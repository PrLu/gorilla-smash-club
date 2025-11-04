import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { isOrganizerOfTournament, isAdmin, hasRole } from '@/lib/roles';
import { recordAudit } from '@/lib/audit';

/**
 * Finance Update API
 * PATCH: Update payment details for registrations
 * Requires organizer, finance, or admin role
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

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check permissions
    const hasAccess =
      (await isOrganizerOfTournament(user.id, tournamentId)) ||
      (await isAdmin(user.id)) ||
      (await hasRole(user.id, 'finance'));

    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Forbidden - Requires organizer, finance, or admin role' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      registrationId,
      entry_fee_paid,
      payment_status,
      payment_method,
      payment_reference,
      collected_by_name,
    } = body;

    if (!registrationId) {
      return NextResponse.json({ error: 'registrationId required' }, { status: 400 });
    }

    // Update registration
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (entry_fee_paid !== undefined) updateData.entry_fee_paid = entry_fee_paid;
    if (payment_status) updateData.payment_status = payment_status;
    if (payment_method) updateData.payment_method = payment_method;
    if (payment_reference) updateData.payment_reference = payment_reference;
    if (collected_by_name) updateData.collected_by_name = collected_by_name;
    if (payment_status === 'paid' && !updateData.payment_date) {
      updateData.payment_date = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('registrations')
      .update(updateData)
      .eq('id', registrationId)
      .eq('tournament_id', tournamentId)
      .select()
      .single();

    if (error) throw error;

    // Record audit log
    await recordAudit({
      action: 'UPDATE_PAYMENT',
      targetTable: 'registrations',
      targetId: registrationId,
      metadata: { ...updateData, tournamentId },
      actorId: user.id,
    });

    return NextResponse.json({ success: true, registration: data });
  } catch (error: any) {
    console.error('Finance update error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

