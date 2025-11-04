import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { generateTournamentCSV } from '@/lib/reports';
import { isAdmin } from '@/lib/roles';

/**
 * Data Export API
 * GET: Export tournament data to CSV format
 * Query params: ?format=csv&scope=organizer|admin&tournamentId=xxx
 */
export async function GET(request: NextRequest) {
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

    const searchParams = request.nextUrl.searchParams;
    const format = searchParams.get('format') || 'csv';
    const scope = searchParams.get('scope') || 'organizer';
    const tournamentId = searchParams.get('tournamentId');

    // Build query based on scope
    let query = supabase.from('tournaments').select(`
      *,
      registrations(
        *,
        player:players(first_name, last_name, player_rating, gender)
      ),
      matches(id, round, status, score1, score2)
    `);

    if (scope === 'organizer') {
      query = query.eq('organizer_id', user.id);
    } else if (scope === 'admin') {
      if (!(await isAdmin(user.id))) {
        return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
      }
    }

    if (tournamentId) {
      query = query.eq('id', tournamentId);
    }

    const { data, error } = await query;

    if (error) throw error;

    if (format === 'csv') {
      // Flatten data for CSV export
      const flatData = data.flatMap((tournament) =>
        tournament.registrations?.map((reg: any) => ({
          tournament_id: tournament.id,
          tournament_title: tournament.title,
          tournament_location: tournament.location,
          tournament_start_date: tournament.start_date,
          tournament_status: tournament.status,
          player_first_name: reg.player?.first_name || '',
          player_last_name: reg.player?.last_name || '',
          player_rating: reg.player?.player_rating || '',
          player_gender: reg.player?.gender || '',
          registration_status: reg.status,
          payment_status: reg.payment_status,
          entry_fee_paid: reg.entry_fee_paid || 0,
          payment_method: reg.payment_method || '',
          collected_by: reg.collected_by_name || '',
        })) || []
      );

      const csv = generateTournamentCSV(flatData);

      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="tournament-export-${Date.now()}.csv"`,
        },
      });
    }

    return NextResponse.json({ data });
  } catch (error: any) {
    console.error('Export error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

