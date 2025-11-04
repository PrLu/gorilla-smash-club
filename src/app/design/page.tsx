'use client';

import { Button, Input, Select, Card, CardHeader, CardTitle, CardContent, Skeleton, Modal } from '@/components/ui';
import { Search, Mail, User, Plus, Save, Trash2, Moon, Sun } from 'lucide-react';
import Image from 'next/image';
import tokens from '@/styles/tokens.json';
import { useState, useEffect } from 'react';

/**
 * Design System Playground with Brand Integration
 * Shows logo, color tokens (light/dark), typography, and all UI components
 */
export default function DesignPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    if (savedTheme) setTheme(savedTheme);
  }, []);

  const togglePreviewTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
  };

  const colorSets = theme === 'light' ? tokens.colors.light : tokens.colors.dark;

  return (
    <div className="min-h-screen bg-gray-50 p-8 dark:bg-gray-900">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-12 flex items-start justify-between">
          <div>
            <h1 className="mb-2 font-display text-4xl font-bold text-gray-900 dark:text-white">
              Design System
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Gorilla Smash Club Component Library & Brand Assets
            </p>
          </div>

          <Button
            onClick={togglePreviewTheme}
            leftIcon={theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
          >
            {theme === 'light' ? 'Preview Dark' : 'Preview Light'}
          </Button>
        </div>

        {/* Brand Logo Section */}
        <section className="mb-12">
          <h2 className="mb-6 text-2xl font-semibold text-gray-900 dark:text-white">Brand Logo</h2>
          
          <div className="grid gap-6 md:grid-cols-2">
            {/* Full Logo */}
            <Card padding="lg">
              <CardHeader>
                <CardTitle>Full Logo</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center rounded-lg bg-primary-700 p-8 dark:bg-gray-800">
                  <div className="relative h-24 w-full">
                    <Image
                      src="/brand/logo.svg"
                      alt="Gorilla Smash Club - The Beast Mode of Pickleball"
                      fill
                      className="object-contain"
                      priority
                    />
                  </div>
                </div>
                <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
                  Use for: Headers, marketing, print materials
                </p>
              </CardContent>
            </Card>

            {/* Logo Mark */}
            <Card padding="lg">
              <CardHeader>
                <CardTitle>Logo Mark</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center rounded-lg bg-white p-8 dark:bg-gray-800">
                  <Image
                    src="/brand/logo-mark.svg"
                    alt="Gorilla Smash Club"
                    width={120}
                    height={120}
                  />
                </div>
                <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
                  Use for: Favicons, app icons, avatars
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Color Tokens */}
        <section className="mb-12">
          <h2 className="mb-6 text-2xl font-semibold text-gray-900 dark:text-white">
            Color Palette {theme === 'dark' && '(Dark Mode)'}
          </h2>
          
          <div className="space-y-6">
            {Object.entries(colorSets)
              .filter(([key]) => !['surface', 'background', 'text', 'muted'].includes(key))
              .map(([name, shades]) => (
                <div key={name}>
                  <h3 className="mb-3 font-display text-lg font-medium capitalize text-gray-700 dark:text-gray-300">
                    {name}
                  </h3>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-5 md:grid-cols-10">
                    {typeof shades === 'object' && Object.entries(shades).map(([shade, color]) => (
                      <div key={shade} className="text-center">
                        <div
                          className="mb-2 h-16 w-full rounded-lg shadow"
                          style={{ backgroundColor: color as string }}
                        />
                        <p className="text-xs text-gray-600 dark:text-gray-400">{shade}</p>
                        <p className="text-xs font-mono text-gray-400 dark:text-gray-500">
                          {(color as string).substring(0, 7)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
          </div>
        </section>

        {/* Typography */}
        <section className="mb-12">
          <h2 className="mb-6 text-2xl font-semibold text-gray-900 dark:text-white">Typography</h2>
          <div className="space-y-4 rounded-xl bg-white p-6 shadow dark:bg-gray-800">
            <div className="font-display text-5xl font-bold text-gray-900 dark:text-white">
              Display Font (Poppins)
            </div>
            <div className="text-5xl font-bold text-gray-900 dark:text-white">Heading 1</div>
            <div className="text-4xl font-bold text-gray-900 dark:text-white">Heading 2</div>
            <div className="text-3xl font-semibold text-gray-900 dark:text-white">Heading 3</div>
            <div className="text-2xl font-semibold text-gray-900 dark:text-white">Heading 4</div>
            <div className="text-xl font-medium text-gray-900 dark:text-white">Heading 5</div>
            <div className="text-lg text-gray-700 dark:text-gray-300">Large Text (Inter)</div>
            <div className="text-base text-gray-700 dark:text-gray-300">Body Text</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Small Text</div>
            <div className="text-xs text-gray-500 dark:text-gray-500">Extra Small Text</div>
          </div>
        </section>

        {/* Buttons */}
        <section className="mb-12">
          <h2 className="mb-6 text-2xl font-semibold text-gray-900 dark:text-white">Buttons</h2>
          <div className="space-y-4 rounded-xl bg-white p-6 shadow dark:bg-gray-800">
            <div className="flex flex-wrap gap-4">
              <Button variant="primary">Primary</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="danger">Danger</Button>
            </div>

            <div className="flex flex-wrap gap-4">
              <Button variant="primary" size="sm">Small</Button>
              <Button variant="primary" size="md">Medium</Button>
              <Button variant="primary" size="lg">Large</Button>
            </div>

            <div className="flex flex-wrap gap-4">
              <Button variant="primary" leftIcon={<Plus className="h-4 w-4" />}>
                With Left Icon
              </Button>
              <Button variant="primary" rightIcon={<Save className="h-4 w-4" />}>
                With Right Icon
              </Button>
              <Button variant="primary" isLoading>
                Loading
              </Button>
              <Button variant="primary" disabled>
                Disabled
              </Button>
            </div>
          </div>
        </section>

        {/* Sample Tournament Card with Branding */}
        <section className="mb-12">
          <h2 className="mb-6 text-2xl font-semibold text-gray-900 dark:text-white">
            Brand in Context
          </h2>
          <div className="grid gap-6 md:grid-cols-2">
            {/* Header Preview */}
            <Card padding="lg">
              <CardHeader>
                <CardTitle>Header with Logo</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border-2 border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
                  <div className="flex items-center gap-3">
                    <Image
                      src="/brand/logo-mark.svg"
                      alt="Gorilla Smash Club"
                      width={40}
                      height={40}
                    />
                    <div>
                      <div className="font-display text-lg font-bold text-primary-700 dark:text-primary-400">
                        Gorilla Smash
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        The Beast Mode of Pickleball
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tournament Card */}
            <Card padding="lg">
              <CardHeader>
                <CardTitle>Tournament Card</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg bg-gradient-to-r from-primary-50 to-primary-100 p-3 dark:from-primary-950 dark:to-primary-900">
                  <span className="rounded-full bg-success-100 px-3 py-1 text-xs font-semibold text-success-800 dark:bg-success-900 dark:text-success-200">
                    Open
                  </span>
                </div>
                <div className="mt-3">
                  <h3 className="font-bold text-gray-900 dark:text-white">
                    Summer Championship
                  </h3>
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                    Doubles • 16 participants
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </div>
  );
}
