# Diagnose Multi-Category Fixture Generation Issue

## Problem
Fixtures are only being generated for one category (Singles) even though players are registered for multiple categories (Singles, Doubles, Mixed).

## Most Likely Cause
**Existing registrations don't have category metadata** because they were created before the RegistrationForm fix was implemented.

## How to Diagnose

### Step 1: Check Your Browser Console

1. Open your tournament page in the browser
2. Open Developer Tools (F12)
3. Go to the Console tab
4. Click "Generate Fixtures"
5. Look for the debug output:

```
=== FIXTURE GENERATION DEBUG ===
Total registrations: X
Registration 1: {
  id: "...",
  player_id: "...",
  metadata: { ... },
  category: "NOT SET" or "singles" or "doubles" or "mixed"
}
...
Grouped participants by category: ["singles"] or ["singles", "doubles", "mixed"]
=== END DEBUG ===
```

### Step 2: Use the Diagnostic API

**Check Categories:**
```bash
# Replace YOUR_TOURNAMENT_ID with your actual tournament ID
curl http://localhost:3000/api/tournaments/YOUR_TOURNAMENT_ID/registrations/check-categories
```

This will return:
```json
{
  "success": true,
  "totalRegistrations": 10,
  "categoryStats": {
    "singles": 5,
    "doubles": 3,
    "mixed": 2
  },
  "registrationsWithoutCategory": 0,
  "message": "✅ All registrations have category metadata set."
}
```

If you see `registrationsWithoutCategory > 0`, that's the problem!

## Solutions

### Solution 1: Fix Existing Registrations (Recommended)

**Option A: Using the Fix API**

```bash
# This will automatically set missing categories
curl -X POST http://localhost:3000/api/tournaments/YOUR_TOURNAMENT_ID/registrations/check-categories \
  -H "Content-Type: application/json" \
  -d '{
    "fixMissing": true,
    "defaultCategory": "singles"
  }'
```

**Option B: Using SQL (Direct Database)**

```sql
-- Update all registrations without category metadata
UPDATE registrations 
SET metadata = jsonb_set(
  COALESCE(metadata, '{}'::jsonb),
  '{category}',
  '"singles"'::jsonb
)
WHERE metadata IS NULL 
   OR metadata->>'category' IS NULL;

-- For team registrations, set to doubles
UPDATE registrations 
SET metadata = jsonb_set(
  COALESCE(metadata, '{}'::jsonb),
  '{category}',
  '"doubles"'::jsonb
)
WHERE team_id IS NOT NULL
  AND (metadata IS NULL OR metadata->>'category' IS NULL);
```

### Solution 2: Re-register Players (Fresh Start)

1. Go to "Manage Participants" for your tournament
2. Delete all existing participants
3. Click "Add Participant" for each player
4. The form now has Category field - select the correct category
5. Fill in all fields and submit
6. Repeat for all players across all categories
7. Generate fixtures again

### Solution 3: Manual Update via Participants Page

The "Add Participant" form (manual invite) already supports categories:

1. Go to `/tournament/YOUR_ID/participants`
2. Click "Add Participant"
3. For each player:
   - Enter email, name, gender, rating
   - **Select Category** (Singles/Doubles/Mixed)
   - If Doubles/Mixed, add partner email
   - Submit
4. The system will create registrations WITH proper metadata

## Verify the Fix

After applying any solution:

1. Check categories again:
   ```bash
   curl http://localhost:3000/api/tournaments/YOUR_TOURNAMENT_ID/registrations/check-categories
   ```

2. You should see:
   ```json
   {
     "categoryStats": {
       "singles": 5,
       "doubles": 3,
       "mixed": 2
     },
     "registrationsWithoutCategory": 0
   }
   ```

3. Delete old fixtures (if any):
   - Go to tournament fixtures tab
   - Click "Delete Fixtures" button

4. Generate fixtures with `replaceExisting: true`:
   - Click "Generate Fixtures"
   - The console should now show:
     ```
     Grouped participants by category: ["singles", "doubles", "mixed"]
     Category: singles { participantCount: 5, ... }
     Category: doubles { participantCount: 3, ... }
     Category: mixed { participantCount: 2, ... }
     ```

5. Check the fixtures page:
   - You should see category tabs at the top
   - Click each tab to view that category's bracket

## Common Issues

### Issue: "registrationsWithoutCategory" is > 0

**Fix:** Run the fix API or SQL update above

### Issue: All registrations show "singles" but I registered for doubles/mixed

**Root Cause:** You registered using the old RegistrationForm (before the fix)

**Fix:** 
- Option 1: Use SQL to update specific registrations:
  ```sql
  -- Update specific registration to doubles
  UPDATE registrations 
  SET metadata = jsonb_set(
    COALESCE(metadata, '{}'::jsonb),
    '{category}',
    '"doubles"'::jsonb
  )
  WHERE id = 'REGISTRATION_ID_HERE';
  ```
- Option 2: Delete and re-register those players

### Issue: Team registrations show category but no team_id

**Root Cause:** Doubles/Mixed registrations should have team_id, not player_id

**Fix:** This is a data integrity issue. Re-register these players using the correct flow:
1. Delete the broken registration
2. Use "Add Participant" with category = Doubles/Mixed
3. System will create team automatically

## Prevention

Going forward:
- ✅ New registrations via RegistrationForm will have categories (FIXED)
- ✅ Manual participant addition already has categories
- ✅ CSV import already supports categories
- ✅ Fixture generation correctly groups by category

The issue was only with the public RegistrationForm, which is now fixed!

## Quick Test

**Test with Fresh Data:**

1. Create a new test tournament
2. Register 2 players for Singles (using RegistrationForm)
3. Register 2 players for Doubles (using Add Participant)
4. Register 2 players for Mixed (using Add Participant)
5. Generate fixtures
6. You should see 3 category tabs with separate brackets

## Need Help?

If fixtures are still generating for only one category after:
- ✅ Checking the diagnostic output
- ✅ Verifying all registrations have categories
- ✅ Re-generating with replaceExisting=true

Then please share:
1. The console output from fixture generation
2. The response from the check-categories API
3. Screenshots of your participants page

---

**Expected Result After Fix:**

```
🎯 Fixture Generation Success!
   
   Categories Created: 3
   - Singles: 8 participants → 7 matches
   - Doubles: 6 teams → 5 matches  
   - Mixed: 4 teams → 3 matches
   
   Total: 15 matches across 3 brackets
```

