import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * VERIFY ENDPOINT - Check if doubles matches exist and are properly formatted
 * GET /api/debug/verify-doubles-fix?tournamentId=xxx
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
    // Get all matches with full details
    const { data: allMatches, error: matchesError } = await supabaseAdmin
      .from('matches')
      .select('id, match_type, court, pool_id, player1_id, team1_id, status')
      .eq('tournament_id', tournamentId);

    if (matchesError) throw matchesError;

    // Get doubles pools
    const { data: doublesPools, error: poolsError } = await supabaseAdmin
      .from('pools')
      .select('id, name, category')
      .eq('tournament_id', tournamentId)
      .ilike('category', 'DOUBLES');

    if (poolsError) throw poolsError;

    const doublesPoolIds = doublesPools?.map(p => p.id) || [];

    // Categorize matches
    const doublesMatchesByPoolId = allMatches?.filter(m => 
      doublesPoolIds.includes(m.pool_id || '')
    ) || [];

    const doublesMatchesByCourt = allMatches?.filter(m => 
      m.court?.toUpperCase().includes('DOUBLES')
    ) || [];

    const analysis = {
      totalMatches: allMatches?.length || 0,
      doublesPoolIds: doublesPoolIds.length,
      doublesMatchesByPoolId: doublesMatchesByPoolId.length,
      doublesMatchesByCourt: doublesMatchesByCourt.length,
      
      issue: null as string | null,
      solution: null as string | null,
    };

    // Diagnose the issue
    if (doublesPoolIds.length === 0) {
      analysis.issue = 'No doubles pools exist';
      analysis.solution = 'Need to generate fixtures with pool+knockout for doubles category';
    } else if (doublesMatchesByPoolId.length === 0) {
      analysis.issue = 'Doubles pools exist but NO matches in those pools';
      analysis.solution = 'Run the fix-doubles-matches endpoint to generate pool matches';
    } else if (doublesMatchesByCourt.length === 0) {
      analysis.issue = 'Matches exist in doubles pools but court field does NOT contain "DOUBLES"';
      analysis.solution = 'Need to update court field to include category prefix';
    } else {
      analysis.issue = null;
      analysis.solution = 'Doubles matches exist and are properly formatted!';
    }

    return NextResponse.json({
      success: true,
      analysis,
      doublesPools: doublesPools?.map(p => ({
        id: p.id,
        name: p.name,
        category: p.category,
      })),
      sampleDoublesMatches: doublesMatchesByPoolId.slice(0, 5).map(m => ({
        id: m.id,
        court: m.court,
        pool_id: m.pool_id,
        match_type: m.match_type,
        has_teams: !!(m.team1_id),
      })),
      recommendation: analysis.issue 
        ? `⚠️ ${analysis.issue}. ${analysis.solution}`
        : '✅ Doubles matches are properly set up!',
    });

  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}




