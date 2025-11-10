# 🚨 IMMEDIATE ACTION - Fix Singles-Only Issue

## The Problem

Only singles fixtures are generating because:
1. Either custom categories don't exist in the database
2. Or registration metadata doesn't have categories set properly
3. Or category names don't match

## 🎯 FASTEST FIX - Do This NOW

### Step 1: Add Categories to Database (2 minutes)

**Copy this SQL and run in Supabase SQL Editor:**

```sql
-- Add all custom categories
INSERT INTO public.categories (name, display_name, description, is_team_based, is_active, sort_order) VALUES
  ('singles', 'Singles', 'Individual player competition', false, true, 1),
  ('doubles', 'Doubles', 'Team of 2 players (same gender)', true, true, 2),
  ('mixed', 'Mixed Doubles', 'Team of 2 players (mixed gender)', true, true, 3),
  ('mojo_dojo', 'Mojo Dojo', 'Mojo Dojo team competition', true, true, 4),
  ('k_db', 'K_DB', 'K_DB team competition', true, true, 5),
  ('doubles & k_db', 'Doubles & K_DB', 'Combined doubles and K_DB competition', true, true, 6),
  ('doubles_and_k_db', 'Doubles & K_DB', 'Combined doubles and K_DB competition (normalized)', true, true, 7),
  ('team events', 'Team Events', 'General team events', true, true, 8),
  ('team_events', 'Team Events', 'General team events (normalized)', true, true, 9)
ON CONFLICT (name) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  is_team_based = EXCLUDED.is_team_based,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();
```

**Verify it worked:**
```sql
SELECT name, display_name, is_team_based 
FROM public.categories 
WHERE is_active = true 
ORDER BY sort_order;
```

You should see ALL your categories including custom ones.

---

### Step 2: Check Your Registrations (1 minute)

**Find your tournament ID:**
- Go to your tournament page
- URL will be like `/tournament/abc-123-xyz`
- Copy the `abc-123-xyz` part

**Check registrations (replace YOUR_TOURNAMENT_ID):**
```sql
SELECT 
  metadata->>'category' as category,
  COUNT(*) as count
FROM public.registrations
WHERE tournament_id = 'YOUR_TOURNAMENT_ID'
GROUP BY metadata->>'category'
ORDER BY category;
```

**Expected result:** Should show all your categories with participant counts

**If you see NULL or missing categories:** Your registrations don't have category metadata! See Step 4.

---

### Step 3: Regenerate Fixtures

1. Go to your tournament page
2. Delete existing matches if any
3. Click "Generate Fixtures"
4. Select "Automatic (All Categories)"
5. Choose "Pool + Knockout"
6. Click "Generate"

**Watch the console (F12 in browser)** - You should see:
```
Category metadata from database:
  - singles: 👤 INDIVIDUAL
  - doubles: 👥 TEAM-BASED
  - mojo_dojo: 👥 TEAM-BASED
  - k_db: 👥 TEAM-BASED

📊 Division Summary AFTER filtering:
  singles: 12 participants (WILL GENERATE)
  doubles: 8 participants (WILL GENERATE)
  mojo_dojo: 6 participants (WILL GENERATE)
  k_db: 5 participants (WILL GENERATE)
```

---

### Step 4: If Registrations Have No Categories

If Step 2 showed NULL or missing categories, your registrations need category metadata.

**How did participants register?**

#### Option A: Manual Registration
Update each registration to set the category:
```sql
-- Example: Update team-based registrations to "doubles"
UPDATE public.registrations
SET metadata = jsonb_set(
  COALESCE(metadata, '{}'::jsonb),
  '{category}',
  '"doubles"'::jsonb
)
WHERE tournament_id = 'YOUR_TOURNAMENT_ID'
AND team_id IS NOT NULL
AND (metadata->>'category' IS NULL OR metadata->>'category' = '');

-- Update individual registrations to "singles"
UPDATE public.registrations
SET metadata = jsonb_set(
  COALESCE(metadata, '{}'::jsonb),
  '{category}',
  '"singles"'::jsonb
)
WHERE tournament_id = 'YOUR_TOURNAMENT_ID'
AND player_id IS NOT NULL
AND team_id IS NULL
AND (metadata->>'category' IS NULL OR metadata->>'category' = '');
```

#### Option B: CSV Import
If you imported via CSV, re-import with a category column.

**Sample CSV format:**
```csv
email,first_name,last_name,gender,rating,category
john@example.com,John,Doe,male,1500,singles
jane@example.com,Jane,Smith,female,1600,doubles
bob@example.com,Bob,Jones,male,1550,mojo_dojo
```

---

## 🔍 Diagnostic Checklist

Run these checks and share results:

- [ ] **Categories table populated?**
  ```sql
  SELECT COUNT(*) FROM categories WHERE is_active = true;
  ```
  Expected: At least 6-9 categories

- [ ] **Registrations have categories?**
  ```sql
  SELECT COUNT(*) as total,
         COUNT(metadata->>'category') as with_category
  FROM registrations 
  WHERE tournament_id = 'YOUR_TOURNAMENT_ID';
  ```
  Expected: total = with_category

- [ ] **Categories match?**
  ```sql
  SELECT 
    r.metadata->>'category' as reg_cat,
    CASE WHEN c.name IS NULL THEN '❌' ELSE '✅' END as match
  FROM registrations r
  LEFT JOIN categories c ON r.metadata->>'category' = c.name
  WHERE r.tournament_id = 'YOUR_TOURNAMENT_ID'
  GROUP BY r.metadata->>'category', c.name;
  ```
  Expected: All show ✅

---

## 📊 Share These Results

After running the steps above, share:

1. **Categories query result** (from Step 1 verify)
2. **Registrations query result** (from Step 2)
3. **Console logs** when you regenerated fixtures
4. **How many matches were created** and for which categories

This will help me identify the exact issue! 🎯

---

## 🎉 Success Indicators

You'll know it worked when:

✅ Console shows multiple categories detected  
✅ Multiple categories show in fixture generation summary  
✅ Category filter appears in Fixtures tab  
✅ Each category has its own pools and matches  
✅ Match counts are distributed across categories  

The category filter will automatically appear once you have matches from multiple categories! 🚀


