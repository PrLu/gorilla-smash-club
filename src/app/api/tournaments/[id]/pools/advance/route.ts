import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { generateSingleElimFixtures } from '@/lib/fixtures';

/**
 * Advance Qualified Players from Pools to Knockout
 * Creates knockout bracket with top players from each pool
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const tournamentId = params.id;

  try {
    const body = await request.json();
    const { seedStrategy = 'poolRankOrder' } = body;

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get Authorization header
    const authHeader = request.headers.get('authorization');
    let currentUser = null;

    if (authHeader) {
      const userSupabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      const {
        data: { user },
      } = await userSupabase.auth.getUser(authHeader.replace('Bearer ', ''));
      currentUser = user;
    }

    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get pool standings
    const standingsResponse = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/tournaments/${tournamentId}/pools/standings`
    );
    const standingsData = await standingsResponse.json();

    if (!standingsData.success || !standingsData.allPoolsComplete) {
      return NextResponse.json(
        { error: 'Not all pools are complete. Finish all pool matches first.' },
        { status: 400 }
      );
    }

    // Extract qualifiers from each pool
    const qualifiersByCategory: Record<string, any[]> = {};

    standingsData.poolStandings.forEach((poolStanding: any) => {
      const category = poolStanding.category || 'UNKNOWN';
      const qualifiers = poolStanding.standings.filter((s: any) => s.advances);

      if (!qualifiersByCategory[category]) {
        qualifiersByCategory[category] = [];
      }

      // Add pool rank info to each qualifier
      qualifiers.forEach((q: any) => {
        qualifiersByCategory[category].push({
          playerId: q.playerId,
          playerName: q.playerName,
          poolName: poolStanding.poolName,
          poolRank: q.rank,
          wins: q.wins,
          losses: q.losses,
          pointDifferential: q.pointDifferential,
        });
      });
    });

    console.log('Qualifiers by category:', Object.keys(qualifiersByCategory));

    const knockoutMatchesCreated: any[] = [];
    const categoryResults: Record<string, any> = {};

    // Generate knockout bracket for each category
    for (const [category, qualifiers] of Object.entries(qualifiersByCategory)) {
      console.log(`Generating knockout for ${category}: ${qualifiers.length} qualifiers`);

      if (qualifiers.length < 2) {
        console.log(`Skipping ${category}: only ${qualifiers.length} qualifier(s)`);
        categoryResults[category] = {
          status: 'skipped',
          reason: 'Not enough qualifiers',
          qualifiers: qualifiers.length,
        };
        continue;
      }

      // Apply seeding strategy
      let seededQualifiers = [...qualifiers];
      
      if (seedStrategy === 'poolRankOrder') {
        // Group by pool rank, then by pool alphabetically
        seededQualifiers.sort((a, b) => {
          if (a.poolRank !== b.poolRank) return a.poolRank - b.poolRank;
          return a.poolName.localeCompare(b.poolName);
        });
      } else if (seedStrategy === 'pointDiff') {
        // Sort by point differential
        seededQualifiers.sort((a, b) => b.pointDifferential - a.pointDifferential);
      } else if (seedStrategy === 'random') {
        // Random shuffle
        seededQualifiers = seededQualifiers.sort(() => Math.random() - 0.5);
      }

      const qualifierIds = seededQualifiers.map((q) => q.playerId);

      // Check if category uses teams or players
      const sampleId = qualifierIds[0];
      const { data: playerCheck } = await supabase
        .from('players')
        .select('id')
        .eq('id', sampleId)
        .single();
      const isTeamBased = !playerCheck;

      // Generate knockout fixtures
      const knockoutFixtures = generateSingleElimFixtures(qualifierIds, tournamentId, {
        seed: 'registered', // Already seeded above
      });

      // Get highest bracket_pos from existing matches to avoid conflicts
      const { data: existingMatches } = await supabase
        .from('matches')
        .select('bracket_pos')
        .eq('tournament_id', tournamentId)
        .order('bracket_pos', { ascending: false })
        .limit(1);

      const bracketPosOffset = (existingMatches?.[0]?.bracket_pos || 0) + 1;

      // Prepare knockout matches for insertion
      const matchesToInsert = knockoutFixtures.map((fixture) => ({
        tournament_id: fixture.tournament_id,
        match_type: 'knockout',
        round: fixture.round,
        bracket_pos: fixture.bracket_pos + bracketPosOffset,
        player1_id: isTeamBased ? null : fixture.player1_id,
        player2_id: isTeamBased ? null : fixture.player2_id,
        team1_id: isTeamBased ? fixture.player1_id : null,
        team2_id: isTeamBased ? fixture.player2_id : null,
        status: fixture.status,
        winner_player_id: isTeamBased ? null : fixture.winner_player_id,
        winner_team_id: isTeamBased ? fixture.winner_player_id : null,
        court: category, // Store category
      }));

      // Insert knockout matches
      const { data: createdMatches, error: insertError } = await supabase
        .from('matches')
        .insert(matchesToInsert)
        .select();

      if (insertError) {
        console.error(`Failed to create knockout for ${category}:`, insertError);
        categoryResults[category] = {
          status: 'error',
          error: insertError.message,
        };
        continue;
      }

      // Update next_match_id references
      for (let i = 0; i < createdMatches.length; i++) {
        const fixture = knockoutFixtures[i];
        if (fixture.next_match_pos !== undefined) {
          const nextMatch = createdMatches[fixture.next_match_pos];
          if (nextMatch) {
            await supabase
              .from('matches')
              .update({ next_match_id: nextMatch.id })
              .eq('id', createdMatches[i].id);
          }
        }
      }

      // Mark pools as completed
      await supabase
        .from('pools')
        .update({ status: 'completed' })
        .eq('tournament_id', tournamentId)
        .eq('category', category);

      knockoutMatchesCreated.push(...createdMatches);
      categoryResults[category] = {
        status: 'success',
        qualifiers: qualifiers.length,
        knockoutMatches: createdMatches.length,
        seeding: seededQualifiers.map((q) => q.playerName),
      };

      console.log(`✅ Knockout created for ${category}: ${createdMatches.length} matches`);
    }

    return NextResponse.json({
      success: true,
      message: 'Qualified players advanced to knockout brackets',
      knockoutMatchesCreated: knockoutMatchesCreated.length,
      categoriesProcessed: Object.keys(categoryResults).length,
      categoryResults,
    });
  } catch (error: any) {
    console.error('Advance players error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to advance players' },
      { status: 500 }
    );
  }
}
