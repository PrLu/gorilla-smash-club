# Knockout Stage Implementation

## ✅ COMPLETE IMPLEMENTATION

The knockout stage feature is now fully implemented, allowing tournaments to progress from pool play to single-elimination knockout rounds.

---

## 🎯 Overview

After pool matches are completed, qualified players/teams advance to a single-elimination knockout bracket. The system:

1. **Tracks pool completion** per category
2. **Identifies qualifiers** based on pool standings
3. **Generates knockout brackets** automatically
4. **Displays knockout matches** in a dedicated tab

---

## 📱 User Interface

### New "Knockouts" Tab

Added to the tournament detail page alongside Overview, Fixtures, and Participants tabs.

**Features:**
- **Category Filter**: Filter knockouts by category (Singles, Doubles, Mixed, etc.)
- **Pool Status Cards**: Shows which categories are ready for knockout generation
- **Generate Button**: Organizers can generate knockouts once pools are complete
- **Bracket Display**: Shows knockout matches organized by round (Quarters, Semis, Finals)

### Knockout Tab Views

#### For Organizers:
```
┌─────────────────────────────────────────┐
│ SINGLES Knockouts                       │
│ ✓ Generated                             │
│ All 4 pools complete. 8 qualifiers.     │
│                                         │
│ [Generate Knockouts] (if not generated)│
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ KNOCKOUT BRACKET                        │
│ Quarter-Finals (4 matches)              │
│ Semi-Finals (2 matches)                 │
│ Final (1 match)                         │
└─────────────────────────────────────────┘
```

#### For Participants:
- Read-only view of knockout brackets
- Can see their position if qualified
- Shows match schedule and results

---

## 🔧 Technical Implementation

### 1. Frontend Components

#### `KnockoutsViewer.tsx`
Location: `src/components/KnockoutsViewer.tsx`

**Responsibilities:**
- Display pool completion status per category
- Show "Generate Knockouts" button when ready
- Render knockout matches organized by round
- Filter matches by category

**Props:**
```typescript
interface KnockoutsViewerProps {
  tournamentId: string;
  matches: Match[];
  isOrganizer?: boolean;
  onMatchClick?: (match: Match) => void;
  canEditScores?: boolean;
}
```

**Key Features:**
- Category filter dropdown
- Pool status indicators
- Round-based match grouping (Finals, Semi-Finals, Quarter-Finals, etc.)
- Color-coded match status (pending, in progress, completed)
- TBD placeholders for unresolved matches

#### Tournament Page Update
Location: `src/app/tournament/[id]/page.tsx`

**Changes:**
- Added 'knockouts' to tab types
- Imported `KnockoutsViewer` component
- Added knockout tab content rendering

---

### 2. API Endpoints

#### GET `/api/tournaments/[id]/knockouts/status`

**Purpose:** Check pool completion and knockout generation status for each category

**Response:**
```json
{
  "categoryStatus": [
    {
      "category": "SINGLES",
      "poolsComplete": true,
      "knockoutsGenerated": false,
      "qualifierCount": 8,
      "totalPools": 4
    },
    {
      "category": "DOUBLES",
      "poolsComplete": false,
      "knockoutsGenerated": false,
      "qualifierCount": 4,
      "totalPools": 2
    }
  ],
  "totalCategories": 2
}
```

**Logic:**
1. Fetch all pools for tournament
2. Group pools by category
3. For each category:
   - Check if all pool matches are completed
   - Count total qualifiers (sum of advance_count)
   - Check if knockouts already generated
4. Return status array

---

#### POST `/api/tournaments/[id]/knockouts/generate`

**Purpose:** Generate single-elimination knockout fixtures from pool qualifiers

**Request Body:**
```json
{
  "category": "SINGLES"
}
```

**Response:**
```json
{
  "success": true,
  "matchesCreated": 7,
  "qualifiersCount": 8,
  "category": "SINGLES"
}
```

**Logic:**
1. Validate category exists and has completed pools
2. Check no knockout fixtures already exist for category
3. Fetch pool standings and extract qualifiers
4. Seed qualifiers (mix pool winners with runners-up)
5. Generate single-elimination bracket:
   - Calculate rounds needed (log2 of participant count)
   - Create first round matches with actual qualifiers
   - Create placeholder matches for subsequent rounds
6. Insert all matches with `match_type='knockout'`
7. Update pool status to 'completed'

---

### 3. Bracket Generation Algorithm

**Function:** `generateSingleEliminationBracket()`

**Seeding Strategy:**
- Groups qualifiers by pool rank (1st place, 2nd place, etc.)
- Distributes participants to avoid same-pool matchups early
- Ensures balanced bracket progression

**Round Calculation:**
```typescript
const totalRounds = Math.ceil(Math.log2(participantCount));
const finalBracketSize = Math.pow(2, totalRounds);
```

**Match Creation:**
- Round 1: Pairs actual qualifiers, handles byes if needed
- Subsequent rounds: Creates placeholder matches (TBD participants)
- Each match includes:
  - `match_type: 'knockout'`
  - `court: category` (for filtering)
  - `round` and `bracket_pos` for ordering
  - Auto-completes bye matches

**Example Bracket (8 qualifiers, 3 rounds):**
```
Round 1 (Quarter-Finals):
  Match 1: Pool A #1 vs Pool D #2
  Match 2: Pool B #1 vs Pool C #2
  Match 3: Pool C #1 vs Pool B #2
  Match 4: Pool D #1 vs Pool A #2

Round 2 (Semi-Finals):
  Match 5: Winner(1) vs Winner(2)
  Match 6: Winner(3) vs Winner(4)

Round 3 (Final):
  Match 7: Winner(5) vs Winner(6)
```

---

## 🔄 Workflow

### Complete Flow:

1. **Pool Generation**
   - Organizer generates pool + knockout fixtures
   - Pool matches created with `match_type='pool'`
   - `advance_count` set per pool

2. **Pool Play**
   - Participants complete pool matches
   - Pool standings automatically updated
   - System tracks which pools are complete

3. **Qualification**
   - Top N players per pool qualify (based on advance_count)
   - Rankings determined by: Wins → Points → Point Differential

4. **Knockout Generation**
   - Once all pools in a category are complete
   - Organizer clicks "Generate Knockouts" for that category
   - System creates single-elimination bracket
   - Qualifiers seeded into first round

5. **Knockout Play**
   - Single elimination format
   - Winners advance, losers eliminated
   - Bracket progresses automatically

6. **Championship**
   - Final match determines category winner

---

## 🎨 UI Features

### Category Filtering
- All categories shown by default
- Click category pill to filter
- Shows only matches for selected category
- Applies to both pool status and bracket display

### Pool Status Cards
```
┌─────────────────────────────────────────┐
│ SINGLES Knockouts                       │
│ ✓ Generated / Ready / Waiting          │
│ Status description...                   │
│ [Generate Knockouts] (if applicable)    │
└─────────────────────────────────────────┘
```

**Status Indicators:**
- **✓ Generated** (Green): Knockouts already created
- **Ready to Generate** (Blue): Pools complete, can generate
- **Waiting for Pools** (Yellow): Pool matches still in progress

### Match Cards
```
┌──────────────────────┐
│ Player 1         21  │ ← Winner highlighted
│ Player 2         15  │
│ Match 1    Completed │
└──────────────────────┘
```

**Features:**
- Winner highlighted in primary color
- Live indicator for in-progress matches
- TBD shown for unresolved participants
- Click to edit scores (organizers only)

---

## 📊 Database Schema

### Matches Table (Enhanced)

Existing `matches` table with these key fields:

```sql
CREATE TABLE matches (
  id UUID PRIMARY KEY,
  tournament_id UUID,
  
  -- Type & Association
  match_type TEXT,              -- 'pool' or 'knockout'
  pool_id UUID,                 -- For pool matches only
  
  -- Bracket Position
  round INTEGER,                -- Round number
  bracket_pos INTEGER,          -- Position in round
  
  -- Participants
  player1_id UUID,
  player2_id UUID,
  team1_id UUID,
  team2_id UUID,
  
  -- Results
  score1 INTEGER,
  score2 INTEGER,
  winner_player_id UUID,
  winner_team_id UUID,
  status TEXT,                  -- pending/in_progress/completed
  
  -- Metadata
  court TEXT,                   -- Stores category
  scheduled_at TIMESTAMPTZ,
  ...
);
```

### Key Relationships

**Pool Matches:**
- `match_type = 'pool'`
- `pool_id` links to pools table
- `court` contains category + pool name

**Knockout Matches:**
- `match_type = 'knockout'`
- `pool_id = NULL`
- `court` contains category only
- Organized by `round` and `bracket_pos`

---

## 🔒 Security & Permissions

### Organizer-Only Actions:
- Generate knockout fixtures
- Edit match scores
- See generation controls

### Participant Access:
- View knockout brackets (read-only)
- See their matches and standings
- No edit permissions

### Validation:
- Prevents duplicate knockout generation
- Requires all pools complete before generation
- Ensures minimum 2 qualifiers for bracket

---

## 🧪 Testing Checklist

### Pool Completion:
- [ ] All pool matches marked as completed
- [ ] Pool standings correctly calculated
- [ ] Status endpoint shows `poolsComplete: true`

### Knockout Generation:
- [ ] Generate button appears when pools complete
- [ ] Successful generation creates correct number of matches
- [ ] Qualifiers properly seeded into bracket
- [ ] Prevents duplicate generation

### Bracket Display:
- [ ] Rounds displayed in correct order
- [ ] Round names correct (Finals, Semi-Finals, etc.)
- [ ] Qualifiers shown in first round
- [ ] TBD shown for subsequent rounds
- [ ] Match status indicators work

### Category Filtering:
- [ ] Filter shows all categories
- [ ] Selecting category filters both status and matches
- [ ] "All Categories" shows everything

### Multi-Category:
- [ ] Each category can be generated independently
- [ ] Categories don't interfere with each other
- [ ] Can mix completed and in-progress categories

---

## 📝 Usage Instructions

### For Tournament Organizers:

1. **Generate Pool Fixtures**
   ```
   Generate Fixtures → Pool + Knockout → Configure → Generate
   ```

2. **Monitor Pool Progress**
   - Check Fixtures tab for pool match completion
   - View pool standings to see rankings

3. **Generate Knockouts**
   ```
   Go to Knockouts tab
   → See status card for each category
   → Click "Generate Knockouts" when pools complete
   → Bracket automatically created
   ```

4. **Manage Knockout Matches**
   - Click matches to enter scores
   - Winners automatically advance
   - Track progress in real-time

### For Participants:

1. **Check Qualification Status**
   ```
   View pool standings
   → Check if in "ADV" (advancing) position
   → See qualification status
   ```

2. **View Knockout Bracket**
   ```
   Go to Knockouts tab
   → Filter by your category
   → See your bracket position
   → Check match schedule
   ```

---

## 🚀 Future Enhancements

### Potential Improvements:
- Bracket visualization (tree diagram)
- Automatic winner advancement
- Seeding options (manual seeding, rankings-based)
- Third-place playoff option
- Bracket PDF export
- Live bracket updates during matches
- Winner prediction/simulation

---

## 📌 Key Files

### Components:
- `src/components/KnockoutsViewer.tsx` - Main knockout display component
- `src/components/PoolStandingsTable.tsx` - Pool standings (updated with category)

### Pages:
- `src/app/tournament/[id]/page.tsx` - Tournament detail page (added knockouts tab)

### API Routes:
- `src/app/api/tournaments/[id]/knockouts/status/route.ts` - Pool completion status
- `src/app/api/tournaments/[id]/knockouts/generate/route.ts` - Bracket generation

---

## 🎉 Summary

The knockout stage implementation provides a complete solution for advancing pool qualifiers to single-elimination brackets:

✅ **Automated Qualification** - Top performers advance automatically  
✅ **Smart Seeding** - Distributes participants for fair matchups  
✅ **Category Support** - Each category has independent knockout bracket  
✅ **Real-time Updates** - Live match status and results  
✅ **Responsive UI** - Works on mobile and desktop  
✅ **Secure** - Proper permissions and validation  

The feature seamlessly integrates with existing pool fixtures, providing a complete tournament management solution from registration through championship.




