# Knockout Stage - Quick Start Guide

## 🎯 What's New?

Your tournament app now supports **knockout brackets** after pool play! Here's what happens:

```
Pool Matches (Round-Robin)
         ↓
    All Complete
         ↓
   Top N Qualify
         ↓
Single Elimination Knockout
         ↓
      Champion! 🏆
```

---

## 📱 User Experience

### New "Knockouts" Tab

Your tournament page now has 4 tabs:
```
┌─────────┬──────────┬───────────┬──────────────┐
│Overview │ Fixtures │ Knockouts │ Participants │
└─────────┴──────────┴───────────┴──────────────┘
```

Click **Knockouts** to:
- See which categories are ready
- Generate knockout brackets
- View and manage knockout matches

---

## 🎮 How It Works

### Step 1: Pool Play
```
Pool A          Pool B
Player 1 ✓      Player 5 ✓  
Player 2 ✓      Player 6 ✓
Player 3        Player 7
Player 4        Player 8

Top 2 advance from each pool
```

### Step 2: Check Status
Go to **Knockouts** tab:
```
┌─────────────────────────────────────┐
│ SINGLES Knockouts                   │
│ ✓ All 2 pools complete. 4 qualifiers│
│ [Generate Knockouts]                │
└─────────────────────────────────────┘
```

### Step 3: Generate Bracket
Click **"Generate Knockouts"** button:
```
Automatic seeding →
Creates single elimination bracket →
Qualifiers placed in first round →
Done! ✓
```

### Step 4: Bracket Display
```
┌─────────────────────────────┐
│ Semi-Finals (2 matches)     │
├─────────────────────────────┤
│ Match 1:                    │
│  Player 1 vs Player 6       │
│                             │
│ Match 2:                    │
│  Player 5 vs Player 2       │
└─────────────────────────────┘

┌─────────────────────────────┐
│ Final (1 match)             │
├─────────────────────────────┤
│ Match 3:                    │
│  Winner(1) vs Winner(2)     │
│      TBD vs TBD             │
└─────────────────────────────┘
```

---

## 🎨 Features

### Category Filtering
```
┌──────────────────────────────────────┐
│ [🔍] [All] [Singles] [Doubles] [Mixed]│
└──────────────────────────────────────┘
```
Click a category to see only those knockout matches.

### Pool Status Indicators

**✓ Generated** (Green)
- Knockouts already created
- Bracket visible below

**Ready to Generate** (Blue)
- All pools complete
- Can click to generate

**Waiting for Pools** (Yellow)
- Pool matches still in progress
- Complete pools first

### Match Status

**Pending** - Not yet played  
**🔴 Live** - Currently in progress  
**✓ Completed** - Finished, winner determined

---

## 🔑 Key Concepts

### Single Elimination
- **Winner advances**, loser is out
- No second chances
- Bracket size is power of 2 (4, 8, 16, 32, etc.)
- Byes given if not enough participants

### Seeding
Qualifiers are seeded to:
- Mix pool winners with runners-up
- Avoid same-pool early matchups
- Create balanced bracket

### Rounds
```
8 players → 3 rounds:
  Round 1: Quarter-Finals (4 matches)
  Round 2: Semi-Finals (2 matches)
  Round 3: Final (1 match)

4 players → 2 rounds:
  Round 1: Semi-Finals (2 matches)
  Round 2: Final (1 match)
```

---

## 📊 Multi-Category Support

Each category has **independent** knockouts:

```
SINGLES
└─ 4 pools → 8 qualifiers → 3 rounds ✓

DOUBLES  
└─ 2 pools → 4 qualifiers → 2 rounds (pending)

MIXED
└─ 2 pools → 4 qualifiers → 2 rounds ✓
```

You can:
- Generate knockouts for each category separately
- Some categories can be in pool play while others are in knockouts
- Filter view by category

---

## 👨‍💼 For Organizers

### Generate Knockouts:
1. Complete all pool matches (enter scores)
2. Go to **Knockouts** tab
3. Look for blue "Ready to Generate" status
4. Click **"Generate Knockouts"**
5. Bracket created instantly!

### Manage Knockout Matches:
- Click any match to enter scores
- Winner automatically determined
- System marks match as complete
- Can edit scores if needed

### Per Category:
- Generate each category independently
- No need to wait for all categories
- Flexible scheduling

---

## 👥 For Participants

### Check if You Qualified:
1. Go to **Fixtures** tab
2. View pool standings
3. Look for **"↑ ADV"** indicator
4. Top N players advance

### View Your Bracket:
1. Go to **Knockouts** tab
2. Filter by your category
3. Find your name in first round
4. See your path to finals

### Track Progress:
- See upcoming matches
- Check scores in real-time
- Follow bracket progression

---

## ⚙️ Technical Details

### API Endpoints Created:

1. **GET `/api/tournaments/[id]/knockouts/status`**
   - Returns pool completion status per category
   - Shows qualifier counts
   - Indicates if knockouts already generated

2. **POST `/api/tournaments/[id]/knockouts/generate`**
   - Generates knockout bracket for a category
   - Seeds qualifiers from pool standings
   - Creates single-elimination matches

### Database:
- Uses existing `matches` table
- `match_type = 'knockout'` for knockout matches
- `match_type = 'pool'` for pool matches
- `court` field stores category

---

## 🎯 Example Workflow

### Tournament: "Weekend Pickleball Championship"

**Saturday Morning: Pool Play**
- Generate fixtures with "Pool + Knockout"
- Set 4 pools, top 2 advance
- Players complete pool matches

**Saturday Afternoon: Knockouts Start**
- Organizer checks pool completion ✓
- Clicks "Generate Knockouts" for Singles
- 8 qualifiers placed in bracket
- Quarter-finals begin

**Saturday Evening: Finals**
- Semi-finals completed
- Final match scheduled
- Live scoreboard active

**Sunday: Other Categories**
- Doubles knockouts generated
- Mixed knockouts generated
- Multiple finals throughout day

---

## ✅ Checklist for First Use

- [ ] Generate pool fixtures with "Pool + Knockout" option
- [ ] Set "Advance per Pool" count (e.g., 2)
- [ ] Complete all pool matches in a category
- [ ] Go to Knockouts tab
- [ ] Verify status shows "Ready to Generate"
- [ ] Click "Generate Knockouts"
- [ ] See bracket with qualifiers in first round
- [ ] Click matches to enter scores
- [ ] Watch winners advance automatically

---

## 🐛 Troubleshooting

**Q: "Generate Knockouts" button not showing?**  
A: Complete all pool matches first. Check pool standings to ensure all matches are done.

**Q: Wrong players in knockout bracket?**  
A: Check pool standings rankings. Top N advance based on wins, then points.

**Q: Can't regenerate knockouts?**  
A: Already generated. Delete existing knockout fixtures first if you need to regenerate.

**Q: Knockout tab is empty?**  
A: Either pools aren't complete yet, or knockouts haven't been generated. Check pool status cards.

**Q: How many advance from each pool?**  
A: Set during fixture generation. Check "Advance to Knockout" setting. Usually 2 per pool.

---

## 🎉 That's It!

You now have a complete pool-to-knockout tournament system:

✅ Pool round-robin play  
✅ Automatic qualification  
✅ Single-elimination knockouts  
✅ Multi-category support  
✅ Category filtering  
✅ Real-time updates  

Your tournaments can now progress from pool play all the way to crowning champions! 🏆




