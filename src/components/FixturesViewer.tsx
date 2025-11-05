'use client';

import { useState, useCallback } from 'react';
import type { Match } from '@/lib/hooks/useMatches';
import { Card, Modal } from '@/components/ui';
import { Trophy, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { staggerContainer, staggerItem } from '@/lib/motion';

interface FixturesViewerProps {
  matches: Match[];
  onMatchClick?: (match: Match) => void;
}

/**
 * Responsive fixtures viewer for tournament brackets
 * Desktop: Horizontal columns by round
 * Mobile: Vertical list grouped by round
 * Keyboard: Arrow navigation between matches
 */
export function FixturesViewer({ matches, onMatchClick }: FixturesViewerProps) {
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [view, setView] = useState<'all' | 'pools' | 'knockout'>('all');

  // Separate pool and knockout matches
  const poolMatches = matches.filter(m => m.match_type === 'pool');
  const knockoutMatches = matches.filter(m => m.match_type === 'knockout' || !m.match_type);

  // Group pool matches by court (pool name)
  const matchesByPool = poolMatches.reduce((acc, match) => {
    const poolName = match.court || 'Unknown Pool';
    if (!acc[poolName]) acc[poolName] = [];
    acc[poolName].push(match);
    return acc;
  }, {} as Record<string, Match[]>);

  const pools = Object.keys(matchesByPool).sort();

  // Group knockout matches by round
  const matchesByRound = knockoutMatches.reduce((acc, match) => {
    if (!acc[match.round]) acc[match.round] = [];
    acc[match.round].push(match);
    return acc;
  }, {} as Record<number, Match[]>);

  const rounds = Object.keys(matchesByRound)
    .map(Number)
    .sort((a, b) => a - b);

  const getRoundName = (round: number, totalRounds: number) => {
    if (round === totalRounds) return 'Final';
    if (round === totalRounds - 1) return 'Semi-Finals';
    if (round === totalRounds - 2) return 'Quarter-Finals';
    return `Round ${round}`;
  };

  const handleMatchClick = useCallback(
    (match: Match) => {
      setSelectedMatch(match);
      onMatchClick?.(match);
    },
    [onMatchClick]
  );

  if (!matches || matches.length === 0) {
    return (
      <Card className="p-12 text-center">
        <Trophy className="mx-auto mb-4 h-16 w-16 text-gray-300" />
        <p className="text-gray-600">No fixtures generated yet.</p>
        <p className="mt-2 text-sm text-gray-500">
          Click &quot;Generate Fixtures&quot; to create matches.
        </p>
      </Card>
    );
  }

  const hasPoolMatches = poolMatches.length > 0;
  const hasKnockoutMatches = knockoutMatches.length > 0;

  return (
    <>
      {/* View Toggle (if both pool and knockout exist) */}
      {hasPoolMatches && hasKnockoutMatches && (
        <div className="mb-6 flex justify-center gap-2">
          <button
            onClick={() => setView('all')}
            className={`rounded-lg px-4 py-2 font-medium transition-colors ${
              view === 'all'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            All Fixtures
          </button>
          <button
            onClick={() => setView('pools')}
            className={`rounded-lg px-4 py-2 font-medium transition-colors ${
              view === 'pools'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            Pool Matches ({poolMatches.length})
          </button>
          <button
            onClick={() => setView('knockout')}
            className={`rounded-lg px-4 py-2 font-medium transition-colors ${
              view === 'knockout'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            Knockout Rounds ({knockoutMatches.length})
          </button>
        </div>
      )}

      {/* Pool Matches View */}
      {(view === 'all' || view === 'pools') && hasPoolMatches && (
        <div className="mb-8">
          <h3 className="mb-4 text-xl font-bold text-gray-900 dark:text-white">Pool Stage</h3>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {pools.map((poolName) => (
              <Card key={poolName} padding="md">
                <h4 className="mb-3 font-semibold text-primary-600 dark:text-primary-400">
                  {poolName}
                </h4>
                <div className="space-y-2">
                  {matchesByPool[poolName].map((match) => (
                    <MatchCard key={match.id} match={match} onClick={() => handleMatchClick(match)} />
                  ))}
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Knockout Matches View */}
      {(view === 'all' || view === 'knockout') && hasKnockoutMatches && (
        <div>
          <h3 className="mb-4 text-xl font-bold text-gray-900 dark:text-white">
            {hasPoolMatches ? 'Knockout Stage' : 'Bracket'}
          </h3>
          
          {/* Desktop View - Horizontal Rounds */}
          <div className="hidden lg:block">
            <div className="overflow-x-auto scrollbar-thin">
              <motion.div
                className="inline-flex min-w-full gap-6 p-4"
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
              >
            {rounds.map((round) => (
              <motion.div
                key={round}
                variants={staggerItem}
                className="flex min-w-[280px] flex-col gap-4"
              >
                <div className="sticky top-0 z-10 rounded-lg bg-primary-50 px-4 py-2">
                  <h3 className="text-center font-semibold text-primary-900">
                    {getRoundName(round, rounds.length)}
                  </h3>
                  <p className="text-center text-xs text-primary-700">
                    {matchesByRound[round].length} match{matchesByRound[round].length !== 1 ? 'es' : ''}
                  </p>
                </div>

                {matchesByRound[round].map((match) => (
                  <MatchCard
                    key={match.id}
                    match={match}
                    onClick={() => handleMatchClick(match)}
                  />
                ))}
              </motion.div>
            ))}
              </motion.div>
            </div>
          </div>

          {/* Mobile View - Vertical List */}
          <div className="lg:hidden">
            <div className="space-y-6">
              {rounds.map((round) => (
                <div key={round}>
                  <h3 className="mb-3 rounded-lg bg-primary-50 px-4 py-2 font-semibold text-primary-900">
                    {getRoundName(round, rounds.length)}
                  </h3>
                  <div className="space-y-3">
                    {matchesByRound[round].map((match) => (
                      <MatchCard
                        key={match.id}
                        match={match}
                        onClick={() => handleMatchClick(match)}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Match Detail Modal */}
      <Modal
        isOpen={!!selectedMatch}
        onClose={() => setSelectedMatch(null)}
        title={`Match ${selectedMatch?.bracket_pos ? selectedMatch.bracket_pos + 1 : ''} Details`}
        size="md"
      >
        {selectedMatch && (
          <div className="space-y-4">
            <div className="rounded-lg bg-gray-50 p-4">
              <div className="mb-3 text-sm text-gray-600">
                Round {selectedMatch.round}
                {selectedMatch.court && ` • Court ${selectedMatch.court}`}
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-900">
                    {selectedMatch.player1 
                      ? `${selectedMatch.player1.first_name} ${selectedMatch.player1.last_name}`
                      : selectedMatch.team1
                      ? selectedMatch.team1.name
                      : 'TBD'}
                  </span>
                  <span className="text-2xl font-bold text-gray-900">
                    {selectedMatch.score1 ?? '-'}
                  </span>
                </div>

                <div className="border-t border-gray-200" />

                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-900">
                    {selectedMatch.player2 
                      ? `${selectedMatch.player2.first_name} ${selectedMatch.player2.last_name}`
                      : selectedMatch.team2
                      ? selectedMatch.team2.name
                      : 'TBD'}
                  </span>
                  <span className="text-2xl font-bold text-gray-900">
                    {selectedMatch.score2 ?? '-'}
                  </span>
                </div>
              </div>

              {selectedMatch.status === 'completed' && (
                <div className="mt-3 rounded-lg bg-success-50 px-3 py-2 text-center text-sm font-semibold text-success-700">
                  ✓ Match Completed
                </div>
              )}

              {selectedMatch.status === 'in_progress' && (
                <div className="mt-3 animate-pulse rounded-lg bg-error-50 px-3 py-2 text-center text-sm font-semibold text-error-700">
                  🔴 LIVE
                </div>
              )}
            </div>

            {selectedMatch.scheduled_at && (
              <p className="text-sm text-gray-600">
                <strong>Scheduled:</strong> {new Date(selectedMatch.scheduled_at).toLocaleString()}
              </p>
            )}
          </div>
        )}
      </Modal>
    </>
  );
}

/**
 * Individual match card component
 */
function MatchCard({ match, onClick }: { match: Match; onClick: () => void }) {
  const statusConfig = {
    pending: { bg: 'bg-white', border: 'border-gray-200' },
    in_progress: { bg: 'bg-blue-50', border: 'border-blue-300' },
    completed: { bg: 'bg-white', border: 'border-gray-300' },
    cancelled: { bg: 'bg-gray-50', border: 'border-gray-300' },
  };

  const config = statusConfig[match.status];

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`w-full rounded-lg border-2 ${config.border} ${config.bg} p-4 text-left shadow-sm transition-all hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500`}
      tabIndex={0}
      role="button"
      aria-label={`Match ${match.bracket_pos + 1}, Round ${match.round}`}
    >
      {/* Match Header */}
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs font-medium text-gray-500">
          Match {match.bracket_pos + 1}
        </span>
        {match.court && (
          <span className="text-xs text-gray-500">Court {match.court}</span>
        )}
      </div>

      {/* Participants */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-900">
            {match.player1 
              ? `${match.player1.first_name} ${match.player1.last_name}`
              : match.team1
              ? match.team1.name
              : 'TBD'}
          </span>
          {match.score1 !== null && (
            <span className="text-xl font-bold text-gray-900">{match.score1}</span>
          )}
        </div>

        <div className="border-t border-gray-200" />

        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-900">
            {match.player2 
              ? `${match.player2.first_name} ${match.player2.last_name}`
              : match.team2
              ? match.team2.name
              : 'TBD'}
          </span>
          {match.score2 !== null && (
            <span className="text-xl font-bold text-gray-900">{match.score2}</span>
          )}
        </div>
      </div>

      {/* Status Badge */}
      <div className="mt-3 flex items-center justify-between">
        {match.status === 'completed' && match.score1 !== null && match.score2 !== null && (
          <span className="text-xs font-semibold text-success-600">
            ✓ Final: {match.score1 > match.score2 ? 'P1 Wins' : 'P2 Wins'}
          </span>
        )}
        {match.status === 'in_progress' && (
          <span className="animate-pulse text-xs font-semibold text-error-600">
            🔴 LIVE
          </span>
        )}
        {match.status === 'pending' && (
          <span className="text-xs text-gray-500">Not started</span>
        )}

        <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-primary-600" />
      </div>
    </motion.button>
  );
}

