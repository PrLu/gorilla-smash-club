-- ============================================
-- QUICK DIAGNOSTIC SCRIPT
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. Check what categories exist in database
SELECT 
  '1️⃣ Categories in database' as check_name,
  name, 
  display_name, 
  is_team_based::text as team_based,
  is_active::text as active
FROM public.categories
WHERE is_active = true
ORDER BY sort_order;

-- 2. Check what categories are in registrations
-- (Replace 'YOUR_TOURNAMENT_ID' with your actual tournament ID)
SELECT 
  '2️⃣ Categories in registrations' as check_name,
  metadata->>'category' as category,
  COUNT(*) as count,
  ARRAY_AGG(DISTINCT 
    CASE 
      WHEN player_id IS NOT NULL THEN 'has_player_id'
      WHEN team_id IS NOT NULL THEN 'has_team_id'
      ELSE 'no_participant'
    END
  ) as participant_types
FROM public.registrations
-- WHERE tournament_id = 'YOUR_TOURNAMENT_ID'  -- UNCOMMENT AND ADD YOUR ID
GROUP BY metadata->>'category'
ORDER BY category;

-- 3. Check for mismatches (categories in registrations but not in database)
SELECT 
  '3️⃣ Category match status' as check_name,
  r.metadata->>'category' as registration_category,
  c.name as database_category,
  c.is_team_based::text as team_based,
  CASE 
    WHEN c.name IS NULL THEN '❌ NOT IN DATABASE'
    WHEN c.is_team_based THEN '✅ TEAM-BASED'
    ELSE '✅ INDIVIDUAL'
  END as status,
  COUNT(*) as registration_count
FROM public.registrations r
LEFT JOIN public.categories c ON r.metadata->>'category' = c.name
-- WHERE r.tournament_id = 'YOUR_TOURNAMENT_ID'  -- UNCOMMENT AND ADD YOUR ID
GROUP BY r.metadata->>'category', c.name, c.is_team_based
ORDER BY registration_category;

-- 4. Check registrations with no category set
SELECT 
  '4️⃣ Registrations without category' as check_name,
  COUNT(*) as count_without_category
FROM public.registrations
-- WHERE tournament_id = 'YOUR_TOURNAMENT_ID'  -- UNCOMMENT AND ADD YOUR ID
WHERE metadata->>'category' IS NULL OR metadata->>'category' = '';

-- 5. Sample of registrations to see structure
SELECT 
  '5️⃣ Sample registrations' as check_name,
  id,
  player_id IS NOT NULL as has_player,
  team_id IS NOT NULL as has_team,
  metadata->>'category' as category,
  status
FROM public.registrations
-- WHERE tournament_id = 'YOUR_TOURNAMENT_ID'  -- UNCOMMENT AND ADD YOUR ID
LIMIT 10;

-- ============================================
-- INSTRUCTIONS:
-- 1. Uncomment the "WHERE tournament_id" lines
-- 2. Replace 'YOUR_TOURNAMENT_ID' with your actual tournament ID
-- 3. Run all queries
-- 4. Share the results
-- ============================================


