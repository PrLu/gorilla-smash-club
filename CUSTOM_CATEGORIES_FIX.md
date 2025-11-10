# Custom Category Fixture Generation Fix

## Problem

Fixture generation was failing to create pools for custom team-based categories like:
- "doubles & k_db"
- "team events"
- "mojo_dojo"
- "k_db"

The system was correctly generating fixtures for standard categories (singles, doubles, mixed), but custom categories were being treated as individual (singles) categories instead of team-based categories.

## Root Cause

The `groupByDivision` function in `generate-fixtures/route.ts` had a **hardcoded check** to determine if a category was team-based:

```typescript
// OLD CODE (WRONG):
const isThisTeamBased = category === 'doubles' || category === 'mixed';
```

This hardcoded check only recognized "doubles" and "mixed" as team-based categories. Any custom categories configured in the `categories` table were not recognized, even if they had `is_team_based = true` in the database.

### Impact

When custom team-based categories weren't recognized:
1. System tried to use `player_id` instead of `team_id` for participants
2. Pool generation logic failed or skipped these categories
3. Fixtures were not created for these categories
4. Users saw missing categories in the fixtures view

## Solution Applied ✅

### 1. Updated `groupByDivision` Function

**File:** `src/app/api/tournaments/[id]/generate-fixtures/route.ts`

**Changes:**
- Added `categoryMetadata` parameter to function signature
- Updated team-based detection to use database metadata
- Added fallback to hardcoded check for backward compatibility

```typescript
// NEW CODE (CORRECT):
function groupByDivision(registrations: any[], categoryMetadata: Map<string, boolean>) {
  // ...
  
  // Determine if this specific registration is team-based using category metadata
  // Default to checking name if metadata not found (backward compatibility)
  const isThisTeamBased = categoryMetadata.has(category) 
    ? categoryMetadata.get(category)!  // Use database value
    : (category === 'doubles' || category === 'mixed');  // Fallback for backward compatibility
}
```

### 2. Fetch Category Metadata from Database

**Added code in POST function:**

```typescript
// Fetch category metadata to determine which categories are team-based
const uniqueCategories = [...new Set(registrations.map(r => r.metadata?.category || 'singles'))];
console.log('Unique categories in registrations:', uniqueCategories);

const { data: categoryData } = await supabase
  .from('categories')
  .select('name, is_team_based')
  .in('name', uniqueCategories);

const categoryMetadata = new Map<string, boolean>();
categoryData?.forEach(cat => {
  categoryMetadata.set(cat.name, cat.is_team_based);
});
console.log('Category metadata fetched:', Array.from(categoryMetadata.entries()));
```

### 3. Enhanced Logging

Added comprehensive console logs to show:
- Which categories are detected
- Whether each category is team-based
- Whether the info comes from database or fallback

```typescript
console.log('\nCategory metadata from database:');
categoryMetadata.forEach((isTeamBased, categoryName) => {
  console.log(`  - ${categoryName}: ${isTeamBased ? '👥 TEAM-BASED' : '👤 INDIVIDUAL'}`);
});
```

## Testing

After this fix, when you generate fixtures, you should see in the console:

```
Category metadata from database:
  - singles: 👤 INDIVIDUAL
  - doubles: 👥 TEAM-BASED
  - mojo_dojo: 👥 TEAM-BASED
  - k_db: 👥 TEAM-BASED
  - team events: 👥 TEAM-BASED

Category "k_db" is 👥 TEAM-BASED (from database)
Category "team events" is 👥 TEAM-BASED (from database)
```

## Benefits

✅ **Dynamic Category Support**: System now respects `is_team_based` flag from `categories` table  
✅ **Custom Categories Work**: Any custom team category will be handled correctly  
✅ **Pool Generation**: Team-based custom categories will now get pool generation  
✅ **Backward Compatible**: Falls back to hardcoded check if category not in database  
✅ **Better Debugging**: Enhanced logs show category detection source

## What You Should See Now

When you generate fixtures with "Pool + Knockout":

1. **All Categories Listed**: Including custom ones like "doubles & k_db", "team events"
2. **Pools Created**: Each team-based category gets proper pool allocation
3. **Correct Participant IDs**: Team IDs used for team categories, player IDs for singles
4. **Console Logs**: Clear indication of which categories are team-based

## Next Steps

1. **Regenerate fixtures** for your tournament
2. **Check console logs** to verify all categories are detected as team-based
3. **Verify pools** are created for all categories in the UI
4. **Confirm matches** are generated for each category

## Related Files Modified

- `src/app/api/tournaments/[id]/generate-fixtures/route.ts` - Main fix

## Database Schema Reference

The fix leverages the existing `categories` table schema:

```sql
CREATE TABLE public.categories (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  description TEXT,
  is_team_based BOOLEAN NOT NULL DEFAULT false,  -- ← This field is now used!
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

Make sure your custom categories have the correct `is_team_based` value set!


