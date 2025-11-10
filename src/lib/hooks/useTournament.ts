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
          player:players(
            id,
            first_name,
            last_name,
            player_rating,
            gender,
            profile_id,
            profiles!players_profile_id_fkey(email)
          ),
          team:teams(
            id,
            name,
            player1:players!teams_player1_id_fkey(
              id,
              first_name,
              last_name,
              player_rating,
              gender,
              profiles!players_profile_id_fkey(email)
            ),
            player2:players!teams_player2_id_fkey(
              id,
              first_name,
              last_name,
              player_rating,
              gender,
              profiles!players_profile_id_fkey(email)
            )
          )
        `)
        .eq('tournament_id', tournamentId);

      if (error) throw error;
      
      console.log(`Fetched ${data?.length || 0} registrations for tournament ${tournamentId}`);
      
      // Flatten the nested profile email into player object
      return data.map((reg: any) => ({
        ...reg,
        player: reg.player ? {
          ...reg.player,
          email: reg.player.profiles?.email,
        } : null,
        team: reg.team ? {
          ...reg.team,
          player1: reg.team.player1 ? {
            ...reg.team.player1,
            email: reg.team.player1.profiles?.email,
          } : null,
          player2: reg.team.player2 ? {
            ...reg.team.player2,
            email: reg.team.player2.profiles?.email,
          } : null,
        } : null,
      }));
    },
    enabled: !!tournamentId,
    staleTime: 0, // Always consider data stale - fetch fresh data
    cacheTime: 0, // Don't cache - force fresh fetch
  });
}
