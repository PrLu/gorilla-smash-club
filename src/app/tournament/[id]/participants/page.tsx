'use client';

import { ManualParticipantForm } from '@/components/ManualParticipantForm';
import { ParticipantRow } from '@/components/ParticipantRow';
import { Button, Card, Skeleton } from '@/components/ui';
import { useTournament, useTournamentRegistrations } from '@/lib/hooks/useTournament';
import { useTournamentInvitations } from '@/lib/hooks/useInvitations';
import { useUser } from '@/lib/useUser';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, UserPlus, Download, Users } from 'lucide-react';
import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { staggerContainer, staggerItem } from '@/lib/motion';

/**
 * Participant management dashboard
 * Organizer-only page with inline editing and bulk actions
 */
export default function ParticipantsPage() {
  const params = useParams();
  const tournamentId = params?.id as string;
  const { user } = useUser();

  const { data: tournament, isLoading: loadingTournament } = useTournament(tournamentId);
  const {
    data: registrations,
    isLoading: loadingRegistrations,
    refetch: refetchRegistrations,
  } = useTournamentRegistrations(tournamentId);
  const { data: invitations, refetch: refetchInvitations } =
    useTournamentInvitations(tournamentId);

  const [showAddForm, setShowAddForm] = useState(false);

  const isOrganizer = user?.id === tournament?.organizer_id;

  const handleRemoveParticipant = async (participantId: string, type: 'registration' | 'invitation') => {
    try {
      if (type === 'registration') {
        const { error } = await supabase.from('registrations').delete().eq('id', participantId);
        if (error) throw error;
        refetchRegistrations();
      } else {
        // Delete invitation
        const { error } = await supabase.from('invitations').delete().eq('id', participantId);
        if (error) throw error;
        refetchInvitations();
      }

      toast.success('Participant removed');
    } catch (err: any) {
      toast.error('Failed to remove participant');
    }
  };

  // Combine registrations AND pending invitations into participants list
  const confirmedParticipants =
    registrations?.map((reg: any) => {
      const invitation = invitations?.find(
        (inv) => inv.email.toLowerCase() === reg.player?.email?.toLowerCase()
      );

      // For team registrations, show team name and both players
      if (reg.team) {
        const player1 = reg.team.player1;
        const player2 = reg.team.player2;
        
        return {
          id: reg.id,
          type: 'registration' as const,
          email: player1?.email || 'Team',
          display_name: reg.team.name || `${player1?.first_name} & ${player2?.first_name}`,
          is_placeholder: false,
          is_team: true,
          status: reg.status,
          rating: reg.metadata?.rating || player1?.player_rating,
          gender: reg.metadata?.gender || player1?.gender,
          partner_name: player2 ? `${player2.first_name} ${player2.last_name}` : 'Partner pending',
          partner_email: reg.metadata?.partner_email,
          invitation,
        };
      }

      // Singles registration
      return {
        id: reg.id,
        type: 'registration' as const,
        email: reg.player?.email || 'Unknown',
        display_name: reg.player
          ? `${reg.player.first_name} ${reg.player.last_name}`
          : undefined,
        is_placeholder: false,
        is_team: false,
        status: reg.status,
        rating: reg.metadata?.rating || reg.player?.player_rating,
        gender: reg.metadata?.gender || reg.player?.gender,
        invitation,
      };
    }) || [];

  // Add pending invitations (users who haven't signed up yet)
  const pendingInvitations =
    invitations
      ?.filter((inv) => inv.status === 'pending')
      .filter(
        (inv) =>
          !confirmedParticipants.some(
            (p) => p.email.toLowerCase() === inv.email.toLowerCase()
          )
      )
      .map((inv) => ({
        id: inv.id,
        type: 'invitation' as const,
        email: inv.email,
        display_name: inv.display_name || inv.email.split('@')[0],
        is_placeholder: true,
        is_team: inv.metadata?.partner_email ? true : false,
        status: 'pending' as const,
        rating: inv.metadata?.rating,
        gender: inv.metadata?.gender,
        partner_name: inv.metadata?.partner_display_name,
        partner_email: inv.metadata?.partner_email,
        invitation: {
          id: inv.id,
          status: inv.status,
          created_at: inv.created_at,
        },
      })) || [];

  // Combine both lists
  const participants = [...confirmedParticipants, ...pendingInvitations];

  if (!isOrganizer) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card className="p-12 text-center">
          <Users className="mx-auto mb-4 h-16 w-16 text-gray-300" />
          <h1 className="mb-2 text-2xl font-bold text-gray-900">Access Denied</h1>
          <p className="mb-6 text-gray-600">Only organizers can manage participants</p>
          <Link href={`/tournament/${tournamentId}`}>
            <Button variant="primary">Back to Tournament</Button>
          </Link>
        </Card>
      </div>
    );
  }

  if (loadingTournament) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <Skeleton height={60} className="mb-6" />
          <Skeleton height={400} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
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
              <h1 className="text-3xl font-bold text-gray-900">Manage Participants</h1>
              {tournament && <p className="mt-1 text-gray-600">{tournament.title}</p>}
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              variant="secondary"
              leftIcon={<Download className="h-5 w-5" />}
              onClick={() => toast('CSV export coming soon!')}
            >
              <span className="hidden sm:inline">Export CSV</span>
            </Button>

            <Button
              variant="primary"
              onClick={() => setShowAddForm(!showAddForm)}
              leftIcon={<UserPlus className="h-5 w-5" />}
            >
              Add Participant
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          <Card padding="md">
            <div className="text-sm text-gray-600">Total Participants</div>
            <div className="mt-1 text-3xl font-bold text-gray-900">{participants.length}</div>
          </Card>

          <Card padding="md">
            <div className="text-sm text-gray-600">Confirmed</div>
            <div className="mt-1 text-3xl font-bold text-success-600">
              {participants.filter((p) => p.status === 'confirmed').length}
            </div>
          </Card>

          <Card padding="md">
            <div className="text-sm text-gray-600">Pending Invites</div>
            <div className="mt-1 text-3xl font-bold text-warning-600">
              {pendingInvitations.length}
            </div>
          </Card>
        </div>

        {/* Add Participant Form */}
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-8"
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Add Participant</h2>
              <button
                onClick={() => setShowAddForm(false)}
                className="text-gray-500 hover:text-gray-700"
                aria-label="Close form"
              >
                ✕
              </button>
            </div>
            <ManualParticipantForm
              tournamentId={tournamentId}
              onSuccess={() => {
                setShowAddForm(false);
                refetchRegistrations();
                refetchInvitations();
              }}
            />
          </motion.div>
        )}

        {/* Participants List */}
        <Card padding="lg">
          <h2 className="mb-6 text-xl font-semibold text-gray-900">Participants</h2>

          {loadingRegistrations ? (
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} height={80} />
              ))}
            </div>
          ) : participants.length === 0 ? (
            <div className="py-16 text-center">
              <Users className="mx-auto mb-4 h-16 w-16 text-gray-300" />
              <p className="mb-4 text-gray-600">No participants yet.</p>
              <Button variant="primary" onClick={() => setShowAddForm(true)}>
                Add Your First Participant
              </Button>
            </div>
          ) : (
            <motion.div
              className="space-y-3"
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
            >
              {participants.map((participant) => (
                <motion.div key={participant.id} variants={staggerItem}>
                  <ParticipantRow
                    participant={participant}
                    onRemove={(id) => handleRemoveParticipant(id, participant.type)}
                  />
                </motion.div>
              ))}
            </motion.div>
          )}
        </Card>
      </div>
    </div>
  );
}
