'use client';

import { useParams } from 'next/navigation';
import { Card, CardTitle, CardContent, Button } from '@/components/ui';
import { useTournamentRegistrations } from '@/lib/hooks/useTournament';
import { ArrowLeft, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

/**
 * Debug page to check category distribution
 * Helps diagnose why categories aren't being detected properly
 */
export default function DebugCategoriesPage() {
  const params = useParams();
  const tournamentId = params?.id as string;
  const { data: registrations, isLoading } = useTournamentRegistrations(tournamentId);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
        <div className="container mx-auto max-w-4xl">
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  // Group by category
  const categoryMap: Record<string, any[]> = {};
  const registrationsWithoutCategory: any[] = [];

  registrations?.forEach((reg) => {
    const category = reg.metadata?.category;
    
    if (category) {
      if (!categoryMap[category]) {
        categoryMap[category] = [];
      }
      categoryMap[category].push(reg);
    } else {
      registrationsWithoutCategory.push(reg);
    }
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="container mx-auto max-w-4xl">
        <Link
          href={`/tournament/${tournamentId}`}
          className="mb-6 inline-flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Tournament
        </Link>

        <h1 className="font-display text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Category Distribution Debug
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          Diagnostic view showing how registrations are distributed across categories
        </p>

        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <Card padding="lg">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                {registrations?.length || 0}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Total Registrations</div>
            </div>
          </Card>
          <Card padding="lg">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                {Object.keys(categoryMap).length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Categories Found</div>
            </div>
          </Card>
          <Card padding="lg">
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">
                {registrationsWithoutCategory.length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Missing Category</div>
            </div>
          </Card>
        </div>

        {/* Categories Breakdown */}
        {Object.keys(categoryMap).length > 0 && (
          <Card className="mb-6" padding="lg">
            <CardTitle>Categories Detected</CardTitle>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(categoryMap).map(([category, regs]) => (
                  <div key={category} className="rounded-lg bg-gray-50 dark:bg-gray-800 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white capitalize">
                          {category}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {regs.length} {regs.length === 1 ? 'registration' : 'registrations'}
                        </p>
                      </div>
                      {regs.length >= 2 ? (
                        <span className="rounded-full bg-green-100 dark:bg-green-900/30 px-3 py-1 text-xs font-medium text-green-700 dark:text-green-300">
                          ✓ Can Generate
                        </span>
                      ) : (
                        <span className="rounded-full bg-orange-100 dark:bg-orange-900/30 px-3 py-1 text-xs font-medium text-orange-700 dark:text-orange-300">
                          ⚠ Need More
                        </span>
                      )}
                    </div>
                    <div className="space-y-1">
                      {regs.map((reg, idx) => (
                        <div key={reg.id} className="text-sm text-gray-700 dark:text-gray-300">
                          {idx + 1}. {reg.player ? `${reg.player.first_name} ${reg.player.last_name}` : reg.team?.name || 'Unknown'}
                          {' '}
                          <span className="text-xs text-gray-500">
                            ({reg.status})
                            {reg.metadata?.rating && ` • ${reg.metadata.rating}`}
                            {reg.metadata?.gender && ` • ${reg.metadata.gender}`}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Registrations Without Category */}
        {registrationsWithoutCategory.length > 0 && (
          <Card className="mb-6" padding="lg">
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              Registrations Missing Category Data
            </CardTitle>
            <CardContent>
              <p className="text-sm text-orange-800 dark:text-orange-300 mb-4">
                These registrations don't have category information in their metadata. 
                They won't be included in automatic fixture generation.
              </p>
              <div className="space-y-2">
                {registrationsWithoutCategory.map((reg) => (
                  <div key={reg.id} className="rounded-lg bg-orange-50 dark:bg-orange-900/10 border border-orange-200 dark:border-orange-800 p-3">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {reg.player ? `${reg.player.first_name} ${reg.player.last_name}` : reg.team?.name || 'Unknown'}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      Status: {reg.status} • Metadata: {JSON.stringify(reg.metadata || {})}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-3">
                <p className="text-xs text-blue-800 dark:text-blue-200">
                  <strong>Fix:</strong> Ensure participants select their category when registering. 
                  The category field must be filled in the registration metadata.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* No Registrations */}
        {!registrations || registrations.length === 0 && (
          <Card padding="lg">
            <CardContent>
              <p className="text-center text-gray-600 dark:text-gray-400">
                No registrations found for this tournament.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Raw Data View */}
        <Card padding="lg">
          <CardTitle>Raw Registration Data</CardTitle>
          <CardContent>
            <div className="max-h-96 overflow-auto">
              <pre className="text-xs text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                {JSON.stringify(registrations, null, 2)}
              </pre>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

