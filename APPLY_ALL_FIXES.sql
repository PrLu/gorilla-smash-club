-- ============================================================================
-- COMPLETE FIX: Format Constraint + Import/Export Settings
-- ============================================================================
-- Run this entire script in your Supabase SQL Editor
-- 
-- This fixes:
-- 1. "tournaments_format_check" constraint error (allows custom categories)
-- 2. Adds import/export settings system
-- 3. Enables multiple category registrations per participant
--
-- HOW TO RUN:
-- 1. Go to Supabase Dashboard → SQL Editor
-- 2. Paste this entire script
-- 3. Click "Run" (bottom right)
-- ============================================================================

-- ============================================================================
-- FIX 1: Remove restrictive format constraint
-- ============================================================================
-- This allows custom categories like "mojo_dojo", "k_db" in addition to 
-- the standard "singles", "doubles", "mixed"

ALTER TABLE public.tournaments
  DROP CONSTRAINT IF EXISTS tournaments_format_check;

SELECT '✅ Fix 1 Applied: Custom categories now allowed in tournaments' as status;

-- ============================================================================
-- FIX 2: Create system_settings table
-- ============================================================================

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

-- Drop existing policies if they exist (for re-run safety)
DROP POLICY IF EXISTS "Admin and root can read settings" ON public.system_settings;
DROP POLICY IF EXISTS "Admin and root can update settings" ON public.system_settings;
DROP POLICY IF EXISTS "Root can insert settings" ON public.system_settings;

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

-- Add updated_at trigger (drop first if exists for re-run safety)
DROP TRIGGER IF EXISTS system_settings_updated_at ON public.system_settings;
DROP FUNCTION IF EXISTS update_system_settings_updated_at();

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

SELECT '✅ Fix 2 Applied: System settings table created with import/export defaults' as status;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Verify format constraint is removed
SELECT 
  CASE 
    WHEN NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints
      WHERE table_name = 'tournaments' 
        AND constraint_name = 'tournaments_format_check'
    )
    THEN '✅ tournaments_format_check constraint successfully removed'
    ELSE '⚠️ tournaments_format_check constraint still exists'
  END as format_constraint_status;

-- Verify system_settings table exists
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_name = 'system_settings'
    )
    THEN '✅ system_settings table exists'
    ELSE '❌ system_settings table NOT created'
  END as settings_table_status;

-- Verify default setting exists
SELECT 
  CASE 
    WHEN setting_key IS NOT NULL THEN '✅ import_export_settings configured: allowMultipleCategoryRegistrations = ' || (setting_value->>'allowMultipleCategoryRegistrations')
    ELSE '❌ import_export_settings NOT found'
  END as setting_status
FROM public.system_settings
WHERE setting_key = 'import_export_settings'
UNION ALL
SELECT '❌ import_export_settings NOT found' as setting_status
WHERE NOT EXISTS (
  SELECT 1 FROM public.system_settings WHERE setting_key = 'import_export_settings'
)
LIMIT 1;

-- ============================================================================
-- FINAL STATUS
-- ============================================================================

SELECT 
  '🎉 ALL FIXES APPLIED SUCCESSFULLY!' as message,
  'You can now:' as next_steps_title,
  '1. Create tournaments with custom categories (mojo_dojo, k_db, etc.)' as step_1,
  '2. Import participants for multiple categories' as step_2,
  '3. Configure import behavior via Settings > Import/Export' as step_3,
  '4. Restart your dev server: npm run dev' as step_4;

