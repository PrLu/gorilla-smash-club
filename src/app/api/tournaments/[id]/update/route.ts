import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { recordAudit } from '@/lib/audit';

/**
 * Update Tournament API
 * PATCH: Update tournament details
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
    const { data: existingTournament, error: tournamentError } = await supabase
      .from('tournaments')
      .select('*')
      .eq('id', tournamentId)
      .single();

    if (tournamentError || !existingTournament) {
      return NextResponse.json({ error: 'Tournament not found' }, { status: 404 });
    }

    // Check if user is organizer
    if (existingTournament.organizer_id !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden - Only tournament organizer can edit' },
        { status: 403 }
      );
    }

    // Get update data from request body
    const body = await request.json();
    const {
      title,
      description,
      start_date,
      end_date,
      location,
      formats,
      entry_fee,
      max_participants,
      status,
    } = body;

    // Prepare update object (only include provided fields)
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (start_date !== undefined) updateData.start_date = start_date;
    if (end_date !== undefined) updateData.end_date = end_date;
    if (location !== undefined) updateData.location = location;
    if (formats !== undefined) {
      updateData.formats = formats;
      updateData.format = formats[0]; // Keep first format for backward compatibility
    }
    if (entry_fee !== undefined) updateData.entry_fee = entry_fee;
    if (max_participants !== undefined) updateData.max_participants = max_participants;
    if (status !== undefined) updateData.status = status;

    // Update tournament
    const { data: updatedTournament, error: updateError } = await supabase
      .from('tournaments')
      .update(updateData)
      .eq('id', tournamentId)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json(
        { error: 'Failed to update tournament', details: updateError.message },
        { status: 500 }
      );
    }

    // Record audit log
    await recordAudit({
      action: 'UPDATE_TOURNAMENT',
      targetTable: 'tournaments',
      targetId: tournamentId,
      metadata: {
        updatedFields: Object.keys(updateData),
        oldStatus: existingTournament.status,
        newStatus: status,
      },
      actorId: user.id,
    });

    return NextResponse.json({
      success: true,
      message: 'Tournament updated successfully',
      tournament: updatedTournament,
    });
  } catch (error: any) {
    console.error('Update tournament error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update tournament' },
      { status: 500 }
    );
  }
}

