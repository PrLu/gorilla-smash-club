'use client';

import { Card, CardHeader, CardTitle, CardContent, Button } from '@/components/ui';
import { Trophy, Users, DollarSign, TrendingUp, Activity, Download } from 'lucide-react';
import Link from 'next/link';

/**
 * Admin Dashboard
 * Overview of platform statistics and quick actions
 */
export default function AdminDashboardPage() {
  // In production, fetch real data from API
  const stats = {
    totalTournaments: 0,
    activeTournaments: 0,
    totalPlayers: 0,
    pendingPayouts: 0,
    totalRevenue: 0,
    recentActivity: 0,
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-gray-900 dark:text-white">
          Admin Dashboard
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Platform overview and management tools
        </p>
      </div>

      {/* Stats Grid */}
      <div className="mb-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="Total Tournaments"
          value={stats.totalTournaments}
          icon={<Trophy className="h-8 w-8" />}
          color="text-primary-600"
          bgColor="bg-primary-100"
        />

        <StatCard
          title="Active Tournaments"
          value={stats.activeTournaments}
          icon={<Activity className="h-8 w-8" />}
          color="text-success-600"
          bgColor="bg-success-100"
        />

        <StatCard
          title="Total Players"
          value={stats.totalPlayers}
          icon={<Users className="h-8 w-8" />}
          color="text-secondary-600"
          bgColor="bg-secondary-100"
        />

        <StatCard
          title="Pending Payouts"
          value={stats.pendingPayouts}
          icon={<DollarSign className="h-8 w-8" />}
          color="text-warning-600"
          bgColor="bg-warning-100"
          subtitle="Requires attention"
        />

        <StatCard
          title="Total Revenue"
          value={`₹${stats.totalRevenue.toLocaleString()}`}
          icon={<TrendingUp className="h-8 w-8" />}
          color="text-highlight-600"
          bgColor="bg-highlight-100"
        />

        <StatCard
          title="Recent Activity"
          value={stats.recentActivity}
          icon={<Activity className="h-8 w-8" />}
          color="text-gray-600"
          bgColor="bg-gray-100"
          subtitle="Last 24 hours"
        />
      </div>

      {/* Quick Actions */}
      <div className="mb-8 grid gap-6 md:grid-cols-2">
        <Card padding="lg">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Link href="/admin/audit-logs">
                <Button variant="outline" className="w-full justify-start" leftIcon={<Activity className="h-5 w-5" />}>
                  View Audit Logs
                </Button>
              </Link>

              <Link href="/admin/reports">
                <Button variant="outline" className="w-full justify-start" leftIcon={<Download className="h-5 w-5" />}>
                  Export Reports
                </Button>
              </Link>

              <Link href="/admin/roles">
                <Button variant="outline" className="w-full justify-start" leftIcon={<Users className="h-5 w-5" />}>
                  Manage Roles
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card padding="lg">
          <CardHeader>
            <CardTitle>Platform Health</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Database Status</span>
                <span className="rounded-full bg-success-100 px-3 py-1 text-xs font-semibold text-success-700">
                  Healthy
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">API Response Time</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">~120ms</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Uptime</span>
                <span className="text-sm font-medium text-success-600">99.9%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
  color,
  bgColor,
  subtitle,
}: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  subtitle?: string;
}) {
  return (
    <Card padding="lg">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400">{title}</p>
          <p className="mt-2 font-display text-3xl font-bold text-gray-900 dark:text-white">
            {value}
          </p>
          {subtitle && (
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-500">{subtitle}</p>
          )}
        </div>
        <div className={`rounded-xl ${bgColor} p-3 ${color}`}>{icon}</div>
      </div>
    </Card>
  );
}

