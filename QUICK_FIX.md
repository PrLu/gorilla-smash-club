# 🚀 QUICK FIX - Custom Categories Not Generating Fixtures

## What Was Wrong

The system only recognized "doubles" and "mixed" as team-based categories. Custom categories like "mojo_dojo", "k_db", "team events" were treated as individual categories, causing pool generation to fail.

## ✅ Code Fix Applied

File `src/app/api/tournaments/[id]/generate-fixtures/route.ts` has been updated to:
- Fetch category metadata from database
- Use `is_team_based` flag from categories table
- Support ANY custom category (not just hardcoded ones)

## 🎯 What You Need to Do NOW

### 1️⃣ Add Custom Categories to Database

**Copy this SQL and run it in Supabase SQL Editor:**

```sql
-- Add custom team-based categories
INSERT INTO public.categories (name, display_name, description, is_team_based, is_active, sort_order) VALUES
  ('mojo_dojo', 'Mojo Dojo', 'Mojo Dojo team competition', true, true, 4),
  ('k_db', 'K_DB', 'K_DB team competition', true, true, 5),
  ('doubles & k_db', 'Doubles & K_DB', 'Combined doubles and K_DB competition', true, true, 6),
  ('doubles_and_k_db', 'Doubles & K_DB', 'Combined doubles and K_DB competition (normalized)', true, true, 6),
  ('team events', 'Team Events', 'General team events', true, true, 7),
  ('team_events', 'Team Events', 'General team events (normalized)', true, true, 7)
ON CONFLICT (name) DO UPDATE SET
  is_team_based = EXCLUDED.is_team_based,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();
```

### 2️⃣ Verify Categories Added

**Run this to check:**

```sql
SELECT name, display_name, is_team_based, is_active
FROM public.categories
WHERE name IN ('mojo_dojo', 'k_db', 'doubles & k_db', 'team events')
ORDER BY sort_order;
```

You should see all 4 categories with `is_team_based = true`.

### 3️⃣ Check Registration Categories Match

**Run this to ensure registrations match categories:**

```sql
SELECT 
  r.metadata->>'category' as category,
  c.is_team_based,
  CASE WHEN c.name IS NULL THEN '❌ MISSING' ELSE '✅ OK' END as status,
  COUNT(*) as count
FROM registrations r
LEFT JOIN categories c ON r.metadata->>'category' = c.name
WHERE r.metadata->>'category' IS NOT NULL
GROUP BY r.metadata->>'category', c.is_team_based, c.name
ORDER BY category;
```

**All categories should show ✅ OK**. If any show ❌ MISSING, add that exact category name to the categories table.

### 4️⃣ Regenerate Fixtures

1. Go to your tournament page
2. Click "Generate Fixtures"
3. Select "Automatic (All Categories)"
4. Choose "Pool + Knockout"
5. Click "Generate Fixtures"

### 5️⃣ Watch Console Logs

Open browser console (F12) or server console and look for:

```
Category metadata from database:
  - mojo_dojo: 👥 TEAM-BASED
  - k_db: 👥 TEAM-BASED
  - doubles & k_db: 👥 TEAM-BASED
  - team events: 👥 TEAM-BASED

🏊 POOL MODE: Generating pools for doubles & k_db
✅ Pool generation complete for doubles & k_db: 2 pools, 15 matches
```

## ✅ Success Checklist

- [ ] SQL script executed in Supabase
- [ ] All categories show `is_team_based = true`
- [ ] All registration categories match categories table
- [ ] Fixtures regenerated
- [ ] Console shows categories loaded from database
- [ ] Pools created for ALL categories
- [ ] Matches visible in UI for all categories

## 🚨 If Still Not Working

1. **Check exact category names** - They must match EXACTLY (case, spaces, special chars)
2. **Share console logs** - Look for errors or warnings
3. **Run verification query** - See Step 3 above
4. **Check tournament formats** - Ensure all categories are enabled in tournament settings

## 📖 Full Documentation

- `FIX_SUMMARY_AND_NEXT_STEPS.md` - Complete guide
- `CUSTOM_CATEGORIES_FIX.md` - Technical details
- `FIX_CUSTOM_CATEGORIES.sql` - Full SQL script with diagnostics


