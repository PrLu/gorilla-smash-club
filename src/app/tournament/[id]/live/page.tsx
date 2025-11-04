'use client';

import { Header } from '@/components/Header';
import { MatchRow } from '@/components/MatchRow';
import { useTournament } from '@/lib/hooks/useTournament';
import { useMatches } from '@/lib/hooks/useMatches';
import { useUser } from '@/lib/useUser';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Radio } from 'lucide-react';

export default function LiveScoreboardPage() {
  const params = useParams();
  const tournamentId = params?.id as string;
  const { user } = useUser();

  const { data: tournament } = useTournament(tournamentId);
  const { data: matches, isLoading } = useMatches(tournamentId);

  const isOrganizer = user?.id === tournament?.organizer_id;

  // Group matches by status
  const inProgressMatches = matches?.filter((m) => m.status === 'in_progress') || [];
  const pendingMatches = matches?.filter((m) => m.status === 'pending') || [];
  const completedMatches = matches?.filter((m) => m.status === 'completed') || [];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href={`/tournament/${tournamentId}`}
              className="flex items-center gap-2 text-primary-600 hover:text-primary-700"
            >
              <ArrowLeft className="h-5 w-5" />
              Back to Tournament
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">Live Scoreboard</h1>
            <Radio className="h-6 w-6 animate-pulse text-red-600" />
          </div>
        </div>

        {tournament && (
          <div className="mb-6 rounded-lg bg-white p-4 shadow">
            <h2 className="text-xl font-semibold">{tournament.title}</h2>
            <p className="text-gray-600">{tournament.location}</p>
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-primary-600"></div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* In Progress Matches */}
            {inProgressMatches.length > 0 && (
              <section>
                <h2 className="mb-4 text-2xl font-semibold text-gray-900">
                  🔴 Live Now ({inProgressMatches.length})
                </h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {inProgressMatches.map((match) => (
                    <MatchRow key={match.id} match={match} isOrganizer={isOrganizer} />
                  ))}
                </div>
              </section>
            )}

            {/* Pending Matches */}
            {pendingMatches.length > 0 && (
              <section>
                <h2 className="mb-4 text-2xl font-semibold text-gray-900">
                  ⏳ Upcoming ({pendingMatches.length})
                </h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {pendingMatches.map((match) => (
                    <MatchRow key={match.id} match={match} isOrganizer={isOrganizer} />
                  ))}
                </div>
              </section>
            )}

            {/* Completed Matches */}
            {completedMatches.length > 0 && (
              <section>
                <h2 className="mb-4 text-2xl font-semibold text-gray-900">
                  ✅ Completed ({completedMatches.length})
                </h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {completedMatches.map((match) => (
                    <MatchRow key={match.id} match={match} isOrganizer={isOrganizer} />
                  ))}
                </div>
              </section>
            )}

            {matches?.length === 0 && (
              <div className="rounded-lg bg-white p-12 text-center shadow">
                <p className="text-gray-600">No matches scheduled yet.</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

