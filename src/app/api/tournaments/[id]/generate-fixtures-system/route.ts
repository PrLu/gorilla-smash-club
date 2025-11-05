import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { generateSingleElimFixtures } from '@/lib/fixtures';

/**
 * System Fixture Generator
 * Supports: Single Elimination, Double Elimination, Pool + Knockout
 */
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
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
    const {
      fixtureType,
      poolOptions,
      seedingType,
      replaceExisting,
      autoAdvanceByes,
    } = body;

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

    // Get confirmed registrations
    const { data: registrations, error: regError } = await supabaseAdmin
      .from('registrations')
      .select(`
        *,
        player:players(id, first_name, last_name, player_rating, gender),
        team:teams(id, name)
      `)
      .eq('tournament_id', tournamentId)
      .eq('status', 'confirmed');

    if (regError || !registrations || registrations.length < 2) {
      return NextResponse.json(
        { error: 'Need at least 2 confirmed participants' },
        { status: 400 }
      );
    }

    // Delete existing if requested
    if (replaceExisting) {
      await supabaseAdmin
        .from('matches')
        .delete()
        .eq('tournament_id', tournamentId);
      
      await supabaseAdmin
        .from('pools')
        .delete()
        .eq('tournament_id', tournamentId);
    }

    const participantIds = registrations.map(r => r.player?.id || r.team?.id).filter(Boolean);
    
    // Apply seeding
    let seededParticipants = [...participantIds];
    if (seedingType === 'random') {
      seededParticipants = seededParticipants.sort(() => Math.random() - 0.5);
    }

    let stats = {
      pools: 0,
      poolMatches: 0,
      knockoutMatches: 0,
      totalMatches: 0,
    };

    // Handle different fixture types
    if (fixtureType === 'pool_knockout' && poolOptions) {
      // Pool + Knockout format
      stats = await generatePoolKnockout(
        supabaseAdmin,
        tournamentId,
        seededParticipants,
        poolOptions
      );
    } else if (fixtureType === 'single_elim') {
      // Single Elimination
      const fixtures = generateSingleElimFixtures(seededParticipants, tournamentId, {
        seed: seedingType,
      });

      const matchesToInsert = fixtures.map((fixture, index) => ({
        tournament_id: fixture.tournament_id,
        round: fixture.round,
        bracket_pos: fixture.bracket_pos,
        player1_id: fixture.player1_id,
        player2_id: fixture.player2_id,
        status: fixture.status,
        match_type: 'knockout',
        winner_player_id: fixture.winner_player_id,
      }));

      const { error: matchError } = await supabaseAdmin
        .from('matches')
        .insert(matchesToInsert);

      if (matchError) {
        return NextResponse.json({ error: matchError.message }, { status: 400 });
      }

      stats.knockoutMatches = matchesToInsert.length;
      stats.totalMatches = matchesToInsert.length;
    } else if (fixtureType === 'double_elim') {
      // Double Elimination - simplified version
      return NextResponse.json(
        { error: 'Double elimination coming soon! Use single elimination for now.' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Fixtures generated successfully',
      stats,
    });

  } catch (error: any) {
    console.error('System generate fixtures error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

/**
 * Generate Pool + Knockout fixtures
 */
async function generatePoolKnockout(
  supabaseAdmin: any,
  tournamentId: string,
  participants: string[],
  poolOptions: { numberOfPools: number; playersPerPool: number; advancePerPool: number }
) {
  const { numberOfPools, advancePerPool } = poolOptions;

  // Distribute players across pools
  const poolSize = Math.ceil(participants.length / numberOfPools);
  const pools: any[] = [];

  for (let i = 0; i < numberOfPools; i++) {
    const poolLetter = String.fromCharCode(65 + i); // A, B, C...
    const start = i * poolSize;
    const end = Math.min(start + poolSize, participants.length);
    const poolParticipants = participants.slice(start, end);

    if (poolParticipants.length >= 2) {
      pools.push({
        name: `Pool ${poolLetter}`,
        participants: poolParticipants,
        advanceCount: Math.min(advancePerPool, poolParticipants.length - 1),
      });
    }
  }

  // Create pool records in database
  const poolsToInsert = pools.map(pool => ({
    tournament_id: tournamentId,
    name: pool.name,
    size: pool.participants.length,
    advance_count: pool.advanceCount,
    status: 'in_progress',
  }));

  const { data: createdPools, error: poolError } = await supabaseAdmin
    .from('pools')
    .insert(poolsToInsert)
    .select();

  if (poolError) throw poolError;

  // Create pool_players mappings
  const poolPlayersToInsert: any[] = [];
  pools.forEach((pool, poolIndex) => {
    const dbPool = createdPools[poolIndex];
    pool.participants.forEach((playerId: string, position: number) => {
      poolPlayersToInsert.push({
        pool_id: dbPool.id,
        player_id: playerId,
        position: position + 1,
      });
    });
  });

  await supabaseAdmin.from('pool_players').insert(poolPlayersToInsert);

  // Generate round-robin matches for each pool
  const matchesToInsert: any[] = [];
  let matchPosition = 0;

  createdPools.forEach((dbPool, poolIndex) => {
    const pool = pools[poolIndex];
    const playerIds = pool.participants;

    // Round-robin: every player vs every other player
    for (let i = 0; i < playerIds.length; i++) {
      for (let j = i + 1; j < playerIds.length; j++) {
        matchesToInsert.push({
          tournament_id: tournamentId,
          pool_id: dbPool.id,
          match_type: 'pool',
          round: 1,
          bracket_pos: matchPosition++,
          player1_id: playerIds[i],
          player2_id: playerIds[j],
          status: 'pending',
          court: pool.name,
        });
      }
    }
  });

  const poolMatchCount = matchesToInsert.length;

  // Generate knockout rounds (TBD placeholders)
  const totalAdvancing = pools.reduce((sum, pool) => sum + pool.advanceCount, 0);
  const knockoutRounds = Math.ceil(Math.log2(totalAdvancing));
  let currentRoundSize = Math.pow(2, knockoutRounds) / 2;
  let currentRound = 2;

  while (currentRoundSize >= 1) {
    for (let i = 0; i < currentRoundSize; i++) {
      matchesToInsert.push({
        tournament_id: tournamentId,
        pool_id: null,
        match_type: 'knockout',
        round: currentRound,
        bracket_pos: matchPosition++,
        player1_id: null,
        player2_id: null,
        status: 'pending',
        court: null,
      });
    }
    currentRound++;
    currentRoundSize = Math.floor(currentRoundSize / 2);
  }

  // Insert all matches
  await supabaseAdmin.from('matches').insert(matchesToInsert);

  return {
    pools: createdPools.length,
    poolMatches: poolMatchCount,
    knockoutMatches: matchesToInsert.length - poolMatchCount,
    totalMatches: matchesToInsert.length,
  };
}

