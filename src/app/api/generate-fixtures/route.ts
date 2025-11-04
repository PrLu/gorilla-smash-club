import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { generateSingleElimFixtures } from '@/lib/fixtures';

/**
 * Server-side fixtures generation API route
 * Generates matches based on registered players/teams
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const tournamentId = searchParams.get('tournamentId');

  if (!tournamentId) {
    return NextResponse.json({ error: 'Tournament ID required' }, { status: 400 });
  }

  // Use service role key for admin operations
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    // Get tournament details
    const { data: tournament, error: tournamentError } = await supabase
      .from('tournaments')
      .select('*')
      .eq('id', tournamentId)
      .single();

    if (tournamentError || !tournament) {
      return NextResponse.json({ error: 'Tournament not found' }, { status: 404 });
    }

    // Get confirmed registrations
    const { data: registrations, error: regError } = await supabase
      .from('registrations')
      .select('*, player:players(*), team:teams(*)')
      .eq('tournament_id', tournamentId)
      .eq('status', 'confirmed');

    if (regError) {
      return NextResponse.json({ error: regError.message }, { status: 500 });
    }

    if (!registrations || registrations.length < 2) {
      return NextResponse.json(
        { error: 'Need at least 2 participants to generate fixtures' },
        { status: 400 }
      );
    }

    // Extract participant IDs
    const participantIds = registrations.map((reg) => reg.player_id || reg.team_id).filter(Boolean);

    // Generate fixture structure
    const fixtureMatches = generateSingleElimFixtures(participantIds);

    // Create matches in database
    const matchesToInsert = fixtureMatches.map((fm, idx) => ({
      tournament_id: tournamentId,
      round: fm.round,
      bracket_pos: fm.bracket_pos,
      player1_id: tournament.format === 'singles' ? fm.player1 : undefined,
      player2_id: tournament.format === 'singles' ? fm.player2 : undefined,
      team1_id: tournament.format !== 'singles' ? fm.player1 : undefined,
      team2_id: tournament.format !== 'singles' ? fm.player2 : undefined,
      status: 'pending',
      next_match_id: null, // Will be updated after all matches are created
    }));

    const { data: createdMatches, error: matchError } = await supabase
      .from('matches')
      .insert(matchesToInsert)
      .select();

    if (matchError) {
      return NextResponse.json({ error: matchError.message }, { status: 500 });
    }

    // Update next_match_id references
    for (let i = 0; i < createdMatches.length; i++) {
      const fixtureMatch = fixtureMatches[i];
      if (fixtureMatch.nextMatchPos !== undefined) {
        const nextMatch = createdMatches[fixtureMatch.nextMatchPos];
        if (nextMatch) {
          await supabase
            .from('matches')
            .update({ next_match_id: nextMatch.id })
            .eq('id', createdMatches[i].id);
        }
      }
    }

    // Update tournament status to in_progress
    await supabase
      .from('tournaments')
      .update({ status: 'in_progress' })
      .eq('id', tournamentId);

    return NextResponse.json({
      success: true,
      matchesCreated: createdMatches.length,
      message: 'Fixtures generated successfully',
    });
  } catch (error: any) {
    console.error('Fixtures generation error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
