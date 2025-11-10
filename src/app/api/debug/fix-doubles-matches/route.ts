import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * FIX ENDPOINT - Generate missing pool matches for doubles pools
 * POST /api/debug/fix-doubles-matches
 * Body: { tournamentId: "xxx" }
 */
export async function POST(request: NextRequest) {
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  try {
    const body = await request.json();
    const { tournamentId } = body;

    if (!tournamentId) {
      return NextResponse.json({ error: 'tournamentId required' }, { status: 400 });
    }

    console.log('🔧 Fixing doubles matches for tournament:', tournamentId);

    // 1. Get all DOUBLES pools that exist
    const { data: doublesPools, error: poolsError } = await supabaseAdmin
      .from('pools')
      .select('*')
      .eq('tournament_id', tournamentId)
      .ilike('category', 'DOUBLES');

    if (poolsError) throw poolsError;

    if (!doublesPools || doublesPools.length === 0) {
      return NextResponse.json({
        error: 'No doubles pools found',
        message: 'You need to generate fixtures first to create pools'
      }, { status: 404 });
    }

    console.log(`Found ${doublesPools.length} doubles pools`);

    // 2. For each pool, get the assigned players/teams
    const matchesToCreate: any[] = [];
    const poolSummary: any[] = [];

    for (const pool of doublesPools) {
      // Get pool_players for this pool
      const { data: poolPlayers, error: playersError } = await supabaseAdmin
        .from('pool_players')
        .select('player_id, team_id, position')
        .eq('pool_id', pool.id)
        .order('position');

      if (playersError) throw playersError;

      console.log(`Pool ${pool.name}: ${poolPlayers?.length || 0} participants`);

      if (!poolPlayers || poolPlayers.length < 2) {
        poolSummary.push({
          pool: pool.name,
          participants: poolPlayers?.length || 0,
          matches: 0,
          status: 'Skipped - not enough participants'
        });
        continue;
      }

      // Check if matches already exist for this pool
      const { data: existingMatches } = await supabaseAdmin
        .from('matches')
        .select('id')
        .eq('pool_id', pool.id);

      if (existingMatches && existingMatches.length > 0) {
        poolSummary.push({
          pool: pool.name,
          participants: poolPlayers.length,
          matches: existingMatches.length,
          status: 'Already has matches'
        });
        continue;
      }

      // Generate round-robin matches for this pool
      const participants = poolPlayers;
      let matchNumber = 0;

      for (let i = 0; i < participants.length; i++) {
        for (let j = i + 1; j < participants.length; j++) {
          const p1 = participants[i];
          const p2 = participants[j];

          matchesToCreate.push({
            tournament_id: tournamentId,
            pool_id: pool.id,
            match_type: 'pool',
            court: `${pool.category} - ${pool.name}`,
            round: 1,
            bracket_pos: matchNumber++,
            player1_id: p1.team_id ? null : p1.player_id,
            player2_id: p2.team_id ? null : p2.player_id,
            team1_id: p1.team_id,
            team2_id: p2.team_id,
            status: 'pending',
            score1: null,
            score2: null,
            winner_player_id: null,
            winner_team_id: null,
          });
        }
      }

      poolSummary.push({
        pool: pool.name,
        participants: poolPlayers.length,
        matchesCreated: matchesToCreate.length - (poolSummary.reduce((sum, p) => sum + (p.matchesCreated || 0), 0)),
        status: 'Matches generated'
      });
    }

    // 3. Insert all matches
    if (matchesToCreate.length > 0) {
      const { data: createdMatches, error: matchesError } = await supabaseAdmin
        .from('matches')
        .insert(matchesToCreate)
        .select('id');

      if (matchesError) {
        console.error('Error creating matches:', matchesError);
        throw matchesError;
      }

      console.log(`✅ Created ${createdMatches?.length || 0} matches`);

      return NextResponse.json({
        success: true,
        message: `Generated ${createdMatches?.length || 0} doubles pool matches`,
        matchesCreated: createdMatches?.length || 0,
        poolsSummary: poolSummary,
        details: {
          pools: doublesPools.length,
          totalMatchesCreated: createdMatches?.length || 0
        }
      });
    } else {
      return NextResponse.json({
        success: false,
        message: 'No matches needed to be created',
        poolsSummary: poolSummary
      });
    }

  } catch (error: any) {
    console.error('Fix error:', error);
    return NextResponse.json(
      { error: error.message, stack: error.stack },
      { status: 500 }
    );
  }
}




