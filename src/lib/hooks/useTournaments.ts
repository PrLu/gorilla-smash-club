import { useQuery } from '@tanstack/react-query';
import { supabase } from '../supabaseClient';

export interface Tournament {
  id: string;
  title: string;
  description: string | null;
  start_date: string;
  end_date: string;
  location: string;
  format: 'singles' | 'doubles' | 'mixed'; // Legacy - kept for backward compatibility
  formats?: string[]; // New - array of formats
  entry_fee: number;
  max_participants: number | null;
  status: 'draft' | 'open' | 'closed' | 'in_progress' | 'completed' | 'cancelled' | 'archived';
  organizer_id: string;
  created_at: string;
  updated_at: string;
}

/**
 * Fetch all public tournaments (open, in_progress, completed)
 */
/**
 * Fetch all public tournaments (excluding archived by default)
 */
export function useTournaments(includeArchived: boolean = false) {
  return useQuery({
    queryKey: ['tournaments', includeArchived ? 'with-archived' : 'active'],
    queryFn: async () => {
      let query = supabase
        .from('tournaments')
        .select(`
          *,
          registrations:registrations(count),
          invitations:invitations!invitations_tournament_id_fkey(count)
        `);

      if (includeArchived) {
        query = query.in('status', ['open', 'closed', 'in_progress', 'completed', 'archived']);
      } else {
        query = query.in('status', ['open', 'closed', 'in_progress', 'completed']);
      }

      query = query.order('start_date', { ascending: true });

      const { data, error } = await query;

      if (error) throw error;
      
      // Format the data to include participant count (registrations + pending invitations)
      return data.map((tournament: any) => ({
        ...tournament,
        participant_count: (tournament.registrations?.[0]?.count || 0) + (tournament.invitations?.[0]?.count || 0),
      })) as (Tournament & { participant_count: number })[];
    },
  });
}

/**
 * Fetch tournaments owned by current user
 */
/**
 * Fetch active tournaments owned by current user
 * Only shows tournaments in active states (open, in_progress)
 * Excludes: draft, closed, completed, cancelled, archived
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
          registrations:registrations(count),
          invitations:invitations!invitations_tournament_id_fkey(count)
        `)
        .eq('organizer_id', user.id)
        .in('status', ['open', 'in_progress']) // Only active/running tournaments
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Format the data to include participant count (registrations + pending invitations)
      return data.map((tournament: any) => ({
        ...tournament,
        participant_count: (tournament.registrations?.[0]?.count || 0) + (tournament.invitations?.[0]?.count || 0),
      })) as (Tournament & { participant_count: number })[];
    },
  });
}

/**
 * Fetch ALL tournaments owned by current user (including all statuses)
 * Used for "My Tournaments" section when showing archived/completed
 */
export function useAllMyTournaments() {
  return useQuery({
    queryKey: ['all-my-tournaments'],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('tournaments')
        .select(`
          *,
          registrations:registrations(count),
          invitations:invitations!invitations_tournament_id_fkey(count)
        `)
        .eq('organizer_id', user.id)
        .order('created_at', { ascending: false});

      if (error) throw error;
      
      return data.map((tournament: any) => ({
        ...tournament,
        participant_count: (tournament.registrations?.[0]?.count || 0) + (tournament.invitations?.[0]?.count || 0),
      })) as (Tournament & { participant_count: number })[];
    },
  });
}
