# Tournament Archive Feature

## Overview

Tournaments can be **archived** instead of permanently deleted. Archived tournaments are soft-deleted and can be restored later.

## Why Archive Instead of Delete?

✅ **Data preservation** - All matches, scores, and participant data retained  
✅ **Compliance** - Audit trail maintained for historical records  
✅ **Reversible** - Can restore tournaments if archived by mistake  
✅ **Analytics** - Past tournament data available for reporting  
✅ **References** - Links to archived tournaments don't break  

---

## How It Works

### Archive Flow

```
Active Tournament → Click "Archive" → Confirmation → Archived
   (status: open)                                    (status: archived)
```

**Changes:**
- `status` = `'archived'`
- `archived_at` = current timestamp
- `archived_by` = user who archived it

### Restore Flow

```
Archived Tournament → Click "Restore" → Active Tournament
   (status: archived)                   (status: draft)
```

**Changes:**
- `status` = `'draft'`
- `archived_at` = `NULL`
- `archived_by` = `NULL`

---

## User Interface

### Dashboard - Archived Filter

**New filter button:**
```
[All] [Open] [In Progress] [Completed] [Archived]
                                         ^^^^^^^^
                                         New!
```

**Behavior:**
- **All**: Shows active tournaments (excludes archived)
- **Archived**: Shows only archived tournaments

### Tournament Detail Page

**For Active Tournaments:**
```
[Manage Participants] [Generate Fixtures] [Archive]
                                           ^^^^^^^^
                                           Red button
```

**For Archived Tournaments:**
```
⚠️ This tournament is archived
   Archived tournaments are read-only. Restore to make changes.
   [Restore Tournament]

[Restore]
^^^^^^^^
Gray button
```

### Tournament Card

**Archived Badge:**
```
┌────────────────────────────┐
│ Summer Championship        │
│ [Archived]  ← Gray badge   │
│                            │
│ 📍 City Complex            │
│ 📅 Jun 15 - Jun 17         │
│ 👥 Singles • 12 participants│
│ ₹ 500                      │
└────────────────────────────┘
```

---

## API Endpoints

### Archive Tournament

```bash
PATCH /api/tournaments/:id/archive

Headers:
  Authorization: Bearer YOUR_JWT_TOKEN

Response (Success):
{
  "success": true,
  "message": "Tournament archived successfully",
  "tournament": { ... }
}
```

### Restore Tournament

```bash
POST /api/tournaments/:id/archive

Headers:
  Authorization: Bearer YOUR_JWT_TOKEN

Response (Success):
{
  "success": true,
  "message": "Tournament restored successfully",
  "tournament": { ... }
}
```

---

## Database Changes

### Migration: `011_add_archive_status.sql`

**Adds to `tournaments` table:**
```sql
status TEXT CHECK (status IN (..., 'archived'))
archived_at TIMESTAMPTZ
archived_by UUID REFERENCES profiles(id)
```

**Indexes:**
```sql
CREATE INDEX idx_tournaments_archived ON tournaments(archived_at);
CREATE INDEX idx_tournaments_status_archived ON tournaments(status) 
  WHERE status = 'archived';
```

---

## Usage Examples

### Archive a Tournament

```typescript
import { useArchiveTournament } from '@/lib/hooks/useArchiveTournament';

const archiveTournament = useArchiveTournament();

const handleArchive = async () => {
  try {
    await archiveTournament.mutateAsync(tournamentId);
    toast.success('Tournament archived');
  } catch (error) {
    toast.error('Failed to archive');
  }
};
```

### Restore from Archive

```typescript
import { useRestoreTournament } from '@/lib/hooks/useArchiveTournament';

const restoreTournament = useRestoreTournament();

const handleRestore = async () => {
  try {
    await restoreTournament.mutateAsync(tournamentId);
    toast.success('Tournament restored');
  } catch (error) {
    toast.error('Failed to restore');
  }
};
```

### View Archived Tournaments

```typescript
import { useTournaments } from '@/lib/hooks/useTournaments';

// Exclude archived (default)
const { data: activeTournaments } = useTournaments(false);

// Include archived
const { data: allTournaments } = useTournaments(true);
```

---

## Permissions

**Who Can Archive:**
- ✅ Tournament organizer (creator)
- ✅ Super admin (via admin panel)

**Who Can Restore:**
- ✅ Tournament organizer
- ✅ Super admin

**Who Can View Archived:**
- ✅ Tournament organizer (always sees their archived tournaments)
- ✅ Super admin
- ❌ Regular users (archived tournaments hidden from public view)

---

## Audit Trail

All archive/restore actions are logged:

```json
{
  "action": "ARCHIVE_TOURNAMENT",
  "target_table": "tournaments",
  "target_id": "tournament-uuid",
  "actor_profile_id": "user-uuid",
  "metadata": {
    "previousStatus": "completed",
    "tournamentTitle": "Summer Championship"
  }
}
```

View in: `/admin/audit-logs`

---

## Queries

### Get Active Tournaments

```sql
SELECT * FROM tournaments 
WHERE status != 'archived'
ORDER BY start_date;
```

### Get Archived Tournaments

```sql
SELECT * FROM tournaments 
WHERE status = 'archived'
ORDER BY archived_at DESC;
```

### Get Recently Archived

```sql
SELECT * FROM tournaments 
WHERE status = 'archived'
AND archived_at > NOW() - INTERVAL '30 days'
ORDER BY archived_at DESC;
```

---

## Best Practices

### When to Archive

✅ **Tournament is completed** and results finalized  
✅ **Old drafts** that won't be used  
✅ **Cancelled events** that won't be rescheduled  
✅ **Test tournaments** after testing complete  

### When NOT to Archive

❌ **Active tournaments** (participants expecting updates)  
❌ **Upcoming events** (use 'open' or 'draft' status)  
❌ **In-progress tournaments** (finish first, then archive)  

### Clean-up Schedule

Recommendation:
- Archive completed tournaments after **30 days**
- Archive drafts older than **90 days**
- Keep archived tournaments for **1-2 years** for reporting
- Permanently delete only after retention period

---

## Troubleshooting

### Can't see archived tournament

**Cause**: Archived tournaments hidden by default

**Fix**: Click "Archived" filter on dashboard

### Archive button missing

**Cause**: Not logged in as organizer

**Fix**: Only tournament creator can archive

### Already archived error

**Cause**: Tournament status is already 'archived'

**Fix**: Use restore instead

### Can't restore tournament

**Cause**: Permission issue or database error

**Fix**:
```sql
-- Check current status
SELECT status, archived_at, archived_by 
FROM tournaments 
WHERE id = 'your-tournament-id';

-- Manual restore if needed
UPDATE tournaments 
SET status = 'draft', archived_at = NULL, archived_by = NULL
WHERE id = 'your-tournament-id';
```

---

## Future Enhancements

- Bulk archive (select multiple tournaments)
- Auto-archive completed tournaments after N days
- Archive confirmation email to participants
- Permanent deletion after retention period
- Archive statistics and reports
- Export archived tournament data

---

## Migration Required

Run this SQL in Supabase:

```sql
-- Copy and paste: supabase/migrations/011_add_archive_status.sql
```

This adds:
- `archived` status option
- `archived_at` timestamp
- `archived_by` user reference
- Indexes for performance

---

**Now you can safely archive tournaments instead of losing data!** 🗄️

