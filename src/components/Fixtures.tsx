import type { Match } from '@/lib/hooks/useMatches';

interface FixturesProps {
  matches: Match[];
}

export function Fixtures({ matches }: FixturesProps) {
  if (!matches || matches.length === 0) {
    return (
      <div className="rounded-lg bg-white p-12 text-center shadow">
        <p className="text-gray-600">No fixtures generated yet. Create matches to see the fixtures.</p>
      </div>
    );
  }

  // Group matches by round
  const matchesByRound = matches.reduce((acc, match) => {
    if (!acc[match.round]) {
      acc[match.round] = [];
    }
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

  return (
    <div className="overflow-x-auto">
      <div className="inline-flex min-w-full gap-6 p-4">
        {rounds.map((round) => (
          <div key={round} className="flex min-w-[240px] flex-col gap-4">
            <h3 className="mb-2 text-center font-semibold text-gray-700">
              {getRoundName(round, rounds.length)}
            </h3>
            {matchesByRound[round].map((match) => (
              <div
                key={match.id}
                className="rounded-lg border-2 border-gray-200 bg-white p-4 shadow-sm"
              >
                <div className="mb-2 text-xs font-medium text-gray-500">
                  Match {match.bracket_pos + 1}
                  {match.court && ` • Court ${match.court}`}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900">
                      {match.player1_id || match.team1_id ? 'Player/Team 1' : 'TBD'}
                    </span>
                    {match.score1 !== null && (
                      <span className="text-lg font-bold text-gray-900">{match.score1}</span>
                    )}
                  </div>

                  <div className="border-t border-gray-200"></div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900">
                      {match.player2_id || match.team2_id ? 'Player/Team 2' : 'TBD'}
                    </span>
                    {match.score2 !== null && (
                      <span className="text-lg font-bold text-gray-900">{match.score2}</span>
                    )}
                  </div>
                </div>

                {match.status === 'completed' && (
                  <div className="mt-2 text-center text-xs font-semibold text-green-600">
                    FINAL
                  </div>
                )}
                {match.status === 'in_progress' && (
                  <div className="mt-2 animate-pulse text-center text-xs font-semibold text-blue-600">
                    LIVE
                  </div>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
