# Debug Tournament: b2012f68-a1ad-4d0c-9208-bbdb1e3cd852

## 🔍 Diagnose Why Doubles Fixtures Are Missing

### Step 1: Run Comprehensive Debug

Open this URL in your browser:

```
http://localhost:3000/api/debug/tournament-fixtures?tournamentId=b2012f68-a1ad-4d0c-9208-bbdb1e3cd852
```

### Step 2: Interpret the Results

The debug endpoint will show you:

#### **Analysis Section:**
```json
{
  "analysis": {
    "registrations": {
      "singles": 8,     // Singles registrations
      "doubles": 6,     // Doubles registrations
      "mixed": 4        // Mixed registrations
    },
    "matches": {
      "singles": 15,    // Singles matches generated
      "doubles": 0,     // ⚠️ Doubles matches - should NOT be 0!
      "mixed": 8        // Mixed matches generated
    },
    "pools": {
      "singles": 2,     // Singles pools
      "doubles": 0,     // ⚠️ Doubles pools - should NOT be 0!
      "mixed": 2        // Mixed pools
    }
  },
  "diagnosis": {
    "hasDoublesRegistrations": true,
    "hasDoublesMatches": false,
    "issue": "⚠️ Doubles registrations exist but NO doubles matches generated!"
  }
}
```

### Step 3: Identify the Problem

#### **Scenario A: No Doubles Registrations**
```json
"registrations": {
  "doubles": 0  // ❌ No one registered for doubles
}
```
**Solution:** Players need to register for the doubles category first.

---

#### **Scenario B: Registrations Exist, No Fixtures**
```json
"registrations": {
  "doubles": 6  // ✅ People registered
},
"matches": {
  "doubles": 0  // ❌ But no fixtures generated!
}
```
**Problem:** Fixtures were not generated for doubles category.

**Possible Causes:**
1. Fixture generation didn't include doubles category
2. Registration metadata missing `category: 'doubles'`
3. Team IDs not properly created
4. Pools generated but matches not created

**Solutions:**

##### Solution 1: Check Registration Metadata
Look at the `breakdown.doublesRegistrations` in the debug output:
```json
"doublesRegistrations": [
  {
    "id": "...",
    "metadata": {
      "category": "doubles"  // ✅ Must be present
    },
    "team": {
      "player1": "Prem Kumar",  // ✅ Must exist
      "player2": "Rishab Singh" // ✅ Must exist
    }
  }
]
```

If `metadata.category` is missing or team players are "MISSING", that's the problem.

##### Solution 2: Regenerate Fixtures

1. **Delete Existing Fixtures** (if any):
   - Go to Fixtures tab
   - Click "Delete Fixtures" button
   - Confirm deletion

2. **Generate New Fixtures**:
   - Click "Generate Fixtures"
   - Choose "Automatic (All Categories)"
   - Select "Pool + Knockout"
   - Configure pool settings
   - Click "Generate for X Categories"

3. **Verify All Categories Selected**:
   - Make sure the generation modal shows ALL categories
   - Should say "Generate for 3 categories" (Singles, Doubles, Mixed)
   - If it only shows 1-2 categories, some registrations might be missing metadata

---

#### **Scenario C: Category Metadata Missing**
```json
"doublesRegistrations": [
  {
    "metadata": null  // ❌ No metadata!
    // OR
    "metadata": {}    // ❌ Empty metadata!
  }
]
```

**Problem:** Registrations don't have the `category` field in metadata.

**Fix in Supabase:**
```sql
-- Check current registrations
SELECT 
  id,
  player_id,
  team_id,
  metadata
FROM registrations
WHERE tournament_id = 'b2012f68-a1ad-4d0c-9208-bbdb1e3cd852'
  AND team_id IS NOT NULL;

-- If metadata is missing or doesn't have category, update:
UPDATE registrations
SET metadata = jsonb_set(
  COALESCE(metadata, '{}'::jsonb),
  '{category}',
  '"doubles"'
)
WHERE tournament_id = 'b2012f68-a1ad-4d0c-9208-bbdb1e3cd852'
  AND team_id IS NOT NULL
  AND (metadata->>'category' IS NULL OR metadata->>'category' = '');
```

---

#### **Scenario D: Court Field Missing Category**
```json
"doublesMatches": [
  {
    "court": "Pool A"  // ❌ Should be "DOUBLES - Pool A"
  }
]
```

**Problem:** Matches exist but `court` field doesn't include "DOUBLES" prefix.

**Check with:**
```sql
SELECT court, COUNT(*)
FROM matches
WHERE tournament_id = 'b2012f68-a1ad-4d0c-9208-bbdb1e3cd852'
GROUP BY court;
```

Expected:
- `SINGLES - Pool A`
- `DOUBLES - Pool A`
- `MIXED - Pool A`

If you see just `Pool A`, the category isn't being stored.

---

### Step 4: Quick Fixes

#### Fix 1: Ensure Teams Have Both Players
```sql
-- Check teams
SELECT 
  t.id,
  t.name,
  t.player1_id,
  t.player2_id,
  p1.first_name || ' ' || p1.last_name as player1,
  p2.first_name || ' ' || p2.last_name as player2
FROM teams t
LEFT JOIN players p1 ON t.player1_id = p1.id
LEFT JOIN players p2 ON t.player2_id = p2.id
WHERE t.tournament_id = 'b2012f68-a1ad-4d0c-9208-bbdb1e3cd852';

-- Update teams missing player2_id if needed
```

#### Fix 2: Regenerate Fixtures Cleanly
1. Delete all existing fixtures
2. Verify all registrations have proper metadata
3. Regenerate with "All Categories" option

#### Fix 3: Manual Pool Creation
If automatic generation fails, use Manual Pools:
1. Go to Fixtures → Manual Pool Setup
2. Create pools for Doubles category specifically
3. Assign doubles teams to pools
4. Generate pool fixtures

---

### Step 5: Verify After Fix

After applying fixes:

1. **Hard refresh browser** (Ctrl+Shift+R)

2. **Check Fixtures tab**:
   - Should see category filter: [All] [Singles] [Doubles] [Mixed]
   - Click "Doubles" - should show doubles matches

3. **Check Pool Standings**:
   - Should show doubles pools
   - Team names: "Prem & Rishab" format

4. **Run debug endpoint again**:
   ```
   http://localhost:3000/api/debug/tournament-fixtures?tournamentId=b2012f68-a1ad-4d0c-9208-bbdb1e3cd852
   ```
   - Should show `"doubles": X` in matches count (not 0)

---

## 🎯 Expected Output After Fix

### Fixtures Tab:
```
Category Filter: [All] [Singles] [Doubles] [Mixed]

↓ Click "Doubles" ↓

DOUBLES - Pool A
1. Prem & Rishab vs Kumar & Arun
2. Raj & Priya vs Sam & Rita
```

### Pool Standings:
```
DOUBLES - Pool A Standings
1. Prem & Rishab      3-0  ↑ ADV
2. Kumar & Arun       2-1  ↑ ADV
```

---

## 📞 Share Debug Results

**Please run the debug URL and share:**
1. The `analysis` section
2. The `diagnosis` section  
3. A sample from `doublesRegistrations`

This will help me identify the exact issue and provide a specific fix!




