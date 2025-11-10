# Category Detection Issue - Troubleshooting Guide

## Problem

Automatic fixture generation is only detecting 1 category when there should be multiple categories (Singles, Doubles, Mixed).

## Root Cause

The category information must be stored in the `registrations.metadata.category` field during the registration process. If registrations don't have this field populated, they will all default to "singles".

---

## 🔍 Diagnosis Steps

### Step 1: Check Category Distribution

Navigate to the debug page:
```
/tournament/{tournament-id}/debug-categories
```

This page shows:
- Total registrations
- Categories detected
- Registrations missing category data
- Participant breakdown per category
- Raw registration data

### Step 2: Review Server Logs

When you click "Automatic (All Categories)", check your server console for:

```
=== CATEGORY DETECTION DEBUG ===
Total registrations: 15
Registration 1: { category: 'singles', ... }
Registration 2: { category: 'doubles', ... }
...
Category map after processing: ['singles', 'doubles', 'mixed']
singles: 5 participants
doubles: 7 participants
mixed: 3 participants
=== END DEBUG ===
```

If you see all registrations showing `category: undefined` or `category: 'singles'`, that's the issue!

---

## 🔧 Solutions

### Solution 1: Ensure Category is Set During Registration

The registration form MUST save the category in metadata:

```typescript
// In RegistrationForm.tsx or similar
const metadata = {
  category: data.category, // This must be: 'singles', 'doubles', or 'mixed'
  rating: data.rating,
  gender: data.gender,
};

await supabase.from('registrations').insert({
  tournament_id: tournamentId,
  player_id: player.id,
  status: 'pending',
  metadata: metadata, // ← Category must be here!
});
```

### Solution 2: Update Existing Registrations (SQL Fix)

If you have existing registrations without category data, run this SQL in Supabase:

```sql
-- For Singles (individual players, not teams)
UPDATE registrations
SET metadata = jsonb_set(
  COALESCE(metadata, '{}'::jsonb),
  '{category}',
  '"singles"'
)
WHERE tournament_id = 'YOUR_TOURNAMENT_ID'
  AND team_id IS NULL
  AND player_id IS NOT NULL
  AND (metadata->>'category' IS NULL);

-- For Doubles (teams)
UPDATE registrations
SET metadata = jsonb_set(
  COALESCE(metadata, '{}'::jsonb),
  '{category}',
  '"doubles"'
)
WHERE tournament_id = 'YOUR_TOURNAMENT_ID'
  AND team_id IS NOT NULL
  AND (metadata->>'category' IS NULL);
```

Replace `'YOUR_TOURNAMENT_ID'` with your actual tournament ID.

### Solution 3: Verify Registration Form

Check `src/components/RegistrationForm.tsx` or manual participant forms:

Ensure the category dropdown/field is:
1. ✅ Present in the form
2. ✅ Required field
3. ✅ Saved to `metadata.category`
4. ✅ Values are: 'singles', 'doubles', or 'mixed' (lowercase)

---

## 🧪 Testing the Fix

### Test 1: Check Debug Page

1. Go to `/tournament/{id}/debug-categories`
2. Look at "Categories Detected" section
3. Should see: Singles, Doubles, Mixed (or whatever you have)
4. Each should show participant counts

### Test 2: Check Server Console

When you click "Automatic (All Categories)":
1. Open terminal/server logs
2. Look for "=== CATEGORY DETECTION DEBUG ==="
3. Verify each registration shows correct category
4. Confirm categoryMap lists all categories

### Test 3: Try Generation Again

After fixing metadata:
1. Click "Generate Fixtures"
2. Select "Automatic (All Categories)"
3. Should now see all 3 categories:
   - ✅ Doubles → 7 teams
   - ✅ Singles → 5 players
   - ✅ Mixed Doubles → 3 teams

---

## 📊 Expected vs Actual

### You Should See:

```
Categories Detected:

✅ Doubles → 7 teams (Can Generate)
✅ Singles → 5 players (Can Generate)
✅ Mixed Doubles → 3 teams (Can Generate)
```

### If You See:

```
Categories Detected:

⚠ Singles → 15 participants (Can Generate)
```

**This means:** All registrations are defaulting to 'singles' because metadata.category is missing!

---

## 🔍 Quick Check Query

Run this in Supabase SQL Editor to see current category distribution:

```sql
SELECT 
  metadata->>'category' as category,
  COUNT(*) as count,
  ARRAY_AGG(id) as registration_ids
FROM registrations
WHERE tournament_id = 'YOUR_TOURNAMENT_ID'
GROUP BY metadata->>'category'
ORDER BY count DESC;
```

Expected output:
```
category | count | registration_ids
---------|-------|------------------
doubles  |   7   | {uuid1, uuid2, ...}
singles  |   5   | {uuid3, uuid4, ...}
mixed    |   3   | {uuid5, uuid6, ...}
```

If you see:
```
category | count | registration_ids
---------|-------|------------------
NULL     |  15   | {all ids}
```

**Then the metadata is not being set!**

---

## 🛠️ Permanent Fix

### Update Registration Forms

Wherever participants register (RegistrationForm, ManualParticipantForm, bulk import):

1. **Ensure category field exists**
2. **Make it required**
3. **Save to metadata.category**

Example:
```typescript
const { data: registration } = await supabase
  .from('registrations')
  .insert({
    tournament_id: tournamentId,
    player_id: playerId,
    team_id: teamId,
    status: 'confirmed',
    metadata: {
      category: formData.category, // 'singles', 'doubles', or 'mixed'
      rating: formData.rating,
      gender: formData.gender,
    },
  });
```

---

## 🚀 Quick Fix for Your Current Tournament

### Option A: Via SQL (Fastest)

If you can identify which participants belong to which category, update them:

```sql
-- Update specific registrations by ID
UPDATE registrations
SET metadata = jsonb_build_object(
  'category', 'doubles',  -- Change this for each group
  'rating', metadata->>'rating',
  'gender', metadata->>'gender'
)
WHERE id IN (
  'registration-id-1',
  'registration-id-2',
  -- ... list IDs for doubles registrations
);
```

### Option B: Via Admin Panel (User-Friendly)

Create a temporary admin tool to bulk-update categories:
1. Show list of all registrations
2. Add category dropdown for each
3. Save updates to metadata

---

## 📖 Related Files to Check

1. **`src/components/RegistrationForm.tsx`** - Public registration form
2. **`src/components/ManualParticipantForm.tsx`** - Admin add participant form
3. **`src/app/api/tournaments/[id]/detect-categories/route.ts`** - Detection logic (now has debug logs)

---

## ✅ Verification Checklist

After fixing:

- [ ] Run debug page - see all 3 categories
- [ ] Check server logs - see category breakdown
- [ ] Run SQL query - see correct counts
- [ ] Test automatic generation - see all categories in confirmation modal
- [ ] Generate fixtures - all categories process successfully

---

## 💡 Pro Tip

**Before generating fixtures, always:**
1. Visit `/tournament/{id}/debug-categories`
2. Verify categories are detected correctly
3. Fix any missing category data
4. Then proceed with automatic generation

This saves time and ensures smooth generation!

---

## 🆘 Still Having Issues?

If categories still aren't detected:

1. **Check the debug page** - Shows exactly what's in the database
2. **Review server console** - See detailed logging
3. **Run SQL query** - Verify metadata structure
4. **Check registration flow** - Ensure category is being saved
5. **Contact support** with tournament ID and debug page screenshot

---

**Next Step:** Go to `/tournament/{your-tournament-id}/debug-categories` to see what's actually in your database!

