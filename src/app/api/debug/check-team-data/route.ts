import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * DEBUG ENDPOINT - Check team data structure
 * GET /api/debug/check-team-data?tournamentId=xxx
 */
export async function GET(request: NextRequest) {
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const { searchParams } = new URL(request.url);
  const tournamentId = searchParams.get('tournamentId');

  if (!tournamentId) {
    return NextResponse.json({ error: 'tournamentId required' }, { status: 400 });
  }

  try {
    // Get all matches for this tournament
    const { data: matches, error: matchesError } = await supabaseAdmin
      .from('matches')
      .select('id, team1_id, team2_id, match_type, court')
      .eq('tournament_id', tournamentId)
      .not('team1_id', 'is', null);

    if (matchesError) throw matchesError;

    // Get all teams used in these matches
    const teamIds = new Set<string>();
    matches?.forEach(m => {
      if (m.team1_id) teamIds.add(m.team1_id);
      if (m.team2_id) teamIds.add(m.team2_id);
    });

    const { data: teams, error: teamsError } = await supabaseAdmin
      .from('teams')
      .select(`
        id,
        name,
        player1_id,
        player2_id,
        player1:players!teams_player1_id_fkey(id, first_name, last_name),
        player2:players!teams_player2_id_fkey(id, first_name, last_name)
      `)
      .in('id', Array.from(teamIds));

    if (teamsError) throw teamsError;

    // Analyze the data
    const analysis = {
      totalMatches: matches?.length || 0,
      teamMatches: matches?.length || 0,
      totalTeams: teams?.length || 0,
      teamsWithBothPlayers: teams?.filter(t => t.player1_id && t.player2_id).length || 0,
      teamsWithOnlyPlayer1: teams?.filter(t => t.player1_id && !t.player2_id).length || 0,
      teamsWithOnlyPlayer2: teams?.filter(t => !t.player1_id && t.player2_id).length || 0,
      teamsWithNoPlayers: teams?.filter(t => !t.player1_id && !t.player2_id).length || 0,
    };

    return NextResponse.json({
      success: true,
      analysis,
      teams: teams?.map(t => ({
        id: t.id,
        name: t.name,
        player1: t.player1 ? `${t.player1.first_name} ${t.player1.last_name}` : 'MISSING',
        player2: t.player2 ? `${t.player2.first_name} ${t.player2.last_name}` : 'MISSING',
        hasPlayer1Id: !!t.player1_id,
        hasPlayer2Id: !!t.player2_id,
      })),
      sampleMatch: matches?.[0],
    });

  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}




