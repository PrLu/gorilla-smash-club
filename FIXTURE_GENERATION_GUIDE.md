# Fixture Generation System - Complete Guide

## 🎯 Overview

The fixture generation system supports three tournament formats:
1. **Single Elimination** - Direct knockout bracket
2. **Double Elimination** - Winners and losers brackets (coming soon)
3. **Pool + Knockout** - Round-robin pools followed by knockout rounds

## 🚀 Quick Start

### For Tournament Organizers

1. **Create your tournament** and add participants
2. Click **"Generate Fixtures"** button
3. Choose between:
   - **System Generator** (Automatic) - Fast, rule-based
   - **Manual Generator** (Drag & Drop) - Full control

### System Generator (Recommended)

**Best for:** Quick setup, standard formats, large tournaments

**Steps:**
1. Select fixture type
2. Configure options (pools, seeding, etc.)
3. Click "Generate Fixtures"
4. Done! Fixtures appear immediately

### Manual Generator

**Best for:** Custom pools, specific matchups, creative formats

**Steps:**
1. Opens dedicated editor page
2. Drag players into pools
3. Configure advancement rules
4. Save & Generate

---

## 📊 System Generator Options

### 1. Single Elimination

**Settings:**
- Seeding Strategy: Registration Order / Random
- Replace Existing: Delete old fixtures
- Auto Advance Byes: Handle odd numbers automatically

**What it creates:**
- Complete knockout bracket
- Byes handled automatically
- Power-of-2 structure (4, 8, 16, 32 players)

**Example:**
- 13 players → 16-player bracket with 3 byes

---

### 2. Pool + Knockout

**Settings:**
- Number of Pools: 2-16
- Players per Pool: 2-32 (target)
- Advance per Pool: 1 to (pool size - 1)
- Seeding Strategy: Registration Order / Random

**What it creates:**
- **Pool Stage:** Round-robin within each pool
  - Every player plays every other player in their pool
  - Matches labeled by pool name (Pool A, Pool B, etc.)
- **Knockout Stage:** Top K players from each pool advance
  - TBD placeholders (filled after pool completion)
  - Standard elimination bracket

**Example:**
- 16 players, 4 pools, top 2 advance per pool
- Creates:
  - Pool A: 6 matches (4 players round-robin)
  - Pool B: 6 matches
  - Pool C: 6 matches
  - Pool D: 6 matches
  - Knockout: 7 matches (8 players, single elim)
  - **Total:** 31 matches

---

### 3. Double Elimination

**Status:** Coming soon!

**Features (planned):**
- Winners bracket
- Losers bracket
- Grand final with bracket reset

---

## 🎨 Manual Generator Workflow

### Page Layout

```
┌─────────────────────────────────────────────────────┐
│  Manual Fixture Editor - [Tournament Name]          │
│  [Back] [Save Pools] [Save & Generate Fixtures]     │
├──────────────┬──────────────────────────────────────┤
│              │                                       │
│  UNASSIGNED  │  POOL A         POOL B         POOL C│
│  PLAYERS     │  [Player 1]     [Player 5]     ...   │
│  (15)        │  [Player 2]     [Player 6]           │
│              │  [Player 3]     [Player 7]           │
│  [Add Pool]  │  [Player 4]     [Player 8]           │
│              │  Advance: 2     Advance: 2           │
│  Controls:   │  [Remove Pool]  [Remove Pool]        │
│  - Auto Dist │                                       │
│  - Reset All │                                       │
│              │                                       │
└──────────────┴──────────────────────────────────────┘
```

### Workflow Steps

#### Step 1: Add Pools
- Click "Add Pool" to create Pool A, Pool B, etc.
- Pools appear as cards in the main area

#### Step 2: Assign Players
- **Drag** players from "Unassigned" list
- **Drop** into desired pool
- **Reorder** within pool if needed

#### Step 3: Configure Advancement
- Set "Advance to Knockout" number for each pool
- Must be less than pool size

#### Step 4: Validate
- Each pool needs at least 2 players
- No player can be in multiple pools
- All validations shown inline

#### Step 5: Save
- "Save Pools" - Saves without generating (draft)
- "Save & Generate Fixtures" - Creates all matches

### Pool Controls

**Auto-Distribute Players:**
- Evenly distributes unassigned players across pools
- Balances pool sizes

**Reset All Pools:**
- Removes all pool assignments
- Returns players to unassigned list
- Requires confirmation

---

## 🎮 Fixture Display (After Generation)

### For Organizers

**Fixtures Tab shows:**

1. **View Toggle** (if pool + knockout):
   - All Fixtures
   - Pool Matches
   - Knockout Rounds

2. **Pool Stage:**
   - Grouped by pool name
   - All round-robin matches visible
   - Shows player names

3. **Knockout Stage:**
   - Traditional bracket view
   - Rounds labeled (Semi-Finals, Finals, etc.)
   - TBD placeholders for pool winners

### For Participants

**Same view, but read-only:**
- Can see all matches
- Can see their pool assignments
- Can view schedule
- Cannot edit anything

---

## 📋 Database Structure

### Pools Table
```sql
CREATE TABLE pools (
  id UUID,
  tournament_id UUID,
  name TEXT,           -- Pool A, Pool B, etc.
  size INTEGER,        -- Number of players
  advance_count INTEGER, -- How many advance
  status TEXT,         -- pending/in_progress/completed
  metadata JSONB
);
```

### Pool_Players Table
```sql
CREATE TABLE pool_players (
  id UUID,
  pool_id UUID,
  player_id UUID,
  team_id UUID,
  position INTEGER,    -- Seed within pool
  points INTEGER,      -- For standings
  wins INTEGER,
  losses INTEGER
);
```

### Matches Table (Updated)
```sql
ALTER TABLE matches ADD COLUMN:
  pool_id UUID,          -- References pool for pool matches
  match_type TEXT        -- 'pool' or 'knockout'
```

---

## 🔄 Complete Flow Examples

### Example 1: Simple Single Elimination

**Setup:**
- 8 players registered
- Format: Singles

**Process:**
1. Click "Generate Fixtures"
2. Select "System Generator"
3. Choose "Single Elimination"
4. Seeding: "Registration Order"
5. Click "Generate Fixtures"

**Result:**
- 7 matches created
- 3 rounds (Quarter, Semi, Final)
- All player names visible
- Ready to play!

### Example 2: Pool + Knockout

**Setup:**
- 20 players registered
- Format: Doubles

**Process:**
1. Click "Generate Fixtures"
2. Select "System Generator"
3. Choose "Pool + Knockout"
4. Configure:
   - 4 pools
   - 5 players per pool
   - Top 2 advance per pool
5. Click "Generate Fixtures"

**Result:**
- **Pool Stage:** 40 matches
  - Pool A: 10 matches (5 players round-robin)
  - Pool B: 10 matches
  - Pool C: 10 matches
  - Pool D: 10 matches
- **Knockout Stage:** 7 matches
  - 8 advancing players
  - Quarter-finals, Semi-finals, Final
- **Total:** 47 matches

### Example 3: Custom Pools (Manual)

**Setup:**
- 24 players registered
- Want specific groupings

**Process:**
1. Click "Generate Fixtures"
2. Select "Manual Generator"
3. Redirects to manual editor
4. Click "Add Pool" 6 times (Pool A-F)
5. Drag 4 players into each pool
6. Set "Advance: 2" for each pool
7. Click "Save & Generate Fixtures"

**Result:**
- 6 pools with 4 players each
- 36 pool matches (6 per pool)
- 12 players advance
- 11 knockout matches
- **Total:** 47 matches

---

## 🎯 Match States & Flow

### Pool Matches
```
Pending → In Progress → Completed
- Update scores
- Calculate pool standings
- Determine who advances
```

### Knockout Matches
```
TBD (waiting for pool results)
  ↓
Pending (players assigned)
  ↓
In Progress
  ↓
Completed
  ↓
Winner advances to next match
```

---

## 🔐 Permissions

| Action | Root | Admin | Participant |
|--------|------|-------|-------------|
| Generate Fixtures (System) | ✅ | ✅ | ❌ |
| Generate Fixtures (Manual) | ✅ | ✅ | ❌ |
| View Fixtures | ✅ | ✅ | ✅ |
| Edit Pools | ✅ | ✅ | ❌ |
| Delete Fixtures | ✅ | ❌ | ❌ |
| Update Match Scores | ✅ | ✅ | ❌ |

---

## 📝 Field Reference

### System Generator Fields

| Field | Type | Options | Default | Notes |
|-------|------|---------|---------|-------|
| Fixture Type | Select | Single Elim / Double Elim / Pool+Knockout | Single Elim | Tournament format |
| Number of Pools | Number | 2-16 | 2 | Only for Pool+Knockout |
| Players per Pool | Number | 2-32 | 4 | Target size |
| Advance per Pool | Number | 1 to (pool size - 1) | 2 | To knockout |
| Seeding Type | Select | Registered / Random / Manual | Registered | Player order |
| Replace Existing | Checkbox | - | false | Delete old fixtures |
| Auto Advance Byes | Checkbox | - | true | Skip bye matches |

---

## ⚠️ Important Notes

### Pool Distribution
- System tries to distribute evenly
- If 17 players and 4 pools → 5, 4, 4, 4 distribution
- Pools with <2 players are not created

### Byes in Pools
- Not applicable (round-robin format)
- Each player plays every other player in pool

### Knockout TBD Slots
- Filled after pool stage completes
- Organizer manually assigns pool winners
- Or auto-filled based on pool standings (future)

### Match Numbering
- Continuous across pool and knockout
- Pool matches: bracket_pos 0-39
- Knockout matches: bracket_pos 40+

---

## 🐛 Troubleshooting

### "Need at least 2 confirmed participants"
**Problem:** Not enough registered players
**Solution:** Add more participants to tournament first

### "Each pool must have at least 2 players"
**Problem:** Pool has 0 or 1 player (manual mode)
**Solution:** Drag at least 2 players into each pool

### Fixtures not showing after generation
**Problem:** Page didn't refresh
**Solution:** Refresh the page or switch to Fixtures tab

### Player names showing as "TBD"
**Problem:** Player data not loaded
**Solution:** Refresh page - names should appear

---

## 🎓 Best Practices

### ✅ Do This:
1. **Test with small numbers** - Generate with 4-8 players first
2. **Use registration order** - For fair seeding
3. **Even pool sizes** - Makes standings clearer
4. **Clear old fixtures** - Use "Replace Existing" when re-generating
5. **Save drafts** - Use "Save Pools" before generating in manual mode

### ❌ Avoid This:
1. **Uneven pools** - Makes knockout stage imbalanced
2. **Too many pools** - 2-4 is optimal for most tournaments
3. **Advancing too few** - At least 2 per pool for good knockout
4. **Generating twice** - Use replace existing to avoid duplicates

---

## 📁 Files Created

### Database
- `supabase/migrations/022_pools_and_pool_players.sql`

### Components
- `src/components/FixtureGenerationModal.tsx`
- `src/app/tournament/[id]/fixtures/manual/page.tsx`

### API Routes
- `src/app/api/tournaments/[id]/generate-fixtures-system/route.ts`
- `src/app/api/tournaments/[id]/pools/save/route.ts`
- `src/app/api/tournaments/[id]/pools/generate-fixtures/route.ts`

### Updated
- `src/components/FixturesViewer.tsx` - Pool display support
- `src/lib/hooks/useMatches.ts` - Fetch player/team data
- `src/app/tournament/[id]/page.tsx` - Integrated modal

---

## ✅ Feature Complete!

All PRD requirements implemented:
- ✅ System Generator (automatic)
- ✅ Manual Generator (drag & drop)
- ✅ Pool-based tournaments
- ✅ Single elimination
- ✅ Real player names in fixtures
- ✅ Pool and knockout separation
- ✅ Participant read-only view
- ✅ Proper permissions
- ✅ Validation rules

---

**Ready to use!** Run the migration and start creating fixtures! 🎉

