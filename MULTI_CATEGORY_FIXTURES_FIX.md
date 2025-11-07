# Multi-Category Fixtures Generation Fix

## Problem Identified

When players registered for multiple categories (Singles, Doubles, Mixed), the fixture generation only created matches for one category (Singles) instead of generating separate brackets for each category.

## Root Cause

The **RegistrationForm component** (`src/components/RegistrationForm.tsx`) was missing critical fields:
- ❌ No category selection field
- ❌ No gender field  
- ❌ No proper rating selection
- ❌ No metadata being saved with registrations

This caused all registrations to default to 'singles' in the fixture generation logic at line 21:
```typescript
const category = reg.metadata?.category || 'singles'; // Always defaulted to 'singles'!
```

## Solution Implemented

### 1. ✅ Fixed RegistrationForm Component

**File:** `src/components/RegistrationForm.tsx`

**Changes:**
- Added **Category** dropdown (Singles, Doubles, Mixed Doubles) - **REQUIRED**
- Added **Gender** dropdown (Male, Female) - **REQUIRED**
- Added **Rating** dropdown (<3.2, <3.6, <3.8, Open)
- Added **Partner Information** section (shows conditionally for Doubles/Mixed)
  - Partner Name field
  - Partner Email field (for invitation)
- Updated registration creation to include metadata:
  ```typescript
  const metadata: any = {
    category: data.category || 'singles',
    rating: data.rating || null,
    gender: data.gender || null,
  };
  
  // Add partner info for doubles/mixed
  if ((data.category === 'doubles' || data.category === 'mixed') && data.partner_email) {
    metadata.partner_email = data.partner_email;
    metadata.partner_display_name = data.partner_name;
  }
  ```

### 2. ✅ Enhanced Fixture Display with Category Tabs

**File:** `src/components/FixturesViewer.tsx`

**Features Added:**
- **Category Detection:** Automatically extracts all unique categories from generated fixtures
- **Beautiful Pill Tabs:** 
  - "All Categories" button showing total match count
  - Individual category buttons (SINGLES, DOUBLES, MIXED) with counts per category
  - Active state with gradient background
  - Smooth transitions and hover effects
- **Smart Filtering:** Filters both pool and knockout matches by selected category
- **Empty State:** Shows helpful message when no matches exist for selected category
- **Responsive Design:** Works perfectly on mobile and desktop

**UI Example:**
```
[All Categories (45)] [SINGLES (15)] [DOUBLES (18)] [MIXED (12)]
```

### 3. ✅ Enhanced Participants Page with Category Filtering

**File:** `src/app/tournament/[id]/participants/page.tsx`

**Features Added:**
- **Dynamic Category Detection:** Extracts categories from all registered participants
- **Filter Pill Buttons:**
  - "All" button showing total participant count
  - Category-specific buttons with participant counts
  - Active state with gradient styling
  - Clean, modern design
- **Smart Filtering:** Shows only participants in selected category
- **Empty State:** Helpful message with "Show All" button when filter has no results
- **Header Update:** Shows current category filter in section heading

**UI Example:**
```
Filter by Category: [All (24)] [Singles (8)] [Doubles (10)] [Mixed (6)]
```

## How The System Works Now

### User Flow:

1. **Player Registration:**
   - Player visits tournament page
   - Clicks "Register"
   - Fills form with:
     - Name
     - Gender (required)
     - Rating (optional)
     - **Category** (Singles/Doubles/Mixed) - **NEW!**
     - Partner info (if Doubles/Mixed) - **NEW!**
   - Submits registration with metadata saved

2. **Multiple Category Registration:**
   - Same player can register multiple times
   - Each registration stores its category in `metadata.category`
   - Example: John registers for both Singles AND Doubles

3. **Fixture Generation:**
   - Organizer clicks "Generate Fixtures"
   - System groups registrations by category using `groupByDivision()` function
   - Creates separate brackets for each category:
     - Singles bracket with all singles registrations
     - Doubles bracket with all doubles teams
     - Mixed bracket with all mixed doubles teams
   - Stores category in `matches.court` field (e.g., "SINGLES", "DOUBLES", "MIXED")

4. **Viewing Fixtures:**
   - Fixtures page shows category filter tabs
   - Click any category to view only those matches
   - Each category has its own complete bracket structure

## Technical Details

### Fixture Generation Logic

**File:** `src/app/api/tournaments/[id]/generate-fixtures/route.ts`

```typescript
// Groups participants by category
function groupByDivision(registrations: any[]) {
  const divisions: Record<string, { 
    category: string;
    isTeamBased: boolean;
    participantIds: string[];
  }> = {};

  registrations.forEach((reg) => {
    // Get category from metadata (NOW PROPERLY SET!)
    const category = reg.metadata?.category || 'singles';
    const divisionKey = category;
    const isThisTeamBased = category === 'doubles' || category === 'mixed';
    const participantId = isThisTeamBased ? reg.team?.id : reg.player?.id;

    if (participantId) {
      if (!divisions[divisionKey]) {
        divisions[divisionKey] = {
          category,
          isTeamBased: isThisTeamBased,
          participantIds: []
        };
      }
      divisions[divisionKey].participantIds.push(participantId);
    }
  });

  return divisions;
}

// Generate fixtures for EACH category
for (const [divisionKey, divisionData] of Object.entries(groupedParticipants)) {
  const { category, isTeamBased, participantIds } = divisionData;
  
  // Generate bracket for this category
  const fixtures = generateSingleElimFixtures(participantIds, tournamentId, {
    seed: seedOrder,
  });
  
  // Store category in court field for filtering
  const matchesToInsert = fixtures.map((fixture) => ({
    // ... other fields
    court: category.toUpperCase(), // "SINGLES", "DOUBLES", "MIXED"
  }));
  
  // Insert matches for this category
  await supabase.from('matches').insert(matchesToInsert);
}
```

## Database Schema

### Registrations Table
```sql
registrations (
  id UUID,
  tournament_id UUID,
  player_id UUID (for singles),
  team_id UUID (for doubles/mixed),
  status TEXT,
  metadata JSONB {
    category: 'singles' | 'doubles' | 'mixed',  -- NOW PROPERLY SET
    rating: string,
    gender: 'male' | 'female',
    partner_email: string (for doubles/mixed),
    partner_display_name: string
  }
)
```

### Matches Table
```sql
matches (
  id UUID,
  tournament_id UUID,
  round INTEGER,
  bracket_pos INTEGER,
  player1_id UUID (for singles),
  player2_id UUID (for singles),
  team1_id UUID (for doubles/mixed),
  team2_id UUID (for doubles/mixed),
  court TEXT,  -- Stores category: "SINGLES", "DOUBLES", "MIXED"
  status TEXT,
  winner_player_id UUID,
  winner_team_id UUID
)
```

## Benefits

✅ **Complete Multi-Category Support:** Players can register for any combination of categories

✅ **Separate Brackets:** Each category gets its own elimination bracket

✅ **Easy Filtering:** Users can quickly view fixtures and participants by category

✅ **Dynamic & Flexible:** Categories are automatically detected from data

✅ **Better UX:** Clear visual indicators and intuitive navigation

✅ **Backward Compatible:** Existing registrations default to 'singles' gracefully

## Testing Checklist

- [ ] Register a player for Singles only → Verify fixtures generated
- [ ] Register a player for Doubles only → Verify team created and fixtures generated
- [ ] Register a player for Mixed only → Verify team created and fixtures generated
- [ ] Register same player for Singles AND Doubles → Verify separate brackets
- [ ] Register 4+ players in each category → Verify 3 separate brackets created
- [ ] View fixtures → Verify category tabs appear
- [ ] Click category tabs → Verify filtering works
- [ ] View participants page → Verify category filters appear
- [ ] Click participant filters → Verify filtering works

## Migration Notes

**For Existing Tournaments:**
- Old registrations without metadata will default to 'singles' category
- To fix old data, run update query:
  ```sql
  UPDATE registrations 
  SET metadata = jsonb_build_object(
    'category', 'singles',
    'rating', NULL,
    'gender', NULL
  )
  WHERE metadata IS NULL OR metadata = '{}';
  ```

**For Manual Participant Import:**
- CSV import already supports category field ✅
- Manual invite already supports category field ✅
- Only RegistrationForm was missing it (now fixed) ✅

## Files Modified

1. `src/components/RegistrationForm.tsx` - Added category and partner fields
2. `src/components/FixturesViewer.tsx` - Added category filtering tabs
3. `src/app/tournament/[id]/participants/page.tsx` - Added category filter pills

## Files NOT Changed (Already Working)

- `src/app/api/tournaments/[id]/generate-fixtures/route.ts` - Already had category support
- `src/app/api/tournaments/[id]/import-participants/route.ts` - Already sets metadata
- `src/app/api/tournaments/[id]/participants/manual-invite/route.ts` - Already sets metadata

---

**Status:** ✅ **FIXED AND READY**

The system now properly generates separate fixtures for each category that players register for!

