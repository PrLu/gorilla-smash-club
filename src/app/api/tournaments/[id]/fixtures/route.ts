import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { recordAudit } from '@/lib/audit';

/**
 * DELETE: Delete all fixtures for a tournament
 * Removes all matches and pools to allow fresh fixture generation
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const tournamentId = params.id;

  try {
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

    // Check if user is organizer
    if (tournament.organizer_id !== currentUser.id) {
      return NextResponse.json(
        { error: 'Forbidden - Only tournament organizer can delete fixtures' },
        { status: 403 }
      );
    }

    // Get count of existing matches and pools
    const { count: matchCount } = await supabase
      .from('matches')
      .select('id', { count: 'exact', head: true })
      .eq('tournament_id', tournamentId);

    const { count: poolCount } = await supabase
      .from('pools')
      .select('id', { count: 'exact', head: true })
      .eq('tournament_id', tournamentId);

    if (!matchCount && !poolCount) {
      return NextResponse.json(
        {
          success: true,
          message: 'No fixtures to delete',
          deletedMatches: 0,
          deletedPools: 0,
        },
        { status: 200 }
      );
    }

    // Delete all pool_players first (foreign key constraint)
    // First, get all pool IDs for this tournament
    const { data: pools } = await supabase
      .from('pools')
      .select('id')
      .eq('tournament_id', tournamentId);

    if (pools && pools.length > 0) {
      const poolIds = pools.map(p => p.id);
      await supabase
        .from('pool_players')
        .delete()
        .in('pool_id', poolIds);
    }

    // Delete all matches
    const { error: matchDeleteError } = await supabase
      .from('matches')
      .delete()
      .eq('tournament_id', tournamentId);

    if (matchDeleteError) {
      return NextResponse.json(
        { error: 'Failed to delete matches', details: matchDeleteError.message },
        { status: 500 }
      );
    }

    // Delete all pools
    const { error: poolDeleteError } = await supabase
      .from('pools')
      .delete()
      .eq('tournament_id', tournamentId);

    if (poolDeleteError) {
      return NextResponse.json(
        { error: 'Failed to delete pools', details: poolDeleteError.message },
        { status: 500 }
      );
    }

    // Update tournament status back to upcoming if it was in_progress
    if (tournament.status === 'in_progress') {
      await supabase
        .from('tournaments')
        .update({ status: 'upcoming', updated_at: new Date().toISOString() })
        .eq('id', tournamentId);
    }

    // Log fixture deletion
    await recordAudit({
      action: 'DELETE_FIXTURES',
      targetTable: 'tournaments',
      targetId: tournamentId,
      metadata: {
        deletedMatches: matchCount || 0,
        deletedPools: poolCount || 0,
        previousStatus: tournament.status,
      },
      actorId: currentUser.id,
    });

    return NextResponse.json({
      success: true,
      message: 'Fixtures deleted successfully',
      deletedMatches: matchCount || 0,
      deletedPools: poolCount || 0,
    });
  } catch (error: any) {
    console.error('Delete fixtures error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete fixtures' },
      { status: 500 }
    );
  }
}

