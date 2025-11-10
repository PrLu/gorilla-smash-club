'use client';

import { useResendInvite } from '@/lib/hooks/useResendInvite';
import { Mail, Trash2, CheckCircle, Clock, XCircle, User, Edit } from 'lucide-react';
import { Button } from '@/components/ui';
import toast from 'react-hot-toast';
import { useState } from 'react';
import { motion } from 'framer-motion';

interface ParticipantRowProps {
  participant: {
    id: string;
    email: string;
    display_name?: string;
    is_placeholder?: boolean;
    is_team?: boolean;
    status: 'pending' | 'confirmed' | 'cancelled';
    category?: string;
    rating?: string;
    gender?: string;
    partner_name?: string;
    partner_email?: string;
    invitation?: {
      id: string;
      status: 'pending' | 'accepted' | 'expired' | 'rejected';
      created_at: string;
    };
  };
  onRemove?: (participantId: string) => void;
  onEdit?: (participantId: string) => void;
  canEdit?: boolean;
}

/**
 * Polished participant row with inline actions
 * Shows invitation status, avatar, and management controls
 */
export function ParticipantRow({ participant, onRemove, onEdit, canEdit = false }: ParticipantRowProps) {
  const resendInvite = useResendInvite();
  const [isRemoving, setIsRemoving] = useState(false);

  const handleResend = async () => {
    if (!participant.invitation) return;

    try {
      await resendInvite.mutateAsync({
        invitationId: participant.invitation.id,
        regenerateToken: true,
      });
      toast.success('Invitation resent successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to resend invitation');
    }
  };

  const handleRemove = async () => {
    if (window.confirm(`Remove ${participant.display_name || participant.email} from this tournament?\n\nTheir account will remain active for other tournaments.`)) {
      setIsRemoving(true);
      try {
        await onRemove?.(participant.id);
      } catch (error) {
        setIsRemoving(false);
      }
    }
  };

  const statusConfig = {
    pending: { icon: Clock, color: 'text-warning-600', bg: 'bg-warning-100' },
    accepted: { icon: CheckCircle, color: 'text-success-600', bg: 'bg-success-100' },
    expired: { icon: XCircle, color: 'text-error-600', bg: 'bg-error-100' },
    rejected: { icon: XCircle, color: 'text-error-600', bg: 'bg-error-100' },
  };

  const registrationStatusConfig = {
    pending: { label: 'Pending', color: 'bg-warning-100 text-warning-800 dark:bg-warning-900 dark:text-warning-200' },
    confirmed: { label: 'Confirmed', color: 'bg-success-100 text-success-800 dark:bg-success-900 dark:text-success-200' },
    cancelled: { label: 'Cancelled', color: 'bg-error-100 text-error-800 dark:bg-error-900 dark:text-error-200' },
  };

  const inviteStatus = participant.invitation?.status;
  const StatusIcon = inviteStatus ? statusConfig[inviteStatus]?.icon : null;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -100 }}
      className="flex items-center justify-between rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 shadow-sm transition-shadow hover:shadow-md"
    >
      {/* Left: Avatar + Info */}
      <div className="flex items-center gap-4">
        {/* Avatar */}
        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300">
          <User className="h-6 w-6" />
        </div>

        {/* Info */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h4 className="truncate font-semibold text-gray-900 dark:text-white">
              {participant.display_name || participant.email.split('@')[0]}
            </h4>
            {participant.is_team && (
              <span className="flex-shrink-0 rounded-full bg-primary-100 dark:bg-primary-900 px-2 py-0.5 text-xs font-medium text-primary-700 dark:text-primary-300">
                Team
              </span>
            )}
            {participant.is_placeholder && (
              <span className="flex-shrink-0 rounded-full bg-gray-200 dark:bg-gray-700 px-2 py-0.5 text-xs font-medium text-gray-600 dark:text-gray-300">
                Pending Signup
              </span>
            )}
          </div>

          {/* Partner Info for Teams/Doubles/Mixed */}
          {(participant.is_team || participant.category === 'doubles' || participant.category === 'mixed') && participant.partner_name && (
            <div className="mt-1 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <span className="font-medium text-gray-700 dark:text-gray-300">Partner:</span>
              <span>{participant.partner_name}</span>
              {participant.partner_email && (
                <span className="text-xs text-gray-500 dark:text-gray-500">({participant.partner_email})</span>
              )}
            </div>
          )}
          
          {/* Show pending partner message if category is team-based but no partner yet */}
          {(participant.is_team || participant.category === 'doubles' || participant.category === 'mixed') && !participant.partner_name && (
            <div className="mt-1 flex items-center gap-2 text-sm text-orange-600 dark:text-orange-400">
              <span className="text-xs">⚠️ Partner not assigned yet</span>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <span className="truncate">{participant.email}</span>
            <span
              className={`flex-shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${registrationStatusConfig[participant.status].color}`}
            >
              {registrationStatusConfig[participant.status].label}
            </span>
          </div>
          
          {/* Display Division Info: Category, Rating, Gender */}
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {participant.category && (
              <div className="flex items-center gap-1 rounded-lg bg-primary-50 px-3 py-1 text-xs font-medium text-primary-700 dark:bg-primary-900 dark:text-primary-300">
                <span className="font-semibold">Category:</span>
                <span className="capitalize">{participant.category}</span>
              </div>
            )}
            
            {participant.rating && (
              <div className="flex items-center gap-1 rounded-lg bg-accent-50 px-3 py-1 text-xs font-medium text-accent-700 dark:bg-accent-900 dark:text-accent-300">
                <span className="font-semibold">Rating:</span>
                <span>{participant.rating}</span>
              </div>
            )}
            
            {participant.gender && (
              <div className="flex items-center gap-1 rounded-lg bg-secondary-50 px-3 py-1 text-xs font-medium text-secondary-700 dark:bg-secondary-900 dark:text-secondary-300">
                <span className="font-semibold">Gender:</span>
                <span className="capitalize">{participant.gender}</span>
              </div>
            )}
          </div>

          {/* Invitation Status */}
          {participant.invitation && StatusIcon && (
            <div className={`mt-1 flex items-center gap-1 text-xs ${statusConfig[inviteStatus!]?.color} dark:opacity-90`}>
              <StatusIcon className="h-3 w-3" />
              <span>
                Invite: {inviteStatus}
                {' • '}
                {new Date(participant.invitation.created_at).toLocaleDateString()}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex flex-shrink-0 items-center gap-2">
        {canEdit && onEdit && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(participant.id)}
            leftIcon={<Edit className="h-4 w-4" />}
            aria-label="Edit participant"
          >
            <span className="hidden sm:inline">Edit</span>
          </Button>
        )}

        {participant.invitation?.status === 'pending' && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleResend}
            disabled={resendInvite.isPending}
            leftIcon={<Mail className="h-4 w-4" />}
            aria-label="Resend invitation"
          >
            <span className="hidden sm:inline">Resend</span>
          </Button>
        )}

        {onRemove && (
          <Button
            variant="danger"
            size="sm"
            onClick={handleRemove}
            disabled={isRemoving}
            leftIcon={<Trash2 className="h-4 w-4" />}
            aria-label="Remove participant"
          >
            <span className="hidden sm:inline">Remove</span>
          </Button>
        )}
      </div>
    </motion.div>
  );
}
