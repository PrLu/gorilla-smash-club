import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendInviteEmail } from '@/lib/email/sendInvite';
import crypto from 'crypto';

interface ResendInviteRequest {
  invitationId: string;
  regenerateToken?: boolean;
}

/**
 * Resend invitation email
 * Organizer-only endpoint to resend invitations to pending participants
 */
export async function POST(request: NextRequest) {
  try {
    const body: ResendInviteRequest = await request.json();
    const { invitationId, regenerateToken = false } = body;

    if (!invitationId) {
      return NextResponse.json({ error: 'Invitation ID required' }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get invitation details
    const { data: invitation, error: inviteError } = await supabase
      .from('invitations')
      .select('*, tournament:tournaments(*, organizer:profiles!tournaments_organizer_id_fkey(*))')
      .eq('id', invitationId)
      .single();

    if (inviteError || !invitation) {
      return NextResponse.json({ error: 'Invitation not found' }, { status: 404 });
    }

    // Only allow resending pending or expired invitations
    if (invitation.status === 'accepted') {
      return NextResponse.json(
        { error: 'Cannot resend accepted invitation' },
        { status: 400 }
      );
    }

    // Regenerate token if requested
    let token = invitation.token;
    if (regenerateToken) {
      token = crypto.randomBytes(32).toString('hex');
      
      const expiryHours = parseInt(process.env.INVITE_TOKEN_EXPIRY_HOURS || '72');
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + expiryHours);

      await supabase
        .from('invitations')
        .update({
          token,
          status: 'pending',
          expires_at: expiresAt.toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', invitationId);
    }

    // Send invitation email
    const inviteLink = `${process.env.NEXT_PUBLIC_APP_URL}/invite?token=${token}`;
    
    const emailResult = await sendInviteEmail({
      to: invitation.email,
      display_name: invitation.display_name || invitation.email.split('@')[0],
      tournament_title: invitation.tournament.title,
      tournament_location: invitation.tournament.location,
      tournament_date: new Date(invitation.tournament.start_date).toLocaleDateString(),
      invite_link: inviteLink,
      invited_by: invitation.tournament.organizer?.full_name || 'Tournament Organizer',
    });

    if (!emailResult.success) {
      return NextResponse.json(
        { error: 'Failed to send email', details: emailResult.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Invitation resent successfully',
      tokenRegenerated: regenerateToken,
    });

  } catch (error: any) {
    console.error('Resend invite error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to resend invitation' },
      { status: 500 }
    );
  }
}

