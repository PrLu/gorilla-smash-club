import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * Generate fixtures from manually created pools
 * Creates:
 * 1. Round-robin matches within each pool
 * 2. Knockout rounds for advancing players
 */
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Get auth token
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabaseAuth = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data: { user }, error: userError } = await supabaseAuth.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tournamentId = params.id;
    const body = await request.json();
    const { pools } = body;

    // Create admin client
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // First, save pools (using the save endpoint logic)
    // Delete existing pools
    await supabaseAdmin
      .from('pools')
      .delete()
      .eq('tournament_id', tournamentId);

    // Create pools
    const poolsToInsert = pools.map((pool: any) => ({
      tournament_id: tournamentId,
      name: pool.name,
      size: pool.playerIds.length,
      advance_count: pool.advanceCount || 2,
      status: 'in_progress',
    }));

    const { data: createdPools, error: poolError } = await supabaseAdmin
      .from('pools')
      .insert(poolsToInsert)
      .select();

    if (poolError) {
      return NextResponse.json({ error: poolError.message }, { status: 400 });
    }

    // Create pool_players mappings
    const poolPlayersToInsert: any[] = [];
    pools.forEach((pool: any, poolIndex: number) => {
      const dbPool = createdPools[poolIndex];
      pool.playerIds.forEach((playerId: string, position: number) => {
        poolPlayersToInsert.push({
          pool_id: dbPool.id,
          player_id: playerId,
          team_id: null,
          position: position + 1,
        });
      });
    });

    if (poolPlayersToInsert.length > 0) {
      await supabaseAdmin
        .from('pool_players')
        .insert(poolPlayersToInsert);
    }

    // Delete existing matches
    await supabaseAdmin
      .from('matches')
      .delete()
      .eq('tournament_id', tournamentId);

    // Generate round-robin matches for each pool
    const matchesToInsert: any[] = [];
    let matchPosition = 0;

    createdPools.forEach((dbPool, poolIndex) => {
      const pool = pools[poolIndex];
      const playerIds = pool.playerIds;

      // Generate round-robin: every player plays every other player
      for (let i = 0; i < playerIds.length; i++) {
        for (let j = i + 1; j < playerIds.length; j++) {
          matchesToInsert.push({
            tournament_id: tournamentId,
            pool_id: dbPool.id,
            match_type: 'pool',
            round: 1, // Pool matches are round 1
            bracket_pos: matchPosition++,
            player1_id: playerIds[i],
            player2_id: playerIds[j],
            status: 'pending',
            court: pool.name, // Store pool name in court field
          });
        }
      }
    });

    // Generate knockout rounds (placeholder matches for now)
    // Calculate total players advancing
    const totalAdvancing = pools.reduce((sum: number, pool: any) => sum + (pool.advanceCount || 2), 0);
    
    if (totalAdvancing >= 2) {
      const knockoutRounds = Math.ceil(Math.log2(totalAdvancing));
      const knockoutSize = Math.pow(2, knockoutRounds);

      // Generate placeholder knockout matches
      let currentRound = 2; // Round 2+ are knockout rounds
      let currentRoundMatches = knockoutSize / 2;

      while (currentRoundMatches >= 1) {
        for (let i = 0; i < currentRoundMatches; i++) {
          matchesToInsert.push({
            tournament_id: tournamentId,
            pool_id: null,
            match_type: 'knockout',
            round: currentRound,
            bracket_pos: matchPosition++,
            player1_id: null, // TBD - will be filled from pool results
            player2_id: null,
            status: 'pending',
            court: null,
          });
        }
        currentRound++;
        currentRoundMatches = Math.floor(currentRoundMatches / 2);
      }
    }

    // Insert all matches
    if (matchesToInsert.length > 0) {
      const { error: matchError } = await supabaseAdmin
        .from('matches')
        .insert(matchesToInsert);

      if (matchError) {
        return NextResponse.json({ error: matchError.message }, { status: 400 });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Fixtures generated successfully',
      stats: {
        pools: createdPools.length,
        poolMatches: matchesToInsert.filter(m => m.match_type === 'pool').length,
        knockoutMatches: matchesToInsert.filter(m => m.match_type === 'knockout').length,
        totalMatches: matchesToInsert.length,
      },
    });

  } catch (error: any) {
    console.error('Generate fixtures from pools error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

