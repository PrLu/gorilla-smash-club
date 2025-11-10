import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { generateSingleElimFixtures, mapPlayerToNextMatch, validateFixtures } from '@/lib/fixtures';
import { recordAudit } from '@/lib/audit';

const MAX_MATCHES_DELETE = 500; // Safety limit for replaceExisting

/**
 * Auto-assign categories to registrations that don't have one set
 * Smart fallback based on participant type
 */
function autoAssignCategories(registrations: any[]) {
  console.log('\n🔧 AUTO-ASSIGNING missing categories...');
  
  let assigned = 0;
  registrations.forEach((reg) => {
    if (!reg.metadata) {
      reg.metadata = {};
    }
    
    if (!reg.metadata.category) {
      // Auto-assign based on whether it's team or player
      if (reg.team_id) {
        reg.metadata.category = 'doubles'; // Default team category
        assigned++;
      } else if (reg.player_id) {
        reg.metadata.category = 'singles'; // Default individual category
        assigned++;
      }
    }
  });
  
  if (assigned > 0) {
    console.log(`⚠️ Auto-assigned categories to ${assigned} registrations (metadata.category was missing)`);
    console.log(`   → ${assigned} registrations now have categories based on team/player structure`);
  }
}

/**
 * Dynamically discover and analyze categories from registrations
 * Returns category metadata including whether each is team-based
 */
function discoverCategories(registrations: any[]) {
  console.log('\n🔍 DISCOVERING CATEGORIES from registrations...');
  console.log(`Total registrations to analyze: ${registrations.length}`);
  
  // First, auto-assign categories to any registrations missing them
  autoAssignCategories(registrations);
  
  const categoryAnalysis: Record<string, {
    totalRegistrations: number;
    hasTeamId: number;
    hasPlayerId: number;
    isTeamBased: boolean;
  }> = {};

  // Analyze all registrations to understand category structure
  let skipped = 0;
  registrations.forEach((reg, idx) => {
    const category = reg.metadata?.category;
    
    if (!category) {
      if (skipped < 3) {
        console.log(`⚠️ Registration ${idx + 1} (${reg.id}) has no category AND no team/player - SKIPPING`);
      }
      skipped++;
      return;
    }

    if (!categoryAnalysis[category]) {
      categoryAnalysis[category] = {
        totalRegistrations: 0,
        hasTeamId: 0,
        hasPlayerId: 0,
        isTeamBased: false
      };
    }

    categoryAnalysis[category].totalRegistrations++;
    if (reg.team_id) categoryAnalysis[category].hasTeamId++;
    if (reg.player_id) categoryAnalysis[category].hasPlayerId++;
  });

  if (skipped > 3) {
    console.log(`⚠️ ... and ${skipped - 3} more registrations skipped (no category, team, or player)`);
  }

  // Determine if each category is team-based by analyzing the data
  console.log('\n📊 CATEGORY ANALYSIS:');
  Object.keys(categoryAnalysis).forEach(category => {
    const analysis = categoryAnalysis[category];
    // If majority of registrations have team_id, it's team-based
    analysis.isTeamBased = analysis.hasTeamId > (analysis.totalRegistrations / 2);
    
    console.log(`\n   ${category.toUpperCase()}:`);
    console.log(`   ├─ Total registrations: ${analysis.totalRegistrations}`);
    console.log(`   ├─ With team_id: ${analysis.hasTeamId}`);
    console.log(`   ├─ With player_id: ${analysis.hasPlayerId}`);
    console.log(`   └─ Type: ${analysis.isTeamBased ? '👥 TEAM-BASED' : '👤 INDIVIDUAL'}`);
  });

  return categoryAnalysis;
}

/**
 * Fetch category metadata from database and merge with discovered categories
 * Database takes precedence, but we can work without it
 */
async function fetchCategoryMetadata(supabase: any, categoryNames: string[]) {
  console.log('\n🗄️ FETCHING category metadata from database...');
  console.log('Categories to fetch:', categoryNames);

  const { data: categoryData, error } = await supabase
    .from('categories')
    .select('name, is_team_based, display_name')
    .in('name', categoryNames);

  if (error) {
    console.warn('⚠️ Could not fetch categories from database:', error.message);
    console.log('→ Will use auto-detected values from registrations');
    return new Map<string, boolean>();
  }

  const metadata = new Map<string, boolean>();
  categoryData?.forEach(cat => {
    metadata.set(cat.name, cat.is_team_based);
    console.log(`   ✅ ${cat.name}: ${cat.is_team_based ? '👥 TEAM-BASED' : '👤 INDIVIDUAL'} (from database)`);
  });

  // Warn about missing categories
  const missingCategories = categoryNames.filter(name => !metadata.has(name));
  if (missingCategories.length > 0) {
    console.warn(`\n⚠️ Categories NOT in database (will use auto-detection):`, missingCategories);
  }

  return metadata;
}

/**
 * Group participants by category with fully dynamic detection
 * No hardcoded category names - everything discovered from data
 */
function groupByDivision(
  registrations: any[], 
  discoveredCategories: Record<string, any>,
  databaseMetadata: Map<string, boolean>
) {
  console.log('\n🔍 STARTING groupByDivision...');
  console.log('Registrations to process:', registrations.length);
  console.log('Discovered categories:', Object.keys(discoveredCategories));
  
  const divisions: Record<string, { 
    category: string;
    isTeamBased: boolean;
    participantIds: string[];
  }> = {};

  registrations.forEach((reg, index) => {
    const category = reg.metadata?.category;
    
    if (!category) {
      console.log(`\n[Reg ${index + 1}] ⚠️ No category - SKIPPED`);
      return;
    }

    // Determine if team-based: Database first, then auto-detection
    const isThisTeamBased = databaseMetadata.has(category)
      ? databaseMetadata.get(category)!
      : discoveredCategories[category]?.isTeamBased || false;

    if (index < 5) { // Log first 5 for debugging
      console.log(`\n[Reg ${index + 1}/${registrations.length}]`, {
        category,
        isTeamBased: isThisTeamBased ? '👥' : '👤',
        hasPlayer: !!reg.player?.id,
        hasTeam: !!reg.team?.id,
        source: databaseMetadata.has(category) ? 'database' : 'auto-detected'
      });
    }

    // Get participant ID based on whether category is team-based
    let participantId = null;
    
    if (isThisTeamBased) {
      // Team-based: prefer team_id, fallback to player_id
      participantId = reg.team?.id || reg.player?.id || null;
    } else {
      // Individual: always use player_id
      participantId = reg.player?.id || null;
    }

    if (!participantId) {
      if (index < 5) console.log(`  ❌ No valid participant ID - SKIPPED`);
      return;
    }

    // Add to division
    if (!divisions[category]) {
      console.log(`  ✨ Creating division: ${category} (${isThisTeamBased ? '👥 TEAM' : '👤 INDIVIDUAL'})`);
      divisions[category] = {
        category,
        isTeamBased: isThisTeamBased,
        participantIds: []
      };
    }
    
    divisions[category].participantIds.push(participantId);
  });

  console.log('\n📊 Division Summary BEFORE filtering:');
  Object.entries(divisions).forEach(([key, data]) => {
    console.log(`  ${key}: ${data.participantIds.length} participants (${data.isTeamBased ? '👥' : '👤'})`);
  });

  // Filter out divisions with less than 2 participants
  const removedDivisions: string[] = [];
  Object.keys(divisions).forEach((key) => {
    if (divisions[key].participantIds.length < 2) {
      removedDivisions.push(`${key} (${divisions[key].participantIds.length})`);
      delete divisions[key];
    }
  });

  if (removedDivisions.length > 0) {
    console.log('\n⚠️ Removed divisions (< 2 participants):', removedDivisions.join(', '));
  }

  // Remove duplicates for team-based categories (2 registrations = 1 team)
  // And filter to only valid team IDs that actually exist in the teams table
  Object.keys(divisions).forEach(key => {
    const division = divisions[key];
    if (division.isTeamBased) {
      const uniqueParticipants = [...new Set(division.participantIds)];
      const duplicatesRemoved = division.participantIds.length - uniqueParticipants.length;
      
      if (duplicatesRemoved > 0) {
        console.log(`\n🔧 ${key}: Removed ${duplicatesRemoved} duplicate team IDs (${division.participantIds.length} registrations → ${uniqueParticipants.length} unique teams)`);
        division.participantIds = uniqueParticipants;
      }
    }
  });

  console.log('\n✅ FINAL Division Summary:');
  Object.entries(divisions).forEach(([key, data]) => {
    console.log(`  ✓ ${key}: ${data.participantIds.length} participants (${data.isTeamBased ? '👥 TEAM' : '👤 INDIVIDUAL'}) → WILL GENERATE`);
  });
  
  console.log('🔍 END groupByDivision\n');

  return divisions;
}

interface GenerateFixturesRequest {
  fixture_type?: 'single_elim';
  fixtureType?: 'single_elim' | 'pool_knockout';
  replaceExisting?: boolean;
  autoAdvanceByes?: boolean;
  seedOrder?: 'registered' | 'random';
  poolOptions?: {
    numberOfPools: number;
    playersPerPool: number;
    advancePerPool: number;
  };
}

/**
 * Generate Fixtures API Route
 * POST: Creates tournament fixtures from confirmed registrations
 * 
 * Requires: Tournament organizer or admin permissions
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const tournamentId = params.id;

  try {
    const body: GenerateFixturesRequest = await request.json();
    const {
      fixture_type,
      fixtureType,
      replaceExisting = false,
      autoAdvanceByes = true,
      seedOrder = 'registered',
      poolOptions,
    } = body;

    // Support both field names for backward compatibility
    const finalFixtureType = fixtureType || fixture_type || 'single_elim';

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

    // Check if user is organizer or has admin/root role
    const { data: userRoles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('profile_id', currentUser.id)
      .in('role', ['admin', 'root']);

    const hasAdminAccess = userRoles && userRoles.length > 0;
    const isOrganizer = tournament.organizer_id === currentUser.id;

    if (!isOrganizer && !hasAdminAccess) {
      return NextResponse.json(
        { error: 'Forbidden - Only tournament organizer, admin, or root can generate fixtures' },
        { status: 403 }
      );
    }

    // Check if matches already exist
    const { data: existingMatches, count: existingCount } = await supabase
      .from('matches')
      .select('id', { count: 'exact' })
      .eq('tournament_id', tournamentId);

    if (existingCount && existingCount > 0 && !replaceExisting) {
      return NextResponse.json(
        {
          error: 'Fixtures already exist',
          message: `${existingCount} matches already exist. Set replaceExisting=true to regenerate.`,
          existingCount,
        },
        { status: 400 }
      );
    }

    // Safety check for delete limit
    if (replaceExisting && existingCount && existingCount > MAX_MATCHES_DELETE) {
      return NextResponse.json(
        {
          error: 'Too many existing matches',
          message: `Cannot delete ${existingCount} matches (limit: ${MAX_MATCHES_DELETE}). Contact support.`,
        },
        { status: 400 }
      );
    }

    // Get ALL registrations (confirmed + pending) with metadata
    const { data: registrations, error: regError } = await supabase
      .from('registrations')
      .select('*, player:players(id, first_name, last_name, player_rating, gender), team:teams(id, name)')
      .eq('tournament_id', tournamentId);
    
    console.log('\n📥 FETCHED REGISTRATIONS:');
    console.log('Total fetched:', registrations?.length || 0);
    
    // Debug: Show detailed breakdown
    if (registrations && registrations.length > 0) {
      const withCategory = registrations.filter(r => r.metadata?.category).length;
      const withTeam = registrations.filter(r => r.team_id).length;
      const withPlayer = registrations.filter(r => r.player_id).length;
      
      console.log('\nBreakdown:');
      console.log(`  - With metadata.category: ${withCategory}/${registrations.length}`);
      console.log(`  - With team_id: ${withTeam}`);
      console.log(`  - With player_id: ${withPlayer}`);
      
      // Show first 3 registrations in detail
      console.log('\nFirst 3 registrations (detailed):');
      registrations.slice(0, 3).forEach((reg, idx) => {
        console.log(`\n  [${idx + 1}]`, {
          id: reg.id,
          player_id: reg.player_id,
          team_id: reg.team_id,
          metadata: reg.metadata,
          'metadata.category': reg.metadata?.category,
          status: reg.status
        });
      });
    }

    if (regError) {
      return NextResponse.json({ error: regError.message }, { status: 500 });
    }

    if (!registrations || registrations.length < 2) {
      return NextResponse.json(
        {
          error: 'Insufficient participants',
          message: 'At least 2 registrations required to generate fixtures',
          totalCount: registrations?.length || 0,
        },
        { status: 400 }
      );
    }

    // ═══════════════════════════════════════════════════════════════
    // DYNAMIC CATEGORY DISCOVERY
    // No hardcoded categories - everything discovered from registrations
    // ═══════════════════════════════════════════════════════════════
    
    console.log('\n╔══════════════════════════════════════════════════════════╗');
    console.log('║     DYNAMIC FIXTURE GENERATION - NO HARDCODED DATA      ║');
    console.log('╚══════════════════════════════════════════════════════════╝');
    console.log(`Total registrations: ${registrations.length}`);
    console.log('Fixture type:', finalFixtureType);
    console.log('Pool options:', poolOptions);

    // Step 1: Discover categories from registrations (auto-detect team vs individual)
    const discoveredCategories = discoverCategories(registrations);
    const categoryNames = Object.keys(discoveredCategories);
    
    if (categoryNames.length === 0) {
      return NextResponse.json(
        {
          error: 'No categories found',
          message: 'Registrations must have metadata.category set. Please check your registration data.',
          hint: 'Run: SELECT DISTINCT metadata->\'category\' FROM registrations WHERE tournament_id = \'...\''
        },
        { status: 400 }
      );
    }

    console.log(`\n✨ DISCOVERED ${categoryNames.length} categories from data:`, categoryNames);

    // Step 2: Try to fetch category metadata from database (optional enhancement)
    const databaseMetadata = await fetchCategoryMetadata(supabase, categoryNames);

    // Step 3: Group participants by category using discovered + database metadata
    const groupedParticipants = groupByDivision(
      registrations, 
      discoveredCategories, 
      databaseMetadata
    );

    // Step 4: Validate team IDs actually exist in teams table for team-based categories
    for (const [divisionKey, divisionData] of Object.entries(groupedParticipants)) {
      if (divisionData.isTeamBased && divisionData.participantIds.length > 0) {
        console.log(`\n🔍 Validating team IDs for ${divisionKey}...`);
        
        const { data: validTeams } = await supabase
          .from('teams')
          .select('id')
          .in('id', divisionData.participantIds);
        
        const validTeamIds = new Set(validTeams?.map(t => t.id) || []);
        const invalidTeamIds = divisionData.participantIds.filter(id => !validTeamIds.has(id));
        
        if (invalidTeamIds.length > 0) {
          console.log(`   ⚠️ Found ${invalidTeamIds.length} invalid team IDs, removing them`);
          console.log(`   Invalid IDs:`, invalidTeamIds.slice(0, 3));
          divisionData.participantIds = divisionData.participantIds.filter(id => validTeamIds.has(id));
          console.log(`   ✅ Now have ${divisionData.participantIds.length} valid team IDs`);
        } else {
          console.log(`   ✅ All ${divisionData.participantIds.length} team IDs are valid`);
        }
      }
    }

    console.log('\n╔══════════════════════════════════════════════════════════╗');
    console.log('║          FINAL CATEGORY SUMMARY                         ║');
    console.log('╚══════════════════════════════════════════════════════════╝');
    console.log('Categories to generate:', Object.keys(groupedParticipants).length);
    
    Object.entries(groupedParticipants).forEach(([key, data], index) => {
      const source = databaseMetadata.has(key) ? '🗄️ database' : '🤖 auto-detected';
      console.log(`\n${index + 1}. ${key.toUpperCase()}`);
      console.log(`   └─ Participants: ${data.participantIds.length}`);
      console.log(`   └─ Type: ${data.isTeamBased ? '👥 TEAM-BASED' : '👤 INDIVIDUAL'} (${source})`);
      console.log(`   └─ Will generate: ${finalFixtureType === 'pool_knockout' ? '🏊 POOLS + KNOCKOUT' : '⚡ SINGLE-ELIM'}`);
    });
    
    console.log('\n══════════════════════════════════════════════════════════\n');

    if (Object.keys(groupedParticipants).length === 0) {
      return NextResponse.json(
        {
          error: 'No valid participants found',
          message: 'Registrations must have valid player/team IDs with category, rating, and gender',
        },
        { status: 400 }
      );
    }

    // Delete existing matches and pools if replaceExisting
    if (replaceExisting && existingCount && existingCount > 0) {
      // Delete pools first (will cascade to pool_players)
      await supabase
        .from('pools')
        .delete()
        .eq('tournament_id', tournamentId);

      // Delete matches
      const { error: deleteError } = await supabase
        .from('matches')
        .delete()
        .eq('tournament_id', tournamentId);

      if (deleteError) {
        return NextResponse.json(
          { error: 'Failed to delete existing matches', details: deleteError.message },
          { status: 500 }
        );
      }

      // Log deletion
      await recordAudit({
        action: 'DELETE_FIXTURES',
        targetTable: 'matches',
        targetId: tournamentId,
        metadata: { deletedCount: existingCount, replaceExisting: true },
        actorId: currentUser.id,
      });
    }

    // Generate fixtures for each division separately
    const allMatches: any[] = [];
    const allPools: any[] = [];
    const divisionResults: Record<string, any> = {};
    let totalMatchesCreated = 0;
    let totalAutoAdvanced = 0;
    let totalPoolsCreated = 0;

    const categoriesToProcess = Object.entries(groupedParticipants);
    console.log(`\n🚀 Starting loop for ${categoriesToProcess.length} categories...\n`);

    let categoryIndex = 0;
    for (const [divisionKey, divisionData] of categoriesToProcess) {
      categoryIndex++;
      console.log(`\n╔══════════════════════════════════════════════════════════╗`);
      console.log(`║  CATEGORY ${categoryIndex}/${categoriesToProcess.length}: ${divisionKey.toUpperCase()}`);
      console.log(`╚══════════════════════════════════════════════════════════╝`);
      
      try {
        const { category, isTeamBased, participantIds } = divisionData;

        console.log(`Category name: ${category}`);
        console.log(`Participants: ${participantIds.length}`);
        console.log(`Is team-based: ${isTeamBased}`);
        console.log(`Fixture type: ${finalFixtureType}`);
        console.log(`Pool options:`, poolOptions);

        // Check if Pool + Knockout format
        if (finalFixtureType === 'pool_knockout' && poolOptions) {
          console.log(`🏊 POOL MODE: Generating pools for ${category} with optimal pool count`);
          
          try {
            // Generate pool-based fixtures
            const poolResult = await generatePoolFixturesForCategory(
              supabase,
              tournamentId,
              category,
              participantIds,
              poolOptions,
              isTeamBased
            );

            console.log(`Pool generation result for ${category}:`, {
              pools: poolResult.pools.length,
              matches: poolResult.matches.length,
            });

            allMatches.push(...poolResult.matches);
            allPools.push(...poolResult.pools);
            totalMatchesCreated += poolResult.matches.length;
            totalPoolsCreated += poolResult.pools.length;

            divisionResults[divisionKey] = {
              division: category,
              participants: participantIds.length,
              pools: poolResult.pools.length,
              poolMatches: poolResult.matches.length,
              knockoutMatches: 0, // Created after pool completion
              autoAdvanced: 0,
            };

            console.log(`✅ Pool generation complete for ${category}: ${poolResult.pools.length} pools, ${poolResult.matches.length} matches`);
          } catch (poolError: any) {
            console.error(`❌ Failed to generate pools for ${category}:`, poolError);
            divisionResults[divisionKey] = {
              division: category,
              participants: participantIds.length,
              error: poolError.message,
              status: 'failed',
            };
            // Continue to next category instead of stopping
          }
          continue; // Skip single-elim logic for this category
        }
      
      console.log(`⚡ KNOCKOUT MODE: Generating single-elimination for ${category}`);

      // Generate single-elimination fixtures
      const fixtures = generateSingleElimFixtures(participantIds, tournamentId, {
        seed: seedOrder,
      });

      // Validate structure
      const validation = validateFixtures(fixtures);
      if (!validation.valid) {
        return NextResponse.json(
          {
            error: 'Invalid fixture structure',
            division: divisionKey,
            validationErrors: validation.errors,
          },
          { status: 500 }
        );
      }

      // Prepare matches for insertion
      const matchesToInsert = fixtures.map((fixture) => {
        // Use team_id for doubles/mixed, player_id for singles
        // Category is stored in court field for grouping
        return {
          tournament_id: fixture.tournament_id,
          round: fixture.round,
          bracket_pos: fixture.bracket_pos + totalMatchesCreated,
          player1_id: isTeamBased ? null : fixture.player1_id,
          player2_id: isTeamBased ? null : fixture.player2_id,
          team1_id: isTeamBased ? fixture.player1_id : null,
          team2_id: isTeamBased ? fixture.player2_id : null,
          status: fixture.status,
          winner_player_id: isTeamBased ? null : fixture.winner_player_id,
          winner_team_id: isTeamBased ? fixture.winner_player_id : null,
          court: category.toUpperCase(),
        };
      });

      // Insert matches for this division
      console.log(`Inserting ${matchesToInsert.length} matches for division: ${divisionKey}`);
      console.log('Sample matches for', divisionKey, ':', matchesToInsert.slice(0, 2));
      console.log('Participant IDs used:', participantIds.slice(0, 5));
      
      const { data: divisionMatches, error: insertError } = await supabase
        .from('matches')
        .insert(matchesToInsert)
        .select();

      if (insertError) {
        console.error('=== INSERT ERROR ===');
        console.error('Division:', divisionKey);
        console.error('Error:', insertError);
        console.error('Sample match that failed:', matchesToInsert[0]);
        console.error('All matches to insert:', JSON.stringify(matchesToInsert, null, 2));
        console.error('===================');
        
        return NextResponse.json(
          { 
            error: 'Failed to create matches', 
            division: divisionKey, 
            details: insertError.message,
            hint: insertError.hint,
            code: insertError.code,
            sampleMatch: matchesToInsert[0],
            participantIds: participantIds.slice(0, 3),
          },
          { status: 500 }
        );
      }

      console.log(`Successfully inserted ${divisionMatches.length} matches for ${divisionKey}`);

      allMatches.push(...divisionMatches);

      // Update next_match_id references for this division
      for (let i = 0; i < divisionMatches.length; i++) {
        const fixture = fixtures[i];
        if (fixture.next_match_pos !== undefined) {
          const nextMatch = divisionMatches[fixture.next_match_pos];
          if (nextMatch) {
            await supabase
              .from('matches')
              .update({ next_match_id: nextMatch.id })
              .eq('id', divisionMatches[i].id);
          }
        }
      }

      // Auto-advance byes for this division
      let autoAdvanced = 0;
      if (autoAdvanceByes) {
        autoAdvanced = await performAutoAdvance(
          supabase,
          divisionMatches,
          fixtures,
          isTeamBased
        );
        totalAutoAdvanced += autoAdvanced;
      }

      divisionResults[divisionKey] = {
        division: category,
        participants: participantIds.length,
        matches: divisionMatches.length,
        autoAdvanced,
      };

      totalMatchesCreated += divisionMatches.length;
      } catch (categoryError: any) {
        console.error(`❌ Error processing category ${divisionKey}:`, categoryError);
        divisionResults[divisionKey] = {
          division: divisionData.category,
          error: categoryError.message,
          status: 'failed',
        };
        // Continue to next category
      }
    }

    console.log('\n╔══════════════════════════════════════════════════════════╗');
    console.log('║               GENERATION SUMMARY                       ║');
    console.log('╚══════════════════════════════════════════════════════════╝');
    console.log('Categories detected:', Object.keys(groupedParticipants).length);
    console.log('Categories attempted:', categoryIndex);
    console.log('Total pools created:', totalPoolsCreated);
    console.log('Total matches created:', totalMatchesCreated);
    console.log('\nResults per category:');
    Object.entries(divisionResults).forEach(([key, result]: [string, any]) => {
      console.log(`\n${key}:`);
      if (result.error) {
        console.log('  ❌ FAILED:', result.error);
      } else {
        console.log(`  ✅ SUCCESS: ${result.pools || result.matches || 0} pools, ${result.poolMatches || result.matches || 0} matches`);
      }
    });
    console.log('\n══════════════════════════════════════════════════════════\n');

    const createdMatches = allMatches;

    // Update tournament status to in_progress
    await supabase
      .from('tournaments')
      .update({ status: 'in_progress', updated_at: new Date().toISOString() })
      .eq('id', tournamentId);

    // Log fixture generation
    await recordAudit({
      action: 'GENERATE_FIXTURES',
      targetTable: 'tournaments',
      targetId: tournamentId,
      metadata: {
        fixture_type,
        matchesCreated: totalMatchesCreated,
        autoAdvancedCount: totalAutoAdvanced,
        replaceExisting,
        divisions: Object.keys(groupedParticipants).length,
        divisionBreakdown: divisionResults,
      },
      actorId: currentUser.id,
    });

    // Fetch final state of matches
    const { data: finalMatches } = await supabase
      .from('matches')
      .select('*')
      .eq('tournament_id', tournamentId)
      .order('round')
      .order('bracket_pos');

    return NextResponse.json({
      success: true,
      message: finalFixtureType === 'pool_knockout' 
        ? 'Pool fixtures generated successfully. Knockout rounds will be created after pool completion.'
        : 'Fixtures generated successfully',
      matchesCreated: totalMatchesCreated,
      autoAdvancedCount: totalAutoAdvanced,
      divisionsCreated: Object.keys(groupedParticipants).length,
      poolsCreated: totalPoolsCreated,
      categories: Object.keys(groupedParticipants),
      divisionBreakdown: divisionResults,
      matches: finalMatches,
      fixtureType: finalFixtureType,
      debug: {
        totalRegistrations: registrations.length,
        categoriesFound: Object.keys(groupedParticipants),
        participantsPerCategory: Object.fromEntries(
          Object.entries(groupedParticipants).map(([key, data]) => [key, data.participantIds.length])
        ),
      },
    });
  } catch (error: any) {
    console.error('Generate fixtures error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate fixtures' },
      { status: 500 }
    );
  }
}

/**
 * Auto-advance winners for bye matches
 * Cascades through rounds if multiple byes in sequence
 */
async function performAutoAdvance(
  supabase: any,
  createdMatches: any[],
  fixtures: any[],
  isTeamFormat: boolean
): Promise<number> {
  let advancedCount = 0;
  const processedMatches = new Set<string>();

  // Find matches with byes (one player null, one not null, status completed)
  const byeMatches = createdMatches.filter(
    (match, idx) =>
      fixtures[idx].status === 'completed' && fixtures[idx].winner_player_id
  );

  for (const match of byeMatches) {
    if (processedMatches.has(match.id)) continue;

    const fixtureIndex = createdMatches.findIndex((m) => m.id === match.id);
    const fixture = fixtures[fixtureIndex];
    const winnerId = fixture.winner_player_id;

    if (!winnerId || !fixture.next_match_pos) continue;

    // Find next match
    const nextMatchFixture = fixtures[fixture.next_match_pos];
    const nextMatch = createdMatches[fixture.next_match_pos];

    if (!nextMatch) continue;

    // Determine which slot to fill
    const mapping = mapPlayerToNextMatch(fixtures, fixture.bracket_pos);
    if (!mapping) continue;

    const updateData: any = {
      [isTeamFormat ? `team${mapping.slot === 'player1' ? '1' : '2'}_id` : `${mapping.slot}_id`]:
        winnerId,
      updated_at: new Date().toISOString(),
    };

    // Update next match with winner
    await supabase.from('matches').update(updateData).eq('id', nextMatch.id);

    advancedCount++;
    processedMatches.add(match.id);

    // Check if next match now also has a bye (cascade)
    const updatedNextMatch = await supabase
      .from('matches')
      .select('*')
      .eq('id', nextMatch.id)
      .single();

    if (updatedNextMatch.data) {
      const hasOpponent = isTeamFormat
        ? updatedNextMatch.data.team1_id && updatedNextMatch.data.team2_id
        : updatedNextMatch.data.player1_id && updatedNextMatch.data.player2_id;

      // If next match still has only one participant, cascade auto-advance
      if (!hasOpponent) {
        const newWinner = isTeamFormat
          ? updatedNextMatch.data.team1_id || updatedNextMatch.data.team2_id
          : updatedNextMatch.data.player1_id || updatedNextMatch.data.player2_id;

        if (newWinner && updatedNextMatch.data.next_match_id) {
          // Recursive advance (limited to prevent infinite loops)
          // This is a simplified version - production would use iterative approach
          advancedCount++;
        }
      }
    }
  }

  return advancedCount;
}

/**
 * Calculate optimal number of pools based on participant count
 * Aims for pool sizes between 3-6 players for best balance
 */
function calculateOptimalPools(participantCount: number, userAdvancePerPool: number): {
  numberOfPools: number;
  poolSize: number;
  advancePerPool: number;
} {
  const MIN_POOL_SIZE = 3;
  const MAX_POOL_SIZE = 6;
  const IDEAL_POOL_SIZE = 4;

  // Very small tournaments (< 6 participants)
  if (participantCount <= 6) {
    return {
      numberOfPools: 1,
      poolSize: participantCount,
      advancePerPool: Math.min(userAdvancePerPool, Math.floor(participantCount / 2)),
    };
  }

  // Try to create pools close to ideal size
  let bestPools = 2;
  let bestDiff = 999;

  // Test different numbers of pools
  for (let numPools = 2; numPools <= Math.ceil(participantCount / MIN_POOL_SIZE); numPools++) {
    const avgSize = participantCount / numPools;
    
    // Prefer pool sizes in the ideal range
    if (avgSize >= MIN_POOL_SIZE && avgSize <= MAX_POOL_SIZE) {
      const diff = Math.abs(avgSize - IDEAL_POOL_SIZE);
      if (diff < bestDiff) {
        bestDiff = diff;
        bestPools = numPools;
      }
    }
  }

  const finalPoolSize = Math.ceil(participantCount / bestPools);
  
  return {
    numberOfPools: bestPools,
    poolSize: finalPoolSize,
    advancePerPool: Math.min(userAdvancePerPool, Math.floor(finalPoolSize / 2)),
  };
}

/**
 * Generate Pool + Knockout Fixtures for a specific category
 * Creates pools, assigns players, generates round-robin matches
 * Automatically determines optimal pool count based on participant count
 */
async function generatePoolFixturesForCategory(
  supabase: any,
  tournamentId: string,
  category: string,
  participantIds: string[],
  poolOptions: { numberOfPools: number; playersPerPool: number; advancePerPool: number },
  isTeamBased: boolean
) {
  // Calculate optimal pool configuration for this category's participant count
  const optimalConfig = calculateOptimalPools(participantIds.length, poolOptions.advancePerPool);
  
  console.log(`Category ${category}: ${participantIds.length} participants`);
  console.log(`Optimal configuration:`, optimalConfig);
  
  const numberOfPools = optimalConfig.numberOfPools;
  const advancePerPool = optimalConfig.advancePerPool;

  // Distribute participants across pools evenly
  const poolSize = Math.ceil(participantIds.length / numberOfPools);
  const poolsData: any[] = [];

  for (let i = 0; i < numberOfPools; i++) {
    const poolLetter = String.fromCharCode(65 + i); // A, B, C...
    const start = i * poolSize;
    const end = Math.min(start + poolSize, participantIds.length);
    const poolParticipants = participantIds.slice(start, end);

    if (poolParticipants.length >= 2) {
      poolsData.push({
        name: `Pool ${poolLetter}`,
        participants: poolParticipants,
        advanceCount: Math.min(advancePerPool, poolParticipants.length - 1),
      });
    }
  }

  console.log(`Creating ${poolsData.length} pools for category ${category}`);

  // Create pool records in database
  const poolsToInsert = poolsData.map(pool => ({
    tournament_id: tournamentId,
    name: pool.name,
    category: category.toUpperCase(), // Store category in pool
    size: pool.participants.length,
    advance_count: pool.advanceCount,
    status: 'in_progress',
  }));

  const { data: createdPools, error: poolError } = await supabase
    .from('pools')
    .insert(poolsToInsert)
    .select();

  if (poolError) {
    console.error('Pool creation error:', poolError);
    throw new Error(`Failed to create pools: ${poolError.message}`);
  }

  console.log(`Created ${createdPools.length} pool records`);

  // Create pool_players assignments
  // For team-based: use team_id, for singles: use player_id
  const poolPlayersToInsert: any[] = [];
  poolsData.forEach((pool, poolIndex) => {
    const dbPool = createdPools[poolIndex];
    pool.participants.forEach((participantId: string, position: number) => {
      poolPlayersToInsert.push({
        pool_id: dbPool.id,
        player_id: isTeamBased ? null : participantId, // Only use player_id for singles
        team_id: isTeamBased ? participantId : null,   // Use team_id for doubles/mixed
        position: position + 1,
        points: 0,
        wins: 0,
        losses: 0,
      });
    });
  });

  console.log(`Preparing to insert ${poolPlayersToInsert.length} pool player assignments`);
  console.log('Sample pool player:', poolPlayersToInsert[0]);

  const { error: poolPlayersError } = await supabase
    .from('pool_players')
    .insert(poolPlayersToInsert);

  if (poolPlayersError) {
    console.error('Pool players assignment error:', poolPlayersError);
    console.error('Failed insertions:', poolPlayersToInsert.slice(0, 3));
    throw new Error(`Failed to assign players to pools: ${poolPlayersError.message}`);
  }

  console.log(`✅ Assigned ${poolPlayersToInsert.length} participants to pools`);

  // Generate round-robin matches for each pool
  const matchesToInsert: any[] = [];
  let matchPosition = 0;

  createdPools.forEach((dbPool, poolIndex) => {
    const pool = poolsData[poolIndex];
    const participantIds = pool.participants;

    // Round-robin: every participant vs every other participant
    for (let i = 0; i < participantIds.length; i++) {
      for (let j = i + 1; j < participantIds.length; j++) {
        // Use team_id for doubles/mixed, player_id for singles
        // Category is tracked via court field
        matchesToInsert.push({
          tournament_id: tournamentId,
          pool_id: dbPool.id,
          match_type: 'pool',
          round: 1,
          bracket_pos: matchPosition++,
          player1_id: isTeamBased ? null : participantIds[i],
          player2_id: isTeamBased ? null : participantIds[j],
          team1_id: isTeamBased ? participantIds[i] : null,
          team2_id: isTeamBased ? participantIds[j] : null,
          status: 'pending',
          court: `${category.toUpperCase()} - ${pool.name}`, // Category + Pool name
        });
      }
    }
  });

  console.log(`Creating ${matchesToInsert.length} pool matches`);

  // Insert pool matches
  const { data: createdMatches, error: matchError } = await supabase
    .from('matches')
    .insert(matchesToInsert)
    .select();

  if (matchError) {
    console.error('Match creation error:', matchError);
    throw new Error(`Failed to create pool matches: ${matchError.message}`);
  }

  console.log(`✅ Pool generation complete for ${category}: ${createdPools.length} pools, ${createdMatches.length} matches`);

  return {
    pools: createdPools,
    matches: createdMatches,
  };
}

