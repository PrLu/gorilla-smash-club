# Fix Doubles Matches for Tournament b2012f68

## 🎯 The Problem (Identified)

Your tournament has:
- ✅ 17 doubles registrations
- ✅ 4 doubles pools (Pool A, B, C, D)  
- ❌ **0 doubles matches** - This is the problem!

The fixture generation created the pools but didn't generate the round-robin matches within those pools.

## 🔧 Solution: Generate Missing Matches

### Option 1: Automated Fix (RECOMMENDED)

I've created a fix endpoint that will generate all the missing pool matches.

**Run this command in your browser console (F12) or use a tool like Postman:**

```javascript
fetch('http://localhost:3000/api/debug/fix-doubles-matches', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    tournamentId: 'b2012f68-a1ad-4d0c-9208-bbdb1e3cd852'
  })
})
.then(res => res.json())
.then(data => console.log('Result:', data));
```

**Or use curl:**
```bash
curl -X POST http://localhost:3000/api/debug/fix-doubles-matches \
  -H "Content-Type: application/json" \
  -d '{"tournamentId":"b2012f68-a1ad-4d0c-9208-bbdb1e3cd852"}'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Generated 40 doubles pool matches",
  "matchesCreated": 40,
  "poolsSummary": [
    {
      "pool": "Pool A",
      "participants": 5,
      "matchesCreated": 10,
      "status": "Matches generated"
    },
    // ... more pools
  ]
}
```

### Option 2: Manual Fix in Supabase

If the automated fix doesn't work, you can manually run this SQL:

```sql
-- First, check pool_players assignments
SELECT 
  p.name as pool_name,
  p.category,
  COUNT(pp.id) as player_count
FROM pools p
LEFT JOIN pool_players pp ON p.id = pp.pool_id
WHERE p.tournament_id = 'b2012f68-a1ad-4d0c-9208-bbdb1e3cd852'
  AND p.category = 'DOUBLES'
GROUP BY p.id, p.name, p.category;

-- Generate round-robin matches for each doubles pool
-- This is complex SQL, so it's better to use the automated fix above
```

### Option 3: Delete & Regenerate Everything

If you want a clean slate:

1. **Delete existing fixtures**:
   - Go to tournament page
   - Click "Delete Fixtures" button
   - This will delete pools and matches

2. **Regenerate properly**:
   - Click "Generate Fixtures"
   - Choose "Automatic (All Categories)"
   - Select "Pool + Knockout"
   - Click "Generate for 3 Categories"

⚠️ **Before regenerating, fix the team issue (see below)**

---

## 🔍 Secondary Issue: Missing Teams

I also noticed that **most doubles registrations don't have teams created**.

Looking at your data:
```json
"doublesRegistrations": [
  {
    "player": "Varun Mehta",
    "team": null,  // ❌ No team!
    "metadata": {
      "category": "doubles",
      "partner_email": "siddhaarth.joshi@gmail.com",
      "partner_display_name": "Siddhartah Joshi"
    }
  }
]
```

Only 1 out of 17 doubles registrations has an actual team. The rest have partner info in metadata but no team_id.

### Why This Matters

Without proper teams:
- Matches might be created with `player_id` instead of `team_id`
- Display will show single names instead of "Player1 & Player2"
- Pool standings won't work correctly

### Fix Teams

You need to create teams from the partner metadata. Here's a SQL script:

```sql
-- Check registrations without teams
SELECT 
  r.id as registration_id,
  p.first_name || ' ' || p.last_name as player,
  r.metadata->>'partner_display_name' as partner,
  r.metadata->>'partner_email' as partner_email,
  r.team_id
FROM registrations r
JOIN players p ON r.player_id = p.id
WHERE r.tournament_id = 'b2012f68-a1ad-4d0c-9208-bbdb1e3cd852'
  AND r.metadata->>'category' = 'doubles'
  AND r.team_id IS NULL;

-- You'll need to manually create teams for these registrations
-- Or better: delete and have players re-register properly
```

---

## ✅ Complete Fix Procedure

### Step 1: Fix Doubles Matches (Immediate)

Run the automated fix endpoint to generate missing matches:
```javascript
fetch('http://localhost:3000/api/debug/fix-doubles-matches', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    tournamentId: 'b2012f68-a1ad-4d0c-9208-bbdb1e3cd852'
  })
})
.then(res => res.json())
.then(data => console.log('Result:', data));
```

### Step 2: Verify Matches Created

1. Hard refresh your browser (Ctrl+Shift+R)
2. Go to Fixtures tab
3. Click category filter → "Doubles"
4. You should now see doubles pool matches!

### Step 3: Check Pool Standings

1. In Fixtures tab, click "Pool Standings" toggle
2. Filter by "Doubles"
3. You should see doubles pools with participants

⚠️ **If names still show as single players instead of "Player & Partner":**
- This is because most registrations don't have proper teams
- The matches might be using player_id instead of team_id
- You might need to regenerate everything properly

### Step 4: Long-term Fix (Optional)

For future tournaments or if you want to fix this properly:

1. **Delete this tournament's fixtures completely**
2. **Fix registrations to create proper teams**:
   - Either manually create teams in Supabase
   - Or have players re-register
3. **Regenerate fixtures** with proper team data

---

## 🎯 Expected Result After Fix

### Fixtures Tab - Doubles Filter:
```
DOUBLES - Pool A
┌────────────────────────────────┐
│ Match 1: Pending               │
│ Player 1 vs Player 2           │  ← Will show single names if teams missing
│ or                             │
│ Varun & Siddharth vs Pair 2    │  ← Ideal if teams proper
└────────────────────────────────┘
```

### Pool Standings:
```
DOUBLES - Pool A Standings
1. Participant 1    0-0  ↑ ADV
2. Participant 2    0-0  ↑ ADV
```

---

## 📞 Next Steps

1. **Run the fix endpoint** (Option 1 above)
2. **Hard refresh browser**
3. **Check Fixtures tab → Doubles**
4. **Let me know** if:
   - Matches appear ✅
   - Names show correctly
   - Any errors occur

If matches appear but names are still wrong, we'll need to fix the team data separately.




