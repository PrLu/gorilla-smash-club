'use client';

import { FixturesViewer } from '@/components/FixturesViewer';
import { KnockoutsViewer } from '@/components/KnockoutsViewer';
import { RegistrationForm } from '@/components/RegistrationForm';
import { GenerateFixturesButton } from '@/components/GenerateFixturesButton';
import { AutoGenerateFixturesButton } from '@/components/AutoGenerateFixturesButton';
import { DeleteFixturesButton } from '@/components/DeleteFixturesButton';
import { TournamentStatusSelector } from '@/components/TournamentStatusSelector';
import { FixtureGenerationModal, SystemGenerateOptions } from '@/components/FixtureGenerationModal';
import { Button, Card, CardContent, Skeleton } from '@/components/ui';
import { useTournament, useTournamentRegistrations } from '@/lib/hooks/useTournament';
import { useMatches } from '@/lib/hooks/useMatches';
import { useUser } from '@/lib/useUser';
import { useArchiveTournament, useRestoreTournament } from '@/lib/hooks/useArchiveTournament';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Calendar, MapPin, Users, Play, Trophy, UserPlus, List, Archive, ArchiveRestore, Trash2, Edit } from 'lucide-react';
import { useState } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

/**
 * Tournament detail page with tabs
 * Tabs: Overview, Fixtures, Participants, Live
 */
export default function TournamentPage() {
  const params = useParams();
  const router = useRouter();
  const tournamentId = params?.id as string;
  const { user } = useUser();

  const { data: tournament, isLoading: loadingTournament } = useTournament(tournamentId);
  const { data: matches, isLoading: loadingMatches } = useMatches(tournamentId);
  const { data: registrations } = useTournamentRegistrations(tournamentId);
  const archiveTournament = useArchiveTournament();
  const restoreTournament = useRestoreTournament();

  const [activeTab, setActiveTab] = useState<'overview' | 'fixtures' | 'participants' | 'knockouts'>('overview');
  const [showRegistration, setShowRegistration] = useState(false);
  const [showFixtureModal, setShowFixtureModal] = useState(false);
  const [showAutoGenerate, setShowAutoGenerate] = useState(false);

  const isOrganizer = user?.id === tournament?.organizer_id;
  const isArchived = tournament?.status === 'archived';
  
  const handleAutoGenerate = () => {
    setShowAutoGenerate(true);
    setShowFixtureModal(false);
  };

  const handleArchive = async () => {
    if (!window.confirm('Archive this tournament? It will be moved to archived tournaments.')) {
      return;
    }

    try {
      await archiveTournament.mutateAsync(tournamentId);
      toast.success('Tournament archived successfully');
      router.push('/dashboard');
    } catch (error: any) {
      toast.error(error.message || 'Failed to archive tournament');
    }
  };

  const handleRestore = async () => {
    try {
      await restoreTournament.mutateAsync(tournamentId);
      toast.success('Tournament restored successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to restore tournament');
    }
  };

  const handleSystemGenerate = async (options: SystemGenerateOptions) => {
    try {
      const { supabase } = await import('@/lib/supabaseClient');
      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.access_token) {
        toast.error('Please sign in again');
        return;
      }

      const response = await fetch(`/api/tournaments/${tournamentId}/generate-fixtures-system`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(options),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(`Failed to generate fixtures: ${data.error}`);
        return;
      }

      toast.success(`Fixtures generated! ${data.stats.totalMatches} matches created`);
      setShowFixtureModal(false);
      window.location.reload(); // Refresh to show new fixtures
    } catch (err) {
      console.error('Generate error:', err);
      toast.error('Failed to generate fixtures');
    }
  };

  const handleManualMode = () => {
    router.push(`/tournament/${tournamentId}/fixtures/manual`);
  };

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
    archived: { color: 'bg-gray-300 text-gray-600', label: 'Archived' },
  };

  const status = statusConfig[tournament.status];

  const tabs = [
    { id: 'overview', label: 'Overview', icon: List },
    { id: 'fixtures', label: 'Fixtures', icon: Trophy },
    { id: 'knockouts', label: 'Knockouts', icon: Trophy },
    { id: 'participants', label: 'Participants', icon: Users },
  ] as const;

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
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
              <div className="min-w-0">
                <div className="text-xs opacity-75">Entry Fees</div>
                {tournament.entry_fees && Object.keys(tournament.entry_fees).length > 0 ? (
                  <div className="space-y-0.5">
                    {Object.entries(tournament.entry_fees).map(([format, fee]: [string, any]) => (
                      <div key={format} className="text-sm font-medium">
                        <span className="capitalize">{format}:</span> ₹{fee}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm font-medium">₹{tournament.entry_fee}</div>
                )}
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
              <Link href={`/tournament/${tournamentId}/edit`}>
                <Button variant="secondary" leftIcon={<Edit className="h-5 w-5" />}>
                  Edit Tournament
                </Button>
              </Link>

              <Link href={`/tournament/${tournamentId}/participants`}>
                <Button variant="secondary" leftIcon={<Users className="h-5 w-5" />}>
                  Manage Participants
                </Button>
              </Link>

              <Button
                variant="primary"
                leftIcon={<Trophy className="h-5 w-5" />}
                onClick={() => setShowFixtureModal(true)}
                disabled={isArchived}
              >
                Generate Fixtures
              </Button>

              {/* Delete Fixtures Button - only show when fixtures exist */}
              {matches && matches.length > 0 && !isArchived && (
                <DeleteFixturesButton
                  tournamentId={tournamentId}
                  variant="secondary"
                />
              )}

              {/* Archive/Restore Button */}
              {isArchived ? (
                <Button
                  variant="secondary"
                  onClick={handleRestore}
                  isLoading={restoreTournament.isPending}
                  leftIcon={<ArchiveRestore className="h-5 w-5" />}
                >
                  Restore
                </Button>
              ) : (
                <Button
                  variant="danger"
                  onClick={handleArchive}
                  isLoading={archiveTournament.isPending}
                  leftIcon={<Archive className="h-5 w-5" />}
                >
                  Archive
                </Button>
              )}
            </>
          )}
        </div>

        {/* Status Selector for Organizer */}
        {isOrganizer && !isArchived && (
          <div className="mb-6">
            <TournamentStatusSelector
              tournamentId={tournamentId}
              currentStatus={tournament.status}
            />
          </div>
        )}

        {/* Archived Notice */}
        {isArchived && (
          <div className="mb-6 flex items-center gap-3 rounded-lg bg-gray-100 border border-gray-300 p-4 dark:bg-gray-800 dark:border-gray-700">
            <Archive className="h-5 w-5 text-gray-600" />
            <div className="flex-1">
              <p className="font-medium text-gray-900 dark:text-white">This tournament is archived</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Archived tournaments are read-only. Restore to make changes.
              </p>
            </div>
            {isOrganizer && (
              <Button variant="secondary" size="sm" onClick={handleRestore}>
                Restore Tournament
              </Button>
            )}
          </div>
        )}

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
                <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Tournament Details</h3>
                <div className="space-y-4">
                  <div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">Format(s):</span>
                    <div className="mt-1 flex flex-wrap gap-2">
                      {(tournament.formats || [tournament.format]).map((fmt: string) => (
                        <span
                          key={fmt}
                          className="rounded-lg bg-primary-100 px-3 py-1 text-sm font-medium text-primary-700 dark:bg-primary-900 dark:text-primary-300"
                        >
                          {fmt.charAt(0).toUpperCase() + fmt.slice(1)}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">Status:</span>
                    <p className="font-medium text-gray-900 dark:text-white">{status.label}</p>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {activeTab === 'fixtures' && (
            <div>
              {/* Fixtures Header with Actions */}
              {isOrganizer && !isArchived && matches && matches.length > 0 && (
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Tournament Fixtures ({matches.length} matches)
                  </h3>
                  <DeleteFixturesButton
                    tournamentId={tournamentId}
                    variant="ghost"
                    size="sm"
                  />
                </div>
              )}

              {loadingMatches ? (
                <div className="flex justify-center py-12">
                  <Skeleton width={600} height={400} />
                </div>
              ) : (
                <FixturesViewer 
                  matches={matches || []} 
                  canEditScores={isOrganizer}
                  onScoreUpdated={() => window.location.reload()}
                  tournamentId={tournamentId}
                />
              )}
            </div>
          )}

          {activeTab === 'knockouts' && (
            <div>
              {loadingMatches ? (
                <div className="flex justify-center py-12">
                  <Skeleton width={600} height={400} />
                </div>
              ) : (
                <KnockoutsViewer
                  tournamentId={tournamentId}
                  matches={matches || []}
                  isOrganizer={isOrganizer}
                  canEditScores={isOrganizer}
                />
              )}
            </div>
          )}

          {activeTab === 'participants' && (
            <Card padding="lg">
              <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                Registered Participants ({registrations?.length || 0})
              </h3>
              {registrations && registrations.length > 0 ? (
                <div className="space-y-3">
                  {registrations.map((reg: any) => {
                    const category = reg.metadata?.category || 'singles';
                    const isTeamCategory = category === 'doubles' || category === 'mixed';
                    const partnerName = reg.metadata?.partner_display_name || (reg.team?.player2 ? `${reg.team.player2.first_name} ${reg.team.player2.last_name}` : null);
                    
                    return (
                      <div key={reg.id} className="flex items-center justify-between rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium text-gray-900 dark:text-white">
                              {reg.player?.first_name} {reg.player?.last_name}
                              {reg.team && ` & Team`}
                            </p>
                            <span className="text-xs rounded-full bg-blue-100 dark:bg-blue-900/30 px-2 py-0.5 text-blue-700 dark:text-blue-300 capitalize">
                              {category}
                            </span>
                            <span className={`text-xs rounded-full px-2 py-0.5 ${
                              reg.status === 'confirmed' 
                                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                                : 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300'
                            }`}>
                              {reg.status}
                            </span>
                          </div>
                          
                          {/* Partner Info */}
                          {isTeamCategory && partnerName && (
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              <span className="font-medium">Partner:</span> {partnerName}
                              {reg.metadata?.partner_email && (
                                <span className="text-xs ml-1">({reg.metadata.partner_email})</span>
                              )}
                            </p>
                          )}
                          
                          {isTeamCategory && !partnerName && (
                            <p className="text-xs text-orange-600 dark:text-orange-400">
                              ⚠️ Partner not assigned yet
                            </p>
                          )}
                          
                          {/* Additional Info */}
                          <div className="flex gap-2 mt-1">
                            {reg.metadata?.rating && (
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                Rating: {reg.metadata.rating}
                              </span>
                            )}
                            {reg.metadata?.gender && (
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                • {reg.metadata.gender}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-center text-gray-600 dark:text-gray-400">No participants yet</p>
              )}
            </Card>
          )}
        </div>

        {/* Fixture Generation Modal */}
        <FixtureGenerationModal
          isOpen={showFixtureModal}
          onClose={() => setShowFixtureModal(false)}
          tournamentId={tournamentId}
          onSystemGenerate={handleSystemGenerate}
          onManualMode={handleManualMode}
          onAutoGenerate={handleAutoGenerate}
        />

        {/* Auto Generate Fixtures Flow */}
        {showAutoGenerate && (
          <AutoGenerateFixturesButton
            tournamentId={tournamentId}
            onSuccess={() => {
              setShowAutoGenerate(false);
            }}
          />
        )}
      </div>
    </div>
  );
}
