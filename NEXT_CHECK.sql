-- ============================================================
-- You have 52 registrations - let's see what they are
-- ============================================================

-- Use the SAME tournament ID that gave you 52 registrations

-- 1. What TYPE of registrations?
SELECT 
  '1️⃣ Registration Type' as check_name,
  COUNT(*) as total,
  COUNT(CASE WHEN team_id IS NOT NULL THEN 1 END) as has_team_id,
  COUNT(CASE WHEN player_id IS NOT NULL AND team_id IS NULL THEN 1 END) as player_only
FROM registrations
WHERE tournament_id = 'YOUR_TOURNAMENT_ID';  -- Same ID that gave 52

-- 2. What's in the METADATA field?
SELECT 
  '2️⃣ Metadata Categories' as check_name,
  COALESCE(metadata->>'category', '❌ NO CATEGORY SET') as category,
  COUNT(*) as count
FROM registrations
WHERE tournament_id = 'YOUR_TOURNAMENT_ID'  -- Same ID that gave 52
GROUP BY metadata->>'category'
ORDER BY count DESC;

-- 3. Show me 5 ACTUAL registrations
SELECT 
  '3️⃣ Sample Data' as check_name,
  id,
  player_id IS NOT NULL as has_player,
  team_id IS NOT NULL as has_team,
  metadata,
  metadata->>'category' as category_value
FROM registrations
WHERE tournament_id = 'YOUR_TOURNAMENT_ID'  -- Same ID that gave 52
LIMIT 5;


