# 🔍 Quick Check - Why Only Singles?

## Most Likely Issues:

### Issue 1: Still Have Old Import Data
Did you delete the old registrations and re-import?

### Issue 2: Categories Not in Database  
Custom categories (mojo_dojo, k_db) not added to categories table

### Issue 3: Categories Not Enabled in Tournament
Tournament formats don't include the custom categories

---

## 🚀 Quick Fix Steps:

### Step 1: Add Categories to Database

**Run this in Supabase SQL Editor:**

```sql
-- Add your custom categories
INSERT INTO categories (name, display_name, description, is_team_based, is_active, sort_order) VALUES
  ('singles', 'Singles', 'Individual player competition', false, true, 1),
  ('doubles', 'Doubles', 'Team of 2 players', true, true, 2),
  ('mojo_dojo', 'Mojo Dojo', 'Mojo Dojo team competition', true, true, 3),
  ('k_db', 'K_DB', 'K_DB team competition', true, true, 4)
ON CONFLICT (name) DO UPDATE SET
  is_team_based = EXCLUDED.is_team_based,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();
```

### Step 2: Enable Categories in Tournament

**Run this (replace tournament ID):**

```sql
-- Update tournament to include all categories
UPDATE tournaments
SET formats = ARRAY['singles', 'doubles', 'mojo_dojo', 'k_db']
WHERE id = '54e0c9bc-d14a-42a6-bfd6-51d97185aede';
```

### Step 3: Delete Old Registrations

```sql
-- Delete old incomplete data
DELETE FROM registrations
WHERE tournament_id = '54e0c9bc-d14a-42a6-bfd6-51d97185aede';
```

### Step 4: Re-Import Your CSV

1. Go to tournament page
2. Click "Import Participants"
3. Upload your CSV
4. Watch console for team creation messages

### Step 5: Generate Fixtures

1. Click "Generate Fixtures"
2. All 4 categories should appear!

---

## 🔍 Or Diagnose First:

**Run this query to see what's wrong:**

```sql
-- Check everything
SELECT 'Registrations' as check_name, COUNT(*)::text as value
FROM registrations
WHERE tournament_id = '54e0c9bc-d14a-42a6-bfd6-51d97185aede'

UNION ALL

SELECT 'With Teams', COUNT(*)::text
FROM registrations
WHERE tournament_id = '54e0c9bc-d14a-42a6-bfd6-51d97185aede'
AND team_id IS NOT NULL

UNION ALL

SELECT 'Tournament Formats', array_to_string(formats, ', ')
FROM tournaments
WHERE id = '54e0c9bc-d14a-42a6-bfd6-51d97185aede'

UNION ALL

SELECT 'DB Categories', string_agg(name || '(' || is_team_based::text || ')', ', ')
FROM categories
WHERE is_active = true;
```

**Share the result and I'll tell you exactly what's wrong!**

---

## 💡 Quick Answer:

**Most likely:** You need to:
1. Add custom categories to database (Step 1)
2. Enable them in tournament (Step 2)
3. Delete and re-import (Steps 3-4)

**Then all categories will work!** 🚀


