'use client';

import { Header } from '@/components/Header';
import { TournamentCard } from '@/components/TournamentCard';
import { TournamentForm } from '@/components/TournamentForm';
import { useTournaments, useMyTournaments } from '@/lib/hooks/useTournaments';
import { useUser } from '@/lib/useUser';
import { useState } from 'react';
import { Plus } from 'lucide-react';

export default function DashboardPage() {
  const { user } = useUser();
  const { data: allTournaments, isLoading: loadingAll } = useTournaments();
  const { data: myTournaments, isLoading: loadingMy } = useMyTournaments();
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="container mx-auto px-4 py-8">
        {/* My Tournaments Section */}
        {user && (
          <section className="mb-12">
            <div className="mb-6 flex items-center justify-between">
              <h1 className="text-3xl font-bold text-gray-900">My Tournaments</h1>
              <button
                onClick={() => setShowForm(!showForm)}
                className="flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 font-semibold text-white transition-colors hover:bg-primary-700"
              >
                <Plus className="h-5 w-5" />
                Create Tournament
              </button>
            </div>

            {showForm && (
              <div className="mb-8 rounded-lg bg-white p-6 shadow">
                <h2 className="mb-4 text-xl font-semibold">Create New Tournament</h2>
                <TournamentForm />
              </div>
            )}

            {loadingMy ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-64 animate-pulse rounded-lg bg-gray-200"></div>
                ))}
              </div>
            ) : myTournaments && myTournaments.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {myTournaments.map((tournament) => (
                  <TournamentCard key={tournament.id} tournament={tournament} />
                ))}
              </div>
            ) : (
              <div className="rounded-lg bg-white p-12 text-center shadow">
                <p className="text-gray-600">You haven't created any tournaments yet.</p>
              </div>
            )}
          </section>
        )}

        {/* All Tournaments Section */}
        <section>
          <h2 className="mb-6 text-2xl font-bold text-gray-900">All Tournaments</h2>

          {loadingAll ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-64 animate-pulse rounded-lg bg-gray-200"></div>
              ))}
            </div>
          ) : allTournaments && allTournaments.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {allTournaments.map((tournament) => (
                <TournamentCard key={tournament.id} tournament={tournament} />
              ))}
            </div>
          ) : (
            <div className="rounded-lg bg-white p-12 text-center shadow">
              <p className="text-gray-600">No tournaments available.</p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
