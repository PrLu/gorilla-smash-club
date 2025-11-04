'use client';

import { useResendInvite } from '@/lib/hooks/useResendInvite';
import { Mail, Trash2, CheckCircle, Clock, XCircle, User } from 'lucide-react';
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
}

/**
 * Polished participant row with inline actions
 * Shows invitation status, avatar, and management controls
 */
export function ParticipantRow({ participant, onRemove }: ParticipantRowProps) {
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

  const handleRemove = () => {
    if (window.confirm(`Remove ${participant.display_name || participant.email}?`)) {
      setIsRemoving(true);
      onRemove?.(participant.id);
    }
  };

  const statusConfig = {
    pending: { icon: Clock, color: 'text-warning-600', bg: 'bg-warning-100' },
    accepted: { icon: CheckCircle, color: 'text-success-600', bg: 'bg-success-100' },
    expired: { icon: XCircle, color: 'text-error-600', bg: 'bg-error-100' },
    rejected: { icon: XCircle, color: 'text-error-600', bg: 'bg-error-100' },
  };

  const registrationStatusConfig = {
    pending: { label: 'Pending', color: 'bg-warning-100 text-warning-800' },
    confirmed: { label: 'Confirmed', color: 'bg-success-100 text-success-800' },
    cancelled: { label: 'Cancelled', color: 'bg-error-100 text-error-800' },
  };

  const inviteStatus = participant.invitation?.status;
  const StatusIcon = inviteStatus ? statusConfig[inviteStatus]?.icon : null;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -100 }}
      className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
    >
      {/* Left: Avatar + Info */}
      <div className="flex items-center gap-4">
        {/* Avatar */}
        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-primary-100 text-primary-700">
          <User className="h-6 w-6" />
        </div>

        {/* Info */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h4 className="truncate font-semibold text-gray-900">
              {participant.display_name || participant.email.split('@')[0]}
            </h4>
            {participant.is_team && (
              <span className="flex-shrink-0 rounded-full bg-primary-100 px-2 py-0.5 text-xs font-medium text-primary-700">
                Team
              </span>
            )}
            {participant.is_placeholder && (
              <span className="flex-shrink-0 rounded-full bg-gray-200 px-2 py-0.5 text-xs font-medium text-gray-600">
                Pending Signup
              </span>
            )}
          </div>

          {/* Partner Info for Teams */}
          {participant.is_team && participant.partner_name && (
            <div className="mt-1 text-sm text-gray-600">
              Partner: {participant.partner_name}
              {participant.partner_email && ` (${participant.partner_email})`}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2 text-sm text-gray-500">
            <span className="truncate">{participant.email}</span>
            <span
              className={`flex-shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${registrationStatusConfig[participant.status].color}`}
            >
              {registrationStatusConfig[participant.status].label}
            </span>
          </div>
          
          {/* Display rating and gender if available */}
          {(participant.rating || participant.gender) && (
            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-500">
              {participant.rating && (
                <span className="rounded bg-gray-100 px-2 py-0.5">
                  Rating: {participant.rating}
                </span>
              )}
              {participant.gender && (
                <span className="rounded bg-gray-100 px-2 py-0.5">
                  {participant.gender}
                </span>
              )}
            </div>
          )}

          {/* Invitation Status */}
          {participant.invitation && StatusIcon && (
            <div className={`mt-1 flex items-center gap-1 text-xs ${statusConfig[inviteStatus!]?.color}`}>
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
