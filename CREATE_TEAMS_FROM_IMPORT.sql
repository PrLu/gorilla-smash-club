-- ============================================================
-- CREATE TEAMS FROM IMPORTED PARTNER DATA
-- This will create teams from registrations that have partner info
-- ============================================================

-- STEP 1: Find all registrations with partner information
-- ============================================================
SELECT 
  '1️⃣ Registrations with Partner Info' as step,
  COUNT(*) as count_with_partners
FROM registrations
WHERE tournament_id = 'YOUR_TOURNAMENT_ID'  -- REPLACE!
AND metadata->>'partner_email' IS NOT NULL;

-- STEP 2: Create teams from partner pairs
-- ============================================================
-- This is complex - we need to match partners and create teams

-- For Doubles category example:
WITH partner_pairs AS (
  SELECT DISTINCT ON (
    LEAST(r.metadata->>'partner_email', r.metadata->>'category'),
    GREATEST(r.metadata->>'partner_email', r.metadata->>'category')
  )
    r.id as reg1_id,
    r.player_id as player1_id,
    p1.first_name || ' ' || p1.last_name as player1_name,
    r.metadata->>'partner_email' as partner_email,
    r.metadata->>'partner_display_name' as partner_name,
    r.metadata->>'category' as category
  FROM registrations r
  JOIN players p1 ON r.player_id = p1.id
  WHERE r.tournament_id = 'YOUR_TOURNAMENT_ID'  -- REPLACE!
  AND r.metadata->>'partner_email' IS NOT NULL
  AND r.metadata->>'category' IN ('doubles', 'mojo_dojo', 'k_db')
)
SELECT * FROM partner_pairs;

-- This is getting complex - let me provide a better solution...


