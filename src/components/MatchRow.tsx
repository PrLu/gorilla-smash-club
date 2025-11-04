'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import type { Match } from '@/lib/hooks/useMatches';
import toast from 'react-hot-toast';
import { Edit2, Save, X } from 'lucide-react';

interface MatchRowProps {
  match: Match;
  isOrganizer: boolean;
}

export function MatchRow({ match, isOrganizer }: MatchRowProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [score1, setScore1] = useState(match.score1?.toString() || '');
  const [score2, setScore2] = useState(match.score2?.toString() || '');
  const queryClient = useQueryClient();

  const updateMatch = useMutation({
    mutationFn: async ({ score1, score2 }: { score1: number; score2: number }) => {
      // Determine winner
      const winnerId = score1 > score2 ? match.player1_id : match.player2_id;
      const winnerTeamId = score1 > score2 ? match.team1_id : match.team2_id;

      const { data, error } = await supabase
        .from('matches')
        .update({
          score1,
          score2,
          winner_player_id: winnerId,
          winner_team_id: winnerTeamId,
          status: 'completed',
          updated_at: new Date().toISOString(),
        })
        .eq('id', match.id)
        .select()
        .single();

      if (error) throw error;

      // Auto-advance winner to next match if exists
      if (match.next_match_id && (winnerId || winnerTeamId)) {
        const { error: advanceError } = await supabase
          .from('matches')
          .update({
            // Determine which player/team slot to fill in next match
            // This is simplified - in production you'd have more complex logic
            player1_id: winnerId || undefined,
            team1_id: winnerTeamId || undefined,
          })
          .eq('id', match.next_match_id);

        if (advanceError) console.error('Failed to advance winner:', advanceError);
      }

      return data;
    },
    onSuccess: () => {
      toast.success('Match updated successfully!');
      queryClient.invalidateQueries({ queryKey: ['matches', match.tournament_id] });
      setIsEditing(false);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update match');
    },
  });

  const handleSave = () => {
    if (!score1 || !score2) {
      toast.error('Please enter both scores');
      return;
    }
    updateMatch.mutate({ score1: parseInt(score1), score2: parseInt(score2) });
  };

  const statusColors = {
    pending: 'bg-gray-100 text-gray-800',
    in_progress: 'bg-blue-100 text-blue-800',
    completed: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 transition-shadow hover:shadow-md">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <span className="text-sm font-medium text-gray-900">
            Round {match.round} • Position {match.bracket_pos + 1}
          </span>
          {match.court && <span className="ml-2 text-sm text-gray-500">• Court {match.court}</span>}
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${statusColors[match.status]}`}
        >
          {match.status.replace('_', ' ')}
        </span>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="font-medium text-gray-900">
            {match.player1_id || match.team1_id ? 'Player/Team 1' : 'TBD'}
          </span>
          {isEditing ? (
            <input
              type="number"
              value={score1}
              onChange={(e) => setScore1(e.target.value)}
              className="w-20 rounded border border-gray-300 px-3 py-1 text-center"
              placeholder="0"
              min="0"
            />
          ) : (
            <span className="text-xl font-bold text-gray-900">
              {match.score1 !== null ? match.score1 : '-'}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between">
          <span className="font-medium text-gray-900">
            {match.player2_id || match.team2_id ? 'Player/Team 2' : 'TBD'}
          </span>
          {isEditing ? (
            <input
              type="number"
              value={score2}
              onChange={(e) => setScore2(e.target.value)}
              className="w-20 rounded border border-gray-300 px-3 py-1 text-center"
              placeholder="0"
              min="0"
            />
          ) : (
            <span className="text-xl font-bold text-gray-900">
              {match.score2 !== null ? match.score2 : '-'}
            </span>
          )}
        </div>
      </div>

      {isOrganizer && match.status !== 'completed' && (
        <div className="mt-4 flex gap-2">
          {isEditing ? (
            <>
              <button
                onClick={handleSave}
                disabled={updateMatch.isPending}
                className="flex flex-1 items-center justify-center gap-1 rounded bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                {updateMatch.isPending ? 'Saving...' : 'Save'}
              </button>
              <button
                onClick={() => setIsEditing(false)}
                className="flex items-center gap-1 rounded bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-300"
              >
                <X className="h-4 w-4" />
                Cancel
              </button>
            </>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="flex flex-1 items-center justify-center gap-1 rounded bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
            >
              <Edit2 className="h-4 w-4" />
              Update Score
            </button>
          )}
        </div>
      )}
    </div>
  );
}
