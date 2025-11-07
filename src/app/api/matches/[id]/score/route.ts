import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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

    const matchId = params.id;
    const body = await request.json();
    const { match_format, scoring_rule, set_scores } = body;

    // Validate input
    if (!match_format || !set_scores || !Array.isArray(set_scores)) {
      return NextResponse.json({ error: 'Invalid request data' }, { status: 400 });
    }

    // Default scoring rule if not provided
    const scoringRuleToUse = scoring_rule || 'golden_point';

    // Create admin client
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

    // Get the match
    const { data: match, error: matchError } = await supabaseAdmin
      .from('matches')
      .select('*, tournament:tournaments!matches_tournament_id_fkey(organizer_id)')
      .eq('id', matchId)
      .single();

    if (matchError || !match) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 });
    }

    // Check permissions (root, admin, or tournament organizer)
    const { data: roleData } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('profile_id', user.id)
      .in('role', ['admin', 'root'])
      .maybeSingle();

    const isOrganizer = match.tournament?.organizer_id === user.id;

    if (!roleData && !isOrganizer) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Determine winner using database function
    const { data: winnerData, error: winnerError } = await supabaseAdmin
      .rpc('determine_match_winner', {
        set_scores_json: set_scores,
        match_format_type: match_format,
        player1_id_val: match.player1_id,
        player2_id_val: match.player2_id,
        team1_id_val: match.team1_id,
        team2_id_val: match.team2_id,
      });

    if (winnerError) {
      console.error('Winner determination error:', winnerError);
      return NextResponse.json({ error: 'Failed to determine winner' }, { status: 400 });
    }

    const winnerId = winnerData;

    // Generate score summary
    const { data: scoreSummary } = await supabaseAdmin
      .rpc('generate_score_summary', {
        set_scores_json: set_scores,
      });

    // Get current match data for history
    const oldScoreHistory = match.score_history || [];
    const newHistoryEntry = {
      entered_by: user.id,
      entered_at: new Date().toISOString(),
      old_score_summary: match.score_summary,
      old_set_scores: match.set_scores,
      new_score_summary: scoreSummary,
      new_set_scores: set_scores,
    };

    // Update match with scores
    const { error: updateError } = await supabaseAdmin
      .from('matches')
      .update({
        match_format,
        scoring_rule: scoringRuleToUse,
        set_scores,
        score_summary: scoreSummary,
        status: 'completed',
        completed_at: new Date().toISOString(),
        entered_by: user.id,
        winner_player_id: match.player1_id || match.player2_id ? winnerId : null,
        winner_team_id: match.team1_id || match.team2_id ? winnerId : null,
        score_history: [...oldScoreHistory, newHistoryEntry],
        updated_at: new Date().toISOString(),
      })
      .eq('id', matchId);

    if (updateError) {
      console.error('Match update error:', updateError);
      return NextResponse.json({ error: updateError.message }, { status: 400 });
    }

    // The trigger will automatically advance the winner to the next match

    return NextResponse.json({
      success: true,
      match_id: matchId,
      winner_id: winnerId,
      score_summary: scoreSummary,
      status: 'completed',
      message: 'Score saved and winner advanced',
    });

  } catch (error: any) {
    console.error('Score entry error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

