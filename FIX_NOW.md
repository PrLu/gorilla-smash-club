# 🔧 FIX: Only Singles Generating - Action Plan

## Problem
Only singles fixtures are generating because your registrations likely don't have `metadata.category` set properly for all categories.

---

## ✅ Solution Applied (Code Changes)

I've updated the code to **automatically handle missing categories**:

### What I Fixed:

1. **Auto-Assignment Logic** ✅
   - If registration has `team_id` → auto-assign to "doubles"
   - If registration has `player_id` only → auto-assign to "singles"
   - Happens automatically during fixture generation

2. **Better Debugging** ✅
   - Shows exactly what's in your registrations
   - Displays breakdown of categories
   - Clear console output showing what's happening

3. **Comprehensive Logging** ✅
   - Shows how many registrations have categories
   - Shows auto-assignments happening
   - Clear feedback on what's being generated

---

## 🚀 What You Need to Do

### OPTION A: Quick Test (Try This First!)

Just regenerate fixtures and see if it works now:

1. **Go to tournament page**
2. **Open console (F12)**
3. **Click "Generate Fixtures"**
4. **Check console output**

**Look for:**
```
🔧 AUTO-ASSIGNING missing categories...
⚠️ Auto-assigned categories to X registrations

📊 CATEGORY ANALYSIS:
   SINGLES: ...
   DOUBLES: ...
   [other categories...]
```

**If you see multiple categories in the analysis → it's working!**

---

### OPTION B: Fix Database Directly (Recommended)

If Option A shows only singles, your registrations need proper categories in the database.

#### Step 1: Diagnose

**Run in Supabase SQL Editor:**

```sql
-- See what categories exist in your registrations
SELECT 
  COALESCE(metadata->>'category', 'NO CATEGORY') as category,
  COUNT(*) as count,
  COUNT(CASE WHEN team_id IS NOT NULL THEN 1 END) as teams,
  COUNT(CASE WHEN player_id IS NOT NULL THEN 1 END) as players
FROM registrations
-- WHERE tournament_id = 'YOUR_TOURNAMENT_ID'  -- Uncomment and add your ID
GROUP BY metadata->>'category'
ORDER BY count DESC;
```

**Expected Output:**

| category | count | teams | players |
|----------|-------|-------|---------|
| NO CATEGORY | 40 | 28 | 12 |

**This shows the problem:** 40 registrations have NO category set!

---

#### Step 2: Fix It

**Run in Supabase SQL Editor:**

```sql
-- Fix registrations with team_id → assign to 'doubles'
UPDATE registrations
SET metadata = jsonb_set(
  COALESCE(metadata, '{}'::jsonb),
  '{category}',
  '"doubles"'::jsonb
)
WHERE team_id IS NOT NULL
AND (metadata IS NULL OR metadata->>'category' IS NULL)
-- AND tournament_id = 'YOUR_TOURNAMENT_ID'  -- Add your ID
;

-- Fix registrations with player_id only → assign to 'singles'
UPDATE registrations
SET metadata = jsonb_set(
  COALESCE(metadata, '{}'::jsonb),
  '{category}',
  '"singles"'::jsonb
)
WHERE player_id IS NOT NULL
AND team_id IS NULL
AND (metadata IS NULL OR metadata->>'category' IS NULL)
-- AND tournament_id = 'YOUR_TOURNAMENT_ID'  -- Add your ID
;
```

**This updates the database permanently.**

---

#### Step 3: Verify

**Run in Supabase SQL Editor:**

```sql
-- Check the fix worked
SELECT 
  metadata->>'category' as category,
  COUNT(*) as count,
  COUNT(CASE WHEN team_id IS NOT NULL THEN 1 END) as teams,
  COUNT(CASE WHEN player_id IS NOT NULL THEN 1 END) as players
FROM registrations
WHERE metadata->>'category' IS NOT NULL
-- AND tournament_id = 'YOUR_TOURNAMENT_ID'
GROUP BY metadata->>'category'
ORDER BY count DESC;
```

**Expected Output:**

| category | count | teams | players |
|----------|-------|-------|---------|
| doubles | 28 | 28 | 0 |
| singles | 12 | 0 | 12 |

**Perfect!** Now all registrations have categories.

---

#### Step 4: Regenerate Fixtures

1. Go to tournament page
2. **Delete existing fixtures** (if any)
3. Click "Generate Fixtures"
4. Watch console

**You should now see:**
```
DOUBLES:
├─ Total registrations: 28
├─ With team_id: 28
└─ Type: 👥 TEAM-BASED

SINGLES:
├─ Total registrations: 12
├─ With player_id: 12
└─ Type: 👤 INDIVIDUAL

✅ Pool generation complete for doubles: 4 pools, 24 matches
✅ Pool generation complete for singles: 3 pools, 18 matches
```

---

## 🎯 For Multiple Categories (mojo_dojo, k_db, etc.)

If you have specific team categories like "mojo_dojo" or "k_db", you need to identify which teams belong to which category.

### Method 1: By Team Name

```sql
-- Assign teams with 'mojo' or 'dojo' in name → 'mojo_dojo'
UPDATE registrations
SET metadata = jsonb_set(
  COALESCE(metadata, '{}'::jsonb),
  '{category}',
  '"mojo_dojo"'::jsonb
)
WHERE team_id IN (
  SELECT id FROM teams 
  WHERE LOWER(name) LIKE '%mojo%' 
  OR LOWER(name) LIKE '%dojo%'
);

-- Assign teams with 'k_db' or 'kdb' in name → 'k_db'
UPDATE registrations
SET metadata = jsonb_set(
  COALESCE(metadata, '{}'::jsonb),
  '{category}',
  '"k_db"'::jsonb
)
WHERE team_id IN (
  SELECT id FROM teams 
  WHERE LOWER(name) LIKE '%k_db%' 
  OR LOWER(name) LIKE '%kdb%'
);
```

### Method 2: Manually List Team IDs

```sql
-- If you know which team IDs are in each category
UPDATE registrations
SET metadata = jsonb_set(
  COALESCE(metadata, '{}'::jsonb),
  '{category}',
  '"mojo_dojo"'::jsonb
)
WHERE team_id IN ('team-id-1', 'team-id-2', 'team-id-3', ...);
```

### Method 3: Check CSV Import Data

If you imported via CSV, check the original CSV file to see which category each participant was assigned.

---

## 📊 Quick Checklist

- [ ] Run diagnostic query (Step 1)
- [ ] See the problem (registrations missing categories)
- [ ] Run fix queries (Step 2)
- [ ] Verify fix worked (Step 3)
- [ ] Regenerate fixtures (Step 4)
- [ ] Check UI shows all categories
- [ ] Verify each category has pools and matches

---

## 🐛 Still Not Working?

### Share This Information:

1. **Console output** when you generate fixtures (copy the "CATEGORY ANALYSIS" section)

2. **SQL diagnostic result:**
```sql
SELECT 
  metadata->>'category' as category,
  COUNT(*) as count,
  team_id IS NOT NULL as has_team
FROM registrations
GROUP BY metadata->>'category', team_id IS NOT NULL;
```

3. **What you see in UI:**
   - How many categories in filter?
   - Which categories?
   - Do they have matches?

---

## 📚 Files to Use

1. **`FIX_MISSING_CATEGORIES.sql`** - Complete SQL script with all steps
2. **`DIAGNOSE_REGISTRATIONS.sql`** - Detailed diagnostic queries
3. **`FIX_NOW.md`** - This file (simple action plan)

---

## 💡 Why This Happened

**Root cause:** When participants were registered (likely via CSV import or manual registration), the `metadata.category` field wasn't set properly.

**The fix:** 
- Code now has auto-assignment as fallback
- But it's better to fix the database so it's permanent

**Future prevention:** Make sure category is always set during registration/import.

---

## ✅ Summary

**Quick Fix:**
1. Run SQL fix queries (Step 2 in Option B)
2. Regenerate fixtures
3. Done!

**Expected Result:**
- Multiple categories discovered
- Fixtures for all categories
- Category filter shows all categories
- Each category has pools and matches

---

**Start with Option A (quick test), then do Option B if needed!** 🚀


