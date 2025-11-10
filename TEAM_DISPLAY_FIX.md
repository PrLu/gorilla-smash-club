# Team Display Name Fix

## ✅ COMPLETE - Doubles/Mixed Teams Now Show Both Partners

Fixed the display of team-based matches (Doubles, Mixed) to show both partners' names in the format **"Partner1 & Partner2"** instead of just showing a single name.

---

## 🎯 What Was Fixed

**Before:**
```
Doubles Match:
Player: Prem
vs
Player: Kumar
```

**After:**
```
Doubles Match:
Players: Prem & Sneha
vs
Players: Kumar & Arun
```

---

## 📁 Files Modified

### 1. **`src/lib/hooks/useMatches.ts`**

**Changes:**
- Updated `Match` interface to include `player1` and `player2` in team objects
- Enhanced query to fetch both players from teams table with proper foreign key relationships
- Added helper functions:
  - `getTeamDisplayName()` - Formats team as "Player1 & Player2"
  - `getParticipantName()` - Universal function to get participant name for singles or teams

**New Team Interface:**
```typescript
team1?: { 
  id: string; 
  name: string;
  player1?: { id: string; first_name: string; last_name: string } | null;
  player2?: { id: string; first_name: string; last_name: string } | null;
} | null;
```

**Helper Functions:**
```typescript
// Format team name to show both partners
export function getTeamDisplayName(team: Match['team1'] | Match['team2']): string {
  if (!team) return 'TBD';
  
  const player1Name = team.player1 
    ? `${team.player1.first_name} ${team.player1.last_name}`
    : null;
  const player2Name = team.player2 
    ? `${team.player2.first_name} ${team.player2.last_name}`
    : null;

  if (player1Name && player2Name) {
    return `${player1Name} & ${player2Name}`;
  }
  // Fallback logic...
}

// Get participant name (singles or team)
export function getParticipantName(match: Match, side: 1 | 2): string {
  // Handles both singles and teams automatically
}
```

---

### 2. **`src/components/FixturesViewer.tsx`**

**Changes:**
- Imported `getParticipantName` helper
- Replaced all manual player/team name formatting with helper function calls
- Updated both:
  - Match cards display
  - Match detail modal display

**Example Change:**
```typescript
// Before:
{match.player1 
  ? `${match.player1.first_name} ${match.player1.last_name}`
  : match.team1
  ? match.team1.name
  : 'TBD'}

// After:
{getParticipantName(match, 1)}
```

---

### 3. **`src/components/KnockoutsViewer.tsx`**

**Changes:**
- Imported `getParticipantName` helper
- Removed local `getPlayerName` function
- Updated all knockout match displays to use the helper

**Impact:**
- Knockout brackets now show "Player1 & Player2" for team matches
- Consistent display across all rounds (Quarter-Finals, Semi-Finals, Finals)

---

### 4. **`src/components/MatchScoringModal.tsx`**

**Changes:**
- Imported `getParticipantName` helper
- Updated player name display in scoring modal
- Simplified name logic from 3 lines to 1 line

**Before:**
```typescript
const player1Name = match?.player1 
  ? `${match.player1.first_name} ${match.player1.last_name}`
  : match?.team1?.name || 'Player 1';
```

**After:**
```typescript
const player1Name = match ? getParticipantName(match, 1) : 'Player 1';
```

---

### 5. **`src/app/api/tournaments/[id]/pools/standings/route.ts`**

**Changes:**
- Enhanced database query to fetch both `player1` and `player2` from teams
- Added team name formatting logic to show "Player1 & Player2"

**Query Update:**
```typescript
team:teams(
  id, 
  name,
  player1:players!teams_player1_id_fkey(id, first_name, last_name),
  player2:players!teams_player2_id_fkey(id, first_name, last_name)
)
```

**Formatting Logic:**
```typescript
if (player1Name && player2Name) {
  participantName = `${player1Name} & ${player2Name}`;
}
```

---

## 🎨 Where Team Names Now Display Correctly

### ✅ Fixtures Tab
- Pool matches show "Player1 & Player2" for teams
- Knockout matches show "Player1 & Player2" for teams
- Match detail modals show both partners

### ✅ Knockouts Tab
- All knockout rounds display both partners
- Match cards show full team composition
- Bracket progression shows complete team names

### ✅ Pool Standings
- Standings table shows "Player1 & Player2"
- Ranking displays both partners
- Advancement indicators show full team

### ✅ Match Scoring Modal
- Score entry shows both partners' names
- Clear identification of who you're entering scores for
- Works for both pool and knockout matches

---

## 🔧 Technical Details

### Database Relationships
```
teams table:
  - id
  - name
  - player1_id → players(id)
  - player2_id → players(id)

matches table:
  - team1_id → teams(id)
  - team2_id → teams(id)
```

### Query Performance
- Used proper Supabase foreign key relationships
- Single query fetches all necessary data
- No N+1 query issues
- Efficient nested selects

### Fallback Logic
The helper functions include smart fallbacks:
1. Try both player names → "Player1 & Player2"
2. If only player1 → "Player1"
3. If only player2 → "Player2"
4. If neither → Use team name
5. If no team → "TBD"

---

## 📊 Example Outputs

### Singles Match
```
Match 1:
  Arjun Kumar
  vs
  Riya Singh
```

### Doubles Match
```
Match 2:
  Prem & Sneha
  vs
  Kumar & Arun
```

### Mixed Doubles
```
Match 3:
  John & Sarah
  vs
  Mike & Emily
```

### Pool Standings (Doubles)
```
┌──────────────────────────────────────┐
│ Pool A Standings                     │
├──────────────────────────────────────┤
│ 1. Prem & Sneha      3-0  ↑ ADV     │
│ 2. Kumar & Arun      2-1  ↑ ADV     │
│ 3. Raj & Priya       1-2  ↓ OUT     │
│ 4. Sam & Rita        0-3  ↓ OUT     │
└──────────────────────────────────────┘
```

---

## ✅ Testing Checklist

- [x] Singles matches display correctly (unchanged)
- [x] Doubles matches show both partners
- [x] Mixed matches show both partners
- [x] Pool fixtures display team names correctly
- [x] Knockout fixtures display team names correctly
- [x] Pool standings show "Player1 & Player2"
- [x] Match scoring modal shows both partners
- [x] Match detail modal shows both partners
- [x] No duplicate team names
- [x] TBD placeholders work correctly
- [x] No linter errors
- [x] Database queries optimized

---

## 🎉 Benefits

1. **Clear Team Identification**
   - Users immediately see who's playing together
   - No confusion about team composition
   - Professional tournament display

2. **Consistent Format**
   - "Player1 & Player2" used everywhere
   - Single source of truth (helper functions)
   - Easy to maintain

3. **Better UX**
   - Participants can quickly find their matches
   - Spectators can follow their favorite teams
   - Organizers can verify team assignments

4. **Maintainable Code**
   - Centralized formatting logic
   - Reusable helper functions
   - Type-safe implementation

---

## 🚀 Usage

The fix is automatic - no configuration needed! 

**For Singles:**
- Still displays as individual names
- No changes to existing behavior

**For Doubles/Mixed:**
- Automatically detects team matches
- Displays "Partner1 & Partner2" format
- Works across all views and components

---

## 📝 Summary

All team-based matches (Doubles, Mixed) now properly display both partners' names in the format **"Partner1 & Partner2"** throughout the entire application:

✅ Fixture displays  
✅ Knockout brackets  
✅ Pool standings  
✅ Score entry  
✅ Match details  

The fix is comprehensive, type-safe, and maintains backward compatibility with singles matches.




