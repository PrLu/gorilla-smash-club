import { createClient } from '@supabase/supabase-js';

/**
 * Reporting and analytics utilities
 * Generates tournament summaries, player stats, and exports
 */

export interface TournamentSummary {
  tournament_id: string;
  title: string;
  organizer_id: string;
  status: string;
  total_registrations: number;
  confirmed_registrations: number;
  paid_registrations: number;
  total_matches: number;
  completed_matches: number;
  pending_matches: number;
  total_revenue: number;
}

/**
 * Get tournament summary from materialized view
 */
export async function getTournamentSummary(tournamentId: string): Promise<TournamentSummary> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data, error } = await supabase
    .from('vw_tournament_summary')
    .select('*')
    .eq('tournament_id', tournamentId)
    .single();

  if (error) throw error;

  return data as TournamentSummary;
}

/**
 * Get all tournament summaries for an organizer
 */
export async function getOrganizerSummaries(organizerId: string) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data, error } = await supabase
    .from('vw_tournament_summary')
    .select('*')
    .eq('organizer_id', organizerId)
    .order('start_date', { ascending: false });

  if (error) throw error;

  return data;
}

/**
 * Export tournament data to CSV format
 */
export function generateTournamentCSV(data: any[]): string {
  if (!data || data.length === 0) return '';

  const headers = Object.keys(data[0]);
  const csvRows = [headers.join(',')];

  for (const row of data) {
    const values = headers.map((header) => {
      const value = row[header];
      // Escape quotes and wrap in quotes if contains comma
      const escaped = String(value || '').replace(/"/g, '""');
      return escaped.includes(',') ? `"${escaped}"` : escaped;
    });
    csvRows.push(values.join(','));
  }

  return csvRows.join('\n');
}

/**
 * Refresh materialized views
 */
export async function refreshReportingViews() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { error } = await supabase.rpc('refresh_reporting_views');

  if (error) throw error;

  return { success: true };
}

/**
 * Get player statistics
 */
export async function getPlayerStats(playerId?: string) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  let query = supabase
    .from('vw_player_stats_global')
    .select('*')
    .order('tournaments_played', { ascending: false });

  if (playerId) {
    query = query.eq('player_id', playerId);
  }

  const { data, error } = await query;

  if (error) throw error;

  return data;
}

