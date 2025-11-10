# Check Your Tournament Data

## 🔍 Diagnose the Issue

The code is correct, but your existing tournament data might have teams without both players assigned.

### Step 1: Check Team Data

I've created a debug endpoint. Open this URL in your browser (replace with your actual tournament ID):

```
http://localhost:3000/api/debug/check-team-data?tournamentId=YOUR_TOURNAMENT_ID
```

**Example:**
```
http://localhost:3000/api/debug/check-team-data?tournamentId=123e4567-e89b-12d3-a456-426614174000
```

### Step 2: Interpret the Results

The response will show:

```json
{
  "analysis": {
    "totalMatches": 20,
    "teamMatches": 20,
    "totalTeams": 8,
    "teamsWithBothPlayers": 4,     // ✅ Good - shows "Prem & Rishab"
    "teamsWithOnlyPlayer1": 3,      // ⚠️ Shows "Prem & Partner"
    "teamsWithOnlyPlayer2": 1,      // ⚠️ Shows "Partner & Rishab"
    "teamsWithNoPlayers": 0         // ❌ Shows "Team" (team name only)
  },
  "teams": [
    {
      "id": "...",
      "name": "Team A",
      "player1": "Prem Kumar",       // ✅ Has player 1
      "player2": "MISSING",          // ❌ Missing player 2
      "hasPlayer1Id": true,
      "hasPlayer2Id": false          // This is the problem!
    }
  ]
}
```

### Step 3: Fix Based on Results

#### Problem: Teams Missing Player Data

If you see teams with "MISSING" players, the issue is in your database, not the code.

**Possible Causes:**
1. Teams were created before player2 was assigned
2. Registration didn't properly link both players to the team
3. Partner hasn't registered yet

**Solutions:**

##### Option A: Check Registration Data
```sql
-- In Supabase SQL Editor
SELECT 
  r.id,
  r.metadata->>'category' as category,
  r.metadata->>'partner_email' as partner_email,
  r.player_id,
  r.team_id,
  t.name as team_name,
  t.player1_id,
  t.player2_id,
  p1.first_name || ' ' || p1.last_name as player1_name,
  p2.first_name || ' ' || p2.last_name as player2_name
FROM registrations r
LEFT JOIN teams t ON r.team_id = t.id
LEFT JOIN players p1 ON t.player1_id = p1.id
LEFT JOIN players p2 ON t.player2_id = p2.id
WHERE r.tournament_id = 'YOUR_TOURNAMENT_ID'
  AND r.metadata->>'category' IN ('doubles', 'mixed');
```

##### Option B: Manually Fix Teams (if needed)
```sql
-- Update a team to add missing player2
UPDATE teams
SET player2_id = 'PLAYER_ID_HERE'
WHERE id = 'TEAM_ID_HERE';
```

##### Option C: Regenerate Fixtures
If the teams are fundamentally broken, you might need to:
1. Delete existing fixtures
2. Ensure all teams have both players assigned
3. Regenerate fixtures

### Step 4: Verify the Fix

After fixing team data, refresh your browser and check:

**Pool Standings should show:**
```
1. Prem Kumar & Rishab Singh    3-0  ↑ ADV
2. Arjun Patel & Sneha Reddy    2-1  ↑ ADV
```

**Pool Matches should show:**
```
Match 1:
  Prem Kumar & Rishab Singh
  vs
  Arjun Patel & Sneha Reddy
```

### Step 5: Test with New Tournament

To verify the code works correctly:

1. Create a **new test tournament**
2. Register teams with both players properly assigned
3. Generate fixtures
4. Check if names display as "Player1 & Player2"

If new tournaments work correctly but old ones don't, the issue is definitely in your existing data.

---

## 🐛 Common Data Issues

### Issue 1: Teams Created Without player2_id
**Symptom:** Shows "Prem & Partner"  
**Cause:** team.player2_id is NULL  
**Fix:** Assign player2_id to the team

### Issue 2: Partner Hasn't Registered
**Symptom:** Shows "Prem & Partner"  
**Cause:** Partner email provided but partner hasn't signed up  
**Fix:** Either manually create player record or wait for partner signup

### Issue 3: Team Name Used Instead
**Symptom:** Shows just "Team A"  
**Cause:** Both player1_id and player2_id are NULL  
**Fix:** Assign both players to the team

---

## 🔧 Quick Fix Script

If you need to fix multiple teams at once, here's a script:

```sql
-- Find all teams with missing players
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
WHERE t.tournament_id = 'YOUR_TOURNAMENT_ID'
  AND (t.player1_id IS NULL OR t.player2_id IS NULL);
```

---

## ✅ Verification Checklist

After fixing data:

- [ ] Check debug endpoint - all teams have both players
- [ ] Hard refresh browser (Ctrl+Shift+R)
- [ ] Check Fixtures tab → Pool Matches
- [ ] Check Fixtures tab → Pool Standings  
- [ ] Check Knockouts tab
- [ ] See "Player1 & Player2" format everywhere

---

## 📞 Next Steps

1. **Run the debug endpoint** with your tournament ID
2. **Share the results** with me if you need help interpreting
3. **Fix the team data** if players are missing
4. **Test with a new tournament** to verify the code works

The display code is working correctly - it's showing "Player1 & Player2" when both players exist, and "Player1 & Partner" when player2 is missing. We just need to ensure your team data is complete!




