'use client';

import { useEffect } from 'react';
import { useAppearancePreferences, applyCustomStyles } from '@/lib/hooks/useAppearancePreferences';

/**
 * Appearance Provider
 * Applies custom colors and styles globally based on user preferences
 */
export function AppearanceProvider({ children }: { children: React.ReactNode }) {
  const { data: preferences } = useAppearancePreferences();

  useEffect(() => {
    if (preferences) {
      applyCustomStyles(preferences);
    }
  }, [preferences]);

  return <>{children}</>;
}

