# Generate Fixtures Feature

## Overview

The fixture generation system creates single-elimination tournament brackets from confirmed registrations, handles byes automatically, and manages match progression.

## API Endpoint

### POST `/api/tournaments/:id/generate-fixtures`

Generates fixtures for a tournament based on confirmed registrations.

**Authentication**: Required (Bearer token)

**Authorization**: Tournament organizer or admin

### Request Body

```json
{
  "fixture_type": "single_elim",
  "replaceExisting": false,
  "autoAdvanceByes": true,
  "seedOrder": "registered"
}
```

**Parameters:**

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `fixture_type` | string | `"single_elim"` | Type of bracket (currently only single elimination) |
| `replaceExisting` | boolean | `false` | Delete existing matches and regenerate |
| `autoAdvanceByes` | boolean | `true` | Automatically advance players with byes |
| `seedOrder` | string | `"registered"` | Seeding: `"registered"` (chronological) or `"random"` (random draw) |

### Response (Success - 200)

```json
{
  "success": true,
  "message": "Fixtures generated successfully",
  "matchesCreated": 7,
  "autoAdvancedCount": 3,
  "participantCount": 5,
  "rounds": 3,
  "matches": [...]
}
```

### Response (Error - 400)

```json
{
  "error": "Fixtures already exist",
  "message": "15 matches already exist. Set replaceExisting=true to regenerate.",
  "existingCount": 15
}
```

### Response (Error - 403)

```json
{
  "error": "Forbidden - Only tournament organizer can generate fixtures"
}
```

---

## cURL Examples

### Basic Generation

```bash
curl -X POST "http://localhost:3000/api/tournaments/abc-123/generate-fixtures" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "autoAdvanceByes": true,
    "seedOrder": "registered"
  }'
```

### Replace Existing Fixtures

```bash
curl -X POST "http://localhost:3000/api/tournaments/abc-123/generate-fixtures" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "replaceExisting": true,
    "autoAdvanceByes": true
  }'
```

### Random Seeding

```bash
curl -X POST "http://localhost:3000/api/tournaments/abc-123/generate-fixtures" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "seedOrder": "random"
  }'
```

---

## Database Changes

### Tables Modified

**`matches` table** - Rows inserted:

```sql
tournament_id UUID           -- Tournament reference
round INTEGER                -- Round number (1, 2, 3, ...)
bracket_pos INTEGER          -- Unique position in bracket
player1_id UUID              -- First player (or NULL for bye)
player2_id UUID              -- Second player (or NULL for bye)
team1_id UUID                -- First team (for doubles/mixed)
team2_id UUID                -- Second team (for doubles/mixed)
status TEXT                  -- 'pending', 'in_progress', 'completed'
winner_player_id UUID        -- Set immediately for bye matches
winner_team_id UUID          -- Set immediately for bye matches (teams)
next_match_id UUID           -- Links to next round match
```

**`tournaments` table** - Status updated:

```sql
status = 'in_progress'       -- Changed from 'open'
updated_at = NOW()
```

**`audit_logs` table** - Entry created:

```sql
action = 'GENERATE_FIXTURES'
target_table = 'tournaments'
target_id = tournament_id
metadata = { matchesCreated, participantCount, ... }
```

---

## How It Works

### 1. Participant Collection

```
Confirmed Registrations → Extract Player/Team IDs → Participant List
```

- For **singles**: Uses `registrations.player_id`
- For **doubles/mixed**: Uses `registrations.team_id`
- Only `status='confirmed'` registrations included

### 2. Bracket Sizing

```
Participants: 5
Padded to: 8 (nearest power of 2)
Byes needed: 3
```

### 3. Round Generation

**Round 1**: Pair all participants
```
Match 1: P1 vs P2
Match 2: P3 vs P4
Match 3: P5 vs NULL (bye)
Match 4: P6 vs NULL (bye)
```

**Round 2**: Placeholder matches
```
Match 5: Winner(M1) vs Winner(M2)
Match 6: Winner(M3) vs Winner(M4)
```

**Round 3**: Final
```
Match 7: Winner(M5) vs Winner(M6)
```

### 4. Auto-Advance (Byes)

When `autoAdvanceByes=true`:

```
Match 3: P5 vs NULL
  ↓
Set winner_player_id = P5
Set status = 'completed'
  ↓
Update Match 6: player1_id = P5
```

If Match 6 now has only P5 (other slot still NULL):
- Cascade: P5 auto-advances to Match 7

### 5. Match Linking

Each match stores `next_match_id`:

```sql
UPDATE matches 
SET next_match_id = (SELECT id FROM matches WHERE bracket_pos = 5)
WHERE bracket_pos IN (1, 2);
```

---

## Frontend Usage

### Using the Hook

```tsx
import { useGenerateFixtures } from '@/lib/hooks/useGenerateFixtures';

function MyComponent() {
  const generateFixtures = useGenerateFixtures();

  const handleClick = () => {
    generateFixtures.mutate({
      tournamentId: 'abc-123',
      replaceExisting: false,
      autoAdvanceByes: true,
      seedOrder: 'registered',
    });
  };

  return (
    <button 
      onClick={handleClick}
      disabled={generateFixtures.isPending}
    >
      {generateFixtures.isPending ? 'Generating...' : 'Generate Fixtures'}
    </button>
  );
}
```

### Using the Component

```tsx
import { GenerateFixturesButton } from '@/components/GenerateFixturesButton';

<GenerateFixturesButton 
  tournamentId={tournamentId}
  hasExistingMatches={matches && matches.length > 0}
/>
```

---

## Constraints & Assumptions

### Requirements

- ✅ At least **2 confirmed registrations**
- ✅ User must be **tournament organizer**
- ✅ Registrations must have valid player/team IDs

### Behavior

- **Singles Format**: Uses `player1_id` and `player2_id`
- **Doubles/Mixed**: Uses `team1_id` and `team2_id`
- **Bye Handling**: Null opponent = automatic win
- **Status**: Tournament status → `'in_progress'` after generation

### Limitations

- Maximum delete limit: **500 matches** (safety guard)
- Auto-advance limited to **2 cascade levels** (prevents infinite loops)
- Only **single elimination** supported (double-elim future feature)

---

## Troubleshooting

### "Insufficient participants" Error

**Cause**: Less than 2 confirmed registrations

**Fix**:
```sql
-- Check confirmed registrations
SELECT COUNT(*) FROM registrations 
WHERE tournament_id = 'xxx' AND status = 'confirmed';

-- Update registration status
UPDATE registrations 
SET status = 'confirmed' 
WHERE tournament_id = 'xxx' AND status = 'pending';
```

### "No valid participants found" Error

**Cause**: Registrations exist but have no player/team IDs

**Fix**:
```sql
-- Check for orphaned registrations
SELECT * FROM registrations r
LEFT JOIN players p ON p.id = r.player_id
LEFT JOIN teams t ON t.id = r.team_id
WHERE r.tournament_id = 'xxx'
AND r.player_id IS NULL 
AND r.team_id IS NULL;

-- These registrations need player or team assigned
```

### "Forbidden" Error

**Cause**: User is not tournament organizer

**Fix**:
- Verify you're logged in as the tournament creator
- Check `tournaments.organizer_id` matches your profile ID
```sql
SELECT organizer_id FROM tournaments WHERE id = 'xxx';
SELECT id FROM profiles WHERE email = 'your@email.com';
```

### Fixtures Generate But Don't Show in UI

**Cause**: Cache not invalidated or Realtime not working

**Fix**:
1. Hard refresh browser (Ctrl+Shift+R)
2. Check Supabase Realtime is enabled for `matches` table
3. Verify React Query invalidation in `useGenerateFixtures` hook

### Auto-Advance Not Working

**Cause**: `autoAdvanceByes=false` or logic error

**Fix**:
- Set `autoAdvanceByes: true` in request
- Check bye matches have `status='completed'` and `winner_player_id` set
```sql
SELECT * FROM matches 
WHERE tournament_id = 'xxx'
AND round = 1
AND (player1_id IS NULL OR player2_id IS NULL);
```

---

## Performance

### Batch Insertion

Matches are inserted in a single query:

```typescript
await supabase.from('matches').insert(matchesToInsert);
```

For 64 participants:
- 63 matches created
- Single DB transaction
- ~200-500ms execution time

### Materialized Views

After generation, refresh reporting views:

```sql
SELECT refresh_reporting_views();
```

### Realtime Updates

Supabase Realtime automatically broadcasts new matches:

```typescript
// Client automatically receives updates via
supabase.channel('matches')
  .on('postgres_changes', { table: 'matches' }, handler)
  .subscribe();
```

---

## Testing

### Unit Tests

```bash
npm run test -- fixtures.generator
```

Tests:
- 8 players → 7 matches
- 5 players → 7 matches (with byes)
- Auto-advance logic
- Bracket linking

### Integration Tests

```bash
npm run test -- generate-fixtures.api
```

Tests:
- Full API flow
- Permission checking
- Replace existing behavior
- Auto-advance cascading

### Manual Testing

1. Create tournament
2. Add 5 participants (confirm registrations)
3. Click "Generate Fixtures"
4. Check `/tournament/:id` page shows 7 matches
5. Verify 3 matches in round 1 show "completed" (byes)
6. Verify round 2 has participants from bye matches

---

## Future Enhancements

- Double elimination support
- Round robin format
- Manual seeding (drag-and-drop bracket editor)
- Best-of-3/best-of-5 series
- Consolation brackets
- Group stage + knockout

---

## Security Notes

- ✅ Organizer-only access enforced
- ✅ ReplaceExisting requires explicit confirmation
- ✅ Delete limit prevents accidental mass deletion
- ✅ All actions logged in audit trail
- ✅ Service role used for DB operations (bypasses RLS)

---

## Database Schema

Fixtures use these `matches` columns:

```sql
CREATE TABLE matches (
  id UUID PRIMARY KEY,
  tournament_id UUID NOT NULL,
  round INTEGER NOT NULL,
  bracket_pos INTEGER NOT NULL,
  player1_id UUID,               -- NULL = bye
  player2_id UUID,               -- NULL = bye
  team1_id UUID,                 -- For doubles
  team2_id UUID,                 -- For doubles
  score1 INTEGER,
  score2 INTEGER,
  winner_player_id UUID,         -- Auto-set for byes
  winner_team_id UUID,           -- Auto-set for byes (teams)
  status TEXT,                   -- pending|in_progress|completed
  next_match_id UUID,            -- Links to next round
  scheduled_at TIMESTAMPTZ,
  court TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Support

For issues:
1. Check browser console for errors
2. Check Supabase logs for server errors
3. Verify permissions in database
4. Review audit logs for failed attempts

