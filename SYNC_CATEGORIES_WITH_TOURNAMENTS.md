# Synchronize Tournament Formats with Master Data Categories

## Issue

Tournament formats and master data categories are **not synchronized**:

- **Master Data Categories**: Dynamic, customizable, managed by admins
- **Tournament Formats**: Hard-coded constraint limiting to only ['singles', 'doubles', 'mixed']

This defeats the purpose of having a flexible categories system!

## Root Cause

1. Migration `012_multiple_formats.sql` added a restrictive constraint:
```sql
ALTER TABLE tournaments
  ADD CONSTRAINT tournaments_formats_check 
  CHECK (
    formats <@ ARRAY['singles', 'doubles', 'mixed']::TEXT[]
  );
```

2. This constraint was created before the master data categories system
3. Now the form loads from `categories` table but can't save non-base categories

## Solution Steps

### Step 1: Apply Migration 026

This removes the restrictive constraint and allows any category:

**Option A: Using Supabase CLI**
```bash
# PowerShell
cd D:\reCon\cursor-ai\gorilla-smash-club
.\node_modules\.bin\supabase db push
```

**Option B: Run SQL Directly**

Execute this in your Supabase SQL Editor:

```sql
-- Drop the old restrictive constraint
ALTER TABLE public.tournaments
  DROP CONSTRAINT IF EXISTS tournaments_formats_check;

-- Add new flexible constraint
ALTER TABLE public.tournaments
  ADD CONSTRAINT tournaments_formats_check 
  CHECK (
    formats IS NOT NULL AND
    array_length(formats, 1) > 0
  );

-- Fix any existing data
UPDATE public.tournaments
SET formats = ARRAY['singles']::TEXT[]
WHERE formats IS NULL OR array_length(formats, 1) IS NULL OR array_length(formats, 1) = 0;
```

### Step 2: Remove Filters from Forms

Once migration 026 is applied, remove the temporary filters:

**File: `src/components/TournamentForm.tsx`**

Remove this filter (around line 206-207):
```typescript
// REMOVE THIS LINE:
.filter(cat => ['singles', 'doubles', 'mixed'].includes(cat.name))
```

So it becomes:
```typescript
) : (
  (categories || [])
    // Filter removed - show ALL active categories
    .map((category) => (
```

**File: `src/app/tournament/[id]/edit/page.tsx`**

Remove the same filter (around line 199-200):
```typescript
// REMOVE THIS LINE:
.filter(cat => ['singles', 'doubles', 'mixed'].includes(cat.name))
```

### Step 3: Remove Validation in TournamentForm

Remove the hardcoded validation (around line 90-96):

```typescript
// REMOVE THESE LINES:
const allowedFormats = ['singles', 'doubles', 'mixed'];
const invalidFormats = data.formats.filter(f => !allowedFormats.includes(f));
if (invalidFormats.length > 0) {
  throw new Error(`Invalid formats: ${invalidFormats.join(', ')}`);
}
```

### Step 4: Add Dynamic Validation (Optional)

Replace the hardcoded validation with dynamic validation:

```typescript
// Add after checking if formats is empty:

// Validate formats against active categories from master data
const { data: activeCategories } = await supabase
  .from('categories')
  .select('name')
  .eq('is_active', true);

const validCategoryNames = activeCategories?.map(c => c.name) || [];
const invalidFormats = data.formats.filter(f => !validCategoryNames.includes(f));

if (invalidFormats.length > 0) {
  throw new Error(`Invalid formats: ${invalidFormats.join(', ')}. Please select from available categories.`);
}
```

## Expected Behavior After Fix

### Master Data Categories Page
Admin can add custom categories like:
- `junior_singles` - Junior Singles (U18)
- `senior_doubles` - Senior Doubles (50+)
- `pro_mixed` - Professional Mixed Doubles

### Tournament Creation
Form automatically shows ALL active categories:
- ✅ Singles
- ✅ Doubles
- ✅ Mixed Doubles
- ✅ Junior Singles (if added in master data)
- ✅ Senior Doubles (if added in master data)
- ✅ Pro Mixed (if added in master data)

### Registration & Fixtures
- Players can register for any category offered by the tournament
- Fixtures are generated separately for each category
- Everything stays synchronized! ✅

## Benefits

1. **True Flexibility**: Add categories without code changes
2. **Consistent**: One source of truth (categories table)
3. **Scalable**: Easy to add age groups, skill levels, etc.
4. **Maintainable**: No hardcoded lists to update

## Testing After Fix

1. **Add a custom category**:
   - Go to `/settings/master-data`
   - Add "Junior Singles (U18)"
   - Mark as active

2. **Create tournament**:
   - Go to `/tournament/new`
   - You should see "Junior Singles (U18)" in the format list
   - Select it along with other formats
   - Submit ✅ Should work!

3. **Register players**:
   - Players can register for Junior Singles
   - Their registration metadata.category = 'junior_singles'

4. **Generate fixtures**:
   - Fixtures created for each category including Junior Singles
   - Category tabs appear for all selected formats

## Migration Status

**Migration 026**: `supabase/migrations/026_fix_tournaments_formats_constraint.sql`

Status: ⏳ **Ready to apply**

To check if already applied:
```sql
-- Check current constraint
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conname = 'tournaments_formats_check';
```

If it shows the old restrictive constraint, run migration 026.

## Quick Commands

### Check current categories:
```sql
SELECT name, display_name, is_active 
FROM categories 
ORDER BY sort_order;
```

### Check tournament formats:
```sql
SELECT id, title, formats 
FROM tournaments 
ORDER BY created_at DESC 
LIMIT 10;
```

### Test constraint:
```sql
-- This should FAIL with old constraint:
INSERT INTO tournaments (
  title, start_date, end_date, location, 
  formats, organizer_id
) VALUES (
  'Test', NOW(), NOW(), 'Test Location',
  ARRAY['junior_singles']::TEXT[], 
  'YOUR_USER_ID'
);

-- This should SUCCEED with new constraint:
-- (Because array is not empty)
```

---

## Summary

**Current State**: Tournament formats are restricted to 3 hardcoded values, ignoring master data categories.

**Desired State**: Tournament formats sync with active categories from master data.

**Fix**: 
1. Apply migration 026 (remove restrictive constraint)
2. Remove temporary filters from forms
3. System now uses dynamic categories everywhere ✅

This makes the system consistent and truly flexible!

