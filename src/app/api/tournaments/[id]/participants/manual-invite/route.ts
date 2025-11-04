import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendInviteEmail } from '@/lib/email/sendInvite';
import crypto from 'crypto';

interface ManualInviteRequest {
  email: string;
  display_name?: string;
  team_id?: string;
  category: 'singles' | 'doubles' | 'mixed';
  rating: '<3.2' | '<3.6' | '<3.8' | 'open';
  gender: 'male' | 'female';
  partner_email?: string;
  partner_display_name?: string;
  partner_rating?: '<3.2' | '<3.6' | '<3.8' | 'open';
  partner_gender?: 'male' | 'female';
  role?: 'player' | 'team_leader';
  sendInvite?: boolean;
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const tournamentId = params.id;

  try {
    const body: ManualInviteRequest = await request.json();
    const { 
      email, 
      display_name, 
      team_id, 
      category, 
      rating, 
      gender, 
      partner_email,
      partner_display_name,
      partner_rating,
      partner_gender,
      sendInvite = true 
    } = body;

    if (!email || !category || !rating || !gender) {
      return NextResponse.json(
        { error: 'Email, category, rating, and gender are required' },
        { status: 400 }
      );
    }

    // Validate partner data for doubles/mixed
    const isDoublesOrMixed = category === 'doubles' || category === 'mixed';
    if (isDoublesOrMixed && (!partner_email || !partner_rating || !partner_gender)) {
      return NextResponse.json(
        { error: 'Partner email, rating, and gender are required for doubles/mixed' },
        { status: 400 }
      );
    }

    // Use service role for server operations
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get current user from Authorization header
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    // Validate organizer permission
    const { data: tournament, error: tournamentError } = await supabase
      .from('tournaments')
      .select('*, organizer:profiles!tournaments_organizer_id_fkey(id, full_name)')
      .eq('id', tournamentId)
      .single();

    if (tournamentError || !tournament) {
      return NextResponse.json({ error: 'Tournament not found' }, { status: 404 });
    }

    // Check if profile with this email already exists
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id, email, full_name')
      .ilike('email', email)
      .single();

    let profileId: string;
    let isNewPlaceholder = false;
    let invitationId: string | null = null;

    if (existingProfile) {
      // Existing real user - create registration directly
      profileId = existingProfile.id;

      // Get or create player record
      let { data: player } = await supabase
        .from('players')
        .select('id')
        .eq('profile_id', profileId)
        .single();

      if (!player) {
        const { data: newPlayer, error: playerError } = await supabase
          .from('players')
          .insert({
            profile_id: profileId,
            first_name: existingProfile.full_name?.split(' ')[0] || 'Player',
            last_name: existingProfile.full_name?.split(' ').slice(1).join(' ') || '',
            player_rating: rating,
            gender: gender,
          })
          .select()
          .single();

        if (playerError) throw playerError;
        player = newPlayer;
      } else {
        // Update existing player with rating and gender if not set
        await supabase
          .from('players')
          .update({
            player_rating: rating,
            gender: gender,
          })
          .eq('id', player.id);
      }

      // Handle doubles/mixed - create team with partner
      let teamId = team_id || null;
      
      if (isDoublesOrMixed && partner_email) {
        // Get or create partner profile and player
        const { data: partnerProfile } = await supabase
          .from('profiles')
          .select('id, email, full_name')
          .ilike('email', partner_email)
          .single();

        let partnerId: string;

        if (partnerProfile) {
          // Partner exists - get or create player record
          let { data: partnerPlayer } = await supabase
            .from('players')
            .select('id')
            .eq('profile_id', partnerProfile.id)
            .single();

          if (!partnerPlayer) {
            const { data: newPartnerPlayer, error: partnerPlayerError } = await supabase
              .from('players')
              .insert({
                profile_id: partnerProfile.id,
                first_name: partnerProfile.full_name?.split(' ')[0] || 'Partner',
                last_name: partnerProfile.full_name?.split(' ').slice(1).join(' ') || '',
                player_rating: partner_rating,
                gender: partner_gender,
              })
              .select()
              .single();

            if (partnerPlayerError) throw partnerPlayerError;
            partnerPlayer = newPartnerPlayer;
          }

          partnerId = partnerPlayer.id;
        } else {
          // Partner doesn't exist - create invitation for them
          const partnerInviteToken = crypto.randomBytes(32).toString('hex');
          const expiryHours = parseInt(process.env.INVITE_TOKEN_EXPIRY_HOURS || '72');
          const expiresAt = new Date();
          expiresAt.setHours(expiresAt.getHours() + expiryHours);

          await supabase.from('invitations').insert({
            tournament_id: tournamentId,
            email: partner_email.toLowerCase(),
            invited_by: tournament.organizer_id,
            token: partnerInviteToken,
            display_name: partner_display_name || partner_email.split('@')[0],
            expires_at: expiresAt.toISOString(),
            metadata: {
              category,
              rating: partner_rating,
              gender: partner_gender,
              role: 'player',
              is_partner: true,
              first_name: partner_display_name?.split(' ')[0] || partner_email.split('@')[0],
              last_name: partner_display_name?.split(' ').slice(1).join(' ') || '',
            },
          });

          if (sendInvite) {
            const inviteLink = `${process.env.NEXT_PUBLIC_APP_URL}/invite?token=${partnerInviteToken}`;
            
            await sendInviteEmail({
              to: partner_email,
              display_name: partner_display_name || partner_email.split('@')[0],
              tournament_title: tournament.title,
              tournament_location: tournament.location,
              tournament_date: new Date(tournament.start_date).toLocaleDateString(),
              invite_link: inviteLink,
              invited_by: tournament.organizer?.full_name || 'Tournament Organizer',
            });
          }

          // Create a placeholder player ID (will be replaced when partner accepts)
          partnerId = 'pending-' + crypto.randomUUID();
        }

        // Create team with both players
        const teamName = `${display_name || email.split('@')[0]} & ${partner_display_name || partner_email?.split('@')[0]}`;
        
        const { data: team, error: teamError } = await supabase
          .from('teams')
          .insert({
            tournament_id: tournamentId,
            name: teamName,
            player1_id: player.id,
            player2_id: partnerId.startsWith('pending-') ? null : partnerId,
          })
          .select()
          .single();

        if (teamError) throw teamError;
        teamId = team.id;
      }

      // Create registration (linked to team for doubles/mixed, player for singles)
      const { data: registration, error: regError } = await supabase
        .from('registrations')
        .insert({
          tournament_id: tournamentId,
          player_id: isDoublesOrMixed ? null : player.id,
          team_id: teamId,
          status: 'confirmed',
          payment_status: 'paid',
          metadata: { 
            category, 
            rating, 
            gender, 
            role: body.role || 'player',
            partner_email: partner_email || null,
          },
        })
        .select()
        .single();

      if (regError) throw regError;

      return NextResponse.json({
        success: true,
        registration,
        team: teamId ? { id: teamId } : null,
        isPlaceholder: false,
        message: isDoublesOrMixed 
          ? 'Team added successfully' 
          : 'Participant added successfully',
      });

    } else {
      // User doesn't exist - create invitation only (no profile until they sign up)
      const inviteToken = crypto.randomBytes(32).toString('hex');
      const expiryHours = parseInt(process.env.INVITE_TOKEN_EXPIRY_HOURS || '72');
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + expiryHours);

      // Create invitation record with all participant data (including partner for doubles/mixed)
      const { data: invitation, error: inviteError } = await supabase
        .from('invitations')
        .insert({
          tournament_id: tournamentId,
          email: email.toLowerCase(),
          invited_by: tournament.organizer_id,
          token: inviteToken,
          display_name: display_name || email.split('@')[0],
          expires_at: expiresAt.toISOString(),
          metadata: { 
            category, 
            rating, 
            gender, 
            role: body.role || 'player',
            first_name: display_name?.split(' ')[0] || email.split('@')[0],
            last_name: display_name?.split(' ').slice(1).join(' ') || '',
            // Partner details for doubles/mixed
            partner_email: partner_email || null,
            partner_display_name: partner_display_name || null,
            partner_rating: partner_rating || null,
            partner_gender: partner_gender || null,
          },
        })
        .select()
        .single();

      if (inviteError) throw inviteError;
      invitationId = invitation.id;

      // Send invitation email if requested
      if (sendInvite) {
        const inviteLink = `${process.env.NEXT_PUBLIC_APP_URL}/invite?token=${inviteToken}`;
        
        const emailResult = await sendInviteEmail({
          to: email,
          display_name: display_name || email.split('@')[0],
          tournament_title: tournament.title,
          tournament_location: tournament.location,
          tournament_date: new Date(tournament.start_date).toLocaleDateString(),
          invite_link: inviteLink,
          invited_by: tournament.organizer?.full_name || 'Tournament Organizer',
        });

        if (!emailResult.success) {
          console.error('Failed to send invite email:', emailResult.error);
        }
      }

      return NextResponse.json({
        success: true,
        invitation: invitationId,
        isPlaceholder: true,
        isPendingSignup: true,
        message: sendInvite
          ? 'Invitation sent successfully. User will be added to tournament after they sign up.'
          : 'Invitation created (no email sent)',
      });
    }
  } catch (error: any) {
    console.error('Manual invite error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to invite participant' },
      { status: 500 }
    );
  }
}

