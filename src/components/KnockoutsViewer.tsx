'use client';

import { useState, useEffect } from 'react';
import { Card, Button } from '@/components/ui';
import { Trophy, Award, Filter, Play } from 'lucide-react';
import toast from 'react-hot-toast';
import { Match, getParticipantName } from '@/lib/hooks/useMatches';

interface KnockoutsViewerProps {
  tournamentId: string;
  matches: Match[];
  isOrganizer?: boolean;
  onMatchClick?: (match: Match) => void;
  canEditScores?: boolean;
}

interface PoolStatus {
  category: string;
  poolsComplete: boolean;
  knockoutsGenerated: boolean;
  qualifierCount: number;
  totalPools: number;
}

export function KnockoutsViewer({ 
  tournamentId, 
  matches, 
  isOrganizer = false,
  onMatchClick,
  canEditScores = false 
}: KnockoutsViewerProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [poolStatus, setPoolStatus] = useState<PoolStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  // Extract unique categories from matches
  const extractCategory = (court: string | null) => {
    if (!court) return null;
    const parts = court.split(' - ');
    return parts[0].trim();
  };

  const allCategories = Array.from(
    new Set(matches.map(m => extractCategory(m.court)).filter(Boolean))
  ).sort();

  // Filter knockout matches by category
  const knockoutMatches = matches.filter(m => 
    m.match_type === 'knockout' || (!m.match_type && !m.pool_id)
  );

  const categoryFilteredKnockouts = selectedCategory === 'all'
    ? knockoutMatches
    : knockoutMatches.filter(m => extractCategory(m.court) === selectedCategory);

  const loadPoolStatus = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/tournaments/${tournamentId}/knockouts/status`);
      const data = await response.json();

      if (response.ok) {
        setPoolStatus(data.categoryStatus || []);
      } else {
        console.error('Failed to load pool status:', data.error);
      }
    } catch (err) {
      console.error('Load pool status error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPoolStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tournamentId]);

  const handleGenerateKnockouts = async (category: string) => {
    if (!isOrganizer) return;

    setGenerating(true);
    try {
      const response = await fetch(`/api/tournaments/${tournamentId}/knockouts/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ category }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(`Knockout fixtures generated for ${category}! ${data.matchesCreated} matches created.`);
        window.location.reload(); // Refresh to show new fixtures
      } else {
        toast.error(data.error || 'Failed to generate knockout fixtures');
      }
    } catch (err) {
      console.error('Generate knockouts error:', err);
      toast.error('Failed to generate knockout fixtures');
    } finally {
      setGenerating(false);
    }
  };

  // Group knockout matches by round
  const groupByRound = (matches: Match[]) => {
    const grouped: { [round: number]: Match[] } = {};
    matches.forEach(match => {
      if (!grouped[match.round]) {
        grouped[match.round] = [];
      }
      grouped[match.round].push(match);
    });
    return grouped;
  };

  const getRoundName = (round: number, totalRounds: number) => {
    if (round === totalRounds) return 'Final';
    if (round === totalRounds - 1) return 'Semi-Finals';
    if (round === totalRounds - 2) return 'Quarter-Finals';
    return `Round ${round}`;
  };

  // Use the helper function from useMatches for consistent team name display

  if (loading) {
    return (
      <Card padding="lg">
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary-600"></div>
          <span className="ml-3 text-gray-600 dark:text-gray-400">Loading knockout status...</span>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Category Filter */}
      {allCategories.length > 0 && (
        <div className="flex items-center gap-3 overflow-x-auto pb-2">
          <Filter className="h-5 w-5 text-gray-500 flex-shrink-0" />
          <button
            onClick={() => setSelectedCategory('all')}
            className={`rounded-full px-5 py-2.5 font-semibold shadow-sm transition-all whitespace-nowrap ${
              selectedCategory === 'all'
                ? 'bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-md'
                : 'bg-white text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
            }`}
          >
            All Categories
          </button>
          {allCategories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`rounded-full px-5 py-2.5 font-semibold shadow-sm transition-all capitalize whitespace-nowrap ${
                selectedCategory === category
                  ? 'bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-md'
                  : 'bg-white text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
              }`}
            >
              {category.toLowerCase()}
            </button>
          ))}
        </div>
      )}

      {/* Pool Status & Generation Controls */}
      {isOrganizer && poolStatus.length > 0 && (
        <div className="space-y-3">
          {poolStatus
            .filter(ps => selectedCategory === 'all' || ps.category === selectedCategory)
            .map((status) => (
              <Card key={status.category} padding="md" className="border-l-4 border-l-primary-500">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="text-lg font-semibold text-gray-900 dark:text-white capitalize">
                        {status.category} Knockouts
                      </h4>
                      {status.knockoutsGenerated ? (
                        <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700 dark:bg-green-900/30 dark:text-green-300">
                          ✓ Generated
                        </span>
                      ) : status.poolsComplete ? (
                        <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                          Ready to Generate
                        </span>
                      ) : (
                        <span className="rounded-full bg-yellow-100 px-3 py-1 text-xs font-semibold text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300">
                          Waiting for Pools
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {status.poolsComplete 
                        ? `All ${status.totalPools} pools complete. ${status.qualifierCount} qualifiers ready.`
                        : `Pools in progress. Complete all pool matches to generate knockouts.`
                      }
                    </p>
                  </div>
                  
                  {status.poolsComplete && !status.knockoutsGenerated && (
                    <Button
                      variant="primary"
                      onClick={() => handleGenerateKnockouts(status.category)}
                      isLoading={generating}
                      leftIcon={<Trophy className="h-5 w-5" />}
                    >
                      Generate Knockouts
                    </Button>
                  )}
                </div>
              </Card>
            ))}
        </div>
      )}

      {/* Knockout Brackets Display */}
      {categoryFilteredKnockouts.length > 0 ? (
        <div className="space-y-6">
          {(() => {
            const matchesByRound = groupByRound(categoryFilteredKnockouts);
            const rounds = Object.keys(matchesByRound).map(Number).sort((a, b) => a - b);
            const totalRounds = Math.max(...rounds);

            return rounds.map((round) => {
              const roundMatches = matchesByRound[round];
              const roundName = getRoundName(round, totalRounds);

              return (
                <Card key={round} padding="lg" className="border-l-4 border-l-primary-500">
                  <div className="mb-4 flex items-center gap-2">
                    <Trophy className="h-6 w-6 text-primary-600 dark:text-primary-400" />
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                      {roundName}
                    </h3>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      ({roundMatches.length} {roundMatches.length === 1 ? 'match' : 'matches'})
                    </span>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    {roundMatches.map((match) => {
                      const player1 = getParticipantName(match, 1);
                      const player2 = getParticipantName(match, 2);
                      const isComplete = match.status === 'completed';
                      const winner = match.winner_player_id || match.winner_team_id;

                      return (
                        <div
                          key={match.id}
                          className={`rounded-lg border-2 p-4 transition-all ${
                            isComplete
                              ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/10'
                              : 'border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800'
                          } ${canEditScores ? 'cursor-pointer hover:border-primary-300 dark:hover:border-primary-700' : ''}`}
                          onClick={() => canEditScores && onMatchClick && onMatchClick(match)}
                        >
                          <div className="space-y-2">
                            {/* Player 1 */}
                            <div className={`flex items-center justify-between rounded p-2 ${
                              winner === match.player1_id || winner === match.team1_id
                                ? 'bg-primary-100 dark:bg-primary-900/30'
                                : 'bg-gray-50 dark:bg-gray-900'
                            }`}>
                              <span className={`font-medium ${
                                winner === match.player1_id || winner === match.team1_id
                                  ? 'text-primary-700 dark:text-primary-300'
                                  : 'text-gray-900 dark:text-white'
                              }`}>
                                {player1}
                              </span>
                              <span className="font-bold text-gray-900 dark:text-white">
                                {match.score1 ?? '-'}
                              </span>
                            </div>

                            {/* Player 2 */}
                            <div className={`flex items-center justify-between rounded p-2 ${
                              winner === match.player2_id || winner === match.team2_id
                                ? 'bg-primary-100 dark:bg-primary-900/30'
                                : 'bg-gray-50 dark:bg-gray-900'
                            }`}>
                              <span className={`font-medium ${
                                winner === match.player2_id || winner === match.team2_id
                                  ? 'text-primary-700 dark:text-primary-300'
                                  : 'text-gray-900 dark:text-white'
                              }`}>
                                {player2}
                              </span>
                              <span className="font-bold text-gray-900 dark:text-white">
                                {match.score2 ?? '-'}
                              </span>
                            </div>

                            {/* Match Info */}
                            <div className="flex items-center justify-between pt-2 text-xs text-gray-500 dark:text-gray-400">
                              <span>Match {match.bracket_pos}</span>
                              {isComplete ? (
                                <span className="font-semibold text-green-600 dark:text-green-400">
                                  Completed
                                </span>
                              ) : match.status === 'in_progress' ? (
                                <span className="font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-1">
                                  <Play className="h-3 w-3" /> Live
                                </span>
                              ) : (
                                <span>Pending</span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </Card>
              );
            });
          })()}
        </div>
      ) : (
        <Card padding="lg" className="text-center">
          <Trophy className="mx-auto mb-4 h-12 w-12 text-gray-300" />
          <p className="text-gray-600 dark:text-gray-400 mb-2">No knockout fixtures available yet</p>
          <p className="text-sm text-gray-500 dark:text-gray-500">
            {poolStatus.some(ps => !ps.poolsComplete)
              ? 'Complete all pool matches first, then generate knockout fixtures'
              : isOrganizer 
              ? 'Click "Generate Knockouts" above to create knockout fixtures from pool qualifiers'
              : 'Waiting for organizer to generate knockout fixtures'
            }
          </p>
        </Card>
      )}
    </div>
  );
}

