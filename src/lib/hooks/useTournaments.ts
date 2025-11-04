import { useQuery } from '@tanstack/react-query';
import { supabase } from '../supabaseClient';

export interface Tournament {
  id: string;
  title: string;
  description: string | null;
  start_date: string;
  end_date: string;
  location: string;
  format: 'singles' | 'doubles' | 'mixed';
  entry_fee: number;
  max_participants: number | null;
  status: 'draft' | 'open' | 'closed' | 'in_progress' | 'completed' | 'cancelled';
  organizer_id: string;
  created_at: string;
  updated_at: string;
}

/**
 * Fetch all public tournaments (open, in_progress, completed)
 */
export function useTournaments() {
  return useQuery({
    queryKey: ['tournaments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tournaments')
        .select(`
          *,
          registrations:registrations(count)
        `)
        .in('status', ['open', 'closed', 'in_progress', 'completed'])
        .order('start_date', { ascending: true });

      if (error) throw error;
      
      // Format the data to include participant count
      return data.map((tournament: any) => ({
        ...tournament,
        participant_count: tournament.registrations?.[0]?.count || 0,
      })) as (Tournament & { participant_count: number })[];
    },
  });
}

/**
 * Fetch tournaments owned by current user
 */
export function useMyTournaments() {
  return useQuery({
    queryKey: ['my-tournaments'],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('tournaments')
        .select(`
          *,
          registrations:registrations(count)
        `)
        .eq('organizer_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Format the data to include participant count
      return data.map((tournament: any) => ({
        ...tournament,
        participant_count: tournament.registrations?.[0]?.count || 0,
      })) as (Tournament & { participant_count: number })[];
    },
  });
}
