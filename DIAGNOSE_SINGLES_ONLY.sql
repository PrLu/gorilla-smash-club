-- ============================================================
-- COMPREHENSIVE DIAGNOSIS: Why Only Singles Generating
-- Run ALL these queries and share ALL results
-- ============================================================

-- Replace this with your tournament ID from the URL
-- http://localhost:3000/tournament/54e0c9bc-d14a-42a6-bfd6-51d97185aede
\set tournament_id '54e0c9bc-d14a-42a6-bfd6-51d97185aede'

-- ============================================================
-- 1. What categories exist in the categories table?
-- ============================================================
SELECT 
  '1️⃣ Categories in Database' as check_type,
  name,
  display_name,
  is_team_based,
  is_active
FROM categories
WHERE is_active = true
ORDER BY sort_order;

-- ============================================================
-- 2. What formats are enabled for THIS tournament?
-- ============================================================
SELECT 
  '2️⃣ Tournament Formats' as check_type,
  id,
  title,
  formats,
  format
FROM tournaments
WHERE id = :'tournament_id';

-- ============================================================
-- 3. What registrations exist and their structure?
-- ============================================================
SELECT 
  '3️⃣ Registration Breakdown' as check_type,
  COUNT(*) as total_registrations,
  COUNT(CASE WHEN team_id IS NOT NULL THEN 1 END) as with_team_id,
  COUNT(CASE WHEN player_id IS NOT NULL AND team_id IS NULL THEN 1 END) as player_only,
  COUNT(CASE WHEN metadata->>'category' IS NOT NULL THEN 1 END) as with_category,
  COUNT(CASE WHEN metadata->>'partner_email' IS NOT NULL THEN 1 END) as with_partner_info
FROM registrations
WHERE tournament_id = :'tournament_id';

-- ============================================================
-- 4. What categories are in the registrations?
-- ============================================================
SELECT 
  '4️⃣ Categories in Registrations' as check_type,
  metadata->>'category' as category,
  COUNT(*) as registration_count,
  COUNT(CASE WHEN team_id IS NOT NULL THEN 1 END) as with_team_id,
  COUNT(CASE WHEN player_id IS NOT NULL THEN 1 END) as with_player_id
FROM registrations
WHERE tournament_id = :'tournament_id'
GROUP BY metadata->>'category'
ORDER BY category;

-- ============================================================
-- 5. Do teams exist at all?
-- ============================================================
SELECT 
  '5️⃣ Teams in System' as check_type,
  COUNT(*) as total_teams
FROM teams
WHERE id IN (
  SELECT DISTINCT team_id 
  FROM registrations 
  WHERE tournament_id = :'tournament_id'
  AND team_id IS NOT NULL
);

-- ============================================================
-- 6. Sample of actual registration data
-- ============================================================
SELECT 
  '6️⃣ Sample Registrations' as check_type,
  id,
  player_id IS NOT NULL as has_player,
  team_id IS NOT NULL as has_team,
  metadata->>'category' as category,
  metadata->>'partner_email' as partner_email
FROM registrations
WHERE tournament_id = :'tournament_id'
LIMIT 10;

-- ============================================================
-- INSTRUCTIONS:
-- 1. Copy ALL query results
-- 2. Paste them here
-- 3. I'll tell you exactly what's wrong
-- ============================================================


