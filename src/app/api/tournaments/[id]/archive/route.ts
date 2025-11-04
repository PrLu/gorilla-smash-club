import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { recordAudit } from '@/lib/audit';

/**
 * Archive Tournament API
 * PATCH: Archives a tournament (soft delete)
 * Requires: Tournament organizer or admin
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const tournamentId = params.id;

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get current user
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const {
      data: { user },
    } = await userSupabase.auth.getUser(authHeader.replace('Bearer ', ''));

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify tournament exists and check ownership
    const { data: tournament, error: tournamentError } = await supabase
      .from('tournaments')
      .select('id, organizer_id, title, status')
      .eq('id', tournamentId)
      .single();

    if (tournamentError || !tournament) {
      return NextResponse.json({ error: 'Tournament not found' }, { status: 404 });
    }

    // Check if user is organizer
    if (tournament.organizer_id !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden - Only tournament organizer can archive' },
        { status: 403 }
      );
    }

    // Check if already archived
    if (tournament.status === 'archived') {
      return NextResponse.json(
        { error: 'Tournament is already archived' },
        { status: 400 }
      );
    }

    // Archive the tournament (soft delete)
    const { data: archivedTournament, error: archiveError } = await supabase
      .from('tournaments')
      .update({
        status: 'archived',
        archived_at: new Date().toISOString(),
        archived_by: user.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', tournamentId)
      .select()
      .single();

    if (archiveError) {
      return NextResponse.json(
        { error: 'Failed to archive tournament', details: archiveError.message },
        { status: 500 }
      );
    }

    // Record audit log
    await recordAudit({
      action: 'ARCHIVE_TOURNAMENT',
      targetTable: 'tournaments',
      targetId: tournamentId,
      metadata: {
        previousStatus: tournament.status,
        tournamentTitle: tournament.title,
      },
      actorId: user.id,
    });

    return NextResponse.json({
      success: true,
      message: 'Tournament archived successfully',
      tournament: archivedTournament,
    });
  } catch (error: any) {
    console.error('Archive tournament error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to archive tournament' },
      { status: 500 }
    );
  }
}

/**
 * Restore Tournament from Archive
 * POST: Un-archives a tournament
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const tournamentId = params.id;

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const {
      data: { user },
    } = await userSupabase.auth.getUser(authHeader.replace('Bearer ', ''));

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Restore tournament
    const { data: restoredTournament, error: restoreError } = await supabase
      .from('tournaments')
      .update({
        status: 'draft',
        archived_at: null,
        archived_by: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', tournamentId)
      .eq('organizer_id', user.id)
      .select()
      .single();

    if (restoreError) {
      return NextResponse.json(
        { error: 'Failed to restore tournament', details: restoreError.message },
        { status: 500 }
      );
    }

    // Record audit log
    await recordAudit({
      action: 'RESTORE_TOURNAMENT',
      targetTable: 'tournaments',
      targetId: tournamentId,
      metadata: {},
      actorId: user.id,
    });

    return NextResponse.json({
      success: true,
      message: 'Tournament restored successfully',
      tournament: restoredTournament,
    });
  } catch (error: any) {
    console.error('Restore tournament error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to restore tournament' },
      { status: 500 }
    );
  }
}

