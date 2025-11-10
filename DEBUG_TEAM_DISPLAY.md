# Debug Guide - Team Display Not Showing

## 🔍 Troubleshooting Steps

If you're still seeing single player names instead of "Player1 & Player2" in doubles/mixed matches, follow these steps:

### Step 1: Hard Refresh Browser
**Clear cache and reload:**
- **Chrome/Edge**: `Ctrl + Shift + R` or `Ctrl + F5`
- **Firefox**: `Ctrl + Shift + R`
- **Safari**: `Cmd + Shift + R`

### Step 2: Check Browser Console
1. Open Developer Tools (`F12`)
2. Go to Console tab
3. Look for any errors related to:
   - `getParticipantName`
   - Team data
   - Match data loading

### Step 3: Verify Data Structure
Open console and run:
```javascript
// Check if matches have team player data
const matches = document.querySelector('[data-matches]'); // Adjust selector
console.log('Match data:', matches);
```

### Step 4: Check Network Tab
1. Open Developer Tools (`F12`)
2. Go to Network tab
3. Reload page
4. Find the request to `/api/tournaments/[id]/matches`
5. Check the response - does it include team.player1 and team.player2?

Example expected response:
```json
{
  "team1": {
    "id": "xxx",
    "name": "Team A",
    "player1": {
      "first_name": "Prem",
      "last_name": "Kumar"
    },
    "player2": {
      "first_name": "Sneha",
      "last_name": "Reddy"
    }
  }
}
```

### Step 5: Restart Development Server
```bash
# Stop current server (Ctrl+C)
# Then restart:
npm run dev
```

### Step 6: Clear Next.js Cache
```bash
# Stop server, then:
rm -rf .next
npm run dev
```

## 🐛 Common Issues

### Issue 1: Import Not Applied
**Symptom:** Error: "getParticipantName is not defined"  
**Fix:** Check that all components import the helper:
```typescript
import { getParticipantName } from '@/lib/hooks/useMatches';
```

### Issue 2: Old Data Cached
**Symptom:** Still showing old format  
**Fix:** Hard refresh browser (Ctrl+Shift+R)

### Issue 3: Server Not Restarted
**Symptom:** Changes not visible  
**Fix:** Restart dev server

### Issue 4: Database Query Not Updated
**Symptom:** Team data missing player1/player2  
**Fix:** Check useMatches query includes player relations

## ✅ Verification Checklist

- [ ] Browser cache cleared (hard refresh)
- [ ] Development server restarted
- [ ] No console errors
- [ ] Import statement present in components
- [ ] Helper function exported from useMatches.ts
- [ ] Match data includes team.player1 and team.player2

## 🔍 Quick Test

Add this to your browser console to test the helper function:
```javascript
// Test the team display logic
const testTeam = {
  player1: { first_name: "Prem", last_name: "Kumar" },
  player2: { first_name: "Sneha", last_name: "Reddy" }
};

// Should show: "Prem Kumar & Sneha Reddy"
console.log(`${testTeam.player1.first_name} ${testTeam.player1.last_name} & ${testTeam.player2.first_name} ${testTeam.player2.last_name}`);
```

## 📞 Still Not Working?

If after all these steps you still see single names, please check:

1. **Which page are you on?**
   - Fixtures tab?
   - Knockouts tab?
   - Pool standings?

2. **What exactly do you see?**
   - Screenshot or exact text

3. **Console errors?**
   - Any red errors in browser console?

4. **Network response?**
   - Does the API return team player data?

This will help identify the specific issue.




