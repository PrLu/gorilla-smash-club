'use client';

import { useState, useEffect } from 'react';
import { Modal, Button, Input } from '@/components/ui';
import { Trophy, AlertCircle, History } from 'lucide-react';
import toast from 'react-hot-toast';
import type { Match } from '@/lib/hooks/useMatches';
import { getParticipantName } from '@/lib/hooks/useMatches';

interface MatchScoringModalProps {
  isOpen: boolean;
  onClose: () => void;
  match: Match | null;
  onScoreSaved: () => void;
}

interface SetScore {
  set: number;
  score1: number;
  score2: number;
}

export function MatchScoringModal({ isOpen, onClose, match, onScoreSaved }: MatchScoringModalProps) {
  const [matchFormat, setMatchFormat] = useState<'single_set' | 'best_of_3'>('single_set');
  const [scoringRule, setScoringRule] = useState<'golden_point' | 'deuce'>('golden_point');
  const [setScores, setSetScores] = useState<SetScore[]>([{ set: 1, score1: 0, score2: 0 }]);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  // Reset form when match changes
  useEffect(() => {
    if (match) {
      // Load existing scores if any
      if (match.set_scores && Array.isArray(match.set_scores) && match.set_scores.length > 0) {
        setSetScores(match.set_scores);
        setMatchFormat(match.match_format || 'single_set');
        setScoringRule((match as any).scoring_rule || 'golden_point');
      } else {
        // Default
        setMatchFormat('single_set');
        setScoringRule('golden_point');
        setSetScores([{ set: 1, score1: 0, score2: 0 }]);
      }
      setErrors([]);
    }
  }, [match]);

  const player1Name = match ? getParticipantName(match, 1) : 'Player 1';
  const player2Name = match ? getParticipantName(match, 2) : 'Player 2';

  const handleFormatChange = (format: 'single_set' | 'best_of_3') => {
    setMatchFormat(format);
    if (format === 'single_set') {
      setSetScores([{ set: 1, score1: 0, score2: 0 }]);
    } else {
      setSetScores([
        { set: 1, score1: 0, score2: 0 },
        { set: 2, score1: 0, score2: 0 },
        { set: 3, score1: 0, score2: 0 },
      ]);
    }
    setErrors([]);
  };

  const updateSetScore = (setIndex: number, player: 1 | 2, value: number) => {
    const newScores = [...setScores];
    if (player === 1) {
      newScores[setIndex].score1 = value;
    } else {
      newScores[setIndex].score2 = value;
    }
    setSetScores(newScores);
    setErrors([]); // Clear errors on input
  };

  const validateScores = (): boolean => {
    const newErrors: string[] = [];

    setScores.forEach((set, index) => {
      const { score1, score2 } = set;

      // Check if set has scores entered
      if (score1 === 0 && score2 === 0) {
        if (matchFormat === 'single_set' || index < 2) {
          newErrors.push(`Set ${index + 1}: Please enter scores`);
        }
        return; // Skip validation for empty sets (allowed for set 3 in best of 3)
      }

      // Validate set scoring rules
      const maxScore = Math.max(score1, score2);
      const minScore = Math.min(score1, score2);
      const diff = Math.abs(score1 - score2);

      // Must reach at least 11 points (or 10 for golden point after 10-10)
      if (scoringRule === 'golden_point') {
        // Golden Point: First to 11, OR at 10-10+ just need to win by 1
        if (maxScore < 10) {
          newErrors.push(`Set ${index + 1}: Winner must reach at least 10 points`);
        }
        if (minScore >= 10 && maxScore >= 10) {
          // After 10-10, win by 1 is allowed (golden point)
          if (diff < 1) {
            newErrors.push(`Set ${index + 1}: Golden point - must win by at least 1`);
          }
        } else if (maxScore < 11) {
          newErrors.push(`Set ${index + 1}: Winner must reach 11 points (or 10-10 for golden point)`);
        }
      } else {
        // Deuce: Must reach 11 and win by 2
        if (maxScore < 11) {
          newErrors.push(`Set ${index + 1}: Winner must reach at least 11 points`);
        }
        // Must win by 2 points
        if (maxScore >= 11 && diff < 2) {
          newErrors.push(`Set ${index + 1}: Deuce rule - must win by at least 2 points`);
        }
      }

      // Can't both be same score
      if (score1 === score2) {
        newErrors.push(`Set ${index + 1}: Scores cannot be tied`);
      }
    });

    // For best of 3, check if enough sets to determine winner
    if (matchFormat === 'best_of_3') {
      const setsWithScores = setScores.filter(s => s.score1 > 0 || s.score2 > 0);
      if (setsWithScores.length < 2) {
        newErrors.push('Best of 3 requires at least 2 sets to be completed');
      }
    }

    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const calculateWinner = (): 1 | 2 | null => {
    let setsWon1 = 0;
    let setsWon2 = 0;

    setScores.forEach(set => {
      if (set.score1 > set.score2) {
        setsWon1++;
      } else if (set.score2 > set.score1) {
        setsWon2++;
      }
    });

    if (matchFormat === 'single_set') {
      return setsWon1 > setsWon2 ? 1 : setsWon2 > setsWon1 ? 2 : null;
    } else {
      // Best of 3/5: first to win majority
      const setsNeeded = matchFormat === 'best_of_3' ? 2 : 3;
      if (setsWon1 >= setsNeeded) return 1;
      if (setsWon2 >= setsNeeded) return 2;
      return null;
    }
  };

  const handleSave = async () => {
    if (!match) return;

    if (!validateScores()) {
      toast.error('Please fix the errors before saving');
      return;
    }

    const winner = calculateWinner();
    if (winner === null) {
      toast.error('Cannot determine winner from scores');
      return;
    }

    setSaving(true);

    try {
      const { supabase } = await import('@/lib/supabaseClient');
      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.access_token) {
        toast.error('Please sign in again');
        setSaving(false);
        return;
      }

      const response = await fetch(`/api/matches/${match.id}/score`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          match_format: matchFormat,
          scoring_rule: scoringRule,
          set_scores: setScores,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(`Failed to save score: ${data.error || 'Unknown error'}`);
        setSaving(false);
        return;
      }

      const winnerName = winner === 1 ? player1Name : player2Name;
      toast.success(`Score saved! Winner: ${winnerName}`);
      onScoreSaved();
      onClose();
    } catch (err) {
      console.error('Save score error:', err);
      toast.error('Failed to save score');
    } finally {
      setSaving(false);
    }
  };

  const winner = calculateWinner();

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Enter Match Score"
      size="lg"
    >
      {match && (
        <div className="space-y-6">
          {/* Match Info */}
          <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Round {match.round} {match.court && `• ${match.court}`}
            </div>
            <div className="mt-2 flex items-center justify-between text-lg font-semibold">
              <span className="text-gray-900 dark:text-white">{player1Name}</span>
              <span className="text-gray-500">vs</span>
              <span className="text-gray-900 dark:text-white">{player2Name}</span>
            </div>
          </div>

          {/* Format Selection */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Match Format
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => handleFormatChange('single_set')}
                className={`flex-1 rounded-lg border-2 px-4 py-2 font-medium transition-colors ${
                  matchFormat === 'single_set'
                    ? 'border-primary-600 bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-300'
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800'
                }`}
              >
                Single Set
              </button>
              <button
                onClick={() => handleFormatChange('best_of_3')}
                className={`flex-1 rounded-lg border-2 px-4 py-2 font-medium transition-colors ${
                  matchFormat === 'best_of_3'
                    ? 'border-primary-600 bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-300'
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800'
                }`}
              >
                Best of 3
              </button>
            </div>
          </div>

          {/* Scoring Rule Selection */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Scoring Rule
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => setScoringRule('deuce')}
                className={`flex-1 rounded-lg border-2 px-4 py-2 font-medium transition-colors ${
                  scoringRule === 'deuce'
                    ? 'border-primary-600 bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-300'
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800'
                }`}
              >
                Deuce (Win by 2)
              </button>
              <button
                onClick={() => setScoringRule('golden_point')}
                className={`flex-1 rounded-lg border-2 px-4 py-2 font-medium transition-colors ${
                  scoringRule === 'golden_point'
                    ? 'border-primary-600 bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-300'
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800'
                }`}
              >
                Golden Point (Win by 1)
              </button>
            </div>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {scoringRule === 'deuce' 
                ? 'Traditional: Must win by 2 points at 11+' 
                : 'Golden Point: First to score at 10-10 wins'}
            </p>
          </div>

          {/* Score Entry Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="pb-2 text-left text-sm font-medium text-gray-700 dark:text-gray-300">
                    Set
                  </th>
                  <th className="pb-2 text-center text-sm font-medium text-gray-700 dark:text-gray-300">
                    {player1Name}
                  </th>
                  <th className="pb-2 text-center text-sm font-medium text-gray-700 dark:text-gray-300">
                    {player2Name}
                  </th>
                  <th className="pb-2 text-center text-sm font-medium text-gray-700 dark:text-gray-300">
                    Winner
                  </th>
                </tr>
              </thead>
              <tbody>
                {setScores.map((set, index) => {
                  const setWinner = set.score1 > set.score2 ? 1 : set.score2 > set.score1 ? 2 : null;
                  return (
                    <tr key={index} className="border-b border-gray-100 dark:border-gray-800">
                      <td className="py-3 text-sm font-medium text-gray-900 dark:text-white">
                        Set {index + 1}
                      </td>
                      <td className="py-3 text-center">
                        <input
                          type="number"
                          min={0}
                          max={99}
                          value={set.score1 || ''}
                          onChange={(e) => updateSetScore(index, 1, parseInt(e.target.value) || 0)}
                          className="w-20 rounded border border-gray-300 px-3 py-2 text-center text-lg font-bold dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                        />
                      </td>
                      <td className="py-3 text-center">
                        <input
                          type="number"
                          min={0}
                          max={99}
                          value={set.score2 || ''}
                          onChange={(e) => updateSetScore(index, 2, parseInt(e.target.value) || 0)}
                          className="w-20 rounded border border-gray-300 px-3 py-2 text-center text-lg font-bold dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                        />
                      </td>
                      <td className="py-3 text-center">
                        {setWinner && (
                          <span className="inline-flex rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-800 dark:bg-green-900/30 dark:text-green-300">
                            {setWinner === 1 ? 'P1' : 'P2'}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Winner Preview */}
          {winner && (
            <div className="rounded-lg bg-green-50 p-4 dark:bg-green-900/20">
              <div className="flex items-center gap-3">
                <Trophy className="h-5 w-5 text-green-600 dark:text-green-400" />
                <div>
                  <p className="font-semibold text-green-900 dark:text-green-300">
                    Match Winner: {winner === 1 ? player1Name : player2Name}
                  </p>
                  <p className="text-sm text-green-700 dark:text-green-400">
                    {matchFormat === 'single_set' ? 'Single set' : `Best of 3 (${setScores.filter(s => s.score1 > s.score2).length}-${setScores.filter(s => s.score2 > s.score1).length})`}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Validation Errors */}
          {errors.length > 0 && (
            <div className="rounded-lg bg-red-50 p-4 dark:bg-red-900/20">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 flex-shrink-0 text-red-600 dark:text-red-400" />
                <div className="flex-1">
                  <p className="font-semibold text-red-900 dark:text-red-300">Please fix the following:</p>
                  <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-red-800 dark:text-red-400">
                    {errors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Scoring Rules */}
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-900/20">
            <p className="text-xs font-medium text-blue-900 dark:text-blue-300">
              📌 {scoringRule === 'deuce' 
                ? 'Deuce: First to 11 points, win by 2. Extended play if needed (e.g., 15-13).'
                : 'Golden Point: First to 11, OR at 10-10 next point wins (win by 1).'}
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              variant="ghost"
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleSave}
              disabled={saving}
              className="flex-1"
            >
              {saving ? 'Saving...' : 'Save Score'}
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}

