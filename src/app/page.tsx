'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Trophy, Users, Zap, ArrowRight, Calendar, TrendingUp, Mail } from 'lucide-react';
import { Button, Card, CardContent } from '@/components/ui';
import { motion } from 'framer-motion';

/**
 * Landing page with hero section and feature highlights
 * Mobile-first responsive design with gradient backgrounds
 */
export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-50 via-white to-primary-50 dark:from-primary-950 dark:via-gray-900 dark:to-primary-950">
        <div className="container mx-auto px-4 py-16 md:py-24">
          <div className="mx-auto max-w-4xl text-center">
            {/* Full Logo */}
            <div className="mb-8 flex justify-center">
              <div className="relative h-32 w-full max-w-md md:h-40">
                <Image
                  src="/brand/logo.svg"
                  alt="Gorilla Smash Club - The Beast Mode of Pickleball"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
            </div>

            {/* Badge */}
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-primary-100 px-4 py-2 text-sm font-medium text-primary-700 dark:bg-primary-900 dark:text-primary-300">
              <Trophy className="h-4 w-4" />
              Professional Tournament Management
            </div>

            {/* Headline */}
            <h1 className="mb-6 font-display text-4xl font-bold text-gray-900 dark:text-white md:text-5xl">
              Manage Pickleball Tournaments{' '}
              <span className="bg-gradient-to-r from-primary-600 to-primary-500 bg-clip-text text-transparent dark:from-primary-400 dark:to-primary-300">
                with Ease
              </span>
            </h1>

            {/* Subheadline */}
            <p className="mb-8 text-lg text-gray-600 dark:text-gray-300 md:text-xl">
              Create, organize, and track tournaments with real-time scoreboards, automatic fixtures
              generation, and seamless player management.
            </p>

            {/* CTAs */}
            <div className="flex flex-col justify-center gap-4 sm:flex-row">
              <Button
                variant="primary"
                size="lg"
                rightIcon={<ArrowRight className="h-5 w-5" />}
                onClick={() => (window.location.href = '/dashboard')}
              >
                View Tournaments
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => (window.location.href = '/auth/signin')}
              >
                Get Started Free
              </Button>
            </div>

            {/* Stats */}
            <div className="mt-12 grid grid-cols-3 gap-6 rounded-2xl bg-white/50 p-6 shadow-lg backdrop-blur-sm dark:bg-gray-800/50">
              <div className="text-center">
                <div className="font-display text-3xl font-bold text-primary-600 dark:text-primary-400">100+</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Tournaments</div>
              </div>
              <div className="text-center">
                <div className="font-display text-3xl font-bold text-primary-600 dark:text-primary-400">1K+</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Players</div>
              </div>
              <div className="text-center">
                <div className="font-display text-3xl font-bold text-primary-600 dark:text-primary-400">5K+</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Matches</div>
              </div>
            </div>
          </div>
        </div>

        {/* Decorative Elements */}
        <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-primary-100 opacity-20 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 h-96 w-96 rounded-full bg-primary-200 opacity-20 blur-3xl" />
      </section>

      {/* Features Section */}
      <section className="bg-white py-16 dark:bg-gray-800 md:py-24">
        <div className="container mx-auto px-4">
          <div className="mx-auto mb-12 max-w-3xl text-center">
            <h2 className="mb-4 font-display text-3xl font-bold text-gray-900 dark:text-white md:text-4xl">
              Everything You Need
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              Powerful features to run professional pickleball tournaments
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            <FeatureCard
              icon={<Trophy className="h-10 w-10" />}
              title="Tournament Management"
              description="Create and manage tournaments with custom formats, entry fees, and participant limits."
              color="text-primary-600"
            />

            <FeatureCard
              icon={<Zap className="h-10 w-10" />}
              title="Real-time Updates"
              description="Live scoreboards with instant updates as matches progress. No refresh needed."
              color="text-warning-600"
            />

            <FeatureCard
              icon={<Users className="h-10 w-10" />}
              title="Easy Registration"
              description="Streamlined player and team registration with automated fixtures generation."
              color="text-success-600"
            />

            <FeatureCard
              icon={<Calendar className="h-10 w-10" />}
              title="Smart Scheduling"
              description="Automatic match scheduling across courts with conflict detection."
              color="text-primary-600"
            />

            <FeatureCard
              icon={<TrendingUp className="h-10 w-10" />}
              title="Analytics"
              description="Track tournament progress, player stats, and match outcomes."
              color="text-success-600"
            />

            <FeatureCard
              icon={<Mail className="h-10 w-10" />}
              title="Email Invitations"
              description="Invite participants via email with secure registration links."
              color="text-warning-600"
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-br from-primary-600 to-primary-700 py-16 text-white dark:from-primary-700 dark:to-primary-900">
        <div className="container mx-auto px-4 text-center">
          <h2 className="mb-4 font-display text-3xl font-bold md:text-4xl">Ready to Get Started?</h2>
          <p className="mb-8 text-lg text-primary-100 dark:text-primary-200">
            Join hundreds of organizers managing their tournaments on Gorilla Smash Club
          </p>
          <Button
            variant="secondary"
            size="lg"
            onClick={() => (window.location.href = '/auth/signup')}
            rightIcon={<ArrowRight className="h-5 w-5" />}
          >
            Create Free Account
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white py-8 dark:border-gray-700 dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center gap-4">
            {/* Footer Logo */}
            <div className="relative h-16 w-48">
              <Image
                src="/brand/logo.svg"
                alt="Gorilla Smash Club"
                fill
                className="object-contain"
              />
            </div>
            <p className="text-center text-sm text-gray-600 dark:text-gray-400">
              © 2024 Gorilla Smash Club. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
  color,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  color: string;
}) {
  return (
    <Card variant="bordered" hoverable padding="lg">
      <CardContent className="text-center">
        <div className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-50 dark:bg-gray-700 ${color}`}>
          {icon}
        </div>
        <h3 className="mb-3 font-display text-xl font-semibold text-gray-900 dark:text-white">{title}</h3>
        <p className="text-gray-600 dark:text-gray-300">{description}</p>
      </CardContent>
    </Card>
  );
}
