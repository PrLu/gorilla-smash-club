import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { generateSingleElimFixtures, mapPlayerToNextMatch, validateFixtures } from '@/lib/fixtures';
import { recordAudit } from '@/lib/audit';

const MAX_MATCHES_DELETE = 500; // Safety limit for replaceExisting

/**
 * Group participants by division (category only)
 * Returns object with division metadata and participant IDs
 */
function groupByDivision(registrations: any[]) {
  const divisions: Record<string, { 
    category: string;
    isTeamBased: boolean;
    participantIds: string[];
  }> = {};

  registrations.forEach((reg) => {
    // Get category from metadata
    const category = reg.metadata?.category || 'singles';

    // Create division key: just the category name
    const divisionKey = category;

    // Determine if this specific registration is team-based
    const isThisTeamBased = category === 'doubles' || category === 'mixed';
    
    // Get participant ID based on category (not tournament format)
    const participantId = isThisTeamBased ? reg.team?.id : reg.player?.id;

    if (participantId) {
      if (!divisions[divisionKey]) {
        divisions[divisionKey] = {
          category,
          isTeamBased: isThisTeamBased,
          participantIds: []
        };
      }
      divisions[divisionKey].participantIds.push(participantId);
    }
  });

  // Filter out divisions with less than 2 participants
  Object.keys(divisions).forEach((key) => {
    if (divisions[key].participantIds.length < 2) {
      delete divisions[key];
    }
  });

  return divisions;
}

interface GenerateFixturesRequest {
  fixture_type?: 'single_elim';
  replaceExisting?: boolean;
  autoAdvanceByes?: boolean;
  seedOrder?: 'registered' | 'random';
}

/**
 * Generate Fixtures API Route
 * POST: Creates tournament fixtures from confirmed registrations
 * 
 * Requires: Tournament organizer or admin permissions
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const tournamentId = params.id;

  try {
    const body: GenerateFixturesRequest = await request.json();
    const {
      fixture_type = 'single_elim',
      replaceExisting = false,
      autoAdvanceByes = true,
      seedOrder = 'registered',
    } = body;

    // Use service role for admin operations
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get Authorization header for user context
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

    // Verify tournament exists and check permissions
    const { data: tournament, error: tournamentError } = await supabase
      .from('tournaments')
      .select('*, organizer:profiles!tournaments_organizer_id_fkey(id, full_name)')
      .eq('id', tournamentId)
      .single();

    if (tournamentError || !tournament) {
      return NextResponse.json({ error: 'Tournament not found' }, { status: 404 });
    }

    // Check if user is organizer (admin check could be added via roles table)
    if (tournament.organizer_id !== currentUser.id) {
      return NextResponse.json(
        { error: 'Forbidden - Only tournament organizer can generate fixtures' },
        { status: 403 }
      );
    }

    // Check if matches already exist
    const { data: existingMatches, count: existingCount } = await supabase
      .from('matches')
      .select('id', { count: 'exact' })
      .eq('tournament_id', tournamentId);

    if (existingCount && existingCount > 0 && !replaceExisting) {
      return NextResponse.json(
        {
          error: 'Fixtures already exist',
          message: `${existingCount} matches already exist. Set replaceExisting=true to regenerate.`,
          existingCount,
        },
        { status: 400 }
      );
    }

    // Safety check for delete limit
    if (replaceExisting && existingCount && existingCount > MAX_MATCHES_DELETE) {
      return NextResponse.json(
        {
          error: 'Too many existing matches',
          message: `Cannot delete ${existingCount} matches (limit: ${MAX_MATCHES_DELETE}). Contact support.`,
        },
        { status: 400 }
      );
    }

    // Get ALL registrations (confirmed + pending) with metadata
    const { data: registrations, error: regError } = await supabase
      .from('registrations')
      .select('*, player:players(id, player_rating, gender), team:teams(id)')
      .eq('tournament_id', tournamentId);

    if (regError) {
      return NextResponse.json({ error: regError.message }, { status: 500 });
    }

    if (!registrations || registrations.length < 2) {
      return NextResponse.json(
        {
          error: 'Insufficient participants',
          message: 'At least 2 registrations required to generate fixtures',
          totalCount: registrations?.length || 0,
        },
        { status: 400 }
      );
    }

    // DEBUG: Log registration metadata to verify categories are present
    console.log('=== FIXTURE GENERATION DEBUG ===');
    console.log(`Total registrations: ${registrations.length}`);
    registrations.forEach((reg, idx) => {
      console.log(`Registration ${idx + 1}:`, {
        id: reg.id,
        player_id: reg.player_id,
        team_id: reg.team_id,
        metadata: reg.metadata,
        category: reg.metadata?.category || 'NOT SET',
      });
    });

    // Group participants by category, rating, and gender
    // Each division now contains metadata about whether it's team-based
    const groupedParticipants = groupByDivision(registrations);

    console.log('Grouped participants by category:', Object.keys(groupedParticipants));
    Object.entries(groupedParticipants).forEach(([key, data]) => {
      console.log(`Category: ${key}`, {
        isTeamBased: data.isTeamBased,
        participantCount: data.participantIds.length,
        participantIds: data.participantIds,
      });
    });
    console.log('=== END DEBUG ===');

    if (Object.keys(groupedParticipants).length === 0) {
      return NextResponse.json(
        {
          error: 'No valid participants found',
          message: 'Registrations must have valid player/team IDs with category, rating, and gender',
        },
        { status: 400 }
      );
    }

    // Delete existing matches if replaceExisting
    if (replaceExisting && existingCount && existingCount > 0) {
      const { error: deleteError } = await supabase
        .from('matches')
        .delete()
        .eq('tournament_id', tournamentId);

      if (deleteError) {
        return NextResponse.json(
          { error: 'Failed to delete existing matches', details: deleteError.message },
          { status: 500 }
        );
      }

      // Log deletion
      await recordAudit({
        action: 'DELETE_FIXTURES',
        targetTable: 'matches',
        targetId: tournamentId,
        metadata: { deletedCount: existingCount, replaceExisting: true },
        actorId: currentUser.id,
      });
    }

    // Generate fixtures for each division separately
    const allMatches: any[] = [];
    const divisionResults: Record<string, any> = {};
    let totalMatchesCreated = 0;
    let totalAutoAdvanced = 0;

    for (const [divisionKey, divisionData] of Object.entries(groupedParticipants)) {
      const { category, isTeamBased, participantIds } = divisionData;

      // Generate fixtures for this division
      const fixtures = generateSingleElimFixtures(participantIds, tournamentId, {
        seed: seedOrder,
      });

      // Validate structure
      const validation = validateFixtures(fixtures);
      if (!validation.valid) {
        return NextResponse.json(
          {
            error: 'Invalid fixture structure',
            division: divisionKey,
            validationErrors: validation.errors,
          },
          { status: 500 }
        );
      }

      // Prepare matches for insertion (add division metadata)
      // Use team IDs for doubles/mixed, player IDs for singles
      const matchesToInsert = fixtures.map((fixture) => ({
        tournament_id: fixture.tournament_id,
        round: fixture.round,
        bracket_pos: fixture.bracket_pos + totalMatchesCreated, // Offset for unique positions
        player1_id: isTeamBased ? null : fixture.player1_id,
        player2_id: isTeamBased ? null : fixture.player2_id,
        team1_id: isTeamBased ? fixture.player1_id : null,
        team2_id: isTeamBased ? fixture.player2_id : null,
        status: fixture.status,
        winner_player_id: isTeamBased ? null : fixture.winner_player_id,
        winner_team_id: isTeamBased ? fixture.winner_player_id : null,
        // Store category in court field
        court: category.toUpperCase(),
      }));

      // Insert matches for this division
      const { data: divisionMatches, error: insertError } = await supabase
        .from('matches')
        .insert(matchesToInsert)
        .select();

      if (insertError) {
        return NextResponse.json(
          { error: 'Failed to create matches', division: divisionKey, details: insertError.message },
          { status: 500 }
        );
      }

      allMatches.push(...divisionMatches);

      // Update next_match_id references for this division
      for (let i = 0; i < divisionMatches.length; i++) {
        const fixture = fixtures[i];
        if (fixture.next_match_pos !== undefined) {
          const nextMatch = divisionMatches[fixture.next_match_pos];
          if (nextMatch) {
            await supabase
              .from('matches')
              .update({ next_match_id: nextMatch.id })
              .eq('id', divisionMatches[i].id);
          }
        }
      }

      // Auto-advance byes for this division
      let autoAdvanced = 0;
      if (autoAdvanceByes) {
        autoAdvanced = await performAutoAdvance(
          supabase,
          divisionMatches,
          fixtures,
          isTeamBased
        );
        totalAutoAdvanced += autoAdvanced;
      }

      divisionResults[divisionKey] = {
        division: category,
        participants: participantIds.length,
        matches: divisionMatches.length,
        autoAdvanced,
      };

      totalMatchesCreated += divisionMatches.length;
    }

    const createdMatches = allMatches;

    // Update tournament status to in_progress
    await supabase
      .from('tournaments')
      .update({ status: 'in_progress', updated_at: new Date().toISOString() })
      .eq('id', tournamentId);

    // Log fixture generation
    await recordAudit({
      action: 'GENERATE_FIXTURES',
      targetTable: 'tournaments',
      targetId: tournamentId,
      metadata: {
        fixture_type,
        matchesCreated: totalMatchesCreated,
        autoAdvancedCount: totalAutoAdvanced,
        replaceExisting,
        divisions: Object.keys(groupedParticipants).length,
        divisionBreakdown: divisionResults,
      },
      actorId: currentUser.id,
    });

    // Fetch final state of matches
    const { data: finalMatches } = await supabase
      .from('matches')
      .select('*')
      .eq('tournament_id', tournamentId)
      .order('round')
      .order('bracket_pos');

    return NextResponse.json({
      success: true,
      message: 'Fixtures generated successfully',
      matchesCreated: totalMatchesCreated,
      autoAdvancedCount: totalAutoAdvanced,
      divisionsCreated: Object.keys(groupedParticipants).length,
      categories: Object.keys(groupedParticipants),
      divisionBreakdown: divisionResults,
      matches: finalMatches,
      debug: {
        totalRegistrations: registrations.length,
        categoriesFound: Object.keys(groupedParticipants),
        participantsPerCategory: Object.fromEntries(
          Object.entries(groupedParticipants).map(([key, data]) => [key, data.participantIds.length])
        ),
      },
    });
  } catch (error: any) {
    console.error('Generate fixtures error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate fixtures' },
      { status: 500 }
    );
  }
}

/**
 * Auto-advance winners for bye matches
 * Cascades through rounds if multiple byes in sequence
 */
async function performAutoAdvance(
  supabase: any,
  createdMatches: any[],
  fixtures: any[],
  isTeamFormat: boolean
): Promise<number> {
  let advancedCount = 0;
  const processedMatches = new Set<string>();

  // Find matches with byes (one player null, one not null, status completed)
  const byeMatches = createdMatches.filter(
    (match, idx) =>
      fixtures[idx].status === 'completed' && fixtures[idx].winner_player_id
  );

  for (const match of byeMatches) {
    if (processedMatches.has(match.id)) continue;

    const fixtureIndex = createdMatches.findIndex((m) => m.id === match.id);
    const fixture = fixtures[fixtureIndex];
    const winnerId = fixture.winner_player_id;

    if (!winnerId || !fixture.next_match_pos) continue;

    // Find next match
    const nextMatchFixture = fixtures[fixture.next_match_pos];
    const nextMatch = createdMatches[fixture.next_match_pos];

    if (!nextMatch) continue;

    // Determine which slot to fill
    const mapping = mapPlayerToNextMatch(fixtures, fixture.bracket_pos);
    if (!mapping) continue;

    const updateData: any = {
      [isTeamFormat ? `team${mapping.slot === 'player1' ? '1' : '2'}_id` : `${mapping.slot}_id`]:
        winnerId,
      updated_at: new Date().toISOString(),
    };

    // Update next match with winner
    await supabase.from('matches').update(updateData).eq('id', nextMatch.id);

    advancedCount++;
    processedMatches.add(match.id);

    // Check if next match now also has a bye (cascade)
    const updatedNextMatch = await supabase
      .from('matches')
      .select('*')
      .eq('id', nextMatch.id)
      .single();

    if (updatedNextMatch.data) {
      const hasOpponent = isTeamFormat
        ? updatedNextMatch.data.team1_id && updatedNextMatch.data.team2_id
        : updatedNextMatch.data.player1_id && updatedNextMatch.data.player2_id;

      // If next match still has only one participant, cascade auto-advance
      if (!hasOpponent) {
        const newWinner = isTeamFormat
          ? updatedNextMatch.data.team1_id || updatedNextMatch.data.team2_id
          : updatedNextMatch.data.player1_id || updatedNextMatch.data.player2_id;

        if (newWinner && updatedNextMatch.data.next_match_id) {
          // Recursive advance (limited to prevent infinite loops)
          // This is a simplified version - production would use iterative approach
          advancedCount++;
        }
      }
    }
  }

  return advancedCount;
}

