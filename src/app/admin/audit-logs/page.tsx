'use client';

import { useState } from 'react';
import { useAuditLogs } from '@/lib/hooks/useAuditLogs';
import { Card, Button, Input, Select, Skeleton } from '@/components/ui';
import { Search, Filter, Download } from 'lucide-react';

/**
 * Audit Logs Page
 * View and filter system audit trail
 * Requires admin or support role
 */
export default function AuditLogsPage() {
  const [filters, setFilters] = useState({
    action: '',
    targetTable: '',
    startDate: '',
    endDate: '',
  });
  const [page, setPage] = useState(0);
  const limit = 50;

  const { data, isLoading, error } = useAuditLogs({
    ...filters,
    limit,
    offset: page * limit,
  });

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-gray-900 dark:text-white">
            Audit Logs
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            System activity trail and compliance records
          </p>
        </div>

        <Button
          variant="outline"
          leftIcon={<Download className="h-5 w-5" />}
          onClick={() => alert('CSV export coming soon')}
        >
          Export
        </Button>
      </div>

      {/* Filters */}
      <Card padding="lg" className="mb-6">
        <div className="grid gap-4 md:grid-cols-4">
          <Select
            label="Action"
            value={filters.action}
            onChange={(e) => setFilters({ ...filters, action: e.target.value })}
            options={[
              { value: '', label: 'All Actions' },
              { value: 'INSERT', label: 'Create' },
              { value: 'UPDATE', label: 'Update' },
              { value: 'DELETE', label: 'Delete' },
            ]}
          />

          <Select
            label="Table"
            value={filters.targetTable}
            onChange={(e) => setFilters({ ...filters, targetTable: e.target.value })}
            options={[
              { value: '', label: 'All Tables' },
              { value: 'tournaments', label: 'Tournaments' },
              { value: 'matches', label: 'Matches' },
              { value: 'registrations', label: 'Registrations' },
              { value: 'user_roles', label: 'User Roles' },
            ]}
          />

          <Input
            label="Start Date"
            type="date"
            value={filters.startDate}
            onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
          />

          <Input
            label="End Date"
            type="date"
            value={filters.endDate}
            onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
          />
        </div>
      </Card>

      {/* Audit Logs Table */}
      <Card padding="none">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-600 dark:text-gray-400">
                  Timestamp
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-600 dark:text-gray-400">
                  Actor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-600 dark:text-gray-400">
                  Action
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-600 dark:text-gray-400">
                  Table
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-600 dark:text-gray-400">
                  Target ID
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4">
                    <Skeleton height={40} />
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-error-600">
                    Error loading audit logs: {error instanceof Error ? error.message : 'Unknown error'}
                  </td>
                </tr>
              ) : data?.data && data.data.length > 0 ? (
                data.data.map((log: any) => (
                  <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                      {log.actor?.full_name || log.actor?.email || 'System'}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          log.action === 'INSERT'
                            ? 'bg-success-100 text-success-800'
                            : log.action === 'UPDATE'
                            ? 'bg-warning-100 text-warning-800'
                            : 'bg-error-100 text-error-800'
                        }`}
                      >
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                      {log.target_table}
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-gray-500">
                      {log.target_id?.substring(0, 8)}...
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-600 dark:text-gray-400">
                    No audit logs found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {data?.count && data.count > limit && (
          <div className="flex items-center justify-between border-t border-gray-200 px-6 py-4 dark:border-gray-700">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Showing {page * limit + 1} to {Math.min((page + 1) * limit, data.count)} of{' '}
              {data.count}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(Math.max(0, page - 1))}
                disabled={page === 0}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page + 1)}
                disabled={(page + 1) * limit >= data.count}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
  color,
  bgColor,
}: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
}) {
  return (
    <Card padding="lg">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400">{title}</p>
          <p className="mt-2 font-display text-3xl font-bold text-gray-900 dark:text-white">
            {value}
          </p>
        </div>
        <div className={`rounded-xl ${bgColor} p-3 ${color}`}>{icon}</div>
      </div>
    </Card>
  );
}

