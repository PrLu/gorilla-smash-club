'use client';

import { Modal, Button, Card, CardContent } from '@/components/ui';
import { Trophy, Download, RefreshCw, CheckCircle, AlertTriangle } from 'lucide-react';

interface DivisionResult {
  division: string;
  participants: number;
  matches: number;
  autoAdvanced: number;
}

interface FixtureGenerationSummaryProps {
  isOpen: boolean;
  onClose: () => void;
  totalMatches: number;
  totalAutoAdvanced: number;
  divisionsCreated: number;
  divisionBreakdown: Record<string, DivisionResult>;
  categories: string[];
  onViewFixtures: () => void;
  onDownloadSummary?: () => void;
}

/**
 * Post-Generation Summary Modal
 * Shows detailed results after multi-category fixture generation
 */
export function FixtureGenerationSummary({
  isOpen,
  onClose,
  totalMatches,
  totalAutoAdvanced,
  divisionsCreated,
  divisionBreakdown,
  categories,
  onViewFixtures,
  onDownloadSummary,
}: FixtureGenerationSummaryProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="🏆 Fixture Generation Complete"
      size="lg"
    >
      <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
        {/* Success Banner */}
        <div className="rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-4">
          <div className="flex gap-3">
            <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400 flex-shrink-0" />
            <div>
              <p className="font-semibold text-green-900 dark:text-green-200">
                All Eligible Categories Processed Successfully!
              </p>
              <p className="text-sm text-green-800 dark:text-green-300 mt-1">
                {totalMatches} total matches created across {divisionsCreated} {divisionsCreated === 1 ? 'category' : 'categories'}
              </p>
            </div>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
              {totalMatches}
            </div>
            <div className="text-xs text-blue-800 dark:text-blue-300 font-medium mt-1">
              Total Matches
            </div>
          </div>
          <div className="text-center p-4 rounded-lg bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800">
            <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
              {divisionsCreated}
            </div>
            <div className="text-xs text-purple-800 dark:text-purple-300 font-medium mt-1">
              Categories
            </div>
          </div>
          <div className="text-center p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
            <div className="text-3xl font-bold text-green-600 dark:text-green-400">
              {totalAutoAdvanced}
            </div>
            <div className="text-xs text-green-800 dark:text-green-300 font-medium mt-1">
              Auto-Advanced (Byes)
            </div>
          </div>
        </div>

        {/* Category Breakdown Table */}
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
            Category Breakdown
          </h3>
          <div className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">
                    Category
                  </th>
                  <th className="px-4 py-2 text-center text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">
                    Participants
                  </th>
                  <th className="px-4 py-2 text-center text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">
                    Matches
                  </th>
                  <th className="px-4 py-2 text-center text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">
                    Byes
                  </th>
                  <th className="px-4 py-2 text-center text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {Object.entries(divisionBreakdown).map(([key, result]) => (
                  <tr key={key} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white capitalize">
                      {result.division}
                    </td>
                    <td className="px-4 py-3 text-sm text-center text-gray-700 dark:text-gray-300">
                      {result.participants}
                    </td>
                    <td className="px-4 py-3 text-sm text-center text-gray-700 dark:text-gray-300">
                      {result.matches}
                    </td>
                    <td className="px-4 py-3 text-sm text-center text-gray-700 dark:text-gray-300">
                      {result.autoAdvanced || 0}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center gap-1 rounded-full bg-green-100 dark:bg-green-900/30 px-2 py-1 text-xs font-medium text-green-700 dark:text-green-300">
                        <CheckCircle className="h-3 w-3" />
                        Success
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          {onDownloadSummary && (
            <Button
              variant="outline"
              leftIcon={<Download className="h-4 w-4" />}
              onClick={onDownloadSummary}
              className="flex-1"
            >
              Download Summary
            </Button>
          )}
          <Button
            variant="primary"
            leftIcon={<Trophy className="h-4 w-4" />}
            onClick={onViewFixtures}
            className="flex-1"
          >
            View Fixtures
          </Button>
        </div>
      </div>
    </Modal>
  );
}


