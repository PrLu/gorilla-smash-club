import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Get auth token from request headers
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized - No auth token' }, { status: 401 });
    }

    // Create client to verify user
    const supabaseAuth = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data: { user }, error: userError } = await supabaseAuth.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized - Invalid token' }, { status: 401 });
    }

    // Check user role using service role client
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

    const { data: roleData } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('profile_id', user.id)
      .in('role', ['admin', 'root'])
      .single();

    if (!roleData) {
      return NextResponse.json({ error: 'Insufficient permissions - Admin or Root access required' }, { status: 403 });
    }

    const tournamentId = params.id;
    const body = await request.json();
    const { participants } = body;

    // Validate input
    if (!Array.isArray(participants) || participants.length === 0) {
      return NextResponse.json({ error: 'Participants array is required and must not be empty' }, { status: 400 });
    }

    const results = {
      successful: [] as any[],
      failed: [] as any[],
      total: participants.length,
    };

    // Process each participant
    for (const participant of participants) {
      try {
        const { email, full_name, phone, gender, dupr_id, category, rating, partner_email, payment_status } = participant;

        // Validate required fields
        if (!email || !full_name) {
          results.failed.push({
            email: email || 'N/A',
            full_name: full_name || 'N/A',
            error: 'Email and full name are required'
          });
          continue;
        }

        // Validate category (required for tournament registration)
        if (!category || !['singles', 'doubles', 'mixed'].includes(category)) {
          results.failed.push({
            email,
            full_name,
            error: 'Category is required and must be: singles, doubles, or mixed'
          });
          continue;
        }

        // Validate rating (required for tournament registration)
        if (!rating || !['<3.2', '<3.6', '<3.8', 'open'].includes(rating)) {
          results.failed.push({
            email,
            full_name,
            error: 'Rating is required and must be: <3.2, <3.6, <3.8, or open'
          });
          continue;
        }

        // Validate gender (required for tournament registration)
        if (!gender || !['male', 'female'].includes(gender)) {
          results.failed.push({
            email,
            full_name,
            error: 'Gender is required and must be: male or female'
          });
          continue;
        }

        // Validate partner email for doubles/mixed
        if ((category === 'doubles' || category === 'mixed') && !partner_email) {
          results.failed.push({
            email,
            full_name,
            error: `Partner email is required for ${category} category`
          });
          continue;
        }

        let profileId: string;
        let playerId: string;
        let isNewUser = false;

        // Check if profile already exists
        const { data: existingProfile } = await supabaseAdmin
          .from('profiles')
          .select('id')
          .eq('email', email)
          .single();

        if (existingProfile) {
          // User exists - just use their profile
          profileId = existingProfile.id;
          isNewUser = false;
        } else {
          // User doesn't exist - create new user and send invitation
          isNewUser = true;

          // Create new auth user (without password - they'll set it via invitation)
          const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email,
            email_confirm: false,
            user_metadata: {
              full_name,
            },
          });

          if (authError) {
            results.failed.push({
              email,
              full_name,
              error: authError.message
            });
            continue;
          }

          profileId = authData.user!.id;

          // Create profile
          const { error: profileError } = await supabaseAdmin
            .from('profiles')
            .upsert({
              id: profileId,
              email,
              full_name,
              phone: phone || null,
              gender: gender || null,
              dupr_id: dupr_id || null,
              created_by: user.id,
              updated_at: new Date().toISOString(),
            });

          if (profileError) {
            await supabaseAdmin.auth.admin.deleteUser(profileId);
            results.failed.push({
              email,
              full_name,
              error: profileError.message
            });
            continue;
          }

          // Assign participant role
          await supabaseAdmin
            .from('user_roles')
            .insert({
              profile_id: profileId,
              role: 'participant',
              scope_type: 'global',
              granted_by: user.id,
            });

          // Generate invitation token for new users
          const inviteToken = crypto.randomUUID();
          
          // Create invitation record
          await supabaseAdmin
            .from('invitations')
            .insert({
              tournament_id: tournamentId,
              email: email,
              invited_by: user.id,
              status: 'pending',
              token: inviteToken,
              display_name: full_name,
              metadata: {
                category,
                rating,
                gender,
                partner_email: partner_email || null,
                imported: true,
              },
            });

          // Send invitation email (using Supabase Auth)
          try {
            await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
              redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/invite?token=${inviteToken}`,
              data: {
                full_name,
                tournament_id: tournamentId,
              },
            });
          } catch (inviteError) {
            console.error('Failed to send invitation email to:', email, inviteError);
            // Don't fail the import if email sending fails
          }
        }

        // Check if player record exists
        const { data: existingPlayer } = await supabaseAdmin
          .from('players')
          .select('id')
          .eq('profile_id', profileId)
          .single();

        if (existingPlayer) {
          playerId = existingPlayer.id;
        } else {
          // Create player record
          // Split full name into first and last name
          const nameParts = full_name.trim().split(' ');
          const firstName = nameParts[0] || full_name;
          const lastName = nameParts.slice(1).join(' ') || '';

          const { data: playerData, error: playerError } = await supabaseAdmin
            .from('players')
            .insert({
              profile_id: profileId,
              first_name: firstName,
              last_name: lastName,
              player_rating: rating || null,
              gender: gender || null,
            })
            .select('id')
            .single();

          if (playerError) {
            results.failed.push({
              email,
              full_name,
              error: `Failed to create player: ${playerError.message}`
            });
            continue;
          }

          playerId = playerData.id;
        }

        // Check if already registered to this tournament
        const { data: existingRegistration } = await supabaseAdmin
          .from('registrations')
          .select('id')
          .eq('tournament_id', tournamentId)
          .eq('player_id', playerId)
          .single();

        if (existingRegistration) {
          results.failed.push({
            email,
            full_name,
            error: 'Already registered to this tournament'
          });
          continue;
        }

        // Prepare registration metadata
        const metadata: any = {
          category: category,
          rating: rating || null,
          gender: gender || null,
        };

        // Add partner info for doubles/mixed
        if (category === 'doubles' || category === 'mixed') {
          metadata.partner_email = partner_email;
        }

        // Create registration
        const { error: registrationError } = await supabaseAdmin
          .from('registrations')
          .insert({
            tournament_id: tournamentId,
            player_id: playerId,
            status: 'confirmed',
            payment_status: payment_status === 'paid' ? 'paid' : 'pending',
            metadata: metadata,
          });

        if (registrationError) {
          results.failed.push({
            email,
            full_name,
            error: `Failed to register: ${registrationError.message}`
          });
          continue;
        }

        results.successful.push({
          id: profileId,
          email,
          full_name,
          isNewUser, // Track if user was created vs existing
        });

      } catch (err: any) {
        results.failed.push({
          email: participant.email || 'N/A',
          full_name: participant.full_name || 'N/A',
          error: err.message || 'Unknown error'
        });
      }
    }

    // Separate new users (invited) from existing users (just registered)
    const newUsers = results.successful.filter(p => p.isNewUser);
    const existingUsers = results.successful.filter(p => !p.isNewUser);

    return NextResponse.json({
      success: true,
      results: {
        total: results.total,
        successful: results.successful.length,
        failed: results.failed.length,
        newUsers: newUsers.length,
        existingUsers: existingUsers.length,
        successfulRegistrations: results.successful,
        failedRegistrations: results.failed,
      }
    });

  } catch (error: any) {
    console.error('Tournament bulk import error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

