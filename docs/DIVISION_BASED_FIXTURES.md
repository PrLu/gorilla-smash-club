# Division-Based Fixture Generation

## Overview

The system now generates **separate brackets** for each unique combination of:
- **Category** (Singles, Doubles, Mixed)
- **Rating** (<3.2, <3.6, <3.8, Open)
- **Gender** (Male, Female)

This ensures fair competition within skill levels and categories.

---

## How It Works

### Automatic Division Grouping

When you click "Generate Fixtures", the system:

1. **Collects all participants** (confirmed + pending registrations)
2. **Groups by division**: `{category}_{rating}_{gender}`
3. **Creates separate brackets** for each division with 2+ participants
4. **Labels matches** with division info

### Example

**Participants:**
```
P1: Singles, <3.6, Male
P2: Singles, <3.6, Male  
P3: Singles, <3.6, Male
P4: Singles, <3.6, Female
P5: Singles, Open, Male
P6: Singles, Open, Male
P7: Doubles, <3.8, Male
P8: Doubles, <3.8, Male
```

**Result: 3 Divisions**

**Division 1**: Singles <3.6 Male
- P1, P2, P3 (3 players)
- Generates: 3 matches (1 bye)

**Division 2**: Singles Open Male  
- P5, P6 (2 players)
- Generates: 1 match (final only)

**Division 3**: Doubles <3.8 Male
- P7, P8 (2 players)
- Generates: 1 match (final only)

**P4 (Singles <3.6 Female)** - Not enough participants (needs partner), no bracket created

**Total**: 5 matches across 3 divisions

---

## Division Display

Each match in the bracket shows its division:

```
Court: SINGLES <3.6 MALE
Match 1: P1 vs P2

Court: SINGLES OPEN MALE  
Match 2: P5 vs P6

Court: DOUBLES <3.8 MALE
Match 3: P7 vs P8
```

The "Court" field temporarily stores division information.

---

## Participant Counting

### Before (Old System):
```
Total Participants: 5 (only confirmed)
```

### After (New System):
```
Total Participants: 8 (confirmed + pending invitations)
```

**Includes:**
- ✅ Confirmed registrations
- ✅ Pending invitations (awaiting signup)

**Displayed on:**
- Tournament cards in dashboard
- Tournament detail page
- Participant management page

---

## Benefits

### ✅ Fair Competition
- Players compete against similar skill levels
- No beginner vs advanced mismatches
- Gender-appropriate divisions

### ✅ Realistic Counts
- Shows full tournament size (not just signed-up players)
- Organizers see expected turnout
- Better planning for courts and scheduling

### ✅ Flexible Brackets
- Each division gets its own champion
- Multiple finals per tournament
- More winners = more engagement

---

## API Response

When generating fixtures with divisions:

```json
{
  "success": true,
  "message": "Fixtures generated successfully",
  "matchesCreated": 12,
  "autoAdvancedCount": 2,
  "divisionsCreated": 4,
  "divisionBreakdown": {
    "singles_<3.6_male": {
      "division": "singles - <3.6 - male",
      "participants": 5,
      "matches": 7,
      "autoAdvanced": 1
    },
    "singles_<3.6_female": {
      "division": "singles - <3.6 - female",
      "participants": 3,
      "matches": 3,
      "autoAdvanced": 1
    },
    "doubles_open_male": {
      "division": "doubles - open - male",
      "participants": 4,
      "matches": 3,
      "autoAdvanced": 0
    }
  }
}
```

---

## UI Changes

### Tournament Card

**Before:**
```
Summer Tournament
Singles • 8 participants
```

**After:**
```
Summer Tournament  
Singles • 12 participants    ← Includes pending invitations
```

### Generate Fixtures Result

**Success Toast:**
```
✨ Fixtures Generated!
12 matches created across 4 divisions • 2 auto-advanced
```

### Fixtures View

Shows matches grouped by division:

```
📊 SINGLES <3.6 MALE (5 players)
  Round 1: 4 matches
  Round 2: 2 matches
  Round 3: 1 match (Final)

📊 SINGLES OPEN MALE (4 players)
  Round 1: 2 matches
  Round 2: 1 match (Final)

📊 DOUBLES <3.8 MALE (6 teams)
  Round 1: 3 matches
  ...
```

---

## Edge Cases

### Single Participant in Division
- **Example**: Only 1 player in "Singles <3.2 Female"
- **Behavior**: Division skipped (needs 2+ participants)
- **Note**: Logged in generation response

### Uneven Divisions
- **Example**: 5 players in one division, 2 in another
- **Behavior**: Each division gets appropriate bracket size
  - 5 players → 7 matches (padded to 8)
  - 2 players → 1 match (final only)

### Missing Metadata
- **Example**: Registration has no category/rating/gender
- **Fallback**: Uses default values:
  - Category: `'singles'`
  - Rating: `'open'`
  - Gender: `'male'`
- **Recommendation**: Ensure all registrations have complete metadata

---

## Database Considerations

### Match Identifiers

Each match gets unique:
- `bracket_pos`: Offset per division (Division 1: 0-6, Division 2: 7-9, etc.)
- `court`: Division label (temporarily)

### Querying by Division

```sql
-- Get matches for specific division
SELECT * FROM matches 
WHERE tournament_id = 'xxx'
AND court LIKE 'SINGLES%<3.6%MALE';

-- Count participants per division
SELECT 
  r.metadata->>'category' as category,
  r.metadata->>'rating' as rating,
  r.metadata->>'gender' as gender,
  COUNT(*) as participants
FROM registrations r
WHERE r.tournament_id = 'xxx'
GROUP BY category, rating, gender;
```

---

## Future Enhancements

- **Division Winners Board**: Show champion for each division
- **Cross-Division Finals**: Winners from each division compete
- **Division Column**: Add `division` field to matches table (instead of using `court`)
- **Combined Ratings**: Allow "3.0-3.5" bracket spanning multiple ratings
- **Age Groups**: Add age-based divisions
- **Skill Handicapping**: Auto-adjust scores based on rating difference

---

## Migration Needed

To properly store division data, consider adding:

```sql
ALTER TABLE public.matches
  ADD COLUMN IF NOT EXISTS division TEXT;

-- Update existing matches
UPDATE matches 
SET division = court 
WHERE division IS NULL AND court LIKE '%<%';
```

Then update fixture generation to set `division` instead of `court`.

---

## Testing

### Test Scenario: Multi-Division Tournament

**Setup:**
```
Add 3 participants: Singles <3.6 Male
Add 2 participants: Singles <3.6 Female  
Add 4 participants: Doubles Open Male
Add 1 participant: Singles <3.2 Male (skipped)
```

**Expected Result:**
- 3 divisions created
- ~9 total matches
- Each division has its own bracket
- Toast shows "3 divisions created"

**Verify:**
1. Check matches table has 3 distinct `court` values
2. Check each division has complete bracket
3. Check participant in lonely division gets notification

---

## Troubleshooting

### "No valid participants found"

**Cause**: All participants missing category/rating/gender

**Fix**:
```sql
-- Check participant metadata
SELECT 
  r.id,
  r.metadata,
  p.player_rating,
  p.gender
FROM registrations r
LEFT JOIN players p ON p.id = r.player_id
WHERE r.tournament_id = 'xxx';

-- Should see metadata or player fields populated
```

### Only 1 division created when expecting multiple

**Cause**: All participants have same category/rating/gender

**Fix**: Verify participants have diverse metadata

### Divisions not visible in UI

**Cause**: Court field not being displayed

**Fix**: Update FixturesViewer to group by division/court

---

## Benefits Summary

✅ **Fair Play**: Matches within skill level  
✅ **Accurate Counts**: Includes pending invitations  
✅ **Multiple Champions**: One per division  
✅ **Better Organization**: Clear division structure  
✅ **Scalable**: Handles 100+ participants across divisions  

---

**Now your tournament system creates professional, skill-appropriate brackets!** 🏆

