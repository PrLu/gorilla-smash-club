-- Check if teams actually exist in the database
SELECT 
  'Teams in DB' as check_type,
  COUNT(*) as count
FROM teams
WHERE tournament_id = 'b2012f68-a1ad-4d0c-9208-bbdb1e3cd852'

UNION ALL

SELECT 
  'Doubles registrations with team_id' as check_type,
  COUNT(*) as count
FROM registrations
WHERE tournament_id = 'b2012f68-a1ad-4d0c-9208-bbdb1e3cd852'
  AND metadata->>'category' = 'doubles'
  AND team_id IS NOT NULL

UNION ALL

SELECT 
  'Registrations with INVALID team_id' as check_type,
  COUNT(*) as count
FROM registrations r
WHERE r.tournament_id = 'b2012f68-a1ad-4d0c-9208-bbdb1e3cd852'
  AND r.metadata->>'category' = 'doubles'
  AND r.team_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM teams t WHERE t.id = r.team_id
  );

-- Show the actual team_ids being used
SELECT 
  r.team_id,
  r.metadata->>'partner_display_name' as partner,
  CASE 
    WHEN t.id IS NOT NULL THEN '✅ EXISTS'
    ELSE '❌ MISSING'
  END as team_exists_in_db
FROM registrations r
LEFT JOIN teams t ON r.team_id = t.id
WHERE r.tournament_id = 'b2012f68-a1ad-4d0c-9208-bbdb1e3cd852'
  AND r.metadata->>'category' = 'doubles'
ORDER BY team_exists_in_db, r.team_id;




