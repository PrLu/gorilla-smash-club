import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * Advance qualified players from pools to knockout rounds
 * Fills TBD slots in knockout matches with pool winners/runners-up
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

    // Check permissions
    const { data: roleData } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('profile_id', user.id)
      .in('role', ['admin', 'root'])
      .maybeSingle();

    const { data: tournament } = await supabaseAdmin
      .from('tournaments')
      .select('organizer_id')
      .eq('id', tournamentId)
      .single();

    const isOrganizer = tournament?.organizer_id === user.id;

    if (!roleData && !isOrganizer) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Get pool standings
    const standingsResponse = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/tournaments/${tournamentId}/pools/standings`
    );
    const standingsData = await standingsResponse.json();

    if (!standingsData.poolStandings || standingsData.poolStandings.length === 0) {
      return NextResponse.json({ error: 'No pool standings found' }, { status: 400 });
    }

    // Check if all pools are complete
    const allComplete = standingsData.poolStandings.every((ps: any) => ps.isComplete);
    if (!allComplete) {
      return NextResponse.json({ 
        error: 'Not all pool matches are completed. Please finish all pool matches first.' 
      }, { status: 400 });
    }

    // Collect qualified players in seeded order
    const qualifiedPlayers: any[] = [];

    // Collect by rank across pools (1st place from each pool, then 2nd place, etc.)
    const maxAdvance = Math.max(...standingsData.poolStandings.map((ps: any) => ps.advanceCount));
    
    for (let rank = 1; rank <= maxAdvance; rank++) {
      standingsData.poolStandings.forEach((poolStanding: any) => {
        const player = poolStanding.standings.find((s: any) => s.rank === rank && s.advances);
        if (player) {
          qualifiedPlayers.push({
            playerId: player.playerId,
            playerName: player.playerName,
            poolName: poolStanding.poolName,
            rank: player.rank,
          });
        }
      });
    }

    if (qualifiedPlayers.length < 2) {
      return NextResponse.json({ error: 'Need at least 2 qualified players for knockout' }, { status: 400 });
    }

    // Delete any existing knockout matches (in case of regeneration)
    await supabaseAdmin
      .from('matches')
      .delete()
      .eq('tournament_id', tournamentId)
      .eq('match_type', 'knockout');

    // DYNAMICALLY GENERATE KNOCKOUT BRACKET
    // Based on actual number of qualified players
    const count = qualifiedPlayers.length;
    
    // Determine bracket size (next power of 2)
    const bracketSize = Math.pow(2, Math.ceil(Math.log2(count)));
    const totalRounds = Math.log2(bracketSize);
    const byesNeeded = bracketSize - count;

    console.log(`Generating knockout for ${count} players, bracket size ${bracketSize}, ${byesNeeded} byes`);

    // NEW MATCHUP LOGIC: Pool toppers vs runners-up from alternate pools
    // Group qualified players by rank
    const playersByRank: any[][] = [];
    for (let rank = 1; rank <= maxAdvance; rank++) {
      const playersAtRank = qualifiedPlayers.filter((p: any) => p.rank === rank);
      if (playersAtRank.length > 0) {
        playersByRank.push(playersAtRank);
      }
    }

    // Create matchups: alternate pool toppers with runners-up
    const seededPlayers: any[] = [];
    
    if (playersByRank.length === 1) {
      // Only one rank advancing (all winners) - pair them sequentially
      seededPlayers.push(...playersByRank[0]);
    } else if (playersByRank.length >= 2) {
      // Multiple ranks: pair rank 1 from pool A with rank 2 from pool B, etc.
      const toppers = playersByRank[0]; // Rank 1 players
      const runnersUp = playersByRank[1]; // Rank 2 players
      
      // Alternate pairing strategy:
      // Pool A topper vs Pool B runner-up, Pool B topper vs Pool A runner-up
      const numPools = standingsData.poolStandings.length;
      
      if (toppers.length === runnersUp.length && toppers.length === numPools) {
        // Perfect case: same number of toppers and runners-up as pools
        // Pair each topper with runner-up from next pool
        for (let i = 0; i < toppers.length; i++) {
          seededPlayers.push(toppers[i]);
          // Pair with runner-up from the next pool (circular)
          const runnerUpIndex = (i + 1) % runnersUp.length;
          seededPlayers.push(runnersUp[runnerUpIndex]);
        }
      } else {
        // Fallback: interleave toppers and runners-up with offset
        const maxLen = Math.max(toppers.length, runnersUp.length);
        for (let i = 0; i < maxLen; i++) {
          if (i < toppers.length) {
            seededPlayers.push(toppers[i]);
          }
          // Pair with runner-up from different pool (offset)
          const runnerUpIndex = (i + Math.floor(numPools / 2)) % runnersUp.length;
          if (runnerUpIndex < runnersUp.length && i < runnersUp.length) {
            seededPlayers.push(runnersUp[runnerUpIndex]);
          }
        }
      }
      
      // Add any remaining ranks (3rd place, etc.)
      for (let r = 2; r < playersByRank.length; r++) {
        seededPlayers.push(...playersByRank[r]);
      }
    }
    
    // Pad with nulls for byes (top seeds get byes)
    const paddedPlayers: (any | null)[] = [];
    
    // Give byes to top seeds
    for (let i = 0; i < byesNeeded; i++) {
      paddedPlayers.push(seededPlayers[i]); // Top seed with bye
      paddedPlayers.push(null); // Bye slot
    }
    
    // Add remaining players
    for (let i = byesNeeded; i < seededPlayers.length; i += 2) {
      paddedPlayers.push(seededPlayers[i]);
      paddedPlayers.push(seededPlayers[i + 1] || null);
    }

    // Generate knockout matches
    const knockoutMatches: any[] = [];
    let matchPosition = 0;
    let currentRound = 2; // First knockout round

    // Generate first round
    for (let i = 0; i < paddedPlayers.length; i += 2) {
      const p1 = paddedPlayers[i];
      const p2 = paddedPlayers[i + 1];

      // Skip if both are null (shouldn't happen)
      if (!p1 && !p2) continue;

      // Determine if this is a bye match
      const isBye = !p1 || !p2;
      const winner = !p1 ? p2?.playerId : !p2 ? p1?.playerId : null;

      knockoutMatches.push({
        tournament_id: tournamentId,
        pool_id: null,
        match_type: 'knockout',
        round: currentRound,
        bracket_pos: matchPosition++,
        player1_id: p1?.playerId || null,
        player2_id: p2?.playerId || null,
        status: isBye ? 'completed' : 'pending',
        winner_player_id: winner,
        court: null,
      });
    }

    // Generate subsequent rounds (placeholder matches)
    const firstRoundMatchCount = knockoutMatches.length;
    currentRound++;
    let previousRoundMatches = firstRoundMatchCount;

    while (previousRoundMatches > 1) {
      const nextRoundMatches = Math.floor(previousRoundMatches / 2);
      
      for (let i = 0; i < nextRoundMatches; i++) {
        knockoutMatches.push({
          tournament_id: tournamentId,
          pool_id: null,
          match_type: 'knockout',
          round: currentRound,
          bracket_pos: matchPosition++,
          player1_id: null,
          player2_id: null,
          status: 'pending',
          next_match_id: null,
          court: null,
        });
      }
      
      currentRound++;
      previousRoundMatches = nextRoundMatches;
    }

    // Link matches (set next_match_id for winner advancement)
    let roundStartIndex = 0;
    for (let round = 2; round < currentRound - 1; round++) {
      const roundMatches = knockoutMatches.filter(m => m.round === round);
      const nextRoundMatches = knockoutMatches.filter(m => m.round === round + 1);
      
      roundMatches.forEach((match, index) => {
        const nextMatchIndex = Math.floor(index / 2);
        if (nextRoundMatches[nextMatchIndex]) {
          match.next_match_id = nextRoundMatches[nextMatchIndex].id || null;
        }
      });
    }

    // Insert knockout matches
    const { data: createdMatches, error: insertError } = await supabaseAdmin
      .from('matches')
      .insert(knockoutMatches)
      .select();

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 400 });
    }

    // Now link next_match_id properly with actual IDs
    for (let round = 2; round < currentRound - 1; round++) {
      const roundMatches = createdMatches.filter((m: any) => m.round === round);
      const nextRoundMatches = createdMatches.filter((m: any) => m.round === round + 1);
      
      for (let i = 0; i < roundMatches.length; i++) {
        const nextMatchIndex = Math.floor(i / 2);
        if (nextRoundMatches[nextMatchIndex]) {
          await supabaseAdmin
            .from('matches')
            .update({ next_match_id: nextRoundMatches[nextMatchIndex].id })
            .eq('id', roundMatches[i].id);
        }
      }
    }

    // Update pool_players with final standings
    for (const poolStanding of standingsData.poolStandings) {
      for (const standing of poolStanding.standings) {
        await supabaseAdmin
          .from('pool_players')
          .update({
            wins: standing.wins,
            losses: standing.losses,
            points: standing.pointDifferential,
          })
          .eq('pool_id', poolStanding.poolId)
          .eq('player_id', standing.playerId);
      }
    }

    // Update pool status to completed
    const poolIds = standingsData.poolStandings.map((ps: any) => ps.poolId);
    await supabaseAdmin
      .from('pools')
      .update({ status: 'completed' })
      .in('id', poolIds);

    return NextResponse.json({
      success: true,
      message: 'Knockout bracket generated and qualified players advanced',
      stats: {
        qualifiedPlayers: qualifiedPlayers.length,
        knockoutMatchesCreated: createdMatches.length,
        poolsCompleted: poolIds.length,
        bracketSize: bracketSize,
        byesUsed: byesNeeded,
      },
      qualifiedPlayers,
    });

  } catch (error: any) {
    console.error('Pool advancement error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

