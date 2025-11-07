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

    // Get confirmed registrations with metadata
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

    // Group registrations by category for proper participant ID extraction
    const participantsByCategory: Record<string, any[]> = {
      singles: [],
      doubles: [],
      mixed: []
    };

    registrations.forEach(reg => {
      const category = reg.metadata?.category || 'singles';
      if (participantsByCategory[category]) {
        const isTeamBased = category === 'doubles' || category === 'mixed';
        const participantId = isTeamBased ? reg.team?.id : reg.player?.id;
        if (participantId) {
          participantsByCategory[category].push({
            id: participantId,
            registration: reg,
            isTeamBased
          });
        }
      }
    });

    // Flatten all participants for backward compatibility with current logic
    const allParticipants = [
      ...participantsByCategory.singles,
      ...participantsByCategory.doubles,
      ...participantsByCategory.mixed
    ];
    
    const participantIds = allParticipants.map(p => p.id).filter(Boolean);
    
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

    // Check if there are mixed categories - if so, recommend using main generate-fixtures endpoint
    const hasMultipleCategories = Object.values(participantsByCategory).filter(arr => arr.length > 0).length > 1;
    
    if (hasMultipleCategories) {
      return NextResponse.json({
        error: 'Mixed categories detected',
        message: 'This tournament has participants in multiple categories (singles/doubles/mixed). Please use the advanced fixture generator for proper category-based divisions.',
        hint: 'Use POST /api/tournaments/[id]/generate-fixtures instead',
        categories: {
          singles: participantsByCategory.singles.length,
          doubles: participantsByCategory.doubles.length,
          mixed: participantsByCategory.mixed.length,
        }
      }, { status: 400 });
    }

    // Determine the primary category and if it's team-based
    const primaryCategory = participantsByCategory.singles.length > 0 ? 'singles' 
      : participantsByCategory.doubles.length > 0 ? 'doubles' 
      : 'mixed';
    const isTeamBased = primaryCategory === 'doubles' || primaryCategory === 'mixed';

    // Handle different fixture types
    if (fixtureType === 'pool_knockout' && poolOptions) {
      // Pool + Knockout format - ONLY create pool matches now
      // Knockout will be generated after pool completion
      stats = await generatePoolMatchesOnly(
        supabaseAdmin,
        tournamentId,
        seededParticipants,
        poolOptions,
        isTeamBased
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
        // Use team IDs for doubles/mixed, player IDs for singles
        player1_id: isTeamBased ? null : fixture.player1_id,
        player2_id: isTeamBased ? null : fixture.player2_id,
        team1_id: isTeamBased ? fixture.player1_id : null,
        team2_id: isTeamBased ? fixture.player2_id : null,
        status: fixture.status,
        match_type: 'knockout',
        winner_player_id: isTeamBased ? null : fixture.winner_player_id,
        winner_team_id: isTeamBased ? fixture.winner_player_id : null,
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
 * Generate Pool Matches Only (Knockout created later after pool completion)
 */
async function generatePoolMatchesOnly(
  supabaseAdmin: any,
  tournamentId: string,
  participants: string[],
  poolOptions: { numberOfPools: number; playersPerPool: number; advancePerPool: number },
  isTeamBased: boolean = false
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
    pool.participants.forEach((participantId: string, position: number) => {
      poolPlayersToInsert.push({
        pool_id: dbPool.id,
        player_id: isTeamBased ? null : participantId,
        team_id: isTeamBased ? participantId : null,
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
    const participantIds = pool.participants;

    // Round-robin: every participant vs every other participant
    for (let i = 0; i < participantIds.length; i++) {
      for (let j = i + 1; j < participantIds.length; j++) {
        matchesToInsert.push({
          tournament_id: tournamentId,
          pool_id: dbPool.id,
          match_type: 'pool',
          round: 1,
          bracket_pos: matchPosition++,
          player1_id: isTeamBased ? null : participantIds[i],
          player2_id: isTeamBased ? null : participantIds[j],
          team1_id: isTeamBased ? participantIds[i] : null,
          team2_id: isTeamBased ? participantIds[j] : null,
          status: 'pending',
          court: pool.name,
        });
      }
    }
  });

  const poolMatchCount = matchesToInsert.length;

  // DON'T generate knockout rounds yet!
  // They will be created dynamically after pool completion
  // This ensures correct bracket structure based on actual qualifiers

  // Insert ONLY pool matches
  await supabaseAdmin.from('matches').insert(matchesToInsert);

  return {
    pools: createdPools.length,
    poolMatches: poolMatchCount,
    knockoutMatches: 0,  // Will be created after pool completion
    totalMatches: poolMatchCount,
    message: 'Pool matches created. Knockout rounds will be generated after pool completion.',
  };
}

