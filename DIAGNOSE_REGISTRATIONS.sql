-- ============================================================
-- DIAGNOSTIC: Check Registration Metadata Structure
-- Run this to see why only singles is generating
-- ============================================================

-- 1. Check ALL registrations and their metadata
SELECT 
  id,
  player_id IS NOT NULL as has_player,
  team_id IS NOT NULL as has_team,
  metadata,
  metadata->>'category' as category_value,
  status
FROM registrations
-- WHERE tournament_id = 'YOUR_TOURNAMENT_ID'  -- ADD YOUR ID HERE
ORDER BY 
  CASE 
    WHEN metadata->>'category' IS NOT NULL THEN 0
    ELSE 1
  END,
  metadata->>'category';

-- 2. Count registrations by category
SELECT 
  'Category Distribution' as check_type,
  COALESCE(metadata->>'category', 'NO CATEGORY SET') as category,
  COUNT(*) as count,
  COUNT(CASE WHEN team_id IS NOT NULL THEN 1 END) as with_team_id,
  COUNT(CASE WHEN player_id IS NOT NULL THEN 1 END) as with_player_id
FROM registrations
-- WHERE tournament_id = 'YOUR_TOURNAMENT_ID'  -- ADD YOUR ID HERE
GROUP BY metadata->>'category'
ORDER BY count DESC;

-- 3. Check if metadata is NULL or empty
SELECT 
  'Metadata Status' as check_type,
  COUNT(*) as total_registrations,
  COUNT(CASE WHEN metadata IS NULL THEN 1 END) as metadata_is_null,
  COUNT(CASE WHEN metadata->>'category' IS NULL THEN 1 END) as category_is_null,
  COUNT(CASE WHEN metadata->>'category' = '' THEN 1 END) as category_is_empty,
  COUNT(CASE WHEN metadata->>'category' IS NOT NULL AND metadata->>'category' != '' THEN 1 END) as category_is_set
FROM registrations;
-- WHERE tournament_id = 'YOUR_TOURNAMENT_ID'  -- ADD YOUR ID HERE

-- 4. Show sample registrations to understand structure
SELECT 
  'Sample Data' as check_type,
  id,
  player_id,
  team_id,
  metadata,
  status,
  created_at
FROM registrations
-- WHERE tournament_id = 'YOUR_TOURNAMENT_ID'  -- ADD YOUR ID HERE
LIMIT 20;


