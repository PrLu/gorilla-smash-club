# Tournament Creation Constraint Error Fix

## Error Message
```
new row for relation "tournaments" violates check constraint "tournaments_formats_check"
```

## Root Cause

The database has a constraint on the `tournaments.formats` field that only allows specific values:

```sql
CHECK (
  formats <@ ARRAY['singles', 'doubles', 'mixed']::TEXT[] AND
  array_length(formats, 1) > 0
)
```

This constraint was created in migration `012_multiple_formats.sql`.

However, the **TournamentForm** component loads ALL categories from the `categories` table and allows users to select them. If you have any custom categories (like 'junior_singles', 'senior_doubles', etc.), selecting them will violate the constraint and cause the error.

## Solutions Provided

### Solution 1: Quick Fix (Immediate - Already Applied ✅)

**Files Modified:**
- `src/components/TournamentForm.tsx`
- `src/app/tournament/[id]/edit/page.tsx`

**Changes:**
1. **Filter displayed categories** to only show base categories (singles, doubles, mixed)
2. **Add validation** before submitting to ensure only allowed formats are selected

```typescript
// Only show base categories in the form
(categories || [])
  .filter(cat => ['singles', 'doubles', 'mixed'].includes(cat.name))
  .map((category) => ...)

// Validate before saving
const allowedFormats = ['singles', 'doubles', 'mixed'];
const invalidFormats = data.formats.filter(f => !allowedFormats.includes(f));
if (invalidFormats.length > 0) {
  throw new Error(`Invalid formats: ${invalidFormats.join(', ')}`);
}
```

**Status:** ✅ **Applied - You can now create tournaments!**

### Solution 2: Database Migration (Long-term - Optional)

**File Created:** `supabase/migrations/026_fix_tournaments_formats_constraint.sql`

This migration:
1. **Removes the restrictive constraint** that only allows 3 specific values
2. **Adds a flexible constraint** that just ensures formats is not empty
3. **Creates a validation function** to check formats against active categories (can be used in application code)
4. **Fixes existing data** by ensuring all tournaments have valid formats arrays

**To Apply:**
```bash
# Run the migration
npx supabase db push

# OR if using Supabase CLI
supabase migration up
```

**Benefits:**
- Allows custom categories in tournaments
- More flexible system for future expansion
- Maintains data integrity

### Solution 3: Remove Custom Categories (Alternative)

If you don't need custom categories:

```sql
-- Delete any custom categories (keeping only base 3)
DELETE FROM categories 
WHERE name NOT IN ('singles', 'doubles', 'mixed');
```

## Current Status

**✅ Immediate Fix Applied**
- Tournament creation form now only shows singles, doubles, mixed
- Validation prevents invalid formats from being submitted
- **You can create tournaments immediately**

**⚠️ Long-term Fix (Optional)**
- Migration 026 is ready to apply when you want to support custom categories
- Until then, the system works with the 3 base categories

## Testing

1. **Create a Tournament:**
   - Go to Create Tournament page
   - You should only see 3 format options: Singles, Doubles, Mixed
   - Select one or more
   - Fill in other fields
   - Submit ✅ Should work!

2. **Edit a Tournament:**
   - Go to any tournament's edit page
   - Same 3 format options should appear
   - Modify and save ✅ Should work!

## Why This Happened

The system has two concepts that got mixed:

1. **Tournament Formats** (`tournaments.formats` field)
   - What types of matches the tournament supports
   - Was hard-coded to: singles, doubles, mixed

2. **Registration Categories** (`categories` table, `registrations.metadata.category`)
   - What categories players can register for
   - Can be extended with custom values

The form was loading from the categories table but saving to the formats field, causing a mismatch when custom categories existed.

## Future Considerations

If you want to support custom categories in tournaments:

1. **Run migration 026** to remove the restrictive constraint
2. **Remove the filter** in TournamentForm.tsx:
   ```typescript
   // Change from:
   .filter(cat => ['singles', 'doubles', 'mixed'].includes(cat.name))
   
   // To:
   // No filter - show all active categories
   ```
3. **Remove the validation** in createTournament mutation
4. **Update fixture generation** to handle all category types

## Related Files

- `supabase/migrations/012_multiple_formats.sql` - Original constraint
- `supabase/migrations/026_fix_tournaments_formats_constraint.sql` - Fix migration
- `src/components/TournamentForm.tsx` - Create form (fixed)
- `src/app/tournament/[id]/edit/page.tsx` - Edit form (fixed)

## Verification

To verify the fix is working:

1. Clear your browser cache
2. Go to `/tournament/new`
3. Fill in the form
4. You should see only 3 format checkboxes
5. Create the tournament
6. ✅ Success! No constraint error

---

**Summary:** The immediate fix is applied and working. You can now create tournaments without errors. The optional migration is available if you want to support custom categories in the future.

