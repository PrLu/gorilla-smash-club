import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * Detect Categories API Route
 * GET: Returns all distinct categories with participant counts for a tournament
 * Used for the automatic fixture generation confirmation modal
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const tournamentId = params.id;

  try {
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

    // Verify user has permission (organizer, admin, or root)
    const { data: tournament } = await supabase
      .from('tournaments')
      .select('organizer_id')
      .eq('id', tournamentId)
      .single();

    if (!tournament) {
      return NextResponse.json({ error: 'Tournament not found' }, { status: 404 });
    }

    const { data: userRoles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('profile_id', currentUser.id)
      .in('role', ['admin', 'root']);

    const hasAdminAccess = userRoles && userRoles.length > 0;
    const isOrganizer = tournament.organizer_id === currentUser.id;

    if (!isOrganizer && !hasAdminAccess) {
      return NextResponse.json(
        { error: 'Forbidden - Only tournament organizer, admin, or root can detect categories' },
        { status: 403 }
      );
    }

    // Get all registrations with metadata (both confirmed and pending to show full picture)
    const { data: registrations, error: regError } = await supabase
      .from('registrations')
      .select('*, player:players(id, first_name, last_name), team:teams(id, name)')
      .eq('tournament_id', tournamentId);

    if (regError) {
      return NextResponse.json({ error: regError.message }, { status: 500 });
    }

    console.log('=== CATEGORY DETECTION DEBUG ===');
    console.log('Total registrations:', registrations?.length || 0);
    
    if (!registrations || registrations.length === 0) {
      return NextResponse.json({
        categories: [],
        totalParticipants: 0,
        message: 'No registrations found',
      });
    }

    // Debug: Log all registrations
    registrations.forEach((reg, idx) => {
      console.log(`Registration ${idx + 1}:`, {
        id: reg.id,
        status: reg.status,
        metadata: reg.metadata,
        category: reg.metadata?.category,
        has_player: !!reg.player,
        has_team: !!reg.team,
      });
    });

    // Group by category
    const categoryMap: Record<string, {
      category: string;
      displayName: string;
      participantCount: number;
      participants: any[];
      isTeamBased: boolean;
      eligible: boolean;
      reason?: string;
    }> = {};

    registrations.forEach((reg) => {
      // Get category from metadata - this is where the category is stored during registration
      const category = reg.metadata?.category || 'singles';
      const isTeamBased = category === 'doubles' || category === 'mixed';
      
      // For team-based categories, check if team exists, otherwise use player
      // For singles, always use player
      let participant = null;
      let participantType = '';
      
      if (isTeamBased) {
        if (reg.team_id && reg.team) {
          participant = reg.team;
          participantType = 'team';
        } else if (reg.player_id && reg.player) {
          // Team doesn't exist yet, use player as placeholder
          participant = reg.player;
          participantType = 'player (needs team)';
        }
      } else {
        if (reg.player_id && reg.player) {
          participant = reg.player;
          participantType = 'player';
        }
      }

      console.log(`Processing registration: category=${category}, isTeamBased=${isTeamBased}, hasParticipant=${!!participant}, type=${participantType}, team_id=${reg.team_id}, player_id=${reg.player_id}`);

      // Count this registration if it has any valid participant
      if (participant) {
        if (!categoryMap[category]) {
          categoryMap[category] = {
            category,
            displayName: category === 'mixed' 
              ? 'Mixed Doubles' 
              : category.charAt(0).toUpperCase() + category.slice(1),
            participantCount: 0,
            participants: [],
            isTeamBased,
            eligible: false,
          };
        }
        categoryMap[category].participantCount++;
        categoryMap[category].participants.push(participant);
      }
    });

    console.log('Category map after processing:', Object.keys(categoryMap));
    Object.entries(categoryMap).forEach(([key, data]) => {
      console.log(`${key}: ${data.participantCount} participants`);
    });
    console.log('=== END DEBUG ===');

    // Determine eligibility (minimum 2 participants required)
    Object.values(categoryMap).forEach((cat) => {
      if (cat.participantCount < 2) {
        cat.eligible = false;
        cat.reason = `Only ${cat.participantCount} participant${cat.participantCount === 1 ? '' : 's'} (minimum 2 required)`;
      } else {
        cat.eligible = true;
      }
    });

    // Sort by participant count (descending)
    const categories = Object.values(categoryMap).sort((a, b) => b.participantCount - a.participantCount);

    const eligibleCount = categories.filter(c => c.eligible).length;
    const skippedCount = categories.filter(c => !c.eligible).length;
    const totalParticipants = registrations.length;

    return NextResponse.json({
      success: true,
      categories,
      summary: {
        total: categories.length,
        eligible: eligibleCount,
        skipped: skippedCount,
        totalParticipants,
      },
    });
  } catch (error: any) {
    console.error('Detect categories error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to detect categories' },
      { status: 500 }
    );
  }
}

