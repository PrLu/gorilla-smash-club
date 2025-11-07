'use client';

import { useEffect, useState } from 'react';
import { Card, Button } from '@/components/ui';
import { Trophy, ChevronUp, ChevronDown, Award } from 'lucide-react';
import toast from 'react-hot-toast';

interface PlayerStanding {
  playerId: string;
  playerName: string;
  rank: number;
  wins: number;
  losses: number;
  matchesPlayed: number;
  pointsFor: number;
  pointsAgainst: number;
  pointDifferential: number;
  winPercentage: number;
  advances: boolean;
}

interface PoolStanding {
  poolId: string;
  poolName: string;
  advanceCount: number;
  standings: PlayerStanding[];
  isComplete: boolean;
}

interface PoolStandingsTableProps {
  tournamentId: string;
  onAdvanceClick?: () => void;
  canAdvance?: boolean;
}

export function PoolStandingsTable({ tournamentId, onAdvanceClick, canAdvance = false }: PoolStandingsTableProps) {
  const [poolStandings, setPoolStandings] = useState<PoolStanding[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStandings();
  }, [tournamentId]);

  const loadStandings = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/tournaments/${tournamentId}/pools/standings`);
      const data = await response.json();

      if (response.ok) {
        setPoolStandings(data.poolStandings || []);
      } else {
        console.error('Failed to load standings:', data.error);
      }
    } catch (err) {
      console.error('Load standings error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card padding="lg">
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary-600"></div>
          <span className="ml-3 text-gray-600 dark:text-gray-400">Loading pool standings...</span>
        </div>
      </Card>
    );
  }

  if (poolStandings.length === 0) {
    return (
      <Card padding="lg" className="text-center">
        <Trophy className="mx-auto mb-4 h-12 w-12 text-gray-300" />
        <p className="text-gray-600 dark:text-gray-400">No pool standings available yet</p>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-500">
          Pool standings will appear once pool matches are completed
        </p>
      </Card>
    );
  }

  const allPoolsComplete = poolStandings.every(ps => ps.isComplete);

  return (
    <div className="space-y-6">
      {/* Advancement Action */}
      {canAdvance && allPoolsComplete && (
        <Card padding="md" className="border-2 border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Award className="h-6 w-6 text-green-600 dark:text-green-400" />
              <div>
                <p className="font-semibold text-green-900 dark:text-green-300">All Pools Complete!</p>
                <p className="text-sm text-green-700 dark:text-green-400">
                  Ready to advance qualified players to knockout rounds
                </p>
              </div>
            </div>
            <Button variant="primary" onClick={onAdvanceClick}>
              Advance Qualified Players
            </Button>
          </div>
        </Card>
      )}

      {/* Pool Standings */}
      {poolStandings.map((poolStanding) => (
        <Card key={poolStanding.poolId} padding="lg">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              {poolStanding.poolName} Standings
            </h3>
            <div className="flex items-center gap-2">
              {poolStanding.isComplete ? (
                <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-800 dark:bg-green-900/30 dark:text-green-300">
                  ✓ Complete
                </span>
              ) : (
                <span className="rounded-full bg-yellow-100 px-3 py-1 text-xs font-semibold text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">
                  In Progress
                </span>
              )}
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Top {poolStanding.advanceCount} advance
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="pb-3 text-left text-xs font-semibold uppercase text-gray-600 dark:text-gray-400">
                    Rank
                  </th>
                  <th className="pb-3 text-left text-xs font-semibold uppercase text-gray-600 dark:text-gray-400">
                    Player
                  </th>
                  <th className="pb-3 text-center text-xs font-semibold uppercase text-gray-600 dark:text-gray-400">
                    W-L
                  </th>
                  <th className="pb-3 text-center text-xs font-semibold uppercase text-gray-600 dark:text-gray-400">
                    Win %
                  </th>
                  <th className="pb-3 text-center text-xs font-semibold uppercase text-gray-600 dark:text-gray-400">
                    Pts For
                  </th>
                  <th className="pb-3 text-center text-xs font-semibold uppercase text-gray-600 dark:text-gray-400">
                    Pts Against
                  </th>
                  <th className="pb-3 text-center text-xs font-semibold uppercase text-gray-600 dark:text-gray-400">
                    Diff
                  </th>
                  <th className="pb-3 text-center text-xs font-semibold uppercase text-gray-600 dark:text-gray-400">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {poolStanding.standings.map((standing) => (
                  <tr
                    key={standing.playerId}
                    className={`border-b border-gray-100 dark:border-gray-800 ${
                      standing.advances
                        ? 'bg-green-50 dark:bg-green-900/10'
                        : ''
                    }`}
                  >
                    <td className="py-3 text-center">
                      <div className="flex items-center justify-center">
                        {standing.rank === 1 && (
                          <Trophy className="mr-1 h-4 w-4 text-yellow-500" />
                        )}
                        <span className="font-bold text-gray-900 dark:text-white">
                          {standing.rank}
                        </span>
                      </div>
                    </td>
                    <td className="py-3">
                      <span className={`font-medium ${
                        standing.advances
                          ? 'text-green-700 dark:text-green-400'
                          : 'text-gray-900 dark:text-white'
                      }`}>
                        {standing.playerName}
                      </span>
                    </td>
                    <td className="py-3 text-center font-semibold text-gray-900 dark:text-white">
                      {standing.wins}-{standing.losses}
                    </td>
                    <td className="py-3 text-center text-gray-600 dark:text-gray-400">
                      {standing.winPercentage.toFixed(0)}%
                    </td>
                    <td className="py-3 text-center text-gray-600 dark:text-gray-400">
                      {standing.pointsFor}
                    </td>
                    <td className="py-3 text-center text-gray-600 dark:text-gray-400">
                      {standing.pointsAgainst}
                    </td>
                    <td className="py-3 text-center">
                      <span className={`font-semibold ${
                        standing.pointDifferential > 0
                          ? 'text-green-600 dark:text-green-400'
                          : standing.pointDifferential < 0
                          ? 'text-red-600 dark:text-red-400'
                          : 'text-gray-600 dark:text-gray-400'
                      }`}>
                        {standing.pointDifferential > 0 ? '+' : ''}{standing.pointDifferential}
                      </span>
                    </td>
                    <td className="py-3 text-center">
                      {standing.advances ? (
                        <div className="flex items-center justify-center gap-1">
                          <ChevronUp className="h-4 w-4 text-green-600 dark:text-green-400" />
                          <span className="text-xs font-semibold text-green-700 dark:text-green-400">
                            ADV
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-1">
                          <ChevronDown className="h-4 w-4 text-gray-400" />
                          <span className="text-xs text-gray-500 dark:text-gray-500">
                            OUT
                          </span>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Tiebreaker Info */}
          <div className="mt-4 rounded-lg bg-blue-50 p-3 dark:bg-blue-900/20">
            <p className="text-xs text-blue-800 dark:text-blue-300">
              <strong>Tiebreaker:</strong> (1) Win-Loss Record, (2) Point Differential, (3) Points For
            </p>
          </div>
        </Card>
      ))}
    </div>
  );
}




