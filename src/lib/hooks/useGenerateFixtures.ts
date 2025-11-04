import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';

interface GenerateFixturesParams {
  tournamentId: string;
  fixtureType?: 'single_elim';
  replaceExisting?: boolean;
  autoAdvanceByes?: boolean;
  seedOrder?: 'registered' | 'random';
}

interface GenerateFixturesResponse {
  success: boolean;
  message: string;
  matchesCreated: number;
  autoAdvancedCount: number;
  participantCount: number;
  rounds: number;
  matches: any[];
}

/**
 * Hook to generate tournament fixtures
 * Invalidates related queries and shows progress
 */
export function useGenerateFixtures() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: GenerateFixturesParams) => {
      const { tournamentId, ...options } = params;

      // Get current user session
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(
        `/api/tournaments/${tournamentId}/generate-fixtures`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            fixture_type: options.fixtureType || 'single_elim',
            replaceExisting: options.replaceExisting ?? false,
            autoAdvanceByes: options.autoAdvanceByes ?? true,
            seedOrder: options.seedOrder || 'registered',
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || result.message || 'Failed to generate fixtures');
      }

      return result as GenerateFixturesResponse;
    },
    onSuccess: (data, variables) => {
      // Invalidate all related queries
      queryClient.invalidateQueries({ queryKey: ['matches', variables.tournamentId] });
      queryClient.invalidateQueries({ queryKey: ['tournament', variables.tournamentId] });
      queryClient.invalidateQueries({ queryKey: ['tournaments'] });
      queryClient.invalidateQueries({ queryKey: ['my-tournaments'] });
      
      // Optimistically update tournament status
      queryClient.setQueryData(['tournament', variables.tournamentId], (old: any) => {
        if (!old) return old;
        return { ...old, status: 'in_progress' };
      });
    },
    onError: (error: Error) => {
      console.error('Generate fixtures error:', error);
    },
  });
}

