# Multiple Format Support

## Overview

Tournaments can now support **multiple formats** (Singles, Doubles, Mixed) simultaneously, allowing organizers to run combined events.

---

## New Features

### ✅ Multi-Format Selection

When creating a tournament, you can now select:
- ☑️ **Singles** (individual players)
- ☑️ **Doubles** (teams of 2, same gender)
- ☑️ **Mixed** (teams of 2, mixed gender)

**Select one or more!**

---

## User Interface

### Tournament Creation Form

**Before (Single Select):**
```
Format: [Singles ▼]
```

**After (Multiple Checkboxes):**
```
Tournament Formats * (Select one or more)

☑️ Singles
   Individual players compete

☑️ Doubles  
   Teams of 2 players (same gender)

☐ Mixed Doubles
   Teams of 2 players (mixed gender)
```

### Tournament Card Display

**Before:**
```
Singles • 12 participants
```

**After (Multiple Formats):**
```
Singles, Doubles, Mixed • 12 participants
```

### Tournament Detail Page

**Format badges:**
```
Format(s):
[Singles] [Doubles] [Mixed]
 (badge)   (badge)    (badge)
```

---

## Database Changes

### Migration: `012_multiple_formats.sql`

**Adds to `tournaments` table:**
```sql
formats TEXT[] DEFAULT ARRAY['singles']::TEXT[]
```

**Constraint:**
```sql
-- Ensures only valid formats in array
CHECK (formats <@ ARRAY['singles', 'doubles', 'mixed']::TEXT[])

-- At least one format required
CHECK (array_length(formats, 1) > 0)
```

**Index:**
```sql
CREATE INDEX idx_tournaments_formats ON tournaments USING GIN(formats);
```

---

## How Fixtures Work with Multiple Formats

When a tournament has multiple formats:

**Participants are grouped by:**
1. **Format/Category** (Singles, Doubles, Mixed)
2. **Rating** (<3.2, <3.6, <3.8, Open)
3. **Gender** (Male, Female)

**Example Tournament:**
```
Formats: Singles, Doubles

Participants:
- 8 Singles <3.6 Male
- 4 Singles <3.6 Female
- 6 Doubles Open Male
- 2 Mixed <3.8 (skipped - needs more)

Generated Divisions: 3
Division 1: Singles <3.6 Male (8 players → 7 matches)
Division 2: Singles <3.6 Female (4 players → 3 matches)  
Division 3: Doubles Open Male (6 teams → 5 matches)

Total: 15 matches across 3 divisions
```

---

## Benefits

### ✅ Combined Events
- Run singles AND doubles in same tournament
- Participants can compete in multiple formats
- One registration handles all formats

### ✅ More Engagement
- Players can enter multiple categories
- More matches = more playtime
- Combined leaderboards possible

### ✅ Better Organization
- All formats under one tournament
- Shared venue and schedule
- Unified participant management

---

## Examples

### Example 1: Full Tournament

**Create tournament with:**
- ✅ Singles
- ✅ Doubles
- ✅ Mixed

**Result**: Players can register for any combination

### Example 2: Singles Only

**Create tournament with:**
- ✅ Singles

**Result**: Traditional singles-only tournament

### Example 3: Doubles Events

**Create tournament with:**
- ✅ Doubles
- ✅ Mixed

**Result**: Team-only tournament

---

## Participant Registration

When registering, participants select which format:

```
Category: [Singles ▼]  ← Dropdown shows only tournament's formats
Rating: [<3.6 ▼]
Gender: [Male ▼]

// If Doubles selected:
Partner Email: [partner@example.com]
...
```

The form automatically adapts based on selected format.

---

## Data Structure

### Database

**Legacy (backward compatible):**
```sql
format TEXT  -- First format in array (for old queries)
formats TEXT[]  -- All formats
```

**Example:**
```sql
format = 'singles'
formats = ['singles', 'doubles', 'mixed']
```

### TypeScript

```typescript
interface Tournament {
  format: string;  // Legacy
  formats?: string[];  // New - preferred
}

// Usage
const displayFormats = tournament.formats || [tournament.format];
```

---

## Migration Guide

### Run Migration

```sql
-- In Supabase SQL Editor
-- Copy/paste: supabase/migrations/012_multiple_formats.sql
```

### Update Existing Tournaments

```sql
-- Convert single format to array
UPDATE tournaments
SET formats = ARRAY[format]::TEXT[]
WHERE formats IS NULL;

-- Or manually set multiple formats
UPDATE tournaments
SET formats = ARRAY['singles', 'doubles']::TEXT[]
WHERE id = 'your-tournament-id';
```

### Verify

```sql
-- Check formats
SELECT id, title, format, formats
FROM tournaments
LIMIT 10;
```

---

## API Updates

### Creating Tournament

```bash
POST /api/tournaments

{
  "title": "Summer Championship",
  "formats": ["singles", "doubles", "mixed"],  ← Array
  ...
}
```

### Format in Fixture Generation

The fixture generator automatically:
1. Groups participants by format (from registration metadata)
2. Creates separate brackets for each format
3. Labels matches with format info

---

## UI Components

### Form Validation

```typescript
// At least one format required
if (selectedFormats.length === 0) {
  throw new Error('Please select at least one format');
}
```

### Display Formats

```typescript
// Show all formats
{tournament.formats?.map(f => (
  <Badge key={f}>{f}</Badge>
))}

// Or comma-separated
{tournament.formats?.join(', ')}
```

---

## Backward Compatibility

Old code using `tournament.format` still works:

```typescript
// Old code (still works)
const format = tournament.format;

// New code (recommended)
const formats = tournament.formats || [tournament.format];
```

---

## Best Practices

### Recommended Combinations

✅ **Singles only**: Simple individual tournament  
✅ **Doubles only**: Team tournament  
✅ **Singles + Doubles**: Combined event, players can enter both  
✅ **All three**: Full pickleball championship  

### Not Recommended

❌ Don't mix formats that conflict logistically  
❌ Don't select formats without available participants  

---

## Troubleshooting

### Formats not showing

**Check migration ran:**
```sql
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'tournaments' 
AND column_name = 'formats';
```

### Can't select multiple formats

**Ensure migration ran and clear cache:**
```bash
# Hard refresh browser
Ctrl + Shift + R

# Or restart dev server
npm run dev
```

---

**Now you can create multi-format tournaments!** 🎾🏆

