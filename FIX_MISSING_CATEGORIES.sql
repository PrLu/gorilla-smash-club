-- ============================================================
-- COMPREHENSIVE FIX: Auto-Assign Categories to Registrations
-- This will fix registrations that don't have metadata.category set
-- ============================================================

-- STEP 1: DIAGNOSE - See current state
-- ============================================================

SELECT 
  '=== CURRENT STATE ===' as step,
  COUNT(*) as total_registrations,
  COUNT(CASE WHEN metadata IS NULL THEN 1 END) as null_metadata,
  COUNT(CASE WHEN metadata->>'category' IS NULL THEN 1 END) as null_category,
  COUNT(CASE WHEN metadata->>'category' IS NOT NULL THEN 1 END) as has_category,
  COUNT(CASE WHEN team_id IS NOT NULL THEN 1 END) as has_team_id,
  COUNT(CASE WHEN player_id IS NOT NULL THEN 1 END) as has_player_id
FROM registrations;
-- Add: WHERE tournament_id = 'YOUR_TOURNAMENT_ID' if you have multiple tournaments

-- Show breakdown by what category they have (if any)
SELECT 
  '=== CATEGORY BREAKDOWN ===' as step,
  COALESCE(metadata->>'category', 'NULL/MISSING') as category,
  COUNT(*) as count,
  COUNT(CASE WHEN team_id IS NOT NULL THEN 1 END) as has_team_id,
  COUNT(CASE WHEN player_id IS NOT NULL THEN 1 END) as has_player_id
FROM registrations
-- WHERE tournament_id = 'YOUR_TOURNAMENT_ID'
GROUP BY metadata->>'category'
ORDER BY count DESC;

-- ============================================================
-- STEP 2: FIX - Auto-assign categories based on structure
-- ============================================================

-- OPTION A: Simple Fix - Assign 'singles' or 'doubles' based on team_id
-- ------------------------------------------------------------
-- This works if you just have basic singles/doubles

-- For registrations with team_id (team-based) → assign 'doubles'
UPDATE registrations
SET metadata = jsonb_set(
  COALESCE(metadata, '{}'::jsonb),
  '{category}',
  '"doubles"'::jsonb
)
WHERE team_id IS NOT NULL
AND (metadata IS NULL OR metadata->>'category' IS NULL OR metadata->>'category' = '');
-- Add: AND tournament_id = 'YOUR_TOURNAMENT_ID'

-- For registrations with player_id only (individual) → assign 'singles'
UPDATE registrations
SET metadata = jsonb_set(
  COALESCE(metadata, '{}'::jsonb),
  '{category}',
  '"singles"'::jsonb
)
WHERE player_id IS NOT NULL
AND team_id IS NULL
AND (metadata IS NULL OR metadata->>'category' IS NULL OR metadata->>'category' = '');
-- Add: AND tournament_id = 'YOUR_TOURNAMENT_ID'

-- ============================================================
-- OPTION B: Advanced Fix - Assign specific categories
-- ============================================================
-- If you know which teams belong to which category, use this

-- Example: Assign specific teams to 'mojo_dojo' category
/*
UPDATE registrations
SET metadata = jsonb_set(
  COALESCE(metadata, '{}'::jsonb),
  '{category}',
  '"mojo_dojo"'::jsonb
)
WHERE team_id IN (
  SELECT id FROM teams WHERE name LIKE '%mojo%' OR name LIKE '%dojo%'
);
*/

-- Example: Assign specific teams to 'k_db' category
/*
UPDATE registrations
SET metadata = jsonb_set(
  COALESCE(metadata, '{}'::jsonb),
  '{category}',
  '"k_db"'::jsonb
)
WHERE team_id IN (
  SELECT id FROM teams WHERE name LIKE '%k_db%' OR name LIKE '%KDB%'
);
*/

-- ============================================================
-- STEP 3: VERIFY - Check the fix worked
-- ============================================================

SELECT 
  '=== AFTER FIX ===' as step,
  COUNT(*) as total_registrations,
  COUNT(CASE WHEN metadata->>'category' IS NOT NULL THEN 1 END) as now_has_category,
  COUNT(CASE WHEN metadata->>'category' IS NULL THEN 1 END) as still_missing
FROM registrations;
-- Add: WHERE tournament_id = 'YOUR_TOURNAMENT_ID'

-- Show new breakdown
SELECT 
  '=== NEW CATEGORY BREAKDOWN ===' as step,
  metadata->>'category' as category,
  COUNT(*) as count,
  COUNT(CASE WHEN team_id IS NOT NULL THEN 1 END) as has_team_id,
  COUNT(CASE WHEN player_id IS NOT NULL THEN 1 END) as has_player_id,
  CASE 
    WHEN COUNT(CASE WHEN team_id IS NOT NULL THEN 1 END) > COUNT(*) / 2 
    THEN '👥 TEAM-BASED'
    ELSE '👤 INDIVIDUAL'
  END as predicted_type
FROM registrations
WHERE metadata->>'category' IS NOT NULL
-- AND tournament_id = 'YOUR_TOURNAMENT_ID'
GROUP BY metadata->>'category'
ORDER BY count DESC;

-- ============================================================
-- STEP 4: (OPTIONAL) Add categories to database for display
-- ============================================================

-- This is optional but improves the UI
INSERT INTO categories (name, display_name, description, is_team_based, is_active, sort_order) VALUES
  ('singles', 'Singles', 'Individual player competition', false, true, 1),
  ('doubles', 'Doubles', 'Team of 2 players', true, true, 2),
  ('mojo_dojo', 'Mojo Dojo', 'Mojo Dojo competition', true, true, 3),
  ('k_db', 'K_DB', 'K_DB competition', true, true, 4),
  ('mixed', 'Mixed Doubles', 'Mixed gender teams', true, true, 5)
ON CONFLICT (name) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  is_team_based = EXCLUDED.is_team_based,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- ============================================================
-- READY!
-- ============================================================
-- After running this script:
-- 1. All registrations should have metadata.category set
-- 2. Categories should be correctly assigned based on team/player structure
-- 3. You can now generate fixtures and all categories will be discovered!


