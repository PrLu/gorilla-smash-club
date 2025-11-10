-- ============================================================
-- CHECK: Why UI Only Shows Singles
-- ============================================================

-- Check what categories are in the matches
SELECT 
  '1️⃣ Matches by Category' as check_type,
  court as category_in_court_field,
  match_type,
  COUNT(*) as match_count
FROM matches
WHERE tournament_id = '54e0c9bc-d14a-42a6-bfd6-51d97185aede'
GROUP BY court, match_type
ORDER BY court;

-- Check pools by category
SELECT 
  '2️⃣ Pools by Category' as check_type,
  category,
  COUNT(*) as pool_count
FROM pools
WHERE tournament_id = '54e0c9bc-d14a-42a6-bfd6-51d97185aede'
GROUP BY category
ORDER BY category;

-- Sample of matches to see structure
SELECT 
  '3️⃣ Sample Matches' as check_type,
  id,
  court,
  match_type,
  pool_id IS NOT NULL as has_pool,
  player1_id IS NOT NULL as has_player1,
  team1_id IS NOT NULL as has_team1
FROM matches
WHERE tournament_id = '54e0c9bc-d14a-42a6-bfd6-51d97185aede'
LIMIT 10;


