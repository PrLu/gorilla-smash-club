'use client';

import { TournamentCard } from '@/components/TournamentCard';
import { TournamentForm } from '@/components/TournamentForm';
import { Button, Card, SkeletonCard } from '@/components/ui';
import { useTournaments, useMyTournaments } from '@/lib/hooks/useTournaments';
import { useUser } from '@/lib/useUser';
import { useState } from 'react';
import { Plus, Trophy, Filter } from 'lucide-react';
import { motion } from 'framer-motion';
import { staggerContainer, staggerItem } from '@/lib/motion';

/**
 * Redesigned organizer dashboard
 * Shows tournaments in organized sections with filter capabilities
 */
export default function DashboardPage() {
  const { user } = useUser();
  const { data: allTournaments, isLoading: loadingAll } = useTournaments();
  const { data: myTournaments, isLoading: loadingMy } = useMyTournaments();
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState<'all' | 'open' | 'in_progress' | 'completed'>('all');

  const filteredTournaments =
    filter === 'all'
      ? allTournaments
      : allTournaments?.filter((t) => t.status === filter);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* My Tournaments Section (Organizer View) */}
        {user && (
          <section className="mb-12">
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">My Tournaments</h1>
                <p className="mt-1 text-gray-600">Manage your organized events</p>
              </div>

              <Button
                variant="primary"
                onClick={() => setShowForm(!showForm)}
                leftIcon={<Plus className="h-5 w-5" />}
              >
                Create Tournament
              </Button>
            </div>

            {/* Create Tournament Form */}
            {showForm && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-8"
              >
                <Card padding="lg">
                  <h2 className="mb-6 text-xl font-semibold text-gray-900">
                    Create New Tournament
                  </h2>
                  <TournamentForm />
                </Card>
              </motion.div>
            )}

            {/* My Tournaments Grid */}
            {loadingMy ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3].map((i) => (
                  <SkeletonCard key={i} />
                ))}
              </div>
            ) : myTournaments && myTournaments.length > 0 ? (
              <motion.div
                className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
              >
                {myTournaments.map((tournament) => (
                  <motion.div key={tournament.id} variants={staggerItem}>
                    <TournamentCard tournament={tournament} />
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <Card className="p-12 text-center">
                <Trophy className="mx-auto mb-4 h-16 w-16 text-gray-300" />
                <p className="mb-4 text-gray-600">You haven't created any tournaments yet.</p>
                <Button variant="primary" onClick={() => setShowForm(true)}>
                  Create Your First Tournament
                </Button>
              </Card>
            )}
          </section>
        )}

        {/* All Tournaments Section */}
        <section>
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">All Tournaments</h2>
              <p className="mt-1 text-gray-600">Browse and join upcoming events</p>
            </div>

            {/* Filter Buttons */}
            <div className="flex flex-wrap gap-2">
              <Button
                variant={filter === 'all' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setFilter('all')}
                leftIcon={<Filter className="h-4 w-4" />}
              >
                All
              </Button>
              <Button
                variant={filter === 'open' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setFilter('open')}
              >
                Open
              </Button>
              <Button
                variant={filter === 'in_progress' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setFilter('in_progress')}
              >
                In Progress
              </Button>
              <Button
                variant={filter === 'completed' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setFilter('completed')}
              >
                Completed
              </Button>
            </div>
          </div>

          {/* Tournaments Grid */}
          {loadingAll ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : filteredTournaments && filteredTournaments.length > 0 ? (
            <motion.div
              className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
            >
              {filteredTournaments.map((tournament) => (
                <motion.div key={tournament.id} variants={staggerItem}>
                  <TournamentCard tournament={tournament} />
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <Card className="p-12 text-center">
              <Trophy className="mx-auto mb-4 h-16 w-16 text-gray-300" />
              <p className="text-gray-600">
                No {filter !== 'all' ? filter : ''} tournaments found.
              </p>
            </Card>
          )}
        </section>
      </div>
    </div>
  );
}
