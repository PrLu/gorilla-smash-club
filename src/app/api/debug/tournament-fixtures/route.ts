import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * DEBUG ENDPOINT - Comprehensive tournament fixture analysis
 * GET /api/debug/tournament-fixtures?tournamentId=xxx
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
    console.log('🔍 Debugging tournament:', tournamentId);

    // 1. Get tournament info
    const { data: tournament } = await supabaseAdmin
      .from('tournaments')
      .select('*')
      .eq('id', tournamentId)
      .single();

    // 2. Get all registrations with category info
    const { data: registrations } = await supabaseAdmin
      .from('registrations')
      .select(`
        id,
        status,
        player_id,
        team_id,
        metadata,
        player:players(id, first_name, last_name),
        team:teams(
          id,
          name,
          player1_id,
          player2_id,
          player1:players!teams_player1_id_fkey(id, first_name, last_name),
          player2:players!teams_player2_id_fkey(id, first_name, last_name)
        )
      `)
      .eq('tournament_id', tournamentId)
      .eq('status', 'confirmed');

    // 3. Group registrations by category
    const regsByCategory: any = {
      singles: [],
      doubles: [],
      mixed: [],
      unknown: []
    };

    registrations?.forEach(reg => {
      const category = reg.metadata?.category || 'singles';
      if (regsByCategory[category]) {
        regsByCategory[category].push(reg);
      } else {
        regsByCategory.unknown.push(reg);
      }
    });

    // 4. Get all matches
    const { data: matches } = await supabaseAdmin
      .from('matches')
      .select(`
        id,
        match_type,
        court,
        player1_id,
        player2_id,
        team1_id,
        team2_id,
        round,
        status,
        pool_id
      `)
      .eq('tournament_id', tournamentId);

    // 5. Group matches by category (extracted from court field)
    const matchesByCategory: any = {
      singles: [],
      doubles: [],
      mixed: [],
      unknown: []
    };

    matches?.forEach(match => {
      const court = match.court?.toUpperCase() || '';
      if (court.includes('SINGLES')) {
        matchesByCategory.singles.push(match);
      } else if (court.includes('DOUBLES')) {
        matchesByCategory.doubles.push(match);
      } else if (court.includes('MIXED')) {
        matchesByCategory.mixed.push(match);
      } else {
        matchesByCategory.unknown.push(match);
      }
    });

    // 6. Get pools
    const { data: pools } = await supabaseAdmin
      .from('pools')
      .select('id, name, category, size, advance_count, status')
      .eq('tournament_id', tournamentId);

    // 7. Group pools by category
    const poolsByCategory: any = {
      SINGLES: [],
      DOUBLES: [],
      MIXED: []
    };

    pools?.forEach(pool => {
      const cat = pool.category?.toUpperCase() || 'UNKNOWN';
      if (poolsByCategory[cat]) {
        poolsByCategory[cat].push(pool);
      }
    });

    // 8. Analysis
    const analysis = {
      tournament: {
        id: tournament?.id,
        title: tournament?.title,
        format: tournament?.format,
        formats: tournament?.formats,
      },
      registrations: {
        total: registrations?.length || 0,
        singles: regsByCategory.singles.length,
        doubles: regsByCategory.doubles.length,
        mixed: regsByCategory.mixed.length,
        unknown: regsByCategory.unknown.length,
      },
      matches: {
        total: matches?.length || 0,
        singles: matchesByCategory.singles.length,
        doubles: matchesByCategory.doubles.length,
        mixed: matchesByCategory.mixed.length,
        unknown: matchesByCategory.unknown.length,
      },
      pools: {
        total: pools?.length || 0,
        singles: poolsByCategory.SINGLES?.length || 0,
        doubles: poolsByCategory.DOUBLES?.length || 0,
        mixed: poolsByCategory.MIXED?.length || 0,
      },
    };

    // 9. Detailed breakdown
    const breakdown = {
      doublesRegistrations: regsByCategory.doubles.map((r: any) => ({
        id: r.id,
        player: r.player ? `${r.player.first_name} ${r.player.last_name}` : null,
        team: r.team ? {
          name: r.team.name,
          player1: r.team.player1 ? `${r.team.player1.first_name} ${r.team.player1.last_name}` : 'MISSING',
          player2: r.team.player2 ? `${r.team.player2.first_name} ${r.team.player2.last_name}` : 'MISSING',
        } : null,
        metadata: r.metadata,
      })),
      doublesMatches: matchesByCategory.doubles.slice(0, 5).map((m: any) => ({
        id: m.id,
        match_type: m.match_type,
        court: m.court,
        pool_id: m.pool_id,
        has_teams: !!(m.team1_id || m.team2_id),
      })),
      doublesPools: poolsByCategory.DOUBLES || [],
    };

    return NextResponse.json({
      success: true,
      tournamentId,
      analysis,
      breakdown,
      diagnosis: {
        hasDoublesRegistrations: analysis.registrations.doubles > 0,
        hasDoublesMatches: analysis.matches.doubles > 0,
        hasDoublesPools: analysis.pools.doubles > 0,
        issue: analysis.registrations.doubles > 0 && analysis.matches.doubles === 0
          ? '⚠️ Doubles registrations exist but NO doubles matches generated!'
          : analysis.registrations.doubles === 0
          ? '❌ No doubles registrations found'
          : '✅ Doubles fixtures appear to be generated',
      },
      rawData: {
        sampleRegistrations: registrations?.slice(0, 3),
        sampleMatches: matches?.slice(0, 3),
        samplePools: pools?.slice(0, 3),
      }
    });

  } catch (error: any) {
    console.error('Debug error:', error);
    return NextResponse.json(
      { error: error.message, stack: error.stack },
      { status: 500 }
    );
  }
}




