'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, FileText, Shield, DollarSign, Activity } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

/**
 * Admin sidebar navigation
 * Responsive: collapses to icons on mobile
 */
export function AdminNav() {
  const pathname = usePathname();

  const links = [
    { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/audit-logs', label: 'Audit Logs', icon: Activity },
    { href: '/admin/reports', label: 'Reports', icon: FileText },
    { href: '/admin/roles', label: 'Roles', icon: Shield },
  ];

  return (
    <nav className="w-64 border-r border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
      <div className="mb-6">
        <h2 className="font-display text-xl font-bold text-gray-900 dark:text-white">
          Admin Panel
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">Platform Management</p>
      </div>

      <ul className="space-y-2">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href;

          return (
            <li key={link.href}>
              <Link
                href={link.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-4 py-2 transition-colors',
                  isActive
                    ? 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300'
                    : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
                )}
              >
                <Icon className="h-5 w-5" />
                <span className="font-medium">{link.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

