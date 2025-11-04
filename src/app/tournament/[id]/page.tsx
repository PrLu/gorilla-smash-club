'use client';

import { FixturesViewer } from '@/components/FixturesViewer';
import { RegistrationForm } from '@/components/RegistrationForm';
import { Button, Card, CardContent, Skeleton } from '@/components/ui';
import { useTournament, useTournamentRegistrations } from '@/lib/hooks/useTournament';
import { useMatches } from '@/lib/hooks/useMatches';
import { useUser } from '@/lib/useUser';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Calendar, MapPin, Users, Play, Trophy, UserPlus, List } from 'lucide-react';
import { useState } from 'react';
import { motion } from 'framer-motion';

/**
 * Tournament detail page with tabs
 * Tabs: Overview, Fixtures, Participants, Live
 */
export default function TournamentPage() {
  const params = useParams();
  const tournamentId = params?.id as string;
  const { user } = useUser();

  const { data: tournament, isLoading: loadingTournament } = useTournament(tournamentId);
  const { data: matches, isLoading: loadingMatches } = useMatches(tournamentId);
  const { data: registrations } = useTournamentRegistrations(tournamentId);

  const [activeTab, setActiveTab] = useState<'overview' | 'fixtures' | 'participants'>('overview');
  const [showRegistration, setShowRegistration] = useState(false);

  const isOrganizer = user?.id === tournament?.organizer_id;

  if (loadingTournament) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <Skeleton height={200} className="mb-6" />
          <div className="grid gap-6 md:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} height={150} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card className="p-12 text-center">
          <h1 className="mb-4 text-2xl font-bold text-gray-900">Tournament Not Found</h1>
          <Link href="/dashboard">
            <Button variant="primary">Back to Dashboard</Button>
          </Link>
        </Card>
      </div>
    );
  }

  const statusConfig = {
    draft: { color: 'bg-gray-100 text-gray-800', label: 'Draft' },
    open: { color: 'bg-success-100 text-success-800', label: 'Open for Registration' },
    closed: { color: 'bg-error-100 text-error-800', label: 'Registration Closed' },
    in_progress: { color: 'bg-primary-100 text-primary-800', label: 'In Progress' },
    completed: { color: 'bg-gray-200 text-gray-700', label: 'Completed' },
    cancelled: { color: 'bg-error-100 text-error-800', label: 'Cancelled' },
  };

  const status = statusConfig[tournament.status];

  const tabs = [
    { id: 'overview', label: 'Overview', icon: List },
    { id: 'fixtures', label: 'Fixtures', icon: Trophy },
    { id: 'participants', label: 'Participants', icon: Users },
  ] as const;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 overflow-hidden rounded-2xl bg-gradient-to-br from-primary-600 to-primary-700 p-8 text-white shadow-xl">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex-1">
              <h1 className="mb-2 text-4xl font-bold">{tournament.title}</h1>
              {tournament.description && (
                <p className="text-primary-100">{tournament.description}</p>
              )}
            </div>

            <span className={`flex-shrink-0 rounded-full px-4 py-2 text-sm font-semibold ${status.color}`}>
              {status.label}
            </span>
          </div>

          {/* Meta Info */}
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 flex-shrink-0 opacity-75" />
              <div className="min-w-0">
                <div className="text-xs opacity-75">Dates</div>
                <div className="truncate text-sm font-medium">
                  {new Date(tournament.start_date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                  {' - '}
                  {new Date(tournament.end_date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5 flex-shrink-0 opacity-75" />
              <div className="min-w-0">
                <div className="text-xs opacity-75">Location</div>
                <div className="truncate text-sm font-medium">{tournament.location}</div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="h-5 w-5 flex-shrink-0 text-lg opacity-75">₹</span>
              <div>
                <div className="text-xs opacity-75">Entry Fee</div>
                <div className="text-sm font-medium">₹{tournament.entry_fee}</div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 flex-shrink-0 opacity-75" />
              <div>
                <div className="text-xs opacity-75">Registered</div>
                <div className="text-sm font-medium">
                  {registrations?.length || 0}
                  {tournament.max_participants && ` / ${tournament.max_participants}`}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mb-6 flex flex-wrap gap-3">
          {tournament.status === 'open' && !isOrganizer && (
            <Button
              variant="primary"
              onClick={() => setShowRegistration(true)}
              leftIcon={<UserPlus className="h-5 w-5" />}
            >
              Register Now
            </Button>
          )}

          <Link href={`/tournament/${tournamentId}/live`}>
            <Button variant="outline" leftIcon={<Play className="h-5 w-5" />}>
              Live Scoreboard
            </Button>
          </Link>

          {isOrganizer && (
            <>
              <Link href={`/tournament/${tournamentId}/participants`}>
                <Button variant="secondary" leftIcon={<Users className="h-5 w-5" />}>
                  Manage Participants
                </Button>
              </Link>

              <Link href={`/api/generate-fixtures?tournamentId=${tournamentId}`}>
                <Button variant="primary" leftIcon={<Trophy className="h-5 w-5" />}>
                  Generate Fixtures
                </Button>
              </Link>
            </>
          )}
        </div>

        {/* Registration Modal */}
        {showRegistration && (
          <div className="mb-8">
            <Card padding="lg">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-semibold">Register for Tournament</h2>
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
            </Card>
          </div>
        )}

        {/* Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 overflow-x-auto" aria-label="Tabs">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 whitespace-nowrap border-b-2 px-1 py-4 text-sm font-medium transition-colors ${
                      isActive
                        ? 'border-primary-600 text-primary-600'
                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                    }`}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    <Icon className="h-5 w-5" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div>
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <Card padding="lg">
                <h3 className="mb-4 text-lg font-semibold text-gray-900">Tournament Details</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <span className="text-sm text-gray-600">Format:</span>
                    <p className="font-medium text-gray-900">{tournament.format.charAt(0).toUpperCase() + tournament.format.slice(1)}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Status:</span>
                    <p className="font-medium text-gray-900">{status.label}</p>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {activeTab === 'fixtures' && (
            <div>
              {loadingMatches ? (
                <div className="flex justify-center py-12">
                  <Skeleton width={600} height={400} />
                </div>
              ) : (
                <FixturesViewer matches={matches || []} />
              )}
            </div>
          )}

          {activeTab === 'participants' && (
            <Card padding="lg">
              <h3 className="mb-4 text-lg font-semibold text-gray-900">
                Registered Participants ({registrations?.length || 0})
              </h3>
              {registrations && registrations.length > 0 ? (
                <div className="space-y-3">
                  {registrations.map((reg: any) => (
                    <div key={reg.id} className="flex items-center justify-between border-b border-gray-100 pb-3 last:border-0">
                      <div>
                        <p className="font-medium text-gray-900">
                          {reg.player?.first_name} {reg.player?.last_name}
                        </p>
                        <p className="text-sm text-gray-500">{reg.status}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-600">No participants yet</p>
              )}
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
