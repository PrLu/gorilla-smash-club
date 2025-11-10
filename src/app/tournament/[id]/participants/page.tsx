'use client';

import { ManualParticipantForm } from '@/components/ManualParticipantForm';
import { ParticipantRow } from '@/components/ParticipantRow';
import { EditParticipantModal } from '@/components/EditParticipantModal';
import { Button, Card, Skeleton } from '@/components/ui';
import { useTournament, useTournamentRegistrations } from '@/lib/hooks/useTournament';
import { useTournamentInvitations } from '@/lib/hooks/useInvitations';
import { useUser } from '@/lib/useUser';
import { useUserRole } from '@/lib/hooks/useUserRole';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, UserPlus, Download, Users, Upload } from 'lucide-react';
import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { staggerContainer, staggerItem } from '@/lib/motion';
import { TournamentBulkImportModal } from '@/components/TournamentBulkImportModal';

/**
 * Participant management dashboard
 * Organizer-only page with inline editing and bulk actions
 */
export default function ParticipantsPage() {
  const params = useParams();
  const tournamentId = params?.id as string;
  const { user } = useUser();
  const { data: userRole } = useUserRole();
  const queryClient = useQueryClient();

  const { data: tournament, isLoading: loadingTournament } = useTournament(tournamentId);
  const {
    data: registrations,
    isLoading: loadingRegistrations,
    refetch: refetchRegistrations,
  } = useTournamentRegistrations(tournamentId);
  const { data: invitations, refetch: refetchInvitations } =
    useTournamentInvitations(tournamentId);

  const [showAddForm, setShowAddForm] = useState(false);
  const [showBulkImportModal, setShowBulkImportModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [editingParticipant, setEditingParticipant] = useState<any>(null);

  const isOrganizer = user?.id === tournament?.organizer_id;
  const isAdminOrRoot = userRole === 'admin' || userRole === 'root';
  const canEdit = isOrganizer || isAdminOrRoot;

    const handleRemoveParticipant = async (participantId: string, type: 'registration' | 'invitation') => {
    try {
      console.log('Removing participant:', participantId, 'type:', type);
      
      if (type === 'registration') {
        // Delete registration only (NOT the user's profile or player record)
        const { error, data } = await supabase
          .from('registrations')
          .delete()
          .eq('id', participantId)
          .select();
        
        console.log('Delete result:', { error, data, deletedCount: data?.length });
        
        if (error) {
          console.error('Delete error:', error);
          throw error;
        }
        
        if (!data || data.length === 0) {
          console.warn('No rows deleted - participant may not exist');
          toast.error('Participant not found or already removed');
          return;
        }
        
        console.log('Registration deleted from database, now refreshing UI...');
        
        // Invalidate ALL related queries to force complete refresh
        queryClient.removeQueries({ queryKey: ['registrations', tournamentId] }); // Remove from cache completely
        queryClient.invalidateQueries({ queryKey: ['tournament', tournamentId] });
        queryClient.invalidateQueries({ queryKey: ['matches', tournamentId] });
        
        // Force immediate refetch with fresh data
        const result = await refetchRegistrations();
        console.log('Refetch result - new count:', result.data?.length);
        
        console.log('✅ Cache invalidated and data refetched - participant should be removed from UI');
        toast.success('✅ Participant removed from tournament');
      } else {
        // Delete invitation only
        const { error, data } = await supabase
          .from('invitations')
          .delete()
          .eq('id', participantId)
          .select();
        
        console.log('Delete invitation result:', { error, data, deletedCount: data?.length });
        
        if (error) {
          console.error('Delete error:', error);
          throw error;
        }
        
        if (!data || data.length === 0) {
          console.warn('No rows deleted - invitation may not exist');
          toast.error('Invitation not found or already removed');
          return;
        }
        
        console.log('Invitation deleted, refreshing UI...');
        
        // Invalidate queries
        await queryClient.invalidateQueries({ queryKey: ['invitations', tournamentId] });
        await queryClient.invalidateQueries({ queryKey: ['tournament', tournamentId] });
        
        // Force refetch
        await refetchInvitations();
        
        console.log('✅ Invitation removed from UI');
        toast.success('✅ Invitation removed');
      }
      
      console.log('🎉 Removal complete - participant no longer listed in tournament or manage participants');
    } catch (err: any) {
      console.error('❌ Failed to remove participant:', err);
      toast.error(`Failed to remove: ${err.message || 'Unknown error'}`);
    }
  };

  const handleEditParticipant = (participantId: string) => {
    const participant = confirmedParticipants.find((p: any) => p.id === participantId);
    if (participant) {
      setEditingParticipant(participant);
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
          category: reg.metadata?.category || 'doubles',
          rating: reg.metadata?.rating || player1?.player_rating,
          gender: reg.metadata?.gender || player1?.gender,
          partner_name: player2 ? `${player2.first_name} ${player2.last_name}` : 'Partner pending',
          partner_email: reg.metadata?.partner_email,
          invitation,
        };
      }

      // Singles or doubles/mixed without team
      const category = reg.metadata?.category || 'singles';
      const isTeamCategory = category === 'doubles' || category === 'mixed';
      
      return {
        id: reg.id,
        type: 'registration' as const,
        email: reg.player?.email || 'Unknown',
        display_name: reg.player
          ? `${reg.player.first_name} ${reg.player.last_name}`
          : undefined,
        is_placeholder: false,
        is_team: isTeamCategory,
        status: reg.status,
        category: category,
        rating: reg.metadata?.rating || reg.player?.player_rating,
        gender: reg.metadata?.gender || reg.player?.gender,
        // Include partner info from metadata for doubles/mixed
        partner_name: isTeamCategory ? reg.metadata?.partner_display_name : undefined,
        partner_email: isTeamCategory ? reg.metadata?.partner_email : undefined,
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
        category: inv.metadata?.category,
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

  // Extract unique categories from participants (recalculated on every render)
  const availableCategories = Array.from(
    new Set(participants.map(p => p.category).filter(Boolean))
  ).sort();

  // Calculate real-time counts per category
  const categoryCounts = availableCategories.reduce((acc, category) => {
    acc[category] = participants.filter(p => p.category === category).length;
    return acc;
  }, {} as Record<string, number>);

  console.log('Current participants:', participants.length);
  console.log('Categories with counts:', categoryCounts);

  // Filter participants by selected category
  const filteredParticipants = selectedCategory === 'all'
    ? participants
    : participants.filter(p => p.category === selectedCategory);

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
    <div className="min-h-screen bg-gray-50 text-gray-900">
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
              variant="ghost"
              leftIcon={<Upload className="h-5 w-5" />}
              onClick={() => setShowBulkImportModal(true)}
            >
              <span className="hidden sm:inline">Import CSV</span>
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

        {/* Bulk Import Modal */}
        <TournamentBulkImportModal
          isOpen={showBulkImportModal}
          onClose={() => setShowBulkImportModal(false)}
          onSuccess={() => {
            refetchRegistrations();
            setShowBulkImportModal(false);
          }}
          tournamentId={tournamentId}
        />

        {/* Edit Participant Modal */}
        {editingParticipant && (
          <EditParticipantModal
            isOpen={!!editingParticipant}
            onClose={() => setEditingParticipant(null)}
            participant={editingParticipant}
            onSuccess={() => {
              refetchRegistrations();
              setEditingParticipant(null);
            }}
          />
        )}

        {/* Category Filter */}
        {availableCategories.length > 0 && (
          <Card padding="md" className="mb-6">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-sm font-semibold text-gray-700">Filter by Category:</span>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedCategory('all')}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
                    selectedCategory === 'all'
                      ? 'bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                  }`}
                >
                  All ({participants.length})
                </button>
                {availableCategories.map((category) => {
                  // Use pre-calculated count from categoryCounts (always fresh)
                  const count = categoryCounts[category] || 0;
                  return (
                    <button
                      key={category}
                      onClick={() => setSelectedCategory(category)}
                      className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
                        selectedCategory === category
                          ? 'bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-md'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                      }`}
                    >
                      {category.charAt(0).toUpperCase() + category.slice(1)} ({count})
                    </button>
                  );
                })}
              </div>
            </div>
          </Card>
        )}

        {/* Participants List */}
        <Card padding="lg">
          <h2 className="mb-6 text-xl font-semibold text-gray-900">
            Participants
            {selectedCategory !== 'all' && (
              <span className="ml-2 text-base font-normal text-gray-600">
                - {selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)}
              </span>
            )}
          </h2>

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
          ) : filteredParticipants.length === 0 ? (
            <div className="py-16 text-center">
              <Users className="mx-auto mb-4 h-16 w-16 text-gray-300" />
              <p className="mb-4 text-gray-600">
                No participants found in {selectedCategory} category.
              </p>
              <Button 
                variant="ghost" 
                onClick={() => setSelectedCategory('all')}
              >
                Show All Participants
              </Button>
            </div>
          ) : (
            <motion.div
              className="space-y-3"
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
            >
              {filteredParticipants.map((participant) => (
                <motion.div key={participant.id} variants={staggerItem}>
                  <ParticipantRow
                    participant={participant}
                    onRemove={(id) => handleRemoveParticipant(id, participant.type)}
                    onEdit={canEdit ? handleEditParticipant : undefined}
                    canEdit={canEdit}
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
