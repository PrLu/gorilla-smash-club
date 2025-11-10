-- Comprehensive fix for custom categories
-- This script:
-- 1. Checks what categories are in use
-- 2. Adds missing categories to the categories table
-- 3. Ensures all team-based categories are properly flagged

-- ========================================
-- STEP 1: View current categories
-- ========================================
SELECT 
  'Current categories in database:' as info,
  name, 
  display_name, 
  is_team_based
FROM public.categories
ORDER BY sort_order;

-- ========================================
-- STEP 2: View categories in use
-- ========================================
SELECT 
  'Categories used in registrations:' as info,
  metadata->>'category' as category_name,
  COUNT(*) as registration_count
FROM public.registrations
WHERE metadata->>'category' IS NOT NULL
GROUP BY metadata->>'category'
ORDER BY category_name;

-- ========================================
-- STEP 3: Add missing categories
-- ========================================
-- This handles both naming conventions:
-- - With special characters (doubles & k_db)
-- - With underscores (doubles_and_k_db)

-- Add categories with special characters (as used in registrations)
INSERT INTO public.categories (name, display_name, description, is_team_based, is_active, sort_order) VALUES
  ('mojo_dojo', 'Mojo Dojo', 'Mojo Dojo team competition', true, true, 4),
  ('k_db', 'K_DB', 'K_DB team competition', true, true, 5),
  ('doubles & k_db', 'Doubles & K_DB', 'Combined doubles and K_DB competition', true, true, 6),
  ('doubles_and_k_db', 'Doubles & K_DB', 'Combined doubles and K_DB competition', true, true, 6),
  ('team events', 'Team Events', 'General team events competition', true, true, 7),
  ('team_events', 'Team Events', 'General team events competition', true, true, 7)
ON CONFLICT (name) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  is_team_based = EXCLUDED.is_team_based,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- ========================================
-- STEP 4: Verify the fix
-- ========================================
-- Check if all registration categories now match
SELECT 
  'Verification - Categories match status:' as info,
  r.metadata->>'category' as registration_category,
  c.name as category_in_table,
  c.is_team_based,
  CASE 
    WHEN c.name IS NULL THEN '❌ NOT FOUND'
    WHEN c.is_team_based THEN '✅ TEAM-BASED'
    ELSE '✅ INDIVIDUAL'
  END as status,
  COUNT(*) as registration_count
FROM public.registrations r
LEFT JOIN public.categories c ON r.metadata->>'category' = c.name
WHERE r.metadata->>'category' IS NOT NULL
GROUP BY r.metadata->>'category', c.name, c.is_team_based
ORDER BY registration_category;

-- ========================================
-- STEP 5: Optional - Normalize category names
-- ========================================
-- If you want to use underscores instead of special characters,
-- uncomment and run these updates:

/*
-- Update "doubles & k_db" to "doubles_and_k_db"
UPDATE public.registrations
SET metadata = jsonb_set(
  COALESCE(metadata, '{}'::jsonb),
  '{category}',
  '"doubles_and_k_db"'::jsonb
)
WHERE metadata->>'category' = 'doubles & k_db';

-- Update "team events" to "team_events"
UPDATE public.registrations
SET metadata = jsonb_set(
  COALESCE(metadata, '{}'::jsonb),
  '{category}',
  '"team_events"'::jsonb
)
WHERE metadata->>'category' = 'team events';
*/

-- ========================================
-- FINAL CHECK
-- ========================================
SELECT 
  '✅ All categories now configured:' as info,
  name, 
  display_name, 
  is_team_based,
  is_active
FROM public.categories
WHERE is_active = true
ORDER BY sort_order;


