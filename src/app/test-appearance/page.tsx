'use client';

import { Card, CardTitle, CardContent } from '@/components/ui';
import { useAppearancePreferences } from '@/lib/hooks/useAppearancePreferences';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

/**
 * Test page to verify appearance customization is working
 */
export default function TestAppearancePage() {
  const { data: preferences } = useAppearancePreferences();

  return (
    <div className="min-h-screen p-8">
      <div className="container mx-auto max-w-4xl">
        <Link
          href="/settings/appearance"
          className="mb-6 inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Appearance Settings
        </Link>

        <h1 className="font-display text-4xl font-bold mb-2">
          Appearance Test Page
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          This page demonstrates your custom appearance settings in action
        </p>

        <div className="space-y-6">
          {/* Current Settings Display */}
          <Card padding="lg">
            <CardTitle>Current Custom Colors</CardTitle>
            <CardContent>
              {preferences ? (
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <h3 className="font-semibold text-sm mb-2">Light Mode</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <div
                          className="h-6 w-6 rounded border"
                          style={{ backgroundColor: preferences.primary_font_color }}
                        />
                        <span>Primary Font: {preferences.primary_font_color}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div
                          className="h-6 w-6 rounded border"
                          style={{ backgroundColor: preferences.secondary_font_color }}
                        />
                        <span>Secondary Font: {preferences.secondary_font_color}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div
                          className="h-6 w-6 rounded border"
                          style={{ backgroundColor: preferences.primary_bg_color }}
                        />
                        <span>Primary BG: {preferences.primary_bg_color}</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm mb-2">Dark Mode</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <div
                          className="h-6 w-6 rounded border"
                          style={{ backgroundColor: preferences.dark_primary_font_color }}
                        />
                        <span>Primary Font: {preferences.dark_primary_font_color}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div
                          className="h-6 w-6 rounded border"
                          style={{ backgroundColor: preferences.dark_secondary_font_color }}
                        />
                        <span>Secondary Font: {preferences.dark_secondary_font_color}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div
                          className="h-6 w-6 rounded border"
                          style={{ backgroundColor: preferences.dark_primary_bg_color }}
                        />
                        <span>Primary BG: {preferences.dark_primary_bg_color}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500">Loading preferences...</p>
              )}
            </CardContent>
          </Card>

          {/* Sample Content */}
          <Card padding="lg">
            <CardTitle>Sample Content</CardTitle>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h2 className="font-display text-2xl font-bold mb-2">
                    This is a Heading (using custom heading color)
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400">
                    This is secondary text that should use your custom secondary font color.
                    It provides additional information and context.
                  </p>
                </div>

                <div>
                  <h3 className="font-display text-xl font-semibold mb-2">
                    Another Heading
                  </h3>
                  <p className="text-gray-900 dark:text-white mb-2">
                    This is primary text using your custom primary font color.
                    It's the main content color throughout your site.
                  </p>
                  <p className="text-gray-600 dark:text-gray-400">
                    And here's more secondary descriptive text in your custom secondary color.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Instructions */}
          <Card padding="lg" className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 no-custom">
            <CardContent>
              <h3 className="font-semibold mb-2 text-blue-900 dark:text-blue-100 no-custom">
                💡 How to Test
              </h3>
              <ol className="list-decimal list-inside space-y-1 text-sm text-blue-800 dark:text-blue-200 no-custom">
                <li>Go to Appearance Settings and change colors</li>
                <li>Save your changes</li>
                <li>Return to this page (or refresh)</li>
                <li>The headings and text above should reflect your chosen colors</li>
                <li>Toggle dark/light mode to see both themes</li>
              </ol>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

