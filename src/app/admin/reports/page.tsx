'use client';

import { useState } from 'react';
import { Card, Button, Input } from '@/components/ui';
import { Download, FileText, Calendar } from 'lucide-react';
import { exportTournamentData } from '@/lib/hooks/useReports';
import toast from 'react-hot-toast';

/**
 * Reports Page
 * Export tournament data and view analytics
 * Requires admin or organizer access
 */
export default function ReportsPage() {
  const [dateRange, setDateRange] = useState({
    start: '',
    end: '',
  });
  const [exporting, setExporting] = useState(false);

  const handleExport = async (scope: 'organizer' | 'admin') => {
    setExporting(true);
    
    try {
      await exportTournamentData({
        format: 'csv',
        scope,
      });
      toast.success('Export downloaded successfully');
    } catch (error) {
      toast.error('Export failed');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-gray-900 dark:text-white">
          Reports & Analytics
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Export data and view tournament analytics
        </p>
      </div>

      {/* Date Range Filter */}
      <Card padding="lg" className="mb-6">
        <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
          Filter by Date Range
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          <Input
            label="Start Date"
            type="date"
            value={dateRange.start}
            onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
            leftIcon={<Calendar className="h-5 w-5" />}
          />
          <Input
            label="End Date"
            type="date"
            value={dateRange.end}
            onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
            leftIcon={<Calendar className="h-5 w-5" />}
          />
        </div>
      </Card>

      {/* Export Options */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card padding="lg">
          <div className="mb-4 flex items-center gap-3">
            <FileText className="h-8 w-8 text-primary-600" />
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">
                My Tournaments Export
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Export your tournaments and participants
              </p>
            </div>
          </div>

          <Button
            variant="primary"
            onClick={() => handleExport('organizer')}
            disabled={exporting}
            leftIcon={<Download className="h-5 w-5" />}
            className="w-full"
          >
            {exporting ? 'Exporting...' : 'Export My Data'}
          </Button>
        </Card>

        <Card padding="lg">
          <div className="mb-4 flex items-center gap-3">
            <FileText className="h-8 w-8 text-highlight-600" />
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">
                Platform-wide Export (Admin)
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Export all tournament data
              </p>
            </div>
          </div>

          <Button
            variant="outline"
            onClick={() => handleExport('admin')}
            disabled={exporting}
            leftIcon={<Download className="h-5 w-5" />}
            className="w-full"
          >
            {exporting ? 'Exporting...' : 'Export All Data (Admin)'}
          </Button>

          <p className="mt-2 text-xs text-gray-500 dark:text-gray-500">
            Requires admin access
          </p>
        </Card>
      </div>

      {/* Export Format Info */}
      <Card padding="lg" className="mt-6">
        <h3 className="mb-3 font-semibold text-gray-900 dark:text-white">
          Export Format
        </h3>
        <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
          <p>CSV files include:</p>
          <ul className="ml-6 list-disc space-y-1">
            <li>Tournament details (title, dates, location, status)</li>
            <li>Participant information (names, ratings, gender)</li>
            <li>Registration status and payment details</li>
            <li>Match results and scores</li>
            <li>Financial data (entry fees, payment methods)</li>
          </ul>
        </div>
      </Card>
    </div>
  );
}

