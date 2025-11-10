# Check Categories Currently in Use

## Issue

The user mentioned categories like "doubles & k_db" and "team events", but we need to verify:
1. What exact category names are in the `categories` table?
2. What exact category names are in `registrations.metadata.category`?
3. Do they match?

## How to Check

### Step 1: Check Categories Table

Run this SQL in Supabase SQL Editor:

```sql
-- View all categories
SELECT 
  name, 
  display_name, 
  is_team_based, 
  is_active,
  sort_order
FROM public.categories
ORDER BY sort_order;
```

### Step 2: Check Registrations Metadata

Run this SQL to see what categories are actually in use:

```sql
-- View unique categories from registrations
SELECT DISTINCT
  metadata->>'category' as category_name,
  COUNT(*) as registration_count
FROM public.registrations
WHERE metadata->>'category' IS NOT NULL
GROUP BY metadata->>'category'
ORDER BY category_name;
```

### Step 3: Check for Mismatches

Run this to find registrations with categories NOT in the categories table:

```sql
-- Find registrations with unknown categories
SELECT DISTINCT
  r.metadata->>'category' as category_name,
  COUNT(*) as count
FROM public.registrations r
WHERE 
  r.metadata->>'category' IS NOT NULL
  AND r.metadata->>'category' NOT IN (
    SELECT name FROM public.categories
  )
GROUP BY r.metadata->>'category';
```

## Common Issues

### Issue 1: Special Characters

**Problem:** Category name in registration has special characters (e.g., "doubles & k_db")  
**Solution:** Normalize category names to use underscores (e.g., "doubles_and_k_db")

### Issue 2: Case Sensitivity

**Problem:** Category name case doesn't match (e.g., "Team Events" vs "team events")  
**Solution:** Use lowercase with underscores in `categories.name` field

### Issue 3: Missing Categories

**Problem:** Registrations have categories that don't exist in the `categories` table  
**Solution:** Add missing categories or update registration metadata

## Fix Options

### Option A: Update Categories Table

If registrations use "doubles & k_db", add it to categories table:

```sql
INSERT INTO public.categories (name, display_name, description, is_team_based, is_active, sort_order) 
VALUES ('doubles & k_db', 'Doubles & K_DB', 'Combined doubles and K_DB competition', true, true, 6)
ON CONFLICT (name) DO NOTHING;
```

### Option B: Update Registration Metadata

If categories table uses "doubles_and_k_db", update registrations:

```sql
UPDATE public.registrations
SET metadata = jsonb_set(
  COALESCE(metadata, '{}'::jsonb),
  '{category}',
  '"doubles_and_k_db"'::jsonb
)
WHERE metadata->>'category' = 'doubles & k_db';
```

### Option C: Add Both Formats (Recommended)

Add categories with the exact names used in registrations:

```sql
-- Add categories with exact names from registrations
INSERT INTO public.categories (name, display_name, description, is_team_based, is_active, sort_order) VALUES
  ('doubles & k_db', 'Doubles & K_DB', 'Combined doubles and K_DB competition', true, true, 6),
  ('team events', 'Team Events', 'General team events', true, true, 7)
ON CONFLICT (name) DO NOTHING;
```

## After Fixing

1. **Verify categories match:**
   ```sql
   SELECT 
     r.metadata->>'category' as reg_category,
     c.name as cat_name,
     c.is_team_based,
     COUNT(*) as count
   FROM public.registrations r
   LEFT JOIN public.categories c ON r.metadata->>'category' = c.name
   WHERE r.metadata->>'category' IS NOT NULL
   GROUP BY r.metadata->>'category', c.name, c.is_team_based
   ORDER BY reg_category;
   ```

2. **Regenerate fixtures** - The fix will now correctly detect team-based categories

3. **Check console logs** - You should see all categories properly classified as team-based or individual


