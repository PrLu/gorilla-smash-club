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
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState<'all' | 'open' | 'in_progress' | 'completed' | 'archived'>('all');
  
  // My Tournaments - only shows active (open, in_progress)
  const { data: myTournaments, isLoading: loadingMy } = useMyTournaments();
  
  // All Tournaments - includes all statuses based on filter
  const includeArchived = filter === 'all' || filter === 'archived';
  const { data: allTournaments, isLoading: loadingAll } = useTournaments(includeArchived);

  const filteredTournaments =
    filter === 'all'
      ? allTournaments?.filter((t) => t.status !== 'archived')
      : allTournaments?.filter((t) => t.status === filter);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* My Tournaments Section (Organizer View) */}
        {user && (
          <section className="mb-12">
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="font-display text-3xl font-bold text-gray-900">My Tournaments</h1>
              <p className="mt-1 text-gray-700">Manage your organized events</p>
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
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                className="mb-8"
              >
                <Card padding="lg" className="border-2 border-primary-200 dark:border-primary-800">
                  <div className="mb-6 flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                      Create New Tournament
                    </h2>
                    <button
                      onClick={() => setShowForm(false)}
                      className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                      aria-label="Close form"
                    >
                      ✕
                    </button>
                  </div>
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
                <Trophy className="mx-auto mb-4 h-16 w-16 text-gray-300 dark:text-gray-600" />
                <p className="mb-4 text-gray-600 dark:text-gray-400">No active tournaments.</p>
                <p className="mb-4 text-sm text-gray-500 dark:text-gray-500">
                  Your draft, completed, and archived tournaments are in the "All Tournaments" section below.
                </p>
                <Button variant="primary" onClick={() => setShowForm(true)}>
                  Create New Tournament
                </Button>
              </Card>
            )}
          </section>
        )}

        {/* All Tournaments Section */}
        <section>
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-display text-2xl font-bold text-gray-900">All Tournaments</h2>
              <p className="mt-1 text-gray-700">Browse and join upcoming events</p>
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
              <Button
                variant={filter === 'archived' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setFilter('archived')}
              >
                Archived
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
              <Trophy className="mx-auto mb-4 h-16 w-16 text-gray-300 dark:text-gray-600" />
              <p className="text-gray-600 dark:text-gray-400">
                No {filter !== 'all' ? filter : ''} tournaments found.
              </p>
            </Card>
          )}
        </section>
      </div>
    </div>
  );
}
