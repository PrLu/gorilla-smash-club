import { AdminNav } from '@/components/AdminNav';

/**
 * Admin section layout
 * Includes sidebar navigation
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <AdminNav />
      <main className="flex-1 bg-gray-50 dark:bg-gray-900">
        {children}
      </main>
    </div>
  );
}

