import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * Pool Standings Calculation API
 * Computes standings for all pools in a tournament with proper tie-breaking
 * 
 * Tie-breaker rules (in order):
 * 1. Matches won
 * 2. Win percentage
 * 3. Point differential
 * 4. Points for
 * 5. Head-to-head (if applicable)
 */

// Disable caching for this route
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const tournamentId = params.id;

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    console.log('🏊 Fetching pool standings for tournament:', tournamentId);

    // Get all pools for this tournament
    const { data: pools, error: poolsError } = await supabase
      .from('pools')
      .select('*')
      .eq('tournament_id', tournamentId)
      .order('category')
      .order('name');

    console.log(`📊 Pools fetched: ${pools?.length || 0}`);
    if (pools) {
      pools.forEach(p => {
        console.log(`  - ${p.name} (Category: ${p.category}, Size: ${p.size})`);
      });
    }

    if (poolsError) {
      console.error('❌ Error fetching pools:', poolsError);
      return NextResponse.json({ error: poolsError.message }, { status: 500 });
    }

    if (!pools || pools.length === 0) {
      console.log('⚠️ No pools found');
      return NextResponse.json({ poolStandings: [] });
    }

    const poolStandings = [];

    for (const pool of pools) {
      // Get all pool players
      const { data: poolPlayers } = await supabase
        .from('pool_players')
        .select(`
          *,
          player:players(id, first_name, last_name),
          team:teams(
            id, 
            name,
            player1:players!teams_player1_id_fkey(id, first_name, last_name),
            player2:players!teams_player2_id_fkey(id, first_name, last_name)
          )
        `)
        .eq('pool_id', pool.id);

      // Get all matches for this pool
      const { data: poolMatches } = await supabase
        .from('matches')
        .select('*')
        .eq('pool_id', pool.id);

      // Calculate standings for each player/team
      const standings = poolPlayers?.map((pp) => {
        const participantId = pp.player_id || pp.team_id;
        
        // Format team names as "Player1 & Player2"
        // Shows "Player1 & Partner" if second partner is missing
        let participantName = 'Unknown';
        if (pp.player) {
          participantName = `${pp.player.first_name} ${pp.player.last_name}`;
        } else if (pp.team) {
          const player1Name = pp.team.player1 
            ? `${pp.team.player1.first_name} ${pp.team.player1.last_name}`
            : null;
          const player2Name = pp.team.player2 
            ? `${pp.team.player2.first_name} ${pp.team.player2.last_name}`
            : null;

          if (player1Name && player2Name) {
            participantName = `${player1Name} & ${player2Name}`;
          } else if (player1Name) {
            // Show "Player1 & Partner" to indicate it's a team event
            participantName = `${player1Name} & Partner`;
          } else if (player2Name) {
            // Show "Partner & Player2" to indicate it's a team event
            participantName = `Partner & ${player2Name}`;
          } else {
            participantName = pp.team.name || 'Team';
          }
        }

        // Count wins and losses from matches
        let wins = 0;
        let losses = 0;
        let pointsFor = 0;
        let pointsAgainst = 0;
        let matchesPlayed = 0;

        poolMatches?.forEach((match) => {
          if (match.status !== 'completed') return;

          const isPlayer1 = (pp.player_id && match.player1_id === pp.player_id) || 
                           (pp.team_id && match.team1_id === pp.team_id);
          const isPlayer2 = (pp.player_id && match.player2_id === pp.player_id) || 
                           (pp.team_id && match.team2_id === pp.team_id);

          if (!isPlayer1 && !isPlayer2) return;

          matchesPlayed++;

          const winnerId = match.winner_player_id || match.winner_team_id;
          const isWinner = winnerId === participantId;

          if (isWinner) {
            wins++;
          } else {
            losses++;
          }

          // Calculate points from score_summary if available
          if (match.score_summary) {
            const scores = match.score_summary.split(',')[0].split('-').map((s: string) => parseInt(s.trim()));
            if (scores.length === 2) {
              if (isPlayer1) {
                pointsFor += scores[0] || 0;
                pointsAgainst += scores[1] || 0;
              } else if (isPlayer2) {
                pointsFor += scores[1] || 0;
                pointsAgainst += scores[0] || 0;
              }
            }
          }
        });

        const pointDifferential = pointsFor - pointsAgainst;
        const winPercentage = matchesPlayed > 0 ? (wins / matchesPlayed) * 100 : 0;

        return {
          playerId: participantId,
          playerName: participantName,
          wins,
          losses,
          matchesPlayed,
          pointsFor,
          pointsAgainst,
          pointDifferential,
          winPercentage,
        };
      }) || [];

      // Sort by tie-breaker rules
      standings.sort((a, b) => {
        // 1. Wins (descending)
        if (b.wins !== a.wins) return b.wins - a.wins;
        
        // 2. Win percentage (descending)
        if (b.winPercentage !== a.winPercentage) return b.winPercentage - a.winPercentage;
        
        // 3. Point differential (descending)
        if (b.pointDifferential !== a.pointDifferential) return b.pointDifferential - a.pointDifferential;
        
        // 4. Points for (descending)
        if (b.pointsFor !== a.pointsFor) return b.pointsFor - a.pointsFor;
        
        // 5. Alphabetical as final tie-break
        return a.playerName.localeCompare(b.playerName);
      });

      // Assign ranks and determine who advances
      const standingsWithRank = standings.map((standing, index) => ({
        ...standing,
        rank: index + 1,
        advances: index < pool.advance_count,
      }));

      // Check if all pool matches are complete
      const allMatchesComplete = poolMatches?.every((m) => m.status === 'completed') || false;

      poolStandings.push({
        poolId: pool.id,
        poolName: pool.name,
        category: pool.category,
        advanceCount: pool.advance_count,
        standings: standingsWithRank,
        isComplete: allMatchesComplete,
        totalMatches: poolMatches?.length || 0,
        completedMatches: poolMatches?.filter((m) => m.status === 'completed').length || 0,
      });
    }

    return NextResponse.json({
      success: true,
      poolStandings,
      allPoolsComplete: poolStandings.every((ps) => ps.isComplete),
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    });
  } catch (error: any) {
    console.error('Pool standings error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to calculate standings' },
      { status: 500 }
    );
  }
}
