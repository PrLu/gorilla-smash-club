import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

interface PlayerStanding {
  playerId: string;
  playerName: string;
  wins: number;
  losses: number;
  matchesPlayed: number;
  pointsFor: number;
  pointsAgainst: number;
  pointDifferential: number;
  winPercentage: number;
}

/**
 * Calculate pool standings from completed matches
 */
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const tournamentId = params.id;

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Get all pools for this tournament
    const { data: pools, error: poolsError } = await supabase
      .from('pools')
      .select(`
        id,
        name,
        advance_count,
        status,
        pool_players (
          id,
          player_id,
          team_id,
          position
        )
      `)
      .eq('tournament_id', tournamentId)
      .order('name');

    if (poolsError) {
      return NextResponse.json({ error: poolsError.message }, { status: 400 });
    }

    if (!pools || pools.length === 0) {
      return NextResponse.json({ standings: [] });
    }

    // Get all pool matches with scores
    const { data: matches, error: matchesError } = await supabase
      .from('matches')
      .select(`
        id,
        pool_id,
        player1_id,
        player2_id,
        team1_id,
        team2_id,
        winner_player_id,
        winner_team_id,
        set_scores,
        status,
        player1:players!matches_player1_id_fkey(id, first_name, last_name),
        player2:players!matches_player2_id_fkey(id, first_name, last_name),
        team1:teams!matches_team1_id_fkey(id, name),
        team2:teams!matches_team2_id_fkey(id, name)
      `)
      .eq('tournament_id', tournamentId)
      .eq('match_type', 'pool')
      .not('pool_id', 'is', null);

    if (matchesError) {
      return NextResponse.json({ error: matchesError.message }, { status: 400 });
    }

    // Calculate standings for each pool
    const poolStandings = pools.map(pool => {
      const poolMatches = matches?.filter(m => m.pool_id === pool.id) || [];
      const poolPlayersList = pool.pool_players || [];
      
      const standings: PlayerStanding[] = [];

      // Get all unique players in this pool
      poolPlayersList.forEach((pp: any) => {
        const playerId = pp.player_id || pp.team_id;
        if (!playerId) return;

        // Find this player's matches
        const playerMatches = poolMatches.filter(m => 
          m.player1_id === playerId || 
          m.player2_id === playerId ||
          m.team1_id === playerId ||
          m.team2_id === playerId
        );

        let wins = 0;
        let losses = 0;
        let pointsFor = 0;
        let pointsAgainst = 0;

        playerMatches.forEach(match => {
          if (match.status !== 'completed') return;

          const isPlayer1 = match.player1_id === playerId || match.team1_id === playerId;
          const winnerId = match.winner_player_id || match.winner_team_id;
          const didWin = winnerId === playerId;

          if (didWin) {
            wins++;
          } else {
            losses++;
          }

          // Calculate points from set scores
          if (match.set_scores && Array.isArray(match.set_scores)) {
            match.set_scores.forEach((set: any) => {
              if (isPlayer1) {
                pointsFor += set.score1 || 0;
                pointsAgainst += set.score2 || 0;
              } else {
                pointsFor += set.score2 || 0;
                pointsAgainst += set.score1 || 0;
              }
            });
          }
        });

        const matchesPlayed = wins + losses;
        const winPercentage = matchesPlayed > 0 ? (wins / matchesPlayed) * 100 : 0;
        const pointDifferential = pointsFor - pointsAgainst;

        // Get player name
        const playerMatch = poolMatches.find(m => 
          m.player1_id === playerId || m.player2_id === playerId ||
          m.team1_id === playerId || m.team2_id === playerId
        );

        let playerName = 'Unknown';
        if (playerMatch) {
          if (playerMatch.player1_id === playerId && playerMatch.player1) {
            playerName = `${playerMatch.player1.first_name} ${playerMatch.player1.last_name}`;
          } else if (playerMatch.player2_id === playerId && playerMatch.player2) {
            playerName = `${playerMatch.player2.first_name} ${playerMatch.player2.last_name}`;
          } else if (playerMatch.team1_id === playerId && playerMatch.team1) {
            playerName = playerMatch.team1.name;
          } else if (playerMatch.team2_id === playerId && playerMatch.team2) {
            playerName = playerMatch.team2.name;
          }
        }

        standings.push({
          playerId,
          playerName,
          wins,
          losses,
          matchesPlayed,
          pointsFor,
          pointsAgainst,
          pointDifferential,
          winPercentage,
        });
      });

      // Sort standings by:
      // 1. Wins (descending)
      // 2. Point differential (descending)
      // 3. Points for (descending)
      standings.sort((a, b) => {
        if (b.wins !== a.wins) return b.wins - a.wins;
        if (b.pointDifferential !== a.pointDifferential) return b.pointDifferential - a.pointDifferential;
        return b.pointsFor - a.pointsFor;
      });

      // Add rank
      const rankedStandings = standings.map((s, index) => ({
        ...s,
        rank: index + 1,
        advances: index < (pool.advance_count || 2),
      }));

      return {
        poolId: pool.id,
        poolName: pool.name,
        advanceCount: pool.advance_count,
        standings: rankedStandings,
        isComplete: poolMatches.every(m => m.status === 'completed'),
      };
    });

    return NextResponse.json({
      success: true,
      poolStandings,
    });

  } catch (error: any) {
    console.error('Pool standings error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}




