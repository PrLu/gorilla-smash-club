'use client';

import Link from 'next/link';
import { MapPin, Calendar, Users as UsersIcon, TrendingUp } from 'lucide-react';
import { Card, CardContent } from '@/components/ui';
import type { Tournament } from '@/lib/hooks/useTournaments';
import { motion } from 'framer-motion';

interface TournamentCardProps {
  tournament: Tournament & { participant_count?: number };
}

/**
 * Rich tournament card with progress indicator and status badges
 * Mobile-first responsive design
 */
export function TournamentCard({ tournament }: TournamentCardProps) {
  const statusConfig = {
    draft: { color: 'bg-gray-100 text-gray-800', label: 'Draft' },
    open: { color: 'bg-success-100 text-success-800', label: 'Open' },
    closed: { color: 'bg-error-100 text-error-800', label: 'Closed' },
    in_progress: { color: 'bg-primary-100 text-primary-800', label: 'In Progress' },
    completed: { color: 'bg-gray-200 text-gray-700', label: 'Completed' },
    cancelled: { color: 'bg-error-100 text-error-800', label: 'Cancelled' },
  };

  const status = statusConfig[tournament.status];

  // Calculate days until tournament
  const daysUntil = Math.ceil(
    (new Date(tournament.start_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  );

  return (
    <Link href={`/tournament/${tournament.id}`} className="group block">
      <motion.div
        whileHover={{ y: -4 }}
        transition={{ duration: 0.2 }}
      >
        <Card variant="default" padding="none" hoverable className="overflow-hidden">
          {/* Status Banner */}
          <div className="flex items-center justify-between bg-gradient-to-r from-primary-50 to-primary-100 px-4 py-2">
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${status.color}`}>
              {status.label}
            </span>
            {daysUntil > 0 && daysUntil < 30 && (
              <span className="text-xs font-medium text-primary-700">
                {daysUntil} day{daysUntil !== 1 ? 's' : ''} away
              </span>
            )}
          </div>

          <CardContent className="p-6">
            {/* Title */}
            <h3 className="mb-3 text-xl font-bold text-gray-900 group-hover:text-primary-600 transition-colors">
              {tournament.title}
            </h3>

            {/* Description */}
            {tournament.description && (
              <p className="mb-4 line-clamp-2 text-sm text-gray-600">{tournament.description}</p>
            )}

            {/* Meta Information */}
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 flex-shrink-0 text-gray-400" />
                <span className="truncate">{tournament.location}</span>
              </div>

              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 flex-shrink-0 text-gray-400" />
                <span>
                  {new Date(tournament.start_date).toLocaleDateString('en-IN', {
                    month: 'short',
                    day: 'numeric',
                  })}
                  {' - '}
                  {new Date(tournament.end_date).toLocaleDateString('en-IN', {
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <UsersIcon className="h-4 w-4 flex-shrink-0 text-gray-400" />
                <span>
                  {tournament.format.charAt(0).toUpperCase() + tournament.format.slice(1)}
                  {tournament.participant_count !== undefined && 
                    ` • ${tournament.participant_count} participant${tournament.participant_count !== 1 ? 's' : ''}`
                  }
                </span>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-4">
              <div className="flex items-center gap-1 text-sm font-semibold text-primary-600">
                <span className="text-lg">₹</span>
                <span>{tournament.entry_fee}</span>
              </div>

              {tournament.max_participants && (
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <TrendingUp className="h-3 w-3" />
                  <span>Max {tournament.max_participants}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </Link>
  );
}
