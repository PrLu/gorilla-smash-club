import Link from 'next/link';
import { MapPin, Calendar } from 'lucide-react';
import type { Tournament } from '@/lib/hooks/useTournaments';

interface TournamentCardProps {
  tournament: Tournament;
}

export function TournamentCard({ tournament }: TournamentCardProps) {
  const statusColors = {
    draft: 'bg-gray-100 text-gray-800',
    open: 'bg-green-100 text-green-800',
    closed: 'bg-red-100 text-red-800',
    in_progress: 'bg-blue-100 text-blue-800',
    completed: 'bg-gray-100 text-gray-800',
    cancelled: 'bg-red-100 text-red-800',
  };

  return (
    <Link
      href={`/tournament/${tournament.id}`}
      className="block rounded-lg bg-white p-6 shadow transition-shadow hover:shadow-lg"
    >
      <div className="mb-4">
        <h3 className="mb-2 text-xl font-semibold text-gray-900">{tournament.title}</h3>
        <p className="line-clamp-2 text-sm text-gray-600">
          {tournament.description || 'No description'}
        </p>
      </div>

      <div className="space-y-2 text-sm text-gray-500">
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4" />
          <span>{tournament.location}</span>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          <span>
            {new Date(tournament.start_date).toLocaleDateString()} -{' '}
            {new Date(tournament.end_date).toLocaleDateString()}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-base">₹</span>
          <span>{tournament.entry_fee}</span>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <span className="text-xs font-medium uppercase text-gray-600">{tournament.format}</span>
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${statusColors[tournament.status]}`}
        >
          {tournament.status.replace('_', ' ')}
        </span>
      </div>
    </Link>
  );
}
