'use client';

import { Select } from '@/components/ui';
import { useUpdateTournament } from '@/lib/hooks/useUpdateTournament';
import toast from 'react-hot-toast';

interface TournamentStatusSelectorProps {
  tournamentId: string;
  currentStatus: string;
  disabled?: boolean;
}

/**
 * Tournament Status Selector
 * Allows organizers to change tournament status with a dropdown
 */
export function TournamentStatusSelector({
  tournamentId,
  currentStatus,
  disabled = false,
}: TournamentStatusSelectorProps) {
  const updateTournament = useUpdateTournament();

  const handleStatusChange = async (newStatus: string) => {
    if (newStatus === currentStatus) return;

    // Confirmation for certain status changes
    if (newStatus === 'archived' || newStatus === 'cancelled') {
      if (!window.confirm(`Change status to ${newStatus}? This will affect participant visibility.`)) {
        return;
      }
    }

    try {
      await updateTournament.mutateAsync({
        tournamentId,
        status: newStatus,
      });

      toast.success(`Tournament status updated to ${newStatus}`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to update status');
    }
  };

  const statusOptions = [
    { value: 'draft', label: '📝 Draft' },
    { value: 'open', label: '✅ Open for Registration' },
    { value: 'closed', label: '🔒 Registration Closed' },
    { value: 'in_progress', label: '▶️ In Progress' },
    { value: 'completed', label: '🏆 Completed' },
    { value: 'cancelled', label: '❌ Cancelled' },
    { value: 'archived', label: '📦 Archived' },
  ];

  return (
    <div className="w-full md:w-64">
      <Select
        label="Tournament Status"
        value={currentStatus}
        onChange={(e) => handleStatusChange(e.target.value)}
        options={statusOptions}
        disabled={disabled || updateTournament.isPending}
      />
      {updateTournament.isPending && (
        <p className="mt-1 text-xs text-gray-500">Updating...</p>
      )}
    </div>
  );
}

