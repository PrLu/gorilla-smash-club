import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getTournamentSummary } from '@/lib/reports';
import { isOrganizerOfTournament, isAdmin } from '@/lib/roles';

/**
 * Tournament Summary Report API
 * GET: Fetch aggregated tournament statistics
 * Requires organizer or admin access
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const tournamentId = params.id;

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check permissions
    const hasAccess =
      (await isOrganizerOfTournament(user.id, tournamentId)) || (await isAdmin(user.id));

    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Forbidden - Must be organizer or admin' },
        { status: 403 }
      );
    }

    const summary = await getTournamentSummary(tournamentId);

    return NextResponse.json({ summary });
  } catch (error: any) {
    console.error('Tournament summary error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

