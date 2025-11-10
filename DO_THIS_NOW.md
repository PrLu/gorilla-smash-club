# ⚡ DO THIS NOW - 3 Simple Steps

## The Problem
Only singles fixtures generating because registrations don't have categories set properly.

---

## The Fix (Choose One)

### 🚀 OPTION 1: Let Code Auto-Fix (Fastest - 2 minutes)

I added auto-assignment code. Just try generating fixtures again:

1. Open tournament page
2. Open console (F12)
3. Click "Generate Fixtures"
4. **Check console** - do you see multiple categories now?

**If YES → Done! ✅**
**If NO → Go to Option 2**

---

### 🔧 OPTION 2: Fix Database (Permanent - 5 minutes)

Your registrations are missing `metadata.category`. Fix it:

#### Copy-Paste This SQL

**Open Supabase → SQL Editor → Paste this:**

```sql
-- STEP 1: See the problem
SELECT 
  COALESCE(metadata->>'category', '❌ NO CATEGORY') as category,
  COUNT(*) as registrations
FROM registrations
GROUP BY metadata->>'category';

-- STEP 2: Fix it (assigns doubles/singles based on team/player)
UPDATE registrations
SET metadata = jsonb_set(COALESCE(metadata, '{}'::jsonb), '{category}', '"doubles"'::jsonb)
WHERE team_id IS NOT NULL AND (metadata->>'category' IS NULL);

UPDATE registrations
SET metadata = jsonb_set(COALESCE(metadata, '{}'::jsonb), '{category}', '"singles"'::jsonb)
WHERE player_id IS NOT NULL AND team_id IS NULL AND (metadata->>'category' IS NULL);

-- STEP 3: Verify
SELECT 
  metadata->>'category' as category,
  COUNT(*) as registrations,
  COUNT(CASE WHEN team_id IS NOT NULL THEN 1 END) as teams
FROM registrations
WHERE metadata->>'category' IS NOT NULL
GROUP BY metadata->>'category';
```

#### Result Should Show:
```
category    | registrations | teams
------------|---------------|-------
doubles     | 28           | 28
singles     | 12           | 0
```

#### Now Regenerate Fixtures

✅ All categories should generate now!

---

## 🎯 Bottom Line

**Your registrations don't have `metadata.category` set.**

**Fix:**
- Option 1: Code auto-assigns (temporary, per-generation)
- Option 2: SQL fixes database (permanent)

**Then:** Regenerate fixtures → See all categories! 🚀

---

## ❓ Still Stuck?

Share this with me:

1. **Console output** when generating fixtures
2. **Result of this SQL:**
```sql
SELECT metadata->>'category', COUNT(*) 
FROM registrations 
GROUP BY metadata->>'category';
```

I'll tell you exactly what's wrong! 💪


