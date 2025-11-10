-- ============================================================
-- CRITICAL DIAGNOSIS: Find Out What's Wrong
-- Copy ALL results and share with me
-- ============================================================

-- Replace 'YOUR_TOURNAMENT_ID' with your actual ID from the URL
-- Example: If URL is /tournament/abc-123, use 'abc-123'

\set tournament_id 'YOUR_TOURNAMENT_ID'

-- ============================================================
-- 1. Do you have registrations at all?
-- ============================================================
SELECT 
  '1️⃣ REGISTRATION COUNT' as check_name,
  COUNT(*) as total_registrations
FROM registrations
WHERE tournament_id = :'tournament_id';

-- ============================================================
-- 2. What's the structure of your registrations?
-- ============================================================
SELECT 
  '2️⃣ REGISTRATION STRUCTURE' as check_name,
  COUNT(*) as total,
  COUNT(player_id) as with_player_id,
  COUNT(team_id) as with_team_id,
  COUNT(metadata) as with_metadata,
  COUNT(CASE WHEN metadata->>'category' IS NOT NULL THEN 1 END) as with_category
FROM registrations
WHERE tournament_id = :'tournament_id';

-- ============================================================
-- 3. Show me actual metadata values
-- ============================================================
SELECT 
  '3️⃣ METADATA SAMPLES' as check_name,
  id,
  player_id IS NOT NULL as has_player,
  team_id IS NOT NULL as has_team,
  metadata,
  metadata->>'category' as category_value
FROM registrations
WHERE tournament_id = :'tournament_id'
LIMIT 10;

-- ============================================================
-- 4. What categories exist (if any)?
-- ============================================================
SELECT 
  '4️⃣ CURRENT CATEGORIES' as check_name,
  COALESCE(metadata->>'category', '❌ NULL') as category,
  COUNT(*) as count
FROM registrations
WHERE tournament_id = :'tournament_id'
GROUP BY metadata->>'category'
ORDER BY count DESC;

-- ============================================================
-- 5. Show me team names (to identify categories)
-- ============================================================
SELECT 
  '5️⃣ TEAM NAMES' as check_name,
  t.id,
  t.name,
  r.metadata->>'category' as current_category
FROM registrations r
JOIN teams t ON r.team_id = t.id
WHERE r.tournament_id = :'tournament_id'
LIMIT 20;

-- ============================================================
-- 6. What do your teams look like?
-- ============================================================
SELECT 
  '6️⃣ ALL TEAMS IN TOURNAMENT' as check_name,
  t.id as team_id,
  t.name as team_name,
  COUNT(r.id) as registration_count
FROM teams t
LEFT JOIN registrations r ON t.id = r.team_id AND r.tournament_id = :'tournament_id'
WHERE EXISTS (
  SELECT 1 FROM registrations 
  WHERE team_id = t.id 
  AND tournament_id = :'tournament_id'
)
GROUP BY t.id, t.name
ORDER BY t.name;


