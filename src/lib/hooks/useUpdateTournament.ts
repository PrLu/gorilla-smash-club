import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';

interface UpdateTournamentData {
  tournamentId: string;
  title?: string;
  description?: string;
  start_date?: string;
  end_date?: string;
  location?: string;
  formats?: string[];
  entry_fee?: number;
  max_participants?: number;
  status?: string;
}

/**
 * Hook to update tournament details
 * Invalidates related queries and shows progress
 */
export function useUpdateTournament() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateTournamentData) => {
      const { tournamentId, ...updateFields } = data;

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`/api/tournaments/${tournamentId}/update`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(updateFields),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update tournament');
      }

      return result;
    },
    onSuccess: (data, variables) => {
      // Invalidate all related queries
      queryClient.invalidateQueries({ queryKey: ['tournament', variables.tournamentId] });
      queryClient.invalidateQueries({ queryKey: ['tournaments'] });
      queryClient.invalidateQueries({ queryKey: ['my-tournaments'] });
      
      // Optimistically update tournament data
      queryClient.setQueryData(['tournament', variables.tournamentId], (old: any) => {
        if (!old) return old;
        return { ...old, ...variables };
      });
    },
  });
}

