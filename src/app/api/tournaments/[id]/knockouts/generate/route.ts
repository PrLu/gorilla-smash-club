import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * POST /api/tournaments/[id]/knockouts/generate
 * Generate knockout fixtures from pool qualifiers for a specific category
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const tournamentId = params.id;
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  try {
    const body = await request.json();
    const { category } = body;

    if (!category) {
      return NextResponse.json(
        { error: 'Category is required' },
        { status: 400 }
      );
    }

    console.log(`Generating knockout fixtures for category: ${category}`);

    // Get all pools for this category
    const { data: pools, error: poolsError } = await supabaseAdmin
      .from('pools')
      .select('id, name, category, advance_count')
      .eq('tournament_id', tournamentId)
      .ilike('category', category);

    if (poolsError) throw poolsError;

    if (!pools || pools.length === 0) {
      return NextResponse.json(
        { error: `No pools found for category: ${category}` },
        { status: 404 }
      );
    }

    console.log(`Found ${pools.length} pools for ${category}`);

    // Check if knockout fixtures already exist
    const { data: existingKnockouts } = await supabaseAdmin
      .from('matches')
      .select('id')
      .eq('tournament_id', tournamentId)
      .eq('match_type', 'knockout')
      .ilike('court', `${category}%`)
      .limit(1);

    if (existingKnockouts && existingKnockouts.length > 0) {
      return NextResponse.json(
        { error: `Knockout fixtures already exist for ${category}. Delete existing fixtures first.` },
        { status: 400 }
      );
    }

    // Get qualifiers from each pool (top N ranked players)
    const qualifiers: Array<{ playerId: string | null; teamId: string | null; poolRank: number; poolName: string }> = [];

    for (const pool of pools) {
      // Get pool standings ordered by rank
      const { data: poolPlayers, error: playersError } = await supabaseAdmin
        .from('pool_players')
        .select('player_id, team_id, wins, losses, points')
        .eq('pool_id', pool.id)
        .order('wins', { ascending: false })
        .order('points', { ascending: false });

      if (playersError) throw playersError;

      if (poolPlayers) {
        // Take top N players (advance_count)
        const topPlayers = poolPlayers.slice(0, pool.advance_count);
        topPlayers.forEach((player, index) => {
          qualifiers.push({
            playerId: player.player_id,
            teamId: player.team_id,
            poolRank: index + 1,
            poolName: pool.name,
          });
        });
      }
    }

    console.log(`Found ${qualifiers.length} qualifiers for ${category}`);

    if (qualifiers.length < 2) {
      return NextResponse.json(
        { error: `Not enough qualifiers (${qualifiers.length}) to generate knockout fixtures` },
        { status: 400 }
      );
    }

    // Determine if this is team-based or singles
    const isTeamBased = qualifiers.some(q => q.teamId !== null);

    // Generate single elimination bracket
    const knockoutMatches = generateSingleEliminationBracket(
      qualifiers,
      tournamentId,
      category,
      isTeamBased
    );

    console.log(`Generated ${knockoutMatches.length} knockout matches`);

    // Insert knockout matches
    const { data: createdMatches, error: matchesError } = await supabaseAdmin
      .from('matches')
      .insert(knockoutMatches)
      .select();

    if (matchesError) throw matchesError;

    // Update pool status to completed
    const { error: updateError } = await supabaseAdmin
      .from('pools')
      .update({ status: 'completed' })
      .eq('tournament_id', tournamentId)
      .ilike('category', category);

    if (updateError) {
      console.error('Failed to update pool status:', updateError);
    }

    return NextResponse.json({
      success: true,
      matchesCreated: createdMatches?.length || 0,
      qualifiersCount: qualifiers.length,
      category,
    });

  } catch (error: any) {
    console.error('Generate knockouts error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate knockout fixtures' },
      { status: 500 }
    );
  }
}

/**
 * Generate single elimination bracket from qualifiers
 */
function generateSingleEliminationBracket(
  qualifiers: Array<{ playerId: string | null; teamId: string | null; poolRank: number; poolName: string }>,
  tournamentId: string,
  category: string,
  isTeamBased: boolean
) {
  const participantCount = qualifiers.length;
  
  // Calculate number of rounds needed
  const totalRounds = Math.ceil(Math.log2(participantCount));
  const finalBracketSize = Math.pow(2, totalRounds); // Next power of 2
  
  console.log(`Bracket size: ${finalBracketSize}, Rounds: ${totalRounds}, Participants: ${participantCount}`);

  // Seed participants - mix pool winners with runners-up
  // Group by pool rank to distribute evenly
  const byRank: { [rank: number]: typeof qualifiers } = {};
  qualifiers.forEach(q => {
    if (!byRank[q.poolRank]) byRank[q.poolRank] = [];
    byRank[q.poolRank].push(q);
  });

  // Distribute participants: alternate between ranks
  const seededParticipants: typeof qualifiers = [];
  const maxRank = Math.max(...Object.keys(byRank).map(Number));
  
  for (let rank = 1; rank <= maxRank; rank++) {
    if (byRank[rank]) {
      seededParticipants.push(...byRank[rank]);
    }
  }

  // Generate matches for round 1
  const matches: any[] = [];
  const firstRoundMatchCount = Math.ceil(participantCount / 2);
  let participantIndex = 0;

  for (let matchPos = 0; matchPos < firstRoundMatchCount; matchPos++) {
    const participant1 = seededParticipants[participantIndex++];
    const participant2 = participantIndex < participantCount ? seededParticipants[participantIndex++] : null;

    matches.push({
      tournament_id: tournamentId,
      round: 1,
      bracket_pos: matchPos + 1,
      player1_id: isTeamBased ? null : participant1?.playerId,
      player2_id: isTeamBased ? null : (participant2?.playerId || null),
      team1_id: isTeamBased ? participant1?.teamId : null,
      team2_id: isTeamBased ? (participant2?.teamId || null) : null,
      status: participant2 ? 'pending' : 'completed', // Auto-complete if only 1 participant (bye)
      winner_player_id: !participant2 && !isTeamBased ? participant1?.playerId : null,
      winner_team_id: !participant2 && isTeamBased ? participant1?.teamId : null,
      match_type: 'knockout',
      court: category, // Store category in court field
      scheduled_at: null,
    });
  }

  // Generate placeholder matches for subsequent rounds
  for (let round = 2; round <= totalRounds; round++) {
    const matchesInRound = Math.pow(2, totalRounds - round);
    
    for (let matchPos = 0; matchPos < matchesInRound; matchPos++) {
      matches.push({
        tournament_id: tournamentId,
        round: round,
        bracket_pos: matchPos + 1,
        player1_id: null,
        player2_id: null,
        team1_id: null,
        team2_id: null,
        status: 'pending',
        winner_player_id: null,
        winner_team_id: null,
        match_type: 'knockout',
        court: category,
        scheduled_at: null,
      });
    }
  }

  return matches;
}




