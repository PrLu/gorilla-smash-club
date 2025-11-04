'use client';

import { Header } from '@/components/Header';
import { Fixtures } from '@/components/Fixtures';
import { RegistrationForm } from '@/components/RegistrationForm';
import { useTournament, useTournamentRegistrations } from '@/lib/hooks/useTournament';
import { useMatches } from '@/lib/hooks/useMatches';
import { useUser } from '@/lib/useUser';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Calendar, MapPin, Users, Play } from 'lucide-react';
import { useState } from 'react';

export default function TournamentPage() {
  const params = useParams();
  const router = useRouter();
  const tournamentId = params?.id as string;
  const { user } = useUser();

  const { data: tournament, isLoading: loadingTournament } = useTournament(tournamentId);
  const { data: matches, isLoading: loadingMatches } = useMatches(tournamentId);
  const { data: registrations } = useTournamentRegistrations(tournamentId);

  const [showRegistration, setShowRegistration] = useState(false);

  const isOrganizer = user?.id === tournament?.organizer_id;

  if (loadingTournament) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-primary-600"></div>
          <p className="mt-4 text-gray-600">Loading tournament...</p>
        </div>
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Tournament not found</h1>
          <Link href="/dashboard" className="mt-4 text-primary-600 hover:text-primary-700">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="container mx-auto px-4 py-8">
        {/* Tournament Header */}
        <div className="mb-8 rounded-lg bg-white p-8 shadow">
          <div className="mb-6 flex items-start justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900">{tournament.title}</h1>
              <p className="mt-2 text-gray-600">{tournament.description}</p>
            </div>
            <span
              className={`rounded-full px-4 py-2 text-sm font-semibold ${
                tournament.status === 'open'
                  ? 'bg-green-100 text-green-800'
                  : tournament.status === 'closed'
                  ? 'bg-red-100 text-red-800'
                  : tournament.status === 'in_progress'
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              {tournament.status.replace('_', ' ')}
            </span>
          </div>

          <div className="grid gap-4 md:grid-cols-4">
            <div className="flex items-center gap-2 text-gray-600">
              <Calendar className="h-5 w-5" />
              <div>
                <div className="text-sm">
                  {new Date(tournament.start_date).toLocaleDateString()}
                </div>
                <div className="text-xs text-gray-500">
                  to {new Date(tournament.end_date).toLocaleDateString()}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 text-gray-600">
              <MapPin className="h-5 w-5" />
              <span>{tournament.location}</span>
            </div>

            <div className="flex items-center gap-2 text-gray-600">
              <span className="text-lg">₹</span>
              <span>₹{tournament.entry_fee} entry fee</span>
            </div>

            <div className="flex items-center gap-2 text-gray-600">
              <Users className="h-5 w-5" />
              <span>
                {registrations?.length || 0}
                {tournament.max_participants && ` / ${tournament.max_participants}`} registered
              </span>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-4">
            {tournament.status === 'open' && !isOrganizer && (
              <button
                onClick={() => setShowRegistration(true)}
                className="rounded-lg bg-primary-600 px-6 py-2 font-semibold text-white transition-colors hover:bg-primary-700"
              >
                Register Now
              </button>
            )}

            {tournament.status === 'closed' && !isOrganizer && (
              <div className="rounded-lg bg-red-100 px-6 py-2 font-semibold text-red-800">
                Registration Closed
              </div>
            )}

            <Link
              href={`/tournament/${tournamentId}/live`}
              className="flex items-center gap-2 rounded-lg border-2 border-primary-600 px-6 py-2 font-semibold text-primary-600 transition-colors hover:bg-primary-50"
            >
              <Play className="h-5 w-5" />
              Live Scoreboard
            </Link>

            {isOrganizer && (
              <Link
                href={`/api/generate-fixtures?tournamentId=${tournamentId}`}
                className="rounded-lg bg-green-600 px-6 py-2 font-semibold text-white transition-colors hover:bg-green-700"
              >
                Generate Fixtures
              </Link>
            )}
          </div>
        </div>

        {/* Registration Form */}
        {showRegistration && (
          <div className="mb-8 rounded-lg bg-white p-6 shadow">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-2xl font-semibold">Register for Tournament</h2>
              <button
                onClick={() => setShowRegistration(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <RegistrationForm
              tournamentId={tournamentId}
              onSuccess={() => setShowRegistration(false)}
            />
          </div>
        )}

        {/* Fixtures */}
        <div className="mb-8 rounded-lg bg-white p-6 shadow">
          <h2 className="mb-4 text-2xl font-semibold">Tournament Fixtures</h2>
          {loadingMatches ? (
            <div className="flex justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary-600"></div>
            </div>
          ) : (
            <Fixtures matches={matches || []} />
          )}
        </div>
      </main>
    </div>
  );
}
