import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';

interface DeleteFixturesParams {
  tournamentId: string;
}

interface DeleteFixturesResponse {
  success: boolean;
  message: string;
  deletedMatches: number;
  deletedPools: number;
}

/**
 * Hook to delete all fixtures for a tournament
 */
export function useDeleteFixtures() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ tournamentId }: DeleteFixturesParams) => {
      // Get current user session
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(
        `/api/tournaments/${tournamentId}/fixtures`,
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || result.message || 'Failed to delete fixtures');
      }

      return result as DeleteFixturesResponse;
    },
    onSuccess: (data, variables) => {
      // Invalidate tournament queries to refetch updated data
      queryClient.invalidateQueries({ queryKey: ['tournament', variables.tournamentId] });
      queryClient.invalidateQueries({ queryKey: ['matches', variables.tournamentId] });
      queryClient.invalidateQueries({ queryKey: ['pools', variables.tournamentId] });
      queryClient.invalidateQueries({ queryKey: ['tournaments'] });
      queryClient.invalidateQueries({ queryKey: ['my-tournaments'] });
    },
    onError: (error: any) => {
      console.error('Delete fixtures error:', error);
    },
  });
}

