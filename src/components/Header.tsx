'use client';

import { useUser } from '@/lib/useUser';
import { useUserRole } from '@/lib/hooks/useUserRole';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { User, LogOut, Menu, X, Moon, Sun, Settings, Database } from 'lucide-react';
import { Button, SkeletonAvatar, Dropdown } from '@/components/ui';
import toast from 'react-hot-toast';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Responsive header with Gorilla Smash Club branding
 * Includes logo, navigation, theme toggle, and mobile menu
 * Supports both light and dark modes
 */
export function Header() {
  const { user, loading } = useUser();
  const { data: userRole } = useUserRole();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [userName, setUserName] = useState<string>('');
  const isAdminOrRoot = userRole === 'admin' || userRole === 'root';

  // Initialize theme from localStorage or system preference
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialTheme = savedTheme || (prefersDark ? 'dark' : 'light');
    
    setTheme(initialTheme);
    document.documentElement.classList.toggle('dark', initialTheme === 'dark');
  }, []);

  // Fetch user's full name from profile
  useEffect(() => {
    const fetchUserName = async () => {
      if (!user) {
        setUserName('');
        return;
      }

      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', user.id)
          .single();

        if (profile?.full_name) {
          setUserName(profile.full_name);
        } else {
          // Fallback to email prefix
          setUserName(user.email?.split('@')[0] || 'User');
        }
      } catch (error) {
        // Fallback to email prefix if profile fetch fails
        setUserName(user.email?.split('@')[0] || 'User');
      }
    };

    fetchUserName();
  }, [user]);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error('Failed to sign out');
    } else {
      toast.success('Signed out successfully');
      router.push('/');
      setMobileMenuOpen(false);
    }
  };

  return (
    <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/95 shadow-sm backdrop-blur-sm dark:border-gray-700 dark:bg-gray-900/95">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3">
            <div className="relative h-10 w-10 flex-shrink-0">
              <Image
                src="/brand/logo-mark.svg"
                alt="Gorilla Smash Club"
                fill
                className="object-contain"
                priority
              />
            </div>
            <div className="hidden sm:block">
              <div className="font-display text-xl font-bold leading-none text-primary-700 dark:text-primary-400">
                Gorilla Smash Club
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                The Beast Mode of Pickleball
              </div>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden items-center gap-6 md:flex">
            <Link
              href="/dashboard"
              className="font-medium text-gray-700 transition-colors hover:text-primary-600 dark:text-gray-300 dark:hover:text-primary-400"
            >
              Tournaments
            </Link>

            {user && (
              <>
                <Link
                  href="/settings/admins"
                  className="font-medium text-gray-700 transition-colors hover:text-primary-600 dark:text-gray-300 dark:hover:text-primary-400"
                >
                  Admins
                </Link>
                <Link
                  href="/settings/participants"
                  className="font-medium text-gray-700 transition-colors hover:text-primary-600 dark:text-gray-300 dark:hover:text-primary-400"
                >
                  Players
                </Link>
              </>
            )}

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="rounded-lg p-2 text-gray-600 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
              aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
              aria-pressed={theme === 'dark'}
            >
              {theme === 'light' ? (
                <Moon className="h-5 w-5" />
              ) : (
                <Sun className="h-5 w-5" />
              )}
            </button>
            
            {loading ? (
              <SkeletonAvatar />
            ) : user ? (
              <Dropdown
                trigger={
                  <div className="flex items-center gap-2 rounded-lg px-3 py-2 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300">
                      <User className="h-5 w-5" />
                    </div>
                    <span className="hidden font-medium text-gray-700 dark:text-gray-300 lg:inline">
                      {userName || user.email?.split('@')[0]}
                    </span>
                  </div>
                }
                items={[
                  {
                    label: 'Profile',
                    icon: <User className="h-4 w-4" />,
                    href: '/profile',
                  },
                  ...(isAdminOrRoot ? [
                    { divider: true },
                    {
                      label: 'Settings',
                      icon: <Settings className="h-4 w-4" />,
                      children: [
                        {
                          label: 'Master Data',
                          icon: <Database className="h-4 w-4" />,
                          href: '/settings/master-data',
                        },
                      ],
                    },
                  ] : []),
                  { divider: true },
                  {
                    label: 'Sign Out',
                    icon: <LogOut className="h-4 w-4" />,
                    onClick: handleSignOut,
                  },
                ]}
              />
            ) : (
              <Button variant="primary" size="sm" onClick={() => router.push('/auth/signin')}>
                Sign In
              </Button>
            )}
          </nav>

          {/* Mobile Menu Button */}
          <div className="flex items-center gap-2 md:hidden">
            <button
              onClick={toggleTheme}
              className="rounded-lg p-2 text-gray-600 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
              aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            >
              {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
            </button>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="rounded-lg p-2 text-gray-700 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
              aria-label="Toggle mobile menu"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.nav
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden border-t border-gray-200 dark:border-gray-700 md:hidden"
            >
              <div className="space-y-2 py-4">
                <Link
                  href="/dashboard"
                  className="block rounded-lg px-4 py-2 font-medium text-gray-700 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Tournaments
                </Link>

                {user ? (
                  <>
                    <Link
                      href="/settings/admins"
                      className="block rounded-lg px-4 py-2 font-medium text-gray-700 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Admins
                    </Link>
                    <Link
                      href="/settings/participants"
                      className="block rounded-lg px-4 py-2 font-medium text-gray-700 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Players
                    </Link>
                    <div className="my-2 border-t border-gray-200 dark:border-gray-700"></div>
                    <Link
                      href="/profile"
                      className="block rounded-lg px-4 py-2 font-medium text-gray-700 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Profile
                    </Link>
                    {isAdminOrRoot && (
                      <>
                        <div className="mt-2 px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400">
                          SETTINGS
                        </div>
                        <Link
                          href="/settings/master-data"
                          className="block rounded-lg px-4 py-2 font-medium text-gray-700 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          Master Data
                        </Link>
                      </>
                    )}
                    <button
                      onClick={handleSignOut}
                      className="block w-full rounded-lg px-4 py-2 text-left font-medium text-gray-700 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                    >
                      Sign Out
                    </button>
                  </>
                ) : (
                  <Link
                    href="/auth/signin"
                    className="block rounded-lg bg-primary-600 px-4 py-2 text-center font-semibold text-white dark:bg-primary-700"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Sign In
                  </Link>
                )}
              </div>
            </motion.nav>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}
