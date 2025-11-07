'use client';

import { useState } from 'react';
import { Button, Modal } from '@/components/ui';
import { Trash2, AlertTriangle } from 'lucide-react';
import { useDeleteFixtures } from '@/lib/hooks/useDeleteFixtures';
import toast from 'react-hot-toast';

interface DeleteFixturesButtonProps {
  tournamentId: string;
  disabled?: boolean;
  variant?: 'danger' | 'ghost' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

/**
 * Delete Fixtures Button Component
 * Allows organizers to delete all fixtures and start fresh
 */
export function DeleteFixturesButton({
  tournamentId,
  disabled = false,
  variant = 'danger',
  size = 'md',
  showIcon = true,
}: DeleteFixturesButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const deleteFixtures = useDeleteFixtures();

  const handleDelete = async () => {
    try {
      const result = await deleteFixtures.mutateAsync({ tournamentId });
      
      toast.success(
        `${result.deletedMatches} matches and ${result.deletedPools} pools deleted successfully`
      );
      
      setIsModalOpen(false);
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete fixtures');
    }
  };

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={() => setIsModalOpen(true)}
        disabled={disabled}
        leftIcon={showIcon ? <Trash2 className="h-5 w-5" /> : undefined}
      >
        Delete Fixtures
      </Button>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Delete All Fixtures"
        size="md"
      >
        <div className="space-y-4">
          {/* Warning Banner */}
          <div className="flex gap-3 rounded-lg bg-red-50 border border-red-200 p-4 dark:bg-red-900/20 dark:border-red-800">
            <AlertTriangle className="h-6 w-6 flex-shrink-0 text-red-600 dark:text-red-400" />
            <div className="flex-1">
              <h4 className="font-semibold text-red-900 dark:text-red-300">
                This action cannot be undone
              </h4>
              <p className="mt-1 text-sm text-red-700 dark:text-red-400">
                All matches, scores, pools, and pool standings will be permanently deleted.
                You will need to regenerate fixtures from scratch.
              </p>
            </div>
          </div>

          {/* What will be deleted */}
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
              What will be deleted:
            </h4>
            <ul className="space-y-1 text-sm text-gray-700 dark:text-gray-300">
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-red-500"></span>
                All tournament matches
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-red-500"></span>
                All match scores and results
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-red-500"></span>
                All pool configurations
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-red-500"></span>
                All pool standings
              </li>
            </ul>
          </div>

          {/* What will be preserved */}
          <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-900/20">
            <h4 className="font-semibold text-green-900 dark:text-green-300 mb-2">
              What will be preserved:
            </h4>
            <ul className="space-y-1 text-sm text-green-700 dark:text-green-400">
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-green-500"></span>
                Tournament details and settings
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-green-500"></span>
                All registered participants
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-green-500"></span>
                Teams and player information
              </li>
            </ul>
          </div>

          {/* Confirmation Message */}
          <div className="rounded-lg border-2 border-red-300 bg-red-50 p-4 dark:border-red-700 dark:bg-red-900/20">
            <p className="text-center font-semibold text-red-900 dark:text-red-300">
              Are you absolutely sure you want to delete all fixtures?
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <Button
              variant="ghost"
              onClick={() => setIsModalOpen(false)}
              disabled={deleteFixtures.isPending}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleDelete}
              isLoading={deleteFixtures.isPending}
              className="flex-1"
            >
              {deleteFixtures.isPending ? 'Deleting...' : 'Yes, Delete All Fixtures'}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}

