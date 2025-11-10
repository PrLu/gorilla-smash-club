import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

/**
 * Create teams from partner pairs in registrations
 * Uses category metadata to determine which categories are team-based
 * Only creates teams for categories marked as team-based in the database
 */
async function createTeamsFromPartners(
  supabase: any,
  tournamentId: string,
  successfulImports: any[],
  categoryMap: Map<string, any>
) {
  console.log('\n🔍 Finding team-based registrations with partner info...');
  console.log('Category metadata:', Array.from(categoryMap.entries()).map(([name, data]) => 
    `${name}: ${data.is_team_based ? '👥 TEAM-BASED' : '👤 INDIVIDUAL'}`
  ));
  
  // Get all registrations for this tournament with partner info
  const { data: registrations, error: fetchError } = await supabase
    .from('registrations')
    .select('id, player_id, metadata, tournament_id')
    .eq('tournament_id', tournamentId)
    .not('metadata->partner_email', 'is', null);

  if (fetchError || !registrations) {
    console.error('Error fetching registrations:', fetchError);
    return { teamsCreated: 0, registrationsUpdated: 0 };
  }

  console.log(`Found ${registrations.length} registrations with partner info`);

  // Group by category to process each separately
  const byCategory: Record<string, any[]> = {};
  registrations.forEach(reg => {
    const category = reg.metadata?.category || 'unknown';
    if (!byCategory[category]) byCategory[category] = [];
    byCategory[category].push(reg);
  });

  let totalTeamsCreated = 0;
  let totalRegistrationsUpdated = 0;

  // Process each category
  for (const [category, regs] of Object.entries(byCategory)) {
    // Check if this category is team-based according to database
    const categoryData = categoryMap.get(category);
    const isTeamBased = categoryData?.is_team_based || false;
    
    console.log(`\n📊 Processing category: ${category} (${regs.length} registrations)`);
    console.log(`   Category type: ${isTeamBased ? '👥 TEAM-BASED (will create teams)' : '👤 INDIVIDUAL (skip team creation)'}`);
    
    // Skip team creation for non-team-based categories
    if (!isTeamBased) {
      console.log(`   ⏭️  Skipping ${category} - not team-based per database`);
      continue;
    }

    // Build a map of email -> registration
    const emailToReg = new Map<string, any>();
    
    // Get player info WITH emails (join with profiles to get email)
    const playerIds = regs.map(r => r.player_id).filter(Boolean);
    console.log(`   DEBUG: Fetching ${playerIds.length} players for category ${category}`);
    console.log(`   DEBUG: Sample player IDs:`, playerIds.slice(0, 3));
    
    const { data: players, error: playerError } = await supabase
      .from('players')
      .select('id, first_name, last_name, profile_id, profile:profiles(email)')
      .in('id', playerIds);

    if (playerError) {
      console.error(`   ERROR fetching players:`, playerError);
    }
    console.log(`   DEBUG: Found ${players?.length || 0} players`);
    
    if (players && players.length > 0) {
      console.log(`   DEBUG: First player:`, {
        id: players[0].id,
        name: `${players[0].first_name} ${players[0].last_name}`,
        email: players[0].profile?.email
      });
    }

    // Map player info - extract email from profile
    const playerMap = new Map(
      players?.map(p => [p.id, { ...p, email: p.profile?.email }]) || []
    );
    
    regs.forEach((reg, idx) => {
      const player = playerMap.get(reg.player_id);
      if (player?.email) {
        emailToReg.set(player.email.toLowerCase(), { ...reg, player });
        if (idx < 2) {
          console.log(`   DEBUG: Mapped ${player.email} with partner_email=${reg.metadata?.partner_email}`);
        }
      } else if (idx < 2) {
        console.log(`   DEBUG: No email found for player ${reg.player_id}`);
      }
    });
    
    console.log(`   DEBUG: emailToReg map size: ${emailToReg.size}`);

    // Find partner pairs (both list each other)
    const processedEmails = new Set<string>();
    const pairs: Array<{ reg1: any; reg2: any; player1: any; player2: any }> = [];
    const unmatchedReasons: string[] = [];

    for (const [email, reg] of emailToReg.entries()) {
      if (processedEmails.has(email)) continue;

      const partnerEmail = reg.metadata?.partner_email?.toLowerCase();
      if (!partnerEmail) {
        unmatchedReasons.push(`${email} - no partner email in metadata`);
        continue;
      }

      const partnerReg = emailToReg.get(partnerEmail);
      
      if (!partnerReg) {
        unmatchedReasons.push(`${email} → lists ${partnerEmail} but that email NOT FOUND in registrations`);
        continue;
      }

      const partnerListsBack = partnerReg.metadata?.partner_email?.toLowerCase();
      
      // Check if partner also lists this person
      if (partnerListsBack === email) {
        pairs.push({
          reg1: reg,
          reg2: partnerReg,
          player1: reg.player,
          player2: partnerReg.player
        });
        processedEmails.add(email);
        processedEmails.add(partnerEmail);
        console.log(`      ✅ Matched: ${email} ↔ ${partnerEmail}`);
      } else {
        unmatchedReasons.push(`${email} → lists ${partnerEmail}, but ${partnerEmail} lists ${partnerListsBack} (doesn't match back!)`);
      }
    }

    console.log(`   Found ${pairs.length} valid partner pairs for ${category}`);
    
    // Handle unmatched registrations by creating teams anyway
    // This allows fixtures to be generated even if partner emails don't match perfectly
    const unmatchedRegistrations: any[] = [];
    for (const [email, reg] of emailToReg.entries()) {
      if (!processedEmails.has(email)) {
        unmatchedRegistrations.push(reg);
      }
    }
    
    if (unmatchedRegistrations.length > 0) {
      console.log(`   ⚠️ ${unmatchedRegistrations.length} unmatched registrations - creating teams anyway for fixture generation`);
      
      // Group unmatched by pairs (every 2 registrations)
      for (let i = 0; i < unmatchedRegistrations.length - 1; i += 2) {
        const reg1 = unmatchedRegistrations[i];
        const reg2 = unmatchedRegistrations[i + 1];
        
        pairs.push({
          reg1: reg1,
          reg2: reg2,
          player1: reg1.player,
          player2: reg2.player
        });
        
        console.log(`      🔗 Auto-paired: ${reg1.player.first_name} & ${reg2.player.first_name} (partner emails didn't match)`);
      }
      
      // If odd number, create a solo registration (will be handled later)
      if (unmatchedRegistrations.length % 2 === 1) {
        console.log(`      ⚠️ 1 registration without pair - skipping for now`);
      }
    }
    
    console.log(`   Total pairs to create teams: ${pairs.length}`);

    // Create teams for each pair
    for (const pair of pairs) {
      const { reg1, reg2, player1, player2 } = pair;
      
      // Create team name
      const teamName = `${player1.first_name} ${player1.last_name} & ${player2.first_name} ${player2.last_name}`;
      
      // Create team with tournament_id
      // Note: teams table doesn't have category column - category is tracked in registrations.metadata
      const { data: team, error: teamError } = await supabase
        .from('teams')
        .insert({
          tournament_id: tournamentId,
          name: teamName,
          player1_id: player1.id,
          player2_id: player2.id,
        })
        .select()
        .single();

      if (teamError || !team) {
        console.error(`   ❌ Failed to create team: ${teamName}`, teamError);
        continue;
      }

      console.log(`   ✅ Created team: ${teamName} (${team.id})`);
      totalTeamsCreated++;

      // Add players to team
      const teamPlayersToInsert = [
        { team_id: team.id, player_id: player1.id },
        { team_id: team.id, player_id: player2.id }
      ];

      await supabase
        .from('team_players')
        .insert(teamPlayersToInsert);

      // Update both registrations to link to this team
      const { error: updateError1 } = await supabase
        .from('registrations')
        .update({ team_id: team.id })
        .eq('id', reg1.id);

      const { error: updateError2 } = await supabase
        .from('registrations')
        .update({ team_id: team.id })
        .eq('id', reg2.id);

      if (!updateError1 && !updateError2) {
        totalRegistrationsUpdated += 2;
        console.log(`   ✅ Linked both registrations to team`);
      } else {
        console.error(`   ⚠️ Error linking registrations:`, updateError1 || updateError2);
      }
    }
  }

  return {
    teamsCreated: totalTeamsCreated,
    registrationsUpdated: totalRegistrationsUpdated
  };
}

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

    // Get tournament details to check which categories/formats are enabled
    const { data: tournament, error: tournamentError } = await supabaseAdmin
      .from('tournaments')
      .select('id, title, formats, format')
      .eq('id', tournamentId)
      .single();

    if (tournamentError || !tournament) {
      return NextResponse.json({ error: 'Tournament not found' }, { status: 404 });
    }

    // Get tournament-specific allowed categories
    const tournamentFormats = tournament.formats || [tournament.format];
    
    // Get category details for these specific formats
    const { data: categoryDetails } = await supabaseAdmin
      .from('categories')
      .select('name, is_team_based')
      .in('name', tournamentFormats)
      .eq('is_active', true);

    const categoryMap = new Map(categoryDetails?.map(c => [c.name, c]) || []);
    const validCategoryNames = Array.from(categoryMap.keys());

    // Get system settings for import/export
    const { data: importSettings } = await supabaseAdmin
      .from('system_settings')
      .select('setting_value')
      .eq('setting_key', 'import_export_settings')
      .single();

    const allowMultipleCategoryRegistrations = importSettings?.setting_value?.allowMultipleCategoryRegistrations ?? true;

    console.log('=== IMPORT PROCESSING ===');
    console.log('Tournament formats:', tournamentFormats);
    console.log('Valid categories for import:', validCategoryNames);
    console.log('Allow multiple category registrations:', allowMultipleCategoryRegistrations);

    const results = {
      successful: [] as any[],
      failed: [] as any[],
      total: participants.length,
    };

    // Process each participant
    for (const participant of participants) {
      try {
        console.log('Processing participant:', participant);
        
        const { 
          email, 
          full_name, 
          phone, 
          gender, 
          dupr_id, 
          category, 
          rating, 
          partner_name,
          partner_email, 
          partner_rating,
          partner_gender,
          payment_status 
        } = participant;

        console.log(`Participant: ${full_name}, Category: ${category}, Partner: ${partner_name}`);

        // Validate required fields
        if (!email || !full_name) {
          console.log('Failed: Missing email or name');
          results.failed.push({
            email: email || 'N/A',
            full_name: full_name || 'N/A',
            error: 'Email and full name are required'
          });
          continue;
        }

        // Validate category against this tournament's enabled formats
        if (!category) {
          console.log('Failed: No category provided');
          results.failed.push({
            email,
            full_name,
            error: 'Category is required'
          });
          continue;
        }

        const normalizedCategory = category.toLowerCase();
        console.log(`Checking category: ${category} (normalized: ${normalizedCategory})`);
        console.log('Valid categories:', validCategoryNames);
        
        // Check if category is enabled for THIS tournament
        if (!validCategoryNames.includes(normalizedCategory)) {
          console.log(`Failed: Category ${normalizedCategory} not in valid list`);
          results.failed.push({
            email,
            full_name,
            error: `Category "${category}" is not enabled for this tournament. Valid options: ${validCategoryNames.join(', ')}`
          });
          continue;
        }

        const categoryData = categoryMap.get(normalizedCategory);
        const isTeamBased = categoryData?.is_team_based || false;
        console.log(`Category ${normalizedCategory} - isTeamBased: ${isTeamBased}`);

        // Normalize and validate rating (optional, but if provided must be valid)
        let normalizedRating = rating;
        if (rating) {
          // Auto-convert numeric ratings
          const numRating = parseFloat(rating);
          if (!isNaN(numRating)) {
            if (numRating < 3.2) normalizedRating = '<3.2';
            else if (numRating < 3.6) normalizedRating = '<3.6';
            else if (numRating < 3.8) normalizedRating = '<3.8';
            else normalizedRating = 'open';
          } else if (!['<3.2', '<3.6', '<3.8', 'open'].includes(rating.toLowerCase())) {
            normalizedRating = 'open'; // Default to open for invalid ratings
          }
        }

        // Normalize and validate gender (optional, but if provided must be valid)
        let normalizedGender = gender?.toLowerCase();
        if (normalizedGender && !['male', 'female'].includes(normalizedGender)) {
          results.failed.push({
            email,
            full_name,
            error: 'Gender must be: male or female (if provided)'
          });
          continue;
        }

        // Handle partner fields dynamically based on category type
        let normalizedPartnerRating = null;
        let normalizedPartnerGender = null;
        let finalPartnerName = null;
        let finalPartnerEmail = null;
        
        // Only process partner fields if this is a team-based category
        if (isTeamBased) {
          // Partner name and email required for team-based categories
          if (!partner_email || !partner_name) {
            results.failed.push({
              email,
              full_name,
              error: `Category "${normalizedCategory}" is team-based - partner_name and partner_email are required`
            });
            continue;
          }
          
          finalPartnerName = partner_name;
          finalPartnerEmail = partner_email;
          
          // Auto-convert partner rating if numeric
          if (partner_rating) {
            const numRating = parseFloat(partner_rating);
            if (!isNaN(numRating)) {
              if (numRating < 3.2) normalizedPartnerRating = '<3.2';
              else if (numRating < 3.6) normalizedPartnerRating = '<3.6';
              else if (numRating < 3.8) normalizedPartnerRating = '<3.8';
              else normalizedPartnerRating = 'open';
            } else if (['<3.2', '<3.6', '<3.8', 'open'].includes(partner_rating.toLowerCase())) {
              normalizedPartnerRating = partner_rating.toLowerCase();
            } else {
              normalizedPartnerRating = 'open';
            }
          }
          
          // Normalize partner gender
          if (partner_gender) {
            normalizedPartnerGender = partner_gender.toLowerCase();
            if (!['male', 'female'].includes(normalizedPartnerGender)) {
              results.failed.push({
                email,
                full_name,
                error: 'Partner gender must be: male or female (if provided)'
              });
              continue;
            }
          }
        }
        // else: Not team-based - gracefully ignore any partner fields provided

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
          const invitationMetadata: any = {
            category,
            rating,
            gender,
            imported: true,
          };

          // Add partner info for doubles/mixed
          if (category === 'doubles' || category === 'mixed') {
            invitationMetadata.partner_email = partner_email || null;
            invitationMetadata.partner_display_name = partner_name || null;
            invitationMetadata.partner_rating = partner_rating || null;
            invitationMetadata.partner_gender = partner_gender || null;
          }

          await supabaseAdmin
            .from('invitations')
            .insert({
              tournament_id: tournamentId,
              email: email,
              invited_by: user.id,
              status: 'pending',
              token: inviteToken,
              display_name: full_name,
              metadata: invitationMetadata,
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
              player_rating: normalizedRating || null,
              gender: normalizedGender || null,
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
        // Logic based on category type (individual vs team-based)
        let registrationQuery = supabaseAdmin
          .from('registrations')
          .select('id, metadata')
          .eq('tournament_id', tournamentId)
          .eq('player_id', playerId);

        const { data: existingRegistrations } = await registrationQuery;

        if (existingRegistrations && existingRegistrations.length > 0) {
          // Check for duplicate based on toggle setting
          if (allowMultipleCategoryRegistrations) {
            // When ON: Only block if EXACT same category
            const duplicateCategory = existingRegistrations.find(reg => {
              const regCategory = reg.metadata?.category?.toLowerCase();
              return regCategory === normalizedCategory;
            });

            if (duplicateCategory) {
              results.failed.push({
                email,
                full_name,
                error: `Already registered for ${category} category in this tournament`
              });
              continue;
            }
          } else {
            // When OFF: Block if same category TYPE (individual vs team-based)
            // Check if any existing registration has the same type
            const duplicateType = existingRegistrations.find(reg => {
              const regCategory = reg.metadata?.category?.toLowerCase();
              const existingCategoryData = categoryMap.get(regCategory);
              const existingIsTeamBased = existingCategoryData?.is_team_based || false;
              
              // Block if same type: both individual OR both team-based
              return existingIsTeamBased === isTeamBased;
            });

            if (duplicateType) {
              const typeLabel = isTeamBased ? 'team-based' : 'individual';
              results.failed.push({
                email,
                full_name,
                error: `Already registered for a ${typeLabel} category. Enable "Allow Multiple Category Registrations" in Settings to allow multiple ${typeLabel} categories.`
              });
              continue;
            }
          }
        }

        // Prepare registration metadata (use normalized values)
        const metadata: any = {
          category: normalizedCategory,
          rating: normalizedRating || null,
          gender: normalizedGender || null,
        };

        // Add partner info ONLY if this is a team-based category
        if (isTeamBased) {
          metadata.partner_email = finalPartnerEmail;
          metadata.partner_display_name = finalPartnerName;
          metadata.partner_rating = normalizedPartnerRating || null;
          metadata.partner_gender = normalizedPartnerGender || null;
        }
        // Partner fields gracefully ignored for non-team categories

        // Create registration
        // For team-based categories, player_id should be null and team_id should be set
        // But we're not creating teams in bulk import, so we'll use player_id for now
        const { error: registrationError } = await supabaseAdmin
          .from('registrations')
          .insert({
            tournament_id: tournamentId,
            player_id: playerId,
            team_id: null, // Teams created later or in manual form
            status: 'confirmed',
            payment_status: payment_status === 'paid' || payment_status === 'Paid' ? 'paid' : 'pending',
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
        console.error('Error processing participant:', participant.email, err);
        results.failed.push({
          email: participant.email || 'N/A',
          full_name: participant.full_name || 'N/A',
          error: err.message || 'Unknown error',
          stack: err.stack,
        });
      }
    }

    console.log('=== IMPORT RESULTS ===');
    console.log('Total:', results.total);
    console.log('Successful:', results.successful.length);
    console.log('Failed:', results.failed.length);
    if (results.failed.length > 0) {
      console.log('First 3 failures:', results.failed.slice(0, 3));
    }
    console.log('===================');

    // ═══════════════════════════════════════════════════════════════
    // AUTO-CREATE TEAMS FROM PARTNER PAIRS
    // Uses category metadata to determine which categories need teams
    // ═══════════════════════════════════════════════════════════════
    console.log('\n🤝 Creating teams from partner pairs...');
    console.log('DEBUG: categoryMap size:', categoryMap.size);
    console.log('DEBUG: categoryMap entries:', Array.from(categoryMap.entries()));
    console.log('DEBUG: Tournament formats:', tournamentFormats);
    
    let teamCreationResult = { teamsCreated: 0, registrationsUpdated: 0 };
    try {
      teamCreationResult = await createTeamsFromPartners(
        supabaseAdmin,
        tournamentId,
        results.successful,
        categoryMap  // Pass category metadata with is_team_based flags
      );
      console.log(`✅ Team creation complete: ${teamCreationResult.teamsCreated} teams, ${teamCreationResult.registrationsUpdated} registrations linked`);
    } catch (teamError: any) {
      console.error('❌ TEAM CREATION FAILED:', teamError);
      console.error('Error details:', teamError.message);
      console.error('Stack:', teamError.stack);
      // Don't fail the whole import, just log the error
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
        teamsCreated: teamCreationResult.teamsCreated,
        registrationsLinkedToTeams: teamCreationResult.registrationsUpdated,
        successfulRegistrations: results.successful,
        failedRegistrations: results.failed,
      }
    });

  } catch (error: any) {
    console.error('Tournament bulk import error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

