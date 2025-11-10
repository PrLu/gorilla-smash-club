-- ============================================================
-- QUICK DIAGNOSIS - Run this ONE query
-- ============================================================

-- Check EVERYTHING in one query
WITH tournament_data AS (
  SELECT 
    '54e0c9bc-d14a-42a6-bfd6-51d97185aede' as tournament_id
)
SELECT '1️⃣ REGISTRATIONS' as section, 
       COUNT(*) as count,
       COUNT(CASE WHEN team_id IS NOT NULL THEN 1 END) as with_teams,
       COUNT(CASE WHEN metadata->>'partner_email' IS NOT NULL THEN 1 END) as with_partners
FROM registrations, tournament_data
WHERE tournament_id = tournament_data.tournament_id

UNION ALL

SELECT '2️⃣ CATEGORIES IN REGS' as section,
       metadata->>'category' as count,
       COUNT(*)::text as with_teams,
       COUNT(CASE WHEN team_id IS NOT NULL THEN 1 END)::text as with_partners
FROM registrations, tournament_data
WHERE tournament_id = tournament_data.tournament_id
GROUP BY metadata->>'category'

UNION ALL

SELECT '3️⃣ TOURNAMENT FORMATS' as section,
       array_to_string(formats, ', ') as count,
       '' as with_teams,
       '' as with_partners
FROM tournaments, tournament_data
WHERE id = tournament_data.tournament_id

UNION ALL

SELECT '4️⃣ CATEGORIES IN DB' as section,
       name || ' (is_team_based=' || is_team_based::text || ')' as count,
       '' as with_teams,
       '' as with_partners
FROM categories
WHERE is_active = true;


