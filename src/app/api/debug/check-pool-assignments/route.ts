import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * CHECK POOL ASSIGNMENTS - Verify all teams are assigned to pools
 * GET /api/debug/check-pool-assignments?tournamentId=xxx
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
    // Get all doubles registrations
    const { data: doublesRegs } = await supabaseAdmin
      .from('registrations')
      .select('id, player_id, team_id, metadata')
      .eq('tournament_id', tournamentId)
      .eq('status', 'confirmed')
      .contains('metadata', { category: 'doubles' });

    // Get doubles pools
    const { data: doublesPools } = await supabaseAdmin
      .from('pools')
      .select('id, name, category, size, advance_count')
      .eq('tournament_id', tournamentId)
      .ilike('category', 'DOUBLES')
      .order('name');

    // Get pool_players for doubles pools
    const poolIds = doublesPools?.map(p => p.id) || [];
    const { data: poolPlayers } = await supabaseAdmin
      .from('pool_players')
      .select(`
        id,
        pool_id,
        player_id,
        team_id,
        position,
        player:players(first_name, last_name),
        team:teams(
          name,
          player1:players!teams_player1_id_fkey(first_name, last_name),
          player2:players!teams_player2_id_fkey(first_name, last_name)
        )
      `)
      .in('pool_id', poolIds);

    // Group by pool
    const poolAssignments = doublesPools?.map(pool => {
      const participants = poolPlayers?.filter(pp => pp.pool_id === pool.id) || [];
      return {
        poolName: pool.name,
        poolSize: pool.size,
        actualCount: participants.length,
        participants: participants.map(pp => ({
          player: pp.player ? `${pp.player.first_name} ${pp.player.last_name}` : null,
          team: pp.team ? {
            name: pp.team.name,
            player1: pp.team.player1 ? `${pp.team.player1.first_name} ${pp.team.player1.last_name}` : 'MISSING',
            player2: pp.team.player2 ? `${pp.team.player2.first_name} ${pp.team.player2.last_name}` : 'MISSING',
          } : null,
          hasTeam: !!pp.team_id,
        })),
      };
    });

    // Check for unassigned registrations
    const assignedPlayerIds = new Set(poolPlayers?.map(pp => pp.player_id).filter(Boolean));
    const assignedTeamIds = new Set(poolPlayers?.map(pp => pp.team_id).filter(Boolean));
    
    const unassignedRegs = doublesRegs?.filter(reg => {
      if (reg.player_id && !assignedPlayerIds.has(reg.player_id)) return true;
      if (reg.team_id && !assignedTeamIds.has(reg.team_id)) return true;
      return false;
    });

    const totalAssigned = poolPlayers?.length || 0;
    const totalRegistrations = doublesRegs?.length || 0;

    return NextResponse.json({
      success: true,
      summary: {
        totalDoublesRegistrations: totalRegistrations,
        totalAssignedToPools: totalAssigned,
        unassignedCount: unassignedRegs?.length || 0,
        poolCount: doublesPools?.length || 0,
      },
      poolAssignments,
      unassignedRegistrations: unassignedRegs?.map(reg => ({
        id: reg.id,
        playerId: reg.player_id,
        teamId: reg.team_id,
        metadata: reg.metadata,
      })),
      diagnosis: {
        allAssigned: (unassignedRegs?.length || 0) === 0,
        issue: (unassignedRegs?.length || 0) > 0 
          ? `⚠️ ${unassignedRegs?.length} registrations NOT assigned to any pool!`
          : '✅ All registrations are assigned to pools',
      },
    });

  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}




