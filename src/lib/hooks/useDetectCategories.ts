import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';

interface CategoryDetection {
  category: string;
  displayName: string;
  participantCount: number;
  participants: any[];
  isTeamBased: boolean;
  eligible: boolean;
  reason?: string;
}

interface DetectCategoriesResponse {
  success: boolean;
  categories: CategoryDetection[];
  summary: {
    total: number;
    eligible: number;
    skipped: number;
    totalParticipants: number;
  };
}

/**
 * Hook to detect all categories in a tournament with participant counts
 * Used for automatic fixture generation confirmation
 */
export function useDetectCategories(tournamentId: string) {
  return useQuery({
    queryKey: ['detect-categories', tournamentId],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(
        `/api/tournaments/${tournamentId}/detect-categories`,
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to detect categories');
      }

      const data: DetectCategoriesResponse = await response.json();
      return data;
    },
    enabled: !!tournamentId,
  });
}


