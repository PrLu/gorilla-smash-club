'use client';

import { LiveScoreCard } from '@/components/LiveScoreCard';
import { Button, Skeleton } from '@/components/ui';
import { useTournament } from '@/lib/hooks/useTournament';
import { useMatches } from '@/lib/hooks/useMatches';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Radio, Trophy, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import { staggerContainer, staggerItem } from '@/lib/motion';

/**
 * Full-screen live scoreboard
 * Real-time match updates with large readable displays
 */
export default function LiveScoreboardPage() {
  const params = useParams();
  const tournamentId = params?.id as string;

  const { data: tournament } = useTournament(tournamentId);
  const { data: matches, isLoading } = useMatches(tournamentId);

  const inProgressMatches = matches?.filter((m) => m.status === 'in_progress') || [];
  const pendingMatches = matches?.filter((m) => m.status === 'pending') || [];
  const completedMatches = matches?.filter((m) => m.status === 'completed') || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 text-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <Link href={`/tournament/${tournamentId}`}>
              <Button variant="ghost" leftIcon={<ArrowLeft className="h-5 w-5" />}>
                Back
              </Button>
            </Link>

            <div>
              <div className="flex items-center gap-2">
                <Radio className="h-6 w-6 animate-pulse text-error-600" />
                <h1 className="text-3xl font-bold text-gray-900">Live Scoreboard</h1>
              </div>
              {tournament && (
                <p className="mt-1 text-gray-600">{tournament.title}</p>
              )}
            </div>
          </div>

          {/* Auto-refresh indicator */}
          <div className="flex items-center gap-2 rounded-lg bg-primary-50 px-4 py-2 text-sm text-primary-700">
            <div className="h-2 w-2 animate-pulse rounded-full bg-primary-600" />
            <span>Auto-updating</span>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} height={200} />
            ))}
          </div>
        ) : (
          <motion.div
            className="space-y-8"
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
          >
            {/* Live Matches */}
            {inProgressMatches.length > 0 && (
              <motion.section variants={staggerItem}>
                <div className="mb-4 flex items-center gap-2">
                  <Radio className="h-5 w-5 animate-pulse text-error-600" />
                  <h2 className="text-2xl font-bold text-gray-900">
                    Live Now ({inProgressMatches.length})
                  </h2>
                </div>
                <div className="grid gap-6 md:grid-cols-2">
                  {inProgressMatches.map((match) => (
                    <LiveScoreCard key={match.id} match={match} size="full" />
                  ))}
                </div>
              </motion.section>
            )}

            {/* Upcoming Matches */}
            {pendingMatches.length > 0 && (
              <motion.section variants={staggerItem}>
                <div className="mb-4 flex items-center gap-2">
                  <Clock className="h-5 w-5 text-gray-500" />
                  <h2 className="text-2xl font-bold text-gray-900">
                    Upcoming ({pendingMatches.length})
                  </h2>
                </div>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {pendingMatches.map((match) => (
                    <LiveScoreCard key={match.id} match={match} size="compact" />
                  ))}
                </div>
              </motion.section>
            )}

            {/* Completed Matches */}
            {completedMatches.length > 0 && (
              <motion.section variants={staggerItem}>
                <div className="mb-4 flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-success-600" />
                  <h2 className="text-2xl font-bold text-gray-900">
                    Completed ({completedMatches.length})
                  </h2>
                </div>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {completedMatches.map((match) => (
                    <LiveScoreCard key={match.id} match={match} size="compact" />
                  ))}
                </div>
              </motion.section>
            )}

            {/* Empty State */}
            {matches?.length === 0 && (
              <motion.div variants={staggerItem}>
                <Card className="p-16 text-center">
                  <Trophy className="mx-auto mb-4 h-20 w-20 text-gray-300" />
                  <h3 className="mb-2 text-xl font-semibold text-gray-900">No Matches Yet</h3>
                  <p className="text-gray-600">
                    Matches will appear here once the fixtures are generated.
                  </p>
                </Card>
              </motion.div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}
