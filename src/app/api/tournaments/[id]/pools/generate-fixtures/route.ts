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

    // Get tournament to determine if team-based
    const { data: tournament } = await supabaseAdmin
      .from('tournaments')
      .select('format, formats')
      .eq('id', tournamentId)
      .single();

    // Check if any pool contains teams by examining the first participant
    let isTeamBased = false;
    if (pools.length > 0 && pools[0].playerIds.length > 0) {
      const firstParticipantId = pools[0].playerIds[0];
      
      // Check if this ID is a team
      const { data: teamCheck } = await supabaseAdmin
        .from('teams')
        .select('id')
        .eq('id', firstParticipantId)
        .single();
      
      isTeamBased = !!teamCheck;
    }

    // Create pool_players mappings
    const poolPlayersToInsert: any[] = [];
    pools.forEach((pool: any, poolIndex: number) => {
      const dbPool = createdPools[poolIndex];
      pool.playerIds.forEach((participantId: string, position: number) => {
        poolPlayersToInsert.push({
          pool_id: dbPool.id,
          player_id: isTeamBased ? null : participantId,
          team_id: isTeamBased ? participantId : null,
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
      const participantIds = pool.playerIds;

      // Generate round-robin: every participant plays every other participant
      for (let i = 0; i < participantIds.length; i++) {
        for (let j = i + 1; j < participantIds.length; j++) {
          matchesToInsert.push({
            tournament_id: tournamentId,
            pool_id: dbPool.id,
            match_type: 'pool',
            round: 1, // Pool matches are round 1
            bracket_pos: matchPosition++,
            player1_id: isTeamBased ? null : participantIds[i],
            player2_id: isTeamBased ? null : participantIds[j],
            team1_id: isTeamBased ? participantIds[i] : null,
            team2_id: isTeamBased ? participantIds[j] : null,
            status: 'pending',
            court: pool.name, // Store pool name in court field
          });
        }
      }
    });

    // DON'T generate knockout rounds yet!
    // They will be created dynamically after pool completion
    
    // Insert ONLY pool matches
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
      message: 'Pool matches created. Knockout rounds will be generated after pool completion.',
      stats: {
        pools: createdPools.length,
        poolMatches: matchesToInsert.length,
        knockoutMatches: 0,  // Will be created dynamically
        totalMatches: matchesToInsert.length,
      },
    });

  } catch (error: any) {
    console.error('Generate fixtures from pools error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

