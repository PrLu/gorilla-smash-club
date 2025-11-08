import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { useUser } from '@/lib/useUser';
import toast from 'react-hot-toast';

export interface AppearancePreferences {
  id: string;
  profile_id: string;
  custom_logo_url: string | null;
  custom_hero_logo_url: string | null;
  custom_footer_logo_url: string | null;
  primary_font_color: string;
  secondary_font_color: string;
  heading_font_color: string;
  dark_primary_font_color: string;
  dark_secondary_font_color: string;
  dark_heading_font_color: string;
  primary_bg_color: string;
  secondary_bg_color: string;
  dark_primary_bg_color: string;
  dark_secondary_bg_color: string;
  custom_accent_color: string | null;
  custom_primary_color: string | null;
  created_at: string;
  updated_at: string;
}

const DEFAULT_PREFERENCES: Omit<AppearancePreferences, 'id' | 'profile_id' | 'created_at' | 'updated_at'> = {
  custom_logo_url: null,
  custom_hero_logo_url: null,
  custom_footer_logo_url: null,
  primary_font_color: '#111827',
  secondary_font_color: '#4b5563',
  heading_font_color: '#111827',
  dark_primary_font_color: '#f9fafb',
  dark_secondary_font_color: '#d1d5db',
  dark_heading_font_color: '#ffffff',
  primary_bg_color: '#ffffff',
  secondary_bg_color: '#f9fafb',
  dark_primary_bg_color: '#111827',
  dark_secondary_bg_color: '#1f2937',
  custom_accent_color: null,
  custom_primary_color: null,
};

export function useAppearancePreferences() {
  const { user } = useUser();

  return useQuery({
    queryKey: ['appearance-preferences', user?.id],
    queryFn: async () => {
      if (!user) return null;

      const { data, error } = await supabase
        .from('appearance_preferences')
        .select('*')
        .eq('profile_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        // PGRST116 = no rows returned
        console.error('Error fetching appearance preferences:', error);
        throw error;
      }

      // Return default preferences if none exist
      return data || null;
    },
    enabled: !!user,
  });
}

export function useUpdateAppearancePreferences() {
  const queryClient = useQueryClient();
  const { user } = useUser();

  return useMutation({
    mutationFn: async (preferences: Partial<AppearancePreferences>) => {
      if (!user) throw new Error('User not authenticated');

      // Check if preferences exist
      const { data: existing } = await supabase
        .from('appearance_preferences')
        .select('id')
        .eq('profile_id', user.id)
        .single();

      if (existing) {
        // Update existing
        const { data, error } = await supabase
          .from('appearance_preferences')
          .update(preferences)
          .eq('profile_id', user.id)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        // Insert new
        const { data, error } = await supabase
          .from('appearance_preferences')
          .insert({
            profile_id: user.id,
            ...DEFAULT_PREFERENCES,
            ...preferences,
          })
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['appearance-preferences', user?.id] });
      toast.success('Appearance preferences updated!');
      
      // Apply custom styles immediately
      applyCustomStyles(data);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update preferences');
    },
  });
}

export function useUploadLogo() {
  const { user } = useUser();

  return useMutation({
    mutationFn: async (file: File) => {
      if (!user) throw new Error('User not authenticated');

      // Validate file type
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/svg+xml', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        throw new Error('Invalid file type. Please upload a JPG, PNG, SVG, or WebP image.');
      }

      // Validate file size (5MB)
      if (file.size > 5242880) {
        throw new Error('File too large. Maximum size is 5MB.');
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/logo-${Date.now()}.${fileExt}`;

      // Upload to Supabase storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('custom-logos')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('custom-logos')
        .getPublicUrl(fileName);

      return urlData.publicUrl;
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to upload logo');
    },
  });
}

// Apply custom styles to the document root
export function applyCustomStyles(preferences: AppearancePreferences | null) {
  if (!preferences) return;

  const root = document.documentElement;
  
  // Apply light mode colors
  root.style.setProperty('--custom-primary-font', preferences.primary_font_color);
  root.style.setProperty('--custom-secondary-font', preferences.secondary_font_color);
  root.style.setProperty('--custom-heading-font', preferences.heading_font_color);
  root.style.setProperty('--custom-primary-bg', preferences.primary_bg_color);
  root.style.setProperty('--custom-secondary-bg', preferences.secondary_bg_color);
  
  // Apply dark mode colors
  root.style.setProperty('--custom-dark-primary-font', preferences.dark_primary_font_color);
  root.style.setProperty('--custom-dark-secondary-font', preferences.dark_secondary_font_color);
  root.style.setProperty('--custom-dark-heading-font', preferences.dark_heading_font_color);
  root.style.setProperty('--custom-dark-primary-bg', preferences.dark_primary_bg_color);
  root.style.setProperty('--custom-dark-secondary-bg', preferences.dark_secondary_bg_color);
  
  // Apply accent colors if set
  if (preferences.custom_accent_color) {
    root.style.setProperty('--custom-accent', preferences.custom_accent_color);
  }
  if (preferences.custom_primary_color) {
    root.style.setProperty('--custom-primary', preferences.custom_primary_color);
  }
}

// Get effective preferences (with defaults)
export function getEffectivePreferences(preferences: AppearancePreferences | null | undefined): AppearancePreferences {
  if (!preferences) {
    return {
      ...DEFAULT_PREFERENCES,
      id: '',
      profile_id: '',
      created_at: '',
      updated_at: '',
    };
  }
  return preferences;
}

