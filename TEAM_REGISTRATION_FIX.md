# Team Registration Issue - Category Detection Fix

## 🔍 Problem Identified

From the server logs:
```
Processing registration: category=doubles, isTeamBased=true, hasParticipant=false
Processing registration: category=mixed, isTeamBased=true, hasParticipant=false
```

**Issue:** Registrations have correct category metadata (doubles, mixed), but the associated **teams don't exist** in the database, so they're being skipped.

---

## 🎯 Root Cause

When participants register for doubles/mixed categories:
1. ✅ Registration is created with `metadata.category = 'doubles'` or `'mixed'`
2. ✅ Registration has `player_id` set
3. ❌ Registration has `team_id = NULL` (team not created)
4. ❌ System looks for `reg.team` but finds nothing
5. ❌ Registration is skipped for fixture generation

---

## 🔧 Solutions

### Solution 1: Update Detection Logic (Already Applied)

I've updated the code to handle registrations where:
- Category is 'doubles' or 'mixed'
- But team hasn't been created yet
- System now uses `player_id` as fallback

This allows fixture generation to proceed even if teams aren't formally created.

### Solution 2: Create Teams for Doubles/Mixed Registrations

Run this SQL to create teams for registrations that need them:

```sql
-- Create teams for doubles registrations that don't have teams
INSERT INTO teams (tournament_id, name, player1_id, player2_id)
SELECT 
  r.tournament_id,
  CONCAT(p.first_name, ' ', p.last_name, ' Team') as name,
  r.player_id as player1_id,
  NULL as player2_id -- Partner can be added later
FROM registrations r
INNER JOIN players p ON r.player_id = p.id
WHERE r.tournament_id = 'YOUR_TOURNAMENT_ID'
  AND r.metadata->>'category' IN ('doubles', 'mixed')
  AND r.team_id IS NULL
  AND r.player_id IS NOT NULL
ON CONFLICT DO NOTHING;

-- Now update the registrations to link to the newly created teams
UPDATE registrations r
SET team_id = t.id
FROM teams t
WHERE r.tournament_id = t.tournament_id
  AND r.player_id = t.player1_id
  AND r.team_id IS NULL
  AND r.metadata->>'category' IN ('doubles', 'mixed');
```

### Solution 3: Fix Registration Flow (Long-term)

Update registration forms to create teams immediately:

```typescript
// In RegistrationForm.tsx or ManualParticipantForm.tsx
if (category === 'doubles' || category === 'mixed') {
  // Create team first
  const { data: team } = await supabase
    .from('teams')
    .insert({
      tournament_id: tournamentId,
      name: `${firstName} ${lastName} Team`,
      player1_id: playerId,
      player2_id: partnerId || null, // Can be null initially
    })
    .select()
    .single();

  // Then create registration with team_id
  await supabase
    .from('registrations')
    .insert({
      tournament_id: tournamentId,
      player_id: playerId,
      team_id: team.id, // ← This is what's missing!
      metadata: { category, rating, gender },
      status: 'confirmed',
    });
}
```

---

## 🧪 Testing the Fix

### Test 1: Check Server Console

After my code update, when you click "Automatic", you should see:
```
singles: 5 participants
doubles: 7 participants  ← Should now appear!
mixed: 3 participants    ← Should now appear!
```

### Test 2: Check Detection API

Test the API directly:
```bash
curl -X GET "http://localhost:3000/api/tournaments/{tournament-id}/detect-categories" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Should return:
```json
{
  "categories": [
    { "category": "doubles", "participantCount": 7, "eligible": true },
    { "category": "singles", "participantCount": 5, "eligible": true },
    { "category": "mixed", "participantCount": 3, "eligible": true }
  ]
}
```

### Test 3: Try Automatic Generation

1. Click "Generate Fixtures"
2. Select "Automatic (All Categories)"
3. Should now show:
   ```
   ✅ Doubles → 7 participants
   ✅ Singles → 5 participants
   ✅ Mixed Doubles → 3 participants
   ```

---

## 📊 Current State Analysis

Based on your logs:

| Category | Registrations | Has Team? | Detected? |
|----------|---------------|-----------|-----------|
| Singles  | 5             | N/A (uses player) | ✅ Yes |
| Doubles  | 7             | ❌ No (team_id=NULL) | ❌ Was skipped |
| Mixed    | 3             | ❌ No (team_id=NULL) | ❌ Was skipped |

**With my fix:** All three should now be detected!

---

## 🚀 Quick Action

### Try Generation Again NOW:

1. **Hard refresh** your browser: `Ctrl + Shift + R`
2. **Click "Generate Fixtures"**
3. **Select "Automatic (All Categories)"**
4. **Check if you now see 3 categories!**

The code change I made should now:
- ✅ Detect doubles registrations (even without teams)
- ✅ Detect mixed registrations (even without teams)
- ✅ Use player_id as participant for team-based categories when team doesn't exist

---

## 🔄 Alternative: Create Teams First

If you want proper team records, run this SQL:

```sql
-- Check current state
SELECT 
  r.id,
  r.metadata->>'category' as category,
  r.player_id,
  r.team_id,
  p.first_name || ' ' || p.last_name as player_name
FROM registrations r
LEFT JOIN players p ON r.player_id = p.id
WHERE r.tournament_id = 'YOUR_TOURNAMENT_ID'
  AND r.metadata->>'category' IN ('doubles', 'mixed')
ORDER BY r.metadata->>'category';

-- Create placeholder teams for doubles/mixed without teams
DO $$
DECLARE
  reg RECORD;
  new_team_id UUID;
BEGIN
  FOR reg IN 
    SELECT r.id, r.tournament_id, r.player_id, r.metadata->>'category' as category, 
           p.first_name, p.last_name
    FROM registrations r
    INNER JOIN players p ON r.player_id = p.id
    WHERE r.tournament_id = 'YOUR_TOURNAMENT_ID'
      AND r.metadata->>'category' IN ('doubles', 'mixed')
      AND r.team_id IS NULL
  LOOP
    -- Create team
    INSERT INTO teams (tournament_id, name, player1_id)
    VALUES (reg.tournament_id, reg.first_name || ' ' || reg.last_name || ' Team', reg.player_id)
    RETURNING id INTO new_team_id;
    
    -- Update registration
    UPDATE registrations
    SET team_id = new_team_id
    WHERE id = reg.id;
    
    RAISE NOTICE 'Created team % for registration %', new_team_id, reg.id;
  END LOOP;
END $$;
```

---

## ✅ Expected Result

After the fix, detection should show:

```
=== CATEGORY DETECTION DEBUG ===
Processing registration: category=singles, hasParticipant=true
Processing registration: category=doubles, hasParticipant=true ← Fixed!
Processing registration: category=mixed, hasParticipant=true ← Fixed!
...
Category map after processing: ['singles', 'doubles', 'mixed']
singles: 5 participants
doubles: 7 participants
mixed: 3 participants
=== END DEBUG ===
```

---

**Try generating fixtures again now! The fix should allow all three categories to be detected.** 🎯
