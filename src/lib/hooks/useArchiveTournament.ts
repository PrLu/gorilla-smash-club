import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';

/**
 * Hook to archive a tournament (soft delete)
 * Changes status to 'archived' instead of deleting from database
 */
export function useArchiveTournament() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (tournamentId: string) => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`/api/tournaments/${tournamentId}/archive`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to archive tournament');
      }

      return result;
    },
    onSuccess: (data, tournamentId) => {
      // Invalidate all tournament queries
      queryClient.invalidateQueries({ queryKey: ['tournaments'] });
      queryClient.invalidateQueries({ queryKey: ['my-tournaments'] });
      queryClient.invalidateQueries({ queryKey: ['tournament', tournamentId] });
    },
  });
}

/**
 * Hook to restore a tournament from archive
 */
export function useRestoreTournament() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (tournamentId: string) => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`/api/tournaments/${tournamentId}/archive`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to restore tournament');
      }

      return result;
    },
    onSuccess: (data, tournamentId) => {
      queryClient.invalidateQueries({ queryKey: ['tournaments'] });
      queryClient.invalidateQueries({ queryKey: ['my-tournaments'] });
      queryClient.invalidateQueries({ queryKey: ['tournament', tournamentId] });
    },
  });
}

