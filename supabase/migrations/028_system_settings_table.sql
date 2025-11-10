-- System Settings Table
-- Migration: 028_system_settings_table.sql
-- Date: 2025-01-09
-- Purpose: Store global system settings for import/export and other configurations

-- Create system_settings table
CREATE TABLE IF NOT EXISTS public.system_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  setting_key TEXT NOT NULL UNIQUE,
  setting_value JSONB NOT NULL,
  description TEXT,
  updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Admin and root can read all settings
CREATE POLICY "Admin and root can read settings"
  ON public.system_settings
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.profile_id = auth.uid()
      AND user_roles.role IN ('admin', 'root')
    )
  );

-- Admin and root can update settings
CREATE POLICY "Admin and root can update settings"
  ON public.system_settings
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.profile_id = auth.uid()
      AND user_roles.role IN ('admin', 'root')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.profile_id = auth.uid()
      AND user_roles.role IN ('admin', 'root')
    )
  );

-- Root can insert settings
CREATE POLICY "Root can insert settings"
  ON public.system_settings
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.profile_id = auth.uid()
      AND user_roles.role = 'root'
    )
  );

-- Insert default import/export settings
INSERT INTO public.system_settings (setting_key, setting_value, description)
VALUES 
  (
    'import_export_settings',
    '{"allowMultipleCategoryRegistrations": true}'::jsonb,
    'Import/Export configuration: Controls whether participants can register for multiple categories in the same tournament'
  )
ON CONFLICT (setting_key) DO NOTHING;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_system_settings_key ON public.system_settings(setting_key);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_system_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER system_settings_updated_at
  BEFORE UPDATE ON public.system_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_system_settings_updated_at();

COMMENT ON TABLE public.system_settings IS 'Global system configuration settings';
COMMENT ON COLUMN public.system_settings.setting_key IS 'Unique identifier for the setting';
COMMENT ON COLUMN public.system_settings.setting_value IS 'JSON value for the setting (flexible structure)';
COMMENT ON COLUMN public.system_settings.description IS 'Human-readable description of what this setting controls';



