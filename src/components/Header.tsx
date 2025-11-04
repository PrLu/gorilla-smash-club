'use client';

import { useUser } from '@/lib/useUser';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Trophy, User, LogOut } from 'lucide-react';
import toast from 'react-hot-toast';

export function Header() {
  const { user, loading } = useUser();
  const router = useRouter();

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error('Failed to sign out');
    } else {
      toast.success('Signed out successfully');
      router.push('/');
    }
  };

  return (
    <header className="border-b border-gray-200 bg-white shadow-sm">
      <div className="container mx-auto flex items-center justify-between px-4 py-4">
        <Link href="/" className="flex items-center gap-2 text-xl font-bold text-primary-600">
          <Trophy className="h-6 w-6" />
          <span>Pickle Tourney</span>
        </Link>

        <nav className="flex items-center gap-4">
          {loading ? (
            <div className="h-10 w-20 animate-pulse rounded bg-gray-200"></div>
          ) : user ? (
            <>
              <Link
                href="/dashboard"
                className="font-medium text-gray-700 hover:text-primary-600"
              >
                Dashboard
              </Link>
              <Link
                href="/profile"
                className="flex items-center gap-1 font-medium text-gray-700 hover:text-primary-600"
              >
                <User className="h-4 w-4" />
                <span>Profile</span>
              </Link>
              <button
                onClick={handleSignOut}
                className="flex items-center gap-1 rounded bg-gray-200 px-4 py-2 text-gray-700 transition-colors hover:bg-gray-300"
              >
                <LogOut className="h-4 w-4" />
                <span>Sign Out</span>
              </button>
            </>
          ) : (
            <Link
              href="/auth/signin"
              className="rounded bg-primary-600 px-4 py-2 text-white transition-colors hover:bg-primary-700"
            >
              Sign In
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
