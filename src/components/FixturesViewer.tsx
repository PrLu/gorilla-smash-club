'use client';

import { useState, useCallback } from 'react';
import type { Match } from '@/lib/hooks/useMatches';
import { Card, Modal, Button } from '@/components/ui';
import { Trophy, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { staggerContainer, staggerItem } from '@/lib/motion';
import { MatchScoringModal } from '@/components/MatchScoringModal';
import { PoolStandingsTable } from '@/components/PoolStandingsTable';
import toast from 'react-hot-toast';

interface FixturesViewerProps {
  matches: Match[];
  onMatchClick?: (match: Match) => void;
  canEditScores?: boolean;
  onScoreUpdated?: () => void;
  tournamentId?: string;
}

/**
 * Responsive fixtures viewer for tournament brackets
 * Desktop: Horizontal columns by round
 * Mobile: Vertical list grouped by round
 * Keyboard: Arrow navigation between matches
 */
export function FixturesViewer({ matches, onMatchClick, canEditScores = false, onScoreUpdated, tournamentId }: FixturesViewerProps) {
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [scoringMatch, setScoringMatch] = useState<Match | null>(null);
  const [view, setView] = useState<'all' | 'pools' | 'knockout' | 'standings'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [advancing, setAdvancing] = useState(false);

  // Extract unique categories from matches (stored in court field)
  const categories = Array.from(new Set(matches.map(m => m.court).filter(Boolean))).sort();
  const hasMultipleCategories = categories.length > 1;

  // Filter matches by selected category
  const categoryFilteredMatches = selectedCategory === 'all' 
    ? matches 
    : matches.filter(m => m.court === selectedCategory);

  // Separate pool and knockout matches from filtered matches
  const poolMatches = categoryFilteredMatches.filter(m => m.match_type === 'pool');
  const knockoutMatches = categoryFilteredMatches.filter(m => m.match_type === 'knockout' || !m.match_type);

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
    // Calculate how many rounds from the end this is
    const roundsFromEnd = totalRounds - round;
    
    // Naming based on matches in the round (not total rounds)
    // Count matches in current round to determine actual stage
    const matchesInRound = matchesByRound[round]?.length || 0;
    
    // Final is always 1 match
    if (matchesInRound === 1) return 'Final';
    
    // Semi-Finals is always 2 matches (4 teams)
    if (matchesInRound === 2) return 'Semi-Finals';
    
    // Quarter-Finals is always 4 matches (8 teams)
    if (matchesInRound === 4) return 'Quarter-Finals';
    
    // Pre Quarter-Finals is 8 matches (16 teams)
    if (matchesInRound === 8) return 'Pre Quarter-Finals';
    
    // Round of 32 is 16 matches (32 teams)
    if (matchesInRound === 16) return 'Round of 32';
    
    // Round of 64 is 32 matches (64 teams)
    if (matchesInRound === 32) return 'Round of 64';
    
    // Fallback for any other size
    return `Round of ${matchesInRound * 2}`;
  };

  const handleMatchClick = useCallback(
    (match: Match) => {
      // Check if both players/teams are assigned (not TBD)
      const hasBothPlayers = (match.player1_id && match.player2_id) || (match.team1_id && match.team2_id);
      
      if (canEditScores && match.status !== 'completed' && hasBothPlayers) {
        // Open scoring modal for incomplete matches with both players assigned
        setScoringMatch(match);
      } else if (canEditScores && match.status !== 'completed' && !hasBothPlayers) {
        // TBD match - show message
        toast.error('Cannot score this match yet. Players are not assigned (TBD).');
      } else {
        // Open details modal for completed matches or view-only
        setSelectedMatch(match);
        onMatchClick?.(match);
      }
    },
    [onMatchClick, canEditScores]
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

  // Show empty state if category filter has no matches
  if (categoryFilteredMatches.length === 0 && selectedCategory !== 'all') {
    return (
      <>
        {hasMultipleCategories && (
          <div className="mb-6">
            <h3 className="mb-3 text-sm font-medium text-gray-700 dark:text-gray-300">
              Select Category
            </h3>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedCategory('all')}
                className="rounded-full px-5 py-2.5 font-semibold shadow-sm transition-all bg-white text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                All Categories ({matches.length})
              </button>
              {categories.map((category) => {
                const count = matches.filter(m => m.court === category).length;
                return (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`rounded-full px-5 py-2.5 font-semibold shadow-sm transition-all ${
                      selectedCategory === category
                        ? 'bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-md'
                        : 'bg-white text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                    }`}
                  >
                    {category} ({count})
                  </button>
                );
              })}
            </div>
          </div>
        )}
        <Card className="p-12 text-center">
          <Trophy className="mx-auto mb-4 h-16 w-16 text-gray-300" />
          <p className="text-gray-600">No fixtures found for {selectedCategory}.</p>
          <p className="mt-2 text-sm text-gray-500">
            Select another category or view all fixtures.
          </p>
        </Card>
      </>
    );
  }

  const hasPoolMatches = poolMatches.length > 0;
  const hasKnockoutMatches = knockoutMatches.length > 0;

  const handleAdvanceQualified = async () => {
    if (!tournamentId) return;
    
    if (!confirm('Advance qualified players to knockout rounds? This will fill the bracket with pool winners and runners-up.')) {
      return;
    }

    setAdvancing(true);
    try {
      const { supabase } = await import('@/lib/supabaseClient');
      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.access_token) {
        toast.error('Please sign in again');
        setAdvancing(false);
        return;
      }

      const response = await fetch(`/api/tournaments/${tournamentId}/pools/advance`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(`Failed to advance players: ${data.error || 'Unknown error'}`);
        setAdvancing(false);
        return;
      }

      toast.success(`${data.stats.qualifiedPlayers} players advanced to knockout rounds!`);
      onScoreUpdated?.();
    } catch (err) {
      console.error('Advance error:', err);
      toast.error('Failed to advance players');
    } finally {
      setAdvancing(false);
    }
  };

  return (
    <>
      {/* Category Tabs (if multiple categories exist) */}
      {hasMultipleCategories && (
        <div className="mb-6">
          <h3 className="mb-3 text-sm font-medium text-gray-700 dark:text-gray-300">
            Select Category
          </h3>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`rounded-full px-5 py-2.5 font-semibold shadow-sm transition-all ${
                selectedCategory === 'all'
                  ? 'bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-md'
                  : 'bg-white text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
              }`}
            >
              All Categories ({matches.length})
            </button>
            {categories.map((category) => {
              const count = matches.filter(m => m.court === category).length;
              return (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`rounded-full px-5 py-2.5 font-semibold shadow-sm transition-all ${
                    selectedCategory === category
                      ? 'bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-md'
                      : 'bg-white text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                  }`}
                >
                  {category} ({count})
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* View Toggle (if both pool and knockout exist) */}
      {hasPoolMatches && (
        <div className="mb-6 flex flex-wrap justify-center gap-2">
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
            onClick={() => setView('standings')}
            className={`rounded-lg px-4 py-2 font-medium transition-colors ${
              view === 'standings'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            Pool Standings
          </button>
          {hasKnockoutMatches && (
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
          )}
        </div>
      )}

      {/* Pool Standings View */}
      {view === 'standings' && hasPoolMatches && tournamentId && (
        <PoolStandingsTable
          tournamentId={tournamentId}
          canAdvance={canEditScores}
          onAdvanceClick={handleAdvanceQualified}
        />
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

      {/* Match Scoring Modal (for entering scores) */}
      <MatchScoringModal
        isOpen={!!scoringMatch}
        onClose={() => setScoringMatch(null)}
        match={scoringMatch}
        onScoreSaved={() => {
          setScoringMatch(null);
          onScoreUpdated?.();
        }}
      />

      {/* Match Detail Modal (for viewing completed matches) */}
      <Modal
        isOpen={!!selectedMatch}
        onClose={() => setSelectedMatch(null)}
        title={`Match ${selectedMatch?.bracket_pos ? selectedMatch.bracket_pos + 1 : ''} Details`}
        size="md"
      >
        {selectedMatch && (
          <div className="space-y-4">
            <div className="rounded-lg bg-gray-50 p-4">
              <div className="mb-3 text-sm text-gray-600 dark:text-gray-400">
                Round {selectedMatch.round}
                {selectedMatch.court && ` • ${selectedMatch.court}`}
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className={`font-medium ${
                    selectedMatch.status === 'completed' && selectedMatch.winner_player_id === selectedMatch.player1_id
                      ? 'font-bold text-green-600 dark:text-green-400'
                      : 'text-gray-900 dark:text-white'
                  }`}>
                    {selectedMatch.player1 
                      ? `${selectedMatch.player1.first_name} ${selectedMatch.player1.last_name}`
                      : selectedMatch.team1
                      ? selectedMatch.team1.name
                      : 'TBD'}
                  </span>
                  {selectedMatch.score_summary && (
                    <span className="text-lg font-bold text-gray-900 dark:text-white">
                      {selectedMatch.score_summary.split(',').map((score, i) => (
                        <span key={i} className="ml-2">{score}</span>
                      ))}
                    </span>
                  )}
                </div>

                <div className="border-t border-gray-200 dark:border-gray-700" />

                <div className="flex items-center justify-between">
                  <span className={`font-medium ${
                    selectedMatch.status === 'completed' && selectedMatch.winner_player_id === selectedMatch.player2_id
                      ? 'font-bold text-green-600 dark:text-green-400'
                      : 'text-gray-900 dark:text-white'
                  }`}>
                    {selectedMatch.player2 
                      ? `${selectedMatch.player2.first_name} ${selectedMatch.player2.last_name}`
                      : selectedMatch.team2
                      ? selectedMatch.team2.name
                      : 'TBD'}
                  </span>
                </div>
              </div>

              {/* Match Format Info */}
              {selectedMatch.match_format && (
                <div className="mt-3 text-xs text-gray-600 dark:text-gray-400">
                  Format: {selectedMatch.match_format === 'single_set' ? 'Single Set' : 'Best of 3'}
                </div>
              )}

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
          <span className={`text-sm font-medium ${
            match.status === 'completed' && match.winner_player_id === match.player1_id 
              ? 'font-bold text-green-600 dark:text-green-400'
              : 'text-gray-900 dark:text-white'
          }`}>
            {match.player1 
              ? `${match.player1.first_name} ${match.player1.last_name}`
              : match.team1
              ? match.team1.name
              : 'TBD'}
          </span>
          {match.score_summary && (
            <span className="text-xs text-gray-600 dark:text-gray-400">
              {match.score_summary.split(',')[0]}
              {match.match_format === 'best_of_3' && match.score_summary.split(',').length > 1 && '...'}
            </span>
          )}
        </div>

        <div className="border-t border-gray-200 dark:border-gray-700" />

        <div className="flex items-center justify-between">
          <span className={`text-sm font-medium ${
            match.status === 'completed' && match.winner_player_id === match.player2_id
              ? 'font-bold text-green-600 dark:text-green-400'
              : 'text-gray-900 dark:text-white'
          }`}>
            {match.player2 
              ? `${match.player2.first_name} ${match.player2.last_name}`
              : match.team2
              ? match.team2.name
              : 'TBD'}
          </span>
        </div>
      </div>

      {/* Score Summary Badge */}
      {match.score_summary && (
        <div className="mt-2 text-center text-xs font-medium text-primary-600 dark:text-primary-400">
          {match.score_summary}
        </div>
      )}

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



