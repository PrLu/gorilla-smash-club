import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * Diagnostic endpoint to check registration categories
 * GET /api/tournaments/:id/registrations/check-categories
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

    // Fetch all registrations with metadata
    const { data: registrations, error } = await supabase
      .from('registrations')
      .select('id, player_id, team_id, status, metadata')
      .eq('tournament_id', tournamentId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Analyze categories
    const categoryStats: Record<string, number> = {};
    const registrationsWithoutCategory: any[] = [];
    const registrationDetails: any[] = [];

    registrations?.forEach((reg) => {
      const category = reg.metadata?.category;
      
      registrationDetails.push({
        id: reg.id,
        player_id: reg.player_id,
        team_id: reg.team_id,
        status: reg.status,
        category: category || 'NOT SET',
        hasMetadata: !!reg.metadata && Object.keys(reg.metadata).length > 0,
        metadata: reg.metadata,
      });

      if (category) {
        categoryStats[category] = (categoryStats[category] || 0) + 1;
      } else {
        registrationsWithoutCategory.push({
          id: reg.id,
          player_id: reg.player_id,
          team_id: reg.team_id,
        });
      }
    });

    return NextResponse.json({
      success: true,
      tournamentId,
      totalRegistrations: registrations?.length || 0,
      categoryStats,
      registrationsWithoutCategory: registrationsWithoutCategory.length,
      registrationDetails,
      issues: {
        missingCategory: registrationsWithoutCategory.length > 0,
        needsUpdate: registrationsWithoutCategory,
      },
      message: registrationsWithoutCategory.length > 0
        ? `⚠️ Found ${registrationsWithoutCategory.length} registrations without category metadata. These will default to 'singles'.`
        : '✅ All registrations have category metadata set.',
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to check categories' },
      { status: 500 }
    );
  }
}

/**
 * Fix missing categories - set all registrations without category to 'singles'
 * POST /api/tournaments/:id/registrations/check-categories
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const tournamentId = params.id;

  try {
    const body = await request.json();
    const { fixMissing = false, defaultCategory = 'singles' } = body;

    if (!fixMissing) {
      return NextResponse.json({
        error: 'Set fixMissing=true to update registrations',
      }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get registrations without category
    const { data: registrations } = await supabase
      .from('registrations')
      .select('id, metadata, team_id')
      .eq('tournament_id', tournamentId);

    const toUpdate: any[] = [];

    registrations?.forEach((reg) => {
      if (!reg.metadata?.category) {
        // Determine category based on team_id
        const category = reg.team_id ? 'doubles' : defaultCategory;
        
        toUpdate.push({
          id: reg.id,
          metadata: {
            ...(reg.metadata || {}),
            category,
          },
        });
      }
    });

    // Update in batches
    if (toUpdate.length > 0) {
      for (const update of toUpdate) {
        await supabase
          .from('registrations')
          .update({ metadata: update.metadata })
          .eq('id', update.id);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Updated ${toUpdate.length} registrations with category metadata`,
      updatedCount: toUpdate.length,
      details: toUpdate.map(u => ({
        id: u.id,
        category: u.metadata.category,
      })),
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fix categories' },
      { status: 500 }
    );
  }
}

