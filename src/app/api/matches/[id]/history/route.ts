import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const matchId = params.id;

    // Create client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Get match with score history
    const { data: match, error } = await supabase
      .from('matches')
      .select('score_history, score_summary, match_format, set_scores, entered_by, completed_at')
      .eq('id', matchId)
      .single();

    if (error || !match) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      history: match.score_history || [],
      current: {
        score_summary: match.score_summary,
        match_format: match.match_format,
        set_scores: match.set_scores,
        entered_by: match.entered_by,
        completed_at: match.completed_at,
      },
    });

  } catch (error: any) {
    console.error('Score history error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

