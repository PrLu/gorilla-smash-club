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

    const tournamentId = params.id;
    const body = await request.json();
    const { pools } = body;

    if (!Array.isArray(pools) || pools.length === 0) {
      return NextResponse.json({ error: 'Pools array required' }, { status: 400 });
    }

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

    // Delete existing pools for this tournament
    await supabaseAdmin
      .from('pools')
      .delete()
      .eq('tournament_id', tournamentId);

    // Create new pools
    const poolsToInsert = pools.map((pool: any) => ({
      tournament_id: tournamentId,
      name: pool.name,
      size: pool.playerIds.length,
      advance_count: pool.advanceCount || 2,
      status: 'pending',
    }));

    const { data: createdPools, error: poolError } = await supabaseAdmin
      .from('pools')
      .insert(poolsToInsert)
      .select();

    if (poolError) {
      return NextResponse.json({ error: poolError.message }, { status: 400 });
    }

    // Create pool_players mappings
    const poolPlayersToInsert: any[] = [];
    pools.forEach((pool: any, poolIndex: number) => {
      const dbPool = createdPools[poolIndex];
      pool.playerIds.forEach((playerId: string, position: number) => {
        // Check if it's a team ID or player ID (teams have longer format typically)
        const isTeam = playerId.startsWith('team-') || pool.playerIds.length > 50; // heuristic
        
        poolPlayersToInsert.push({
          pool_id: dbPool.id,
          player_id: isTeam ? null : playerId,
          team_id: isTeam ? playerId : null,
          position: position + 1,
        });
      });
    });

    if (poolPlayersToInsert.length > 0) {
      const { error: playersError } = await supabaseAdmin
        .from('pool_players')
        .insert(poolPlayersToInsert);

      if (playersError) {
        return NextResponse.json({ error: playersError.message }, { status: 400 });
      }
    }

    return NextResponse.json({
      success: true,
      pools: createdPools,
      message: 'Pools saved successfully',
    });

  } catch (error: any) {
    console.error('Save pools error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

