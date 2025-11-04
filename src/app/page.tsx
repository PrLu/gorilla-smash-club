import Link from 'next/link';
import { Header } from '@/components/Header';
import { Trophy, Users, Zap } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100">
      <Header />

      <main className="container mx-auto px-4 py-16">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="mb-6 text-5xl font-bold text-gray-900 md:text-6xl">
            Manage Pickleball Tournaments with Ease
          </h1>
          <p className="mb-8 text-xl text-gray-600">
            Create, organize, and track tournaments with real-time scoreboards, automatic fixtures
            generation, and player registration.
          </p>

          <div className="flex flex-col justify-center gap-4 sm:flex-row">
            <Link
              href="/dashboard"
              className="rounded-lg bg-primary-600 px-8 py-4 text-lg font-semibold text-white transition-colors hover:bg-primary-700"
            >
              View Tournaments
            </Link>
            <Link
              href="/auth/signin"
              className="rounded-lg border-2 border-primary-600 bg-white px-8 py-4 text-lg font-semibold text-primary-600 transition-colors hover:bg-primary-50"
            >
              Get Started
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="mt-24 grid gap-8 md:grid-cols-3">
          <div className="rounded-lg bg-white p-8 shadow-lg">
            <Trophy className="mb-4 h-12 w-12 text-primary-600" />
            <h3 className="mb-3 text-xl font-semibold">Tournament Management</h3>
            <p className="text-gray-600">
              Create and manage tournaments with custom formats, entry fees, and participant limits.
            </p>
          </div>

          <div className="rounded-lg bg-white p-8 shadow-lg">
            <Zap className="mb-4 h-12 w-12 text-primary-600" />
            <h3 className="mb-3 text-xl font-semibold">Real-time Updates</h3>
            <p className="text-gray-600">
              Live scoreboards with instant updates as matches progress. No refresh needed.
            </p>
          </div>

          <div className="rounded-lg bg-white p-8 shadow-lg">
            <Users className="mb-4 h-12 w-12 text-primary-600" />
            <h3 className="mb-3 text-xl font-semibold">Easy Registration</h3>
            <p className="text-gray-600">
              Streamlined player and team registration with automated fixtures generation.
            </p>
          </div>
        </div>
      </main>

      <footer className="container mx-auto mt-16 border-t border-gray-200 px-4 py-8">
        <p className="text-center text-gray-600">© 2024 Pickle Tourney. All rights reserved.</p>
      </footer>
    </div>
  );
}
