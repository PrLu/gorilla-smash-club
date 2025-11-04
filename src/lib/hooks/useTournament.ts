import { useQuery } from '@tanstack/react-query';
import { supabase } from '../supabaseClient';
import type { Tournament } from './useTournaments';

/**
 * Fetch single tournament by ID
 */
export function useTournament(id: string) {
  return useQuery({
    queryKey: ['tournament', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tournaments')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as Tournament;
    },
    enabled: !!id,
  });
}

/**
 * Fetch registrations for a tournament
 */
export function useTournamentRegistrations(tournamentId: string) {
  return useQuery({
    queryKey: ['registrations', tournamentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('registrations')
        .select(`
          *,
          player:players(*),
          team:teams(
            *,
            player1:players!teams_player1_id_fkey(*),
            player2:players!teams_player2_id_fkey(*)
          )
        `)
        .eq('tournament_id', tournamentId)
        .eq('status', 'confirmed');

      if (error) throw error;
      return data;
    },
    enabled: !!tournamentId,
  });
}
