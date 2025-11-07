# Fixture Generation Category Fix

## Problem Summary

**Issue:** Fixture generation was not properly filtering participants by their registered categories (singles, doubles, mixed). It was generating fixtures using ALL participants regardless of what category they signed up for.

**Root Cause:** 
1. The `groupByDivision` function used the tournament's global format (singles/doubles/mixed) instead of each registration's individual category
2. The code determined whether to use `player_id` vs `team_id` based on tournament format, not per-registration category
3. Mixed-format tournaments (with singles + doubles + mixed categories) weren't properly separated into divisions

---

## Solution Implemented

### 1. **Fixed `generate-fixtures/route.ts`** ✅

**Changes:**
- Updated `groupByDivision()` to:
  - Check each registration's `metadata.category` individually
  - Return division metadata including `isTeamBased` flag per division
  - Use `team_id` for doubles/mixed registrations, `player_id` for singles
- Updated fixture creation to use division-specific team/player IDs
- Removed global `isTeamFormat` check in favor of per-division checks

**Key Code Changes:**
```typescript
// BEFORE (WRONG):
const isTeamFormat = tournament.format === 'doubles' || tournament.format === 'mixed';
const participantId = isTeamFormat ? reg.team?.id : reg.player?.id;

// AFTER (CORRECT):
const category = reg.metadata?.category || 'singles';
const isThisTeamBased = category === 'doubles' || category === 'mixed';
const participantId = isThisTeamBased ? reg.team?.id : reg.player?.id;
```

---

### 2. **Fixed `generate-fixtures-system/route.ts`** ✅

**Changes:**
- Added category grouping logic to separate singles/doubles/mixed participants
- Added validation to detect mixed-category tournaments and recommend using the main generator
- Updated single elimination fixture creation to use correct player/team IDs
- Fixed pool generation to handle team-based formats

**New Features:**
- Detects when tournament has multiple categories and provides helpful error message
- Properly handles team-based formats in pool + knockout generation

---

### 3. **Fixed `pools/generate-fixtures/route.ts`** ✅

**Changes:**
- Added automatic detection of team-based pools by checking participant IDs
- Updated pool_players mapping to use team_id when appropriate
- Updated match creation to use team IDs for doubles/mixed pools

---

## How It Works Now

### Division-Based Generation

Fixtures are now generated per division, where a division is defined as:
```
Division = Category + Rating + Gender
```

**Example Tournament:**
- 4 participants registered as: Singles, <3.2, Male
- 2 teams registered as: Doubles, <3.6, Female
- 2 teams registered as: Mixed, <3.8

**Generated Divisions:**
1. **Division 1:** Singles <3.2 Male (4 individual players)
   - Uses `player1_id`, `player2_id` in matches
2. **Division 2:** Doubles <3.6 Female (2 teams)
   - Uses `team1_id`, `team2_id` in matches
3. **Division 3:** Mixed <3.8 (2 teams)
   - Uses `team1_id`, `team2_id` in matches

Each division gets its own separate bracket!

---

## API Response Format

### Success Response (Multiple Divisions)

```json
{
  "success": true,
  "message": "Fixtures generated successfully",
  "matchesCreated": 9,
  "autoAdvancedCount": 0,
  "divisionsCreated": 3,
  "divisionBreakdown": {
    "singles_<3.2_male": {
      "division": "singles - <3.2 - male",
      "participants": 4,
      "matches": 3,
      "autoAdvanced": 0
    },
    "doubles_<3.6_female": {
      "division": "doubles - <3.6 - female",
      "participants": 2,
      "matches": 1,
      "autoAdvanced": 0
    },
    "mixed_<3.8_mixed": {
      "division": "mixed - <3.8 - mixed",
      "participants": 2,
      "matches": 1,
      "autoAdvanced": 0
    }
  },
  "matches": [...]
}
```

---

## Testing Instructions

### Test Case 1: Singles-Only Tournament

**Setup:**
1. Create tournament with format: Singles
2. Add 4 participants:
   - All registered as: Singles, <3.2, Male

**Expected Result:**
- 1 division created: "SINGLES <3.2 MALE"
- 3 matches (single elimination)
- All matches use `player1_id` and `player2_id`

---

### Test Case 2: Doubles-Only Tournament

**Setup:**
1. Create tournament with format: Doubles
2. Add 4 teams:
   - All registered as: Doubles, <3.6, Female

**Expected Result:**
- 1 division created: "DOUBLES <3.6 FEMALE"
- 3 matches (single elimination)
- All matches use `team1_id` and `team2_id`

---

### Test Case 3: Mixed-Format Tournament (Main Test!)

**Setup:**
1. Create tournament with formats: Singles, Doubles, Mixed
2. Add participants:
   - 4 singles players: Singles, <3.2, Male
   - 2 doubles teams: Doubles, <3.6, Female
   - 2 mixed teams: Mixed, <3.8

**Expected Result:**
- 3 divisions created
- Singles matches use `player1_id`, `player2_id`
- Doubles/Mixed matches use `team1_id`, `team2_id`
- Court field shows division name (e.g., "SINGLES <3.2 MALE")

**SQL Query to Verify:**
```sql
SELECT 
  court,
  player1_id,
  player2_id,
  team1_id,
  team2_id,
  round,
  status
FROM matches
WHERE tournament_id = 'YOUR_TOURNAMENT_ID'
ORDER BY court, round, bracket_pos;
```

---

### Test Case 4: Same Rating, Different Categories

**Setup:**
1. Create tournament with formats: Singles, Doubles
2. Add participants:
   - 4 singles players: Singles, <3.6, Male
   - 4 doubles teams: Doubles, <3.6, Male

**Expected Result:**
- 2 divisions created (despite same rating and gender!)
- "SINGLES <3.6 MALE" - 4 players
- "DOUBLES <3.6 MALE" - 4 teams
- Completely separate brackets

---

## Database Schema Notes

### Matches Table

Matches now properly use:
- `player1_id`, `player2_id`, `winner_player_id` - For singles divisions
- `team1_id`, `team2_id`, `winner_team_id` - For doubles/mixed divisions

The `court` field temporarily stores division information:
```
Format: "{CATEGORY} {RATING} {GENDER}"
Examples:
- "SINGLES <3.2 MALE"
- "DOUBLES <3.6 FEMALE"
- "MIXED <3.8 MIXED"
```

**Future Enhancement:** Consider adding dedicated `division` or `category` columns to the matches table.

---

## Migration Notes

### No Database Changes Required ✅

All fixes are in application logic only. No schema changes needed.

### Backward Compatibility ✅

- Existing tournaments will continue to work
- Old fixtures remain intact
- Only NEW fixture generation uses the improved logic

---

## Common Scenarios

### Scenario: Tournament has only singles participants
**Result:** Works perfectly - creates one singles division

### Scenario: Tournament has only doubles teams
**Result:** Works perfectly - creates one doubles division

### Scenario: Tournament has both singles and doubles
**Result:** Creates separate divisions for each category

### Scenario: Participant registered for wrong category
**Fix:** Edit registration metadata to correct category, regenerate fixtures

---

## API Endpoints Updated

1. **POST `/api/tournaments/[id]/generate-fixtures`**
   - Main fixture generator
   - Fully supports mixed categories
   - Recommended for all tournament types

2. **POST `/api/tournaments/[id]/generate-fixtures-system`**
   - System generator
   - Now detects mixed categories and provides helpful error
   - Works for single-category tournaments

3. **POST `/api/tournaments/[id]/pools/generate-fixtures`**
   - Pool-based generator
   - Now handles team-based pools correctly

---

## Error Messages

### Mixed Categories in System Generator

```json
{
  "error": "Mixed categories detected",
  "message": "This tournament has participants in multiple categories (singles/doubles/mixed). Please use the advanced fixture generator for proper category-based divisions.",
  "hint": "Use POST /api/tournaments/[id]/generate-fixtures instead",
  "categories": {
    "singles": 4,
    "doubles": 2,
    "mixed": 2
  }
}
```

---

## Next Steps

1. **Test the changes** with mixed-category tournaments
2. **Verify** that divisions are created correctly
3. **Check** that player/team IDs are used appropriately
4. **Monitor** the court field to ensure division names are correct

---

## Files Changed

1. `src/app/api/tournaments/[id]/generate-fixtures/route.ts` - Main fixture generator
2. `src/app/api/tournaments/[id]/generate-fixtures-system/route.ts` - System generator
3. `src/app/api/tournaments/[id]/pools/generate-fixtures/route.ts` - Pool generator

---

## Support for Future Enhancements

This fix provides a foundation for:
- Multiple divisions in same tournament
- Category-specific seeding
- Division-based leaderboards
- Category filtering in fixture views
- Advanced reporting by category

---

**Status:** ✅ Complete and Ready for Testing
**Breaking Changes:** None
**Database Changes:** None
**Testing Required:** Mixed-category tournaments

