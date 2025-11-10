'use client';

import { useParams } from 'next/navigation';
import { useTournamentRegistrations } from '@/lib/hooks/useTournament';
import { Card, Button } from '@/components/ui';
import Link from 'next/link';
import { ArrowLeft, AlertCircle } from 'lucide-react';

/**
 * Quick diagnostic page to check category distribution
 */
export default function CheckCategoriesPage() {
  const params = useParams();
  const tournamentId = params?.id as string;
  const { data: registrations, isLoading } = useTournamentRegistrations(tournamentId);

  if (isLoading) {
    return <div className="p-8">Loading...</div>;
  }

  // Group by category
  const categoryGroups: Record<string, any[]> = {};
  
  registrations?.forEach((reg) => {
    const category = reg.metadata?.category || 'singles';
    if (!categoryGroups[category]) {
      categoryGroups[category] = [];
    }
    categoryGroups[category].push(reg);
  });

  const categories = Object.keys(categoryGroups);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto">
        <Link
          href={`/tournament/${tournamentId}`}
          className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Tournament
        </Link>

        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
          Category Distribution Check
        </h1>

        {/* Summary */}
        <Card padding="lg" className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Summary
          </h2>
          <div className="space-y-2">
            <p className="text-gray-700 dark:text-gray-300">
              <strong>Total Registrations:</strong> {registrations?.length || 0}
            </p>
            <p className="text-gray-700 dark:text-gray-300">
              <strong>Categories Found:</strong> {categories.length}
            </p>
            <p className="text-gray-700 dark:text-gray-300">
              <strong>Category List:</strong> {categories.join(', ')}
            </p>
          </div>
        </Card>

        {/* Alert if only one category */}
        {categories.length === 1 && registrations && registrations.length > 5 && (
          <div className="mb-6 rounded-lg bg-orange-50 dark:bg-orange-900/20 border-2 border-orange-300 dark:border-orange-700 p-4">
            <div className="flex gap-3">
              <AlertCircle className="h-6 w-6 text-orange-600 dark:text-orange-400 flex-shrink-0" />
              <div>
                <p className="font-bold text-orange-900 dark:text-orange-200 text-lg">
                  ⚠️ Only One Category Found!
                </p>
                <p className="text-sm text-orange-800 dark:text-orange-300 mt-1">
                  All {registrations.length} registrations are in "{categories[0]}" category.
                  If you expected multiple categories (singles, doubles, mixed), the category metadata is not set correctly.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Per Category Breakdown */}
        <div className="space-y-4">
          {categories.map((category) => {
            const regs = categoryGroups[category];
            const hasValidIds = regs.filter(r => r.player?.id || r.team?.id).length;

            return (
              <Card key={category} padding="lg">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white capitalize">
                    {category}
                  </h3>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {regs.length} registrations
                    </span>
                    <span className={`text-sm font-semibold ${
                      hasValidIds >= 2 
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-orange-600 dark:text-orange-400'
                    }`}>
                      {hasValidIds >= 2 ? '✓ Can Generate' : '⚠ Need More'}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  {regs.map((reg, idx) => (
                    <div key={reg.id} className="text-sm p-2 rounded bg-gray-50 dark:bg-gray-800">
                      <span className="font-medium text-gray-900 dark:text-white">
                        {idx + 1}. {reg.player ? `${reg.player.first_name} ${reg.player.last_name}` : reg.team?.name || 'Unknown'}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                        ({reg.status})
                        {reg.player?.id && ` • Player ID: ${reg.player.id.substring(0, 8)}...`}
                        {reg.team?.id && ` • Team ID: ${reg.team.id.substring(0, 8)}...`}
                      </span>
                    </div>
                  ))}
                </div>
              </Card>
            );
          })}
        </div>

        {/* Instructions */}
        <Card padding="lg" className="mt-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
          <h3 className="font-semibold text-blue-900 dark:text-blue-300 mb-3">
            💡 What This Means
          </h3>
          <div className="text-sm text-blue-800 dark:text-blue-200 space-y-2">
            <p>
              <strong>If you see multiple categories above:</strong> Pool generation should work for all of them.
            </p>
            <p>
              <strong>If you only see "singles":</strong> Your registrations' metadata doesn't have proper category values. 
              Check the CSV import or manual add forms to ensure category is being saved correctly.
            </p>
            <p>
              <strong>Next step:</strong> If only singles shows but you have doubles/mixed participants, 
              you need to update the registration metadata to set the correct category.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}





