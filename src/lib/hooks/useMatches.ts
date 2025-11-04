'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '../supabaseClient';

export interface Match {
  id: string;
  tournament_id: string;
  round: number;
  bracket_pos: number;
  player1_id: string | null;
  player2_id: string | null;
  team1_id: string | null;
  team2_id: string | null;
  score1: number | null;
  score2: number | null;
  winner_player_id: string | null;
  winner_team_id: string | null;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  next_match_id: string | null;
  scheduled_at: string | null;
  court: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Fetch matches for a tournament with Realtime subscription
 * Automatically refetches when matches are updated
 */
export function useMatches(tournamentId: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['matches', tournamentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('matches')
        .select('*')
        .eq('tournament_id', tournamentId)
        .order('round', { ascending: true })
        .order('bracket_pos', { ascending: true });

      if (error) throw error;
      return data as Match[];
    },
    enabled: !!tournamentId,
  });

  // Subscribe to realtime updates for matches
  useEffect(() => {
    if (!tournamentId) return;

    const channel = supabase
      .channel(`matches-${tournamentId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'matches',
          filter: `tournament_id=eq.${tournamentId}`,
        },
        (payload) => {
          console.log('Match update:', payload);
          // Invalidate and refetch matches
          queryClient.invalidateQueries({ queryKey: ['matches', tournamentId] });
        }
      )
      .subscribe();

    // Cleanup subscription on unmount
    return () => {
      supabase.removeChannel(channel);
    };
  }, [tournamentId, queryClient]);

  return query;
}
