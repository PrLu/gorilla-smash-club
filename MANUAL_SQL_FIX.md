# Manual SQL Fix for Doubles Matches

If the automated fix didn't work, use this manual SQL approach in Supabase:

## Step 1: Verify Current State

Run this in Supabase SQL Editor:

```sql
-- Check doubles pools
SELECT 
  p.id,
  p.name,
  p.category,
  COUNT(m.id) as match_count
FROM pools p
LEFT JOIN matches m ON p.id = m.pool_id
WHERE p.tournament_id = 'b2012f68-a1ad-4d0c-9208-bbdb1e3cd852'
  AND p.category = 'DOUBLES'
GROUP BY p.id, p.name, p.category
ORDER BY p.name;
```

**Expected Result:**
- Should show 4 pools
- Match count should be 0 (the problem)

## Step 2: Check Pool Players

```sql
-- See who's assigned to each doubles pool
SELECT 
  p.name as pool_name,
  pp.player_id,
  pp.team_id,
  pp.position,
  pl.first_name || ' ' || pl.last_name as player_name
FROM pools p
JOIN pool_players pp ON p.id = pp.pool_id
LEFT JOIN players pl ON pp.player_id = pl.id
WHERE p.tournament_id = 'b2012f68-a1ad-4d0c-9208-bbdb1e3cd852'
  AND p.category = 'DOUBLES'
ORDER BY p.name, pp.position;
```

**What to look for:**
- Each pool should have multiple participants
- Check if they have `team_id` or just `player_id`

## Step 3: Generate Matches (Manual)

If you have SQL skills, you can manually generate round-robin matches:

```sql
-- For Pool A (get the pool ID first)
WITH pool_participants AS (
  SELECT 
    pp.player_id,
    pp.team_id,
    pp.position,
    p.id as pool_id,
    p.name as pool_name,
    p.category
  FROM pools p
  JOIN pool_players pp ON p.id = pp.pool_id
  WHERE p.tournament_id = 'b2012f68-a1ad-4d0c-9208-bbdb1e3cd852'
    AND p.name = 'Pool A'
    AND p.category = 'DOUBLES'
),
match_pairs AS (
  SELECT 
    p1.pool_id,
    p1.pool_name,
    p1.category,
    p1.player_id as player1_id,
    p1.team_id as team1_id,
    p2.player_id as player2_id,
    p2.team_id as team2_id,
    ROW_NUMBER() OVER () as match_number
  FROM pool_participants p1
  CROSS JOIN pool_participants p2
  WHERE p1.position < p2.position
)
INSERT INTO matches (
  tournament_id,
  pool_id,
  match_type,
  court,
  round,
  bracket_pos,
  player1_id,
  player2_id,
  team1_id,
  team2_id,
  status
)
SELECT
  'b2012f68-a1ad-4d0c-9208-bbdb1e3cd852',
  pool_id,
  'pool',
  category || ' - ' || pool_name,  -- "DOUBLES - Pool A"
  1,
  match_number - 1,
  CASE WHEN team1_id IS NULL THEN player1_id ELSE NULL END,
  CASE WHEN team2_id IS NULL THEN player2_id ELSE NULL END,
  team1_id,
  team2_id,
  'pending'
FROM match_pairs;
```

**Repeat for Pool B, C, D** by changing `p.name = 'Pool A'` to `'Pool B'`, etc.

## Step 4: Verify Matches Created

```sql
-- Check how many matches were created
SELECT 
  m.court,
  COUNT(*) as match_count
FROM matches m
WHERE m.tournament_id = 'b2012f68-a1ad-4d0c-9208-bbdb1e3cd852'
  AND m.match_type = 'pool'
GROUP BY m.court
ORDER BY m.court;
```

**Expected Result:**
```
DOUBLES - Pool A    10 matches
DOUBLES - Pool B    10 matches
DOUBLES - Pool C    10 matches
DOUBLES - Pool D     1 match
SINGLES - Pool A     X matches
...
```

## Step 5: Verify Court Field Format

This is CRITICAL - the court field MUST contain "DOUBLES" for the category filter to work:

```sql
-- Check court field format
SELECT DISTINCT court 
FROM matches
WHERE tournament_id = 'b2012f68-a1ad-4d0c-9208-bbdb1e3cd852'
ORDER BY court;
```

**Must show:**
- ✅ `DOUBLES - Pool A`
- ✅ `SINGLES - Pool A`
- ❌ NOT just `Pool A`

If court field is wrong, fix it:

```sql
-- Update court field for doubles pool matches
UPDATE matches m
SET court = 'DOUBLES - ' || p.name
FROM pools p
WHERE m.pool_id = p.id
  AND m.tournament_id = 'b2012f68-a1ad-4d0c-9208-bbdb1e3cd852'
  AND p.category = 'DOUBLES'
  AND (m.court NOT LIKE 'DOUBLES%' OR m.court IS NULL);
```

## Alternative: Use Function

Create a PostgreSQL function to generate all matches at once:

```sql
CREATE OR REPLACE FUNCTION generate_pool_matches(p_tournament_id UUID, p_pool_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_pool RECORD;
  v_participants RECORD[];
  v_count INTEGER := 0;
BEGIN
  -- Get pool info
  SELECT * INTO v_pool FROM pools WHERE id = p_pool_id;
  
  -- Get participants
  SELECT ARRAY_AGG(ROW(player_id, team_id, position)) 
  INTO v_participants
  FROM pool_players 
  WHERE pool_id = p_pool_id
  ORDER BY position;
  
  -- Generate round-robin matches
  -- (Implementation depends on your specific needs)
  
  RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- Then call it for each pool:
SELECT generate_pool_matches(
  'b2012f68-a1ad-4d0c-9208-bbdb1e3cd852',
  'a955e3b3-d39a-48d7-8170-ee88bae03c9a'  -- Pool A ID
);
```

## Quick Nuclear Option

If you're comfortable deleting everything and starting fresh:

```sql
-- Delete all fixtures for this tournament
DELETE FROM matches WHERE tournament_id = 'b2012f68-a1ad-4d0c-9208-bbdb1e3cd852';
DELETE FROM pool_players WHERE pool_id IN (
  SELECT id FROM pools WHERE tournament_id = 'b2012f68-a1ad-4d0c-9208-bbdb1e3cd852'
);
DELETE FROM pools WHERE tournament_id = 'b2012f68-a1ad-4d0c-9208-bbdb1e3cd852';

-- Then regenerate fixtures properly from the UI
```

This clears everything so you can regenerate with proper team data.




