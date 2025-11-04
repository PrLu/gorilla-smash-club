import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { mergePlaceholderProfile } from '@/lib/participants/mergePlaceholderProfile';

interface AcceptInviteRequest {
  token: string;
  name?: string;
  password?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: AcceptInviteRequest = await request.json();
    const { token, name, password } = body;

    if (!token) {
      return NextResponse.json({ error: 'Invitation token required' }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Validate invitation token
    const { data: invitation, error: inviteError } = await supabase
      .from('invitations')
      .select('*, tournament:tournaments(*)')
      .eq('token', token)
      .single();

    if (inviteError || !invitation) {
      return NextResponse.json({ error: 'Invalid invitation token' }, { status: 404 });
    }

    // Check if expired
    if (invitation.expires_at && new Date(invitation.expires_at) < new Date()) {
      await supabase
        .from('invitations')
        .update({ status: 'expired' })
        .eq('id', invitation.id);

      return NextResponse.json({ error: 'Invitation has expired' }, { status: 400 });
    }

    // Check if already accepted
    if (invitation.status === 'accepted') {
      return NextResponse.json(
        { 
          success: true, 
          alreadyAccepted: true,
          tournament: invitation.tournament,
          message: 'Invitation already accepted' 
        },
        { status: 200 }
      );
    }

    // Get current authenticated user (if any)
    const authHeader = request.headers.get('authorization');
    let currentUser = null;

    if (authHeader) {
      const userSupabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      const { data: { user } } = await userSupabase.auth.getUser(authHeader.replace('Bearer ', ''));
      currentUser = user;
    }

    if (currentUser) {
      // User is logged in - check if email matches
      if (currentUser.email?.toLowerCase() !== invitation.email.toLowerCase()) {
        return NextResponse.json(
          { error: 'Invitation email does not match your account' },
          { status: 403 }
        );
      }

      // Find placeholder profile for this invitation email
      const { data: placeholderProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', invitation.email.toLowerCase())
        .eq('is_placeholder', true)
        .single();

      if (placeholderProfile) {
        // Merge placeholder into real profile
        const mergeResult = await mergePlaceholderProfile(
          placeholderProfile.id,
          currentUser.id
        );

        if (!mergeResult.success) {
          return NextResponse.json(
            { error: mergeResult.error || 'Failed to merge profiles' },
            { status: 500 }
          );
        }
      }

      // Mark invitation as accepted
      await supabase
        .from('invitations')
        .update({
          status: 'accepted',
          accepted_at: new Date().toISOString(),
        })
        .eq('id', invitation.id);

      // Update registrations to confirmed
      await supabase
        .from('registrations')
        .update({ status: 'confirmed' })
        .eq('tournament_id', invitation.tournament_id)
        .eq('player_id', currentUser.id);

      return NextResponse.json({
        success: true,
        tournament: invitation.tournament,
        message: 'Invitation accepted successfully',
      });

    } else {
      // User not logged in - need to create account
      if (password && name) {
        // Create new account
        const { data: authData, error: signUpError } = await supabase.auth.signUp({
          email: invitation.email,
          password,
          options: {
            data: { full_name: name },
          },
        });

        if (signUpError) {
          return NextResponse.json({ error: signUpError.message }, { status: 400 });
        }

        if (authData.user) {
          // Create profile
          await supabase.from('profiles').insert({
            id: authData.user.id,
            email: authData.user.email!,
            full_name: name,
          });

          // Find and merge placeholder
          const { data: placeholderProfile } = await supabase
            .from('profiles')
            .select('id')
            .eq('email', invitation.email.toLowerCase())
            .eq('is_placeholder', true)
            .single();

          if (placeholderProfile) {
            await mergePlaceholderProfile(placeholderProfile.id, authData.user.id);
          }

          // Mark invitation as accepted
          await supabase
            .from('invitations')
            .update({
              status: 'accepted',
              accepted_at: new Date().toISOString(),
            })
            .eq('id', invitation.id);

          return NextResponse.json({
            success: true,
            user: authData.user,
            tournament: invitation.tournament,
            message: 'Account created and invitation accepted',
          });
        }
      }

      // Return instructions to sign up
      return NextResponse.json({
        success: false,
        requiresAuth: true,
        invitation,
        message: 'Please sign up or sign in to accept this invitation',
      });
    }
  } catch (error: any) {
    console.error('Accept invite error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to accept invitation' },
      { status: 500 }
    );
  }
}

/**
 * Validate invitation token (GET request)
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const token = searchParams.get('token');

  if (!token) {
    return NextResponse.json({ error: 'Token required' }, { status: 400 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: invitation, error } = await supabase
    .from('invitations')
    .select('*, tournament:tournaments(*)')
    .eq('token', token)
    .single();

  if (error || !invitation) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 404 });
  }

  // Check expiry
  const isExpired = invitation.expires_at && new Date(invitation.expires_at) < new Date();

  return NextResponse.json({
    valid: !isExpired && invitation.status === 'pending',
    invitation: {
      email: invitation.email,
      display_name: invitation.display_name,
      tournament: invitation.tournament,
      status: invitation.status,
      expired: isExpired,
    },
  });
}

