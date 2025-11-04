import { useQuery } from '@tanstack/react-query';

/**
 * Fetch tournament summary report
 */
export function useTournamentSummary(tournamentId: string) {
  return useQuery({
    queryKey: ['tournament-summary', tournamentId],
    queryFn: async () => {
      const response = await fetch(`/api/tournaments/${tournamentId}/reports/summary`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch tournament summary');
      }

      const data = await response.json();
      return data.summary;
    },
    enabled: !!tournamentId,
  });
}

/**
 * Trigger data export
 */
export async function exportTournamentData({
  format = 'csv',
  scope = 'organizer',
  tournamentId,
}: {
  format?: 'csv' | 'xlsx';
  scope?: 'organizer' | 'admin';
  tournamentId?: string;
}) {
  const params = new URLSearchParams({ format, scope });
  if (tournamentId) params.set('tournamentId', tournamentId);

  const response = await fetch(`/api/reports/export?${params.toString()}`);

  if (!response.ok) {
    throw new Error('Export failed');
  }

  // Download file
  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `tournament-export-${Date.now()}.${format}`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}

