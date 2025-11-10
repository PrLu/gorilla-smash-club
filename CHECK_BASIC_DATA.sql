-- ============================================================
-- BASIC CHECK: Do you have any data at all?
-- ============================================================

-- First, let's confirm your tournament ID
-- Look at your browser URL: /tournament/YOUR_ID_HERE
-- Copy that ID and use it below

-- ============================================================
-- 1. Do you have ANY registrations at all?
-- ============================================================
SELECT 
  '1️⃣ Total Registrations' as check_type,
  COUNT(*) as count
FROM registrations
WHERE tournament_id = 'YOUR_TOURNAMENT_ID';  -- REPLACE THIS!

-- ============================================================
-- 2. What KIND of registrations do you have?
-- ============================================================
SELECT 
  '2️⃣ Registration Type Breakdown' as check_type,
  COUNT(*) as total,
  COUNT(CASE WHEN player_id IS NOT NULL THEN 1 END) as with_player_id,
  COUNT(CASE WHEN team_id IS NOT NULL THEN 1 END) as with_team_id,
  COUNT(CASE WHEN player_id IS NULL AND team_id IS NULL THEN 1 END) as with_neither
FROM registrations
WHERE tournament_id = 'YOUR_TOURNAMENT_ID';  -- REPLACE THIS!

-- ============================================================
-- 3. Show me ACTUAL registrations
-- ============================================================
SELECT 
  '3️⃣ Sample Registrations' as check_type,
  id,
  player_id,
  team_id,
  metadata,
  status,
  created_at
FROM registrations
WHERE tournament_id = 'YOUR_TOURNAMENT_ID'  -- REPLACE THIS!
ORDER BY created_at DESC
LIMIT 10;

-- ============================================================
-- 4. If you're not sure of tournament ID, find it
-- ============================================================
SELECT 
  '4️⃣ All Tournaments' as check_type,
  id,
  title,
  (SELECT COUNT(*) FROM registrations WHERE tournament_id = tournaments.id) as registration_count
FROM tournaments
ORDER BY created_at DESC
LIMIT 10;


