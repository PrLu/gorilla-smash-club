# Debug: Only Singles Fixtures Generated

## Problem

After applying the dynamic category fix:
1. ❌ Category filter is not visible in fixtures view
2. ❌ Only singles fixtures are being generated
3. ❌ Other categories (doubles, mojo_dojo, k_db, team events) are not generating

## Why Category Filter is Hidden

The category filter only shows when `hasMultipleCategories = true`:

```typescript
// FixturesViewer.tsx line 254
{hasMultipleCategories && (
  <div className="mb-6">
    <h3>Select Category</h3>
    // ... category buttons
  </div>
)}
```

**If only singles fixtures exist → only 1 category → filter is hidden!**

## Root Cause Analysis

The issue is likely one of these:

### Issue 1: Categories Not in Database ❓

The custom categories don't exist in the `categories` table.

**Check:**
```sql
SELECT name, display_name, is_team_based, is_active
FROM public.categories
ORDER BY sort_order;
```

**Expected:** You should see all your categories including custom ones.

### Issue 2: Category Names Don't Match ❓

Registration metadata has different category names than the `categories` table.

**Check:**
```sql
-- See what categories are in registrations
SELECT DISTINCT metadata->>'category' as reg_category, COUNT(*)
FROM public.registrations
WHERE tournament_id = 'YOUR_TOURNAMENT_ID'
AND metadata->>'category' IS NOT NULL
GROUP BY metadata->>'category';

-- Check if they match categories table
SELECT 
  r.metadata->>'category' as reg_category,
  c.name as db_category,
  c.is_team_based,
  CASE WHEN c.name IS NULL THEN '❌ NOT IN DB' ELSE '✅ MATCH' END as status,
  COUNT(*) as count
FROM public.registrations r
LEFT JOIN public.categories c ON r.metadata->>'category' = c.name
WHERE r.tournament_id = 'YOUR_TOURNAMENT_ID'
AND r.metadata->>'category' IS NOT NULL
GROUP BY r.metadata->>'category', c.name, c.is_team_based;
```

### Issue 3: Not Enough Participants per Category ❓

The `groupByDivision` function filters out categories with < 2 participants:

```typescript
// Filter out divisions with less than 2 participants
Object.keys(divisions).forEach((key) => {
  if (divisions[key].participantIds.length < 2) {
    console.log(`⚠️ Removing division ${key}: only ${divisions[key].participantIds.length} participant(s)`);
    delete divisions[key];
  }
});
```

**Check:** Do you have at least 2 registrations for each category?

### Issue 4: Registrations Missing Category Metadata ❓

Registrations don't have `metadata.category` set properly.

**Check:**
```sql
-- Check registrations with missing or null category
SELECT 
  id,
  player_id,
  team_id,
  metadata->>'category' as category,
  metadata
FROM public.registrations
WHERE tournament_id = 'YOUR_TOURNAMENT_ID'
ORDER BY metadata->>'category';
```

## Diagnostic Steps

### Step 1: Check Console Logs (MOST IMPORTANT!)

When you clicked "Generate Fixtures", the console should show:

```
Category metadata from database:
  - singles: 👤 INDIVIDUAL
  - doubles: 👥 TEAM-BASED
  - mojo_dojo: 👥 TEAM-BASED
  - k_db: 👥 TEAM-BASED

[Reg 1/50] Processing:
  → Category "singles" is 👤 INDIVIDUAL (from database)
  
[Reg 2/50] Processing:
  → Category "doubles" is 👥 TEAM-BASED (from database)
  
📊 Division Summary AFTER filtering:
  singles: 12 participants (WILL GENERATE)
  doubles: 8 participants (WILL GENERATE)
  mojo_dojo: 6 participants (WILL GENERATE)
```

**SHARE THESE LOGS!** They will tell us exactly what's happening.

### Step 2: Check Categories in Database

**Run this SQL:**
```sql
-- Get all active categories
SELECT 
  name, 
  display_name, 
  is_team_based, 
  is_active,
  sort_order
FROM public.categories
WHERE is_active = true
ORDER BY sort_order;
```

**Expected result:** Should include your custom categories (mojo_dojo, k_db, etc.)

### Step 3: Check Registration Categories

**Run this SQL (replace YOUR_TOURNAMENT_ID):**
```sql
-- Check what categories are in your registrations
SELECT 
  metadata->>'category' as category,
  COUNT(*) as participant_count,
  ARRAY_AGG(DISTINCT 
    CASE 
      WHEN player_id IS NOT NULL THEN 'player'
      WHEN team_id IS NOT NULL THEN 'team'
    END
  ) as participant_types
FROM public.registrations
WHERE tournament_id = 'YOUR_TOURNAMENT_ID'
AND metadata->>'category' IS NOT NULL
GROUP BY metadata->>'category'
ORDER BY category;
```

### Step 4: Check for Mismatches

**Run this SQL (replace YOUR_TOURNAMENT_ID):**
```sql
-- Find registrations with categories NOT in database
SELECT 
  r.metadata->>'category' as registration_category,
  c.name as db_category,
  c.is_team_based,
  CASE 
    WHEN c.name IS NULL THEN '❌ CATEGORY NOT IN DATABASE'
    WHEN c.is_team_based THEN '✅ TEAM-BASED'
    ELSE '✅ INDIVIDUAL'
  END as status,
  COUNT(*) as registration_count
FROM public.registrations r
LEFT JOIN public.categories c ON r.metadata->>'category' = c.name
WHERE r.tournament_id = 'YOUR_TOURNAMENT_ID'
AND r.metadata->>'category' IS NOT NULL
GROUP BY r.metadata->>'category', c.name, c.is_team_based
ORDER BY registration_category;
```

## Quick Fixes

### If Categories Missing from Database

Run the SQL from `QUICK_FIX.md`:
```sql
INSERT INTO public.categories (name, display_name, description, is_team_based, is_active, sort_order) VALUES
  ('mojo_dojo', 'Mojo Dojo', 'Mojo Dojo team competition', true, true, 4),
  ('k_db', 'K_DB', 'K_DB team competition', true, true, 5),
  ('doubles & k_db', 'Doubles & K_DB', 'Combined doubles and K_DB competition', true, true, 6),
  ('team events', 'Team Events', 'General team events', true, true, 7)
ON CONFLICT (name) DO UPDATE SET
  is_team_based = EXCLUDED.is_team_based,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();
```

### If Category Names Don't Match

**Option A:** Add categories with the exact names from registrations  
**Option B:** Update registration metadata to match database category names

### If Registrations Missing Category Metadata

This is likely if you registered participants before the category system was set up.

**Fix by updating registration metadata:**
```sql
-- Example: Set category for team-based registrations
UPDATE public.registrations
SET metadata = jsonb_set(
  COALESCE(metadata, '{}'::jsonb),
  '{category}',
  '"doubles"'::jsonb
)
WHERE tournament_id = 'YOUR_TOURNAMENT_ID'
AND team_id IS NOT NULL
AND (metadata IS NULL OR metadata->>'category' IS NULL);
```

## Action Items

Please provide:

1. **Console logs** from when you clicked "Generate Fixtures"
   - Open browser console (F12) or check your server terminal
   - Look for the logs starting with "Category metadata from database"
   - Share the "Division Summary AFTER filtering" section

2. **SQL query results** from Step 2, 3, and 4 above

3. **Tournament ID** so I can write specific SQL queries for your case

Once you share these, I can pinpoint the exact issue! 🎯


