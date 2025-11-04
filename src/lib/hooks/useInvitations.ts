import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';

export interface Invitation {
  id: string;
  tournament_id: string;
  email: string;
  invited_by: string;
  status: 'pending' | 'accepted' | 'expired' | 'rejected';
  token: string;
  display_name: string | null;
  metadata: any;
  created_at: string;
  expires_at: string | null;
  accepted_at: string | null;
  updated_at: string;
}

/**
 * Fetch invitations for a tournament
 */
export function useTournamentInvitations(tournamentId: string) {
  return useQuery({
    queryKey: ['invitations', tournamentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('invitations')
        .select('*')
        .eq('tournament_id', tournamentId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Invitation[];
    },
    enabled: !!tournamentId,
  });
}

/**
 * Validate an invitation token (client-side check)
 */
export function useValidateInvitation(token: string) {
  return useQuery({
    queryKey: ['invitation-validate', token],
    queryFn: async () => {
      const response = await fetch(`/api/invite/accept?token=${token}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Invalid invitation');
      }

      return result;
    },
    enabled: !!token,
    retry: false,
  });
}

