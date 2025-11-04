import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';

interface InviteParticipantData {
  tournamentId: string;
  email: string;
  display_name?: string;
  team_id?: string;
  category: 'singles' | 'doubles' | 'mixed';
  rating: '<3.2' | '<3.6' | '<3.8' | 'open';
  gender: 'male' | 'female';
  partner_email?: string;
  partner_display_name?: string;
  partner_rating?: '<3.2' | '<3.6' | '<3.8' | 'open';
  partner_gender?: 'male' | 'female';
  role?: 'player' | 'team_leader';
  sendInvite?: boolean;
}

/**
 * Hook to invite a participant to a tournament
 * Creates placeholder profile if needed and sends email invitation
 */
export function useInviteParticipant() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: InviteParticipantData) => {
      const { tournamentId, ...inviteData } = data;

      // Get current user's session token
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_APP_URL || ''}/api/tournaments/${tournamentId}/participants/manual-invite`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify(inviteData),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to invite participant');
      }

      return result;
    },
    onSuccess: (data, variables) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['registrations', variables.tournamentId] });
      queryClient.invalidateQueries({ queryKey: ['invitations', variables.tournamentId] });
    },
  });
}

