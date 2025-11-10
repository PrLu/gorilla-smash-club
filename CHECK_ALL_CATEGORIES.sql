-- Check if matches exist for all categories
SELECT 
  court,
  match_type,
  COUNT(*) as match_count
FROM matches
WHERE tournament_id = '54e0c9bc-d14a-42a6-bfd6-51d97185aede'
GROUP BY court, match_type
ORDER BY court;

-- Check pools by category
SELECT 
  category,
  name,
  size,
  (SELECT COUNT(*) FROM pool_players pp WHERE pp.pool_id = p.id) as participants_assigned,
  (SELECT COUNT(*) FROM matches m WHERE m.pool_id = p.id) as matches_in_pool
FROM pools p
WHERE tournament_id = '54e0c9bc-d14a-42a6-bfd6-51d97185aede'
ORDER BY category, name;

-- Check unique categories in matches
SELECT DISTINCT 
  CASE 
    WHEN court LIKE '%-%' THEN SPLIT_PART(court, ' - ', 1)
    ELSE court
  END as category_from_court
FROM matches
WHERE tournament_id = '54e0c9bc-d14a-42a6-bfd6-51d97185aede'
ORDER BY category_from_court;

