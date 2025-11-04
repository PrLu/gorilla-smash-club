'use client';

import type { Match } from '@/lib/hooks/useMatches';
import { Card } from '@/components/ui';
import { Radio, Trophy, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface LiveScoreCardProps {
  match: Match;
  size?: 'compact' | 'full';
}

/**
 * Large readable scoreboard component
 * Optimized for mobile viewing with big fonts and clear contrast
 */
export function LiveScoreCard({ match, size = 'full' }: LiveScoreCardProps) {
  const isLive = match.status === 'in_progress';
  const isCompleted = match.status === 'completed';

  const player1Name = match.player1_id || match.team1_id ? 'Player/Team 1' : 'TBD';
  const player2Name = match.player2_id || match.team2_id ? 'Player/Team 2' : 'TBD';

  const winner =
    isCompleted && match.score1 !== null && match.score2 !== null
      ? match.score1 > match.score2
        ? 'player1'
        : 'player2'
      : null;

  if (size === 'compact') {
    return (
      <Card variant="elevated" padding="md" className="relative overflow-hidden">
        {isLive && (
          <motion.div
            className="absolute right-4 top-4"
            animate={{ opacity: [1, 0.5, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <div className="flex items-center gap-1 rounded-full bg-error-100 px-3 py-1 text-xs font-semibold text-error-700">
              <Radio className="h-3 w-3" />
              LIVE
            </div>
          </motion.div>
        )}

        <div className="mb-2 text-sm text-gray-600">
          Round {match.round} • Match {match.bracket_pos + 1}
          {match.court && ` • Court ${match.court}`}
        </div>

        <div className="flex items-center justify-between">
          <span className={`font-medium ${winner === 'player1' ? 'text-success-600' : 'text-gray-900'}`}>
            {player1Name}
          </span>
          <span className="text-2xl font-bold text-gray-900">{match.score1 ?? '-'}</span>
        </div>

        <div className="my-2 border-t border-gray-200" />

        <div className="flex items-center justify-between">
          <span className={`font-medium ${winner === 'player2' ? 'text-success-600' : 'text-gray-900'}`}>
            {player2Name}
          </span>
          <span className="text-2xl font-bold text-gray-900">{match.score2 ?? '-'}</span>
        </div>
      </Card>
    );
  }

  // Full size scoreboard
  return (
    <Card variant="elevated" padding="none" className="overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between bg-gradient-to-r from-primary-600 to-primary-700 px-6 py-4 text-white">
        <div>
          <div className="text-sm opacity-90">
            Round {match.round} • Match {match.bracket_pos + 1}
          </div>
          {match.court && <div className="text-xs opacity-75">Court {match.court}</div>}
        </div>

        {isLive && (
          <motion.div
            animate={{ opacity: [1, 0.6, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="flex items-center gap-2 rounded-full bg-white/20 px-4 py-2"
          >
            <Radio className="h-4 w-4" />
            <span className="text-sm font-semibold">LIVE</span>
          </motion.div>
        )}

        {isCompleted && (
          <div className="flex items-center gap-1 rounded-full bg-success-500 px-3 py-1">
            <Trophy className="h-4 w-4" />
            <span className="text-sm font-semibold">FINAL</span>
          </div>
        )}

        {match.status === 'pending' && (
          <div className="flex items-center gap-1 rounded-full bg-white/20 px-3 py-1">
            <Clock className="h-4 w-4" />
            <span className="text-sm">Scheduled</span>
          </div>
        )}
      </div>

      {/* Score Display */}
      <div className="p-8">
        <div className="space-y-6">
          {/* Player 1 */}
          <div className={`flex items-center justify-between ${winner === 'player1' ? 'opacity-100' : 'opacity-75'}`}>
            <div className="flex items-center gap-3">
              {winner === 'player1' && <Trophy className="h-6 w-6 text-success-500" />}
              <div>
                <div className={`text-xl font-semibold ${winner === 'player1' ? 'text-success-600' : 'text-gray-900'}`}>
                  {player1Name}
                </div>
              </div>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={match.score1}
                initial={{ scale: 1.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className={`text-6xl font-bold ${winner === 'player1' ? 'text-success-600' : 'text-gray-900'}`}
              >
                {match.score1 ?? '-'}
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="border-t-2 border-gray-200" />

          {/* Player 2 */}
          <div className={`flex items-center justify-between ${winner === 'player2' ? 'opacity-100' : 'opacity-75'}`}>
            <div className="flex items-center gap-3">
              {winner === 'player2' && <Trophy className="h-6 w-6 text-success-500" />}
              <div>
                <div className={`text-xl font-semibold ${winner === 'player2' ? 'text-success-600' : 'text-gray-900'}`}>
                  {player2Name}
                </div>
              </div>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={match.score2}
                initial={{ scale: 1.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className={`text-6xl font-bold ${winner === 'player2' ? 'text-success-600' : 'text-gray-900'}`}
              >
                {match.score2 ?? '-'}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Match Time */}
        {match.scheduled_at && (
          <div className="mt-6 text-center text-sm text-gray-500">
            {new Date(match.scheduled_at).toLocaleString('en-IN', {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </div>
        )}
      </div>
    </Card>
  );
}

