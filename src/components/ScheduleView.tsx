'use client';

import type { Match } from '@/lib/hooks/useMatches';
import { Card } from '@/components/ui';
import { Clock, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';
import { staggerContainer, staggerItem } from '@/lib/motion';

interface ScheduleViewProps {
  matches: Match[];
}

/**
 * Day timeline view for scheduled matches
 * Desktop: Horizontal timeline
 * Mobile: Vertical stacked list
 */
export function ScheduleView({ matches }: ScheduleViewProps) {
  // Group matches by day
  const matchesByDay = matches
    .filter((m) => m.scheduled_at)
    .reduce((acc, match) => {
      const day = new Date(match.scheduled_at!).toDateString();
      if (!acc[day]) acc[day] = [];
      acc[day].push(match);
      return acc;
    }, {} as Record<string, Match[]>);

  const days = Object.keys(matchesByDay).sort(
    (a, b) => new Date(a).getTime() - new Date(b).getTime()
  );

  if (days.length === 0) {
    return (
      <Card className="p-12 text-center">
        <Clock className="mx-auto mb-4 h-16 w-16 text-gray-300" />
        <p className="text-gray-600">No matches scheduled yet.</p>
      </Card>
    );
  }

  return (
    <div>
      {/* Desktop: Horizontal Timeline */}
      <div className="hidden overflow-x-auto scrollbar-thin lg:block">
        <div className="inline-flex min-w-full gap-6 p-4">
          {days.map((day) => (
            <div key={day} className="min-w-[320px]">
              <div className="sticky top-0 z-10 mb-4 rounded-lg bg-primary-50 px-4 py-2">
                <h3 className="font-semibold text-primary-900">
                  {new Date(day).toLocaleDateString('en-IN', {
                    weekday: 'long',
                    month: 'short',
                    day: 'numeric',
                  })}
                </h3>
                <p className="text-xs text-primary-700">
                  {matchesByDay[day].length} match{matchesByDay[day].length !== 1 ? 'es' : ''}
                </p>
              </div>

              <div className="space-y-3">
                {matchesByDay[day]
                  .sort(
                    (a, b) =>
                      new Date(a.scheduled_at!).getTime() - new Date(b.scheduled_at!).getTime()
                  )
                  .map((match) => (
                    <ScheduleMatchCard key={match.id} match={match} />
                  ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Mobile: Vertical List */}
      <motion.div
        className="space-y-6 lg:hidden"
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
      >
        {days.map((day) => (
          <motion.div key={day} variants={staggerItem}>
            <h3 className="mb-3 font-semibold text-gray-900">
              {new Date(day).toLocaleDateString('en-IN', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
              })}
            </h3>
            <div className="space-y-3">
              {matchesByDay[day]
                .sort(
                  (a, b) =>
                    new Date(a.scheduled_at!).getTime() - new Date(b.scheduled_at!).getTime()
                )
                .map((match) => (
                  <ScheduleMatchCard key={match.id} match={match} />
                ))}
            </div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}

function ScheduleMatchCard({ match }: { match: Match }) {
  return (
    <Card padding="md" className="transition-all hover:shadow-lg">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="mb-2 flex items-center gap-2 text-sm text-gray-600">
            <Clock className="h-4 w-4" />
            <span className="font-medium">
              {new Date(match.scheduled_at!).toLocaleTimeString('en-IN', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
            {match.court && (
              <>
                <MapPin className="ml-2 h-4 w-4" />
                <span>Court {match.court}</span>
              </>
            )}
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-medium text-gray-900">{match.player1_id || match.team1_id ? 'Player/Team 1' : 'TBD'}</span>
              {match.score1 !== null && (
                <span className="text-lg font-bold text-gray-900">{match.score1}</span>
              )}
            </div>
            <div className="flex items-center justify-between">
              <span className="font-medium text-gray-900">{match.player2_id || match.team2_id ? 'Player/Team 2' : 'TBD'}</span>
              {match.score2 !== null && (
                <span className="text-lg font-bold text-gray-900">{match.score2}</span>
              )}
            </div>
          </div>
        </div>

        <div className="ml-4">
          {match.status === 'in_progress' && (
            <div className="animate-pulse rounded-full bg-error-100 px-2 py-1">
              <Radio className="h-4 w-4 text-error-600" />
            </div>
          )}
          {match.status === 'completed' && (
            <Trophy className="h-5 w-5 text-success-500" />
          )}
        </div>
      </div>
    </Card>
  );
}

