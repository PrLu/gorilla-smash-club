# Delete Fixtures Feature

## Overview

Tournament organizers can now easily delete all generated fixtures to start fresh. This feature provides a clean slate for regenerating fixtures without affecting participants or tournament settings.

---

## Features

### ✅ **Complete Fixture Deletion**
- Deletes all matches (with scores)
- Deletes all pools and pool standings
- Deletes pool player assignments
- Preserves all participants and tournament details

### ✅ **Smart UI Integration**
- Delete button appears only when fixtures exist
- Available in two locations:
  1. Main tournament page (action buttons area)
  2. Fixtures tab (inline with fixture viewer)
- Hidden for archived tournaments

### ✅ **Safety Measures**
- Confirmation modal with clear warnings
- Shows what will be deleted vs. preserved
- Requires explicit confirmation
- Audit logging for all deletions

### ✅ **Status Management**
- Automatically resets tournament status from `in_progress` to `upcoming`
- Allows fresh fixture generation after deletion

---

## How to Use

### Method 1: From Main Tournament Page

1. Navigate to your tournament
2. Look for the **"Delete Fixtures"** button (red, secondary style)
3. Click the button
4. Review the confirmation modal
5. Click **"Yes, Delete All Fixtures"**
6. Fixtures are deleted, and you can regenerate fresh

### Method 2: From Fixtures Tab

1. Navigate to your tournament
2. Click the **"Fixtures"** tab
3. Look for the **"Delete Fixtures"** button (ghost style, top right)
4. Click the button
5. Confirm deletion
6. Start fresh!

---

## What Gets Deleted

### 🗑️ **Removed:**
- ✅ All tournament matches
- ✅ All match scores and results
- ✅ All pool configurations
- ✅ All pool standings
- ✅ All pool player assignments

### 💾 **Preserved:**
- ✅ Tournament details (name, date, location, etc.)
- ✅ All registered participants
- ✅ Teams and player information
- ✅ Registration data
- ✅ Tournament settings

---

## API Documentation

### Endpoint

```
DELETE /api/tournaments/{tournamentId}/fixtures
```

### Authentication

Requires:
- Valid authentication token
- User must be tournament organizer

### Response

**Success (200):**
```json
{
  "success": true,
  "message": "Fixtures deleted successfully",
  "deletedMatches": 15,
  "deletedPools": 3
}
```

**No Fixtures (200):**
```json
{
  "success": true,
  "message": "No fixtures to delete",
  "deletedMatches": 0,
  "deletedPools": 0
}
```

**Unauthorized (401):**
```json
{
  "error": "Unauthorized"
}
```

**Forbidden (403):**
```json
{
  "error": "Forbidden - Only tournament organizer can delete fixtures"
}
```

**Not Found (404):**
```json
{
  "error": "Tournament not found"
}
```

**Server Error (500):**
```json
{
  "error": "Failed to delete fixtures",
  "details": "Error message"
}
```

---

## React Hook Usage

### `useDeleteFixtures`

```typescript
import { useDeleteFixtures } from '@/lib/hooks/useDeleteFixtures';

function MyComponent() {
  const deleteFixtures = useDeleteFixtures();

  const handleDelete = async () => {
    try {
      const result = await deleteFixtures.mutateAsync({
        tournamentId: 'tournament-id'
      });
      
      console.log(`Deleted ${result.deletedMatches} matches`);
    } catch (error) {
      console.error('Failed to delete:', error);
    }
  };

  return (
    <button 
      onClick={handleDelete}
      disabled={deleteFixtures.isPending}
    >
      {deleteFixtures.isPending ? 'Deleting...' : 'Delete Fixtures'}
    </button>
  );
}
```

### Hook Properties

- `mutateAsync({ tournamentId })` - Execute deletion
- `isPending` - Loading state
- `isError` - Error state
- `error` - Error object

---

## Component Usage

### `<DeleteFixturesButton />`

```typescript
import { DeleteFixturesButton } from '@/components/DeleteFixturesButton';

<DeleteFixturesButton
  tournamentId="tournament-id"
  variant="danger"      // 'danger' | 'ghost' | 'secondary'
  size="md"             // 'sm' | 'md' | 'lg'
  showIcon={true}       // Show trash icon
  disabled={false}      // Disable button
/>
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `tournamentId` | `string` | **required** | Tournament ID |
| `variant` | `'danger' \| 'ghost' \| 'secondary'` | `'danger'` | Button style |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Button size |
| `showIcon` | `boolean` | `true` | Show trash icon |
| `disabled` | `boolean` | `false` | Disable button |

---

## Confirmation Modal

The delete confirmation modal provides:

### 🚨 **Warning Banner**
- Red alert banner with clear warning message
- "This action cannot be undone" notice

### 📋 **Detailed Information**
- **What will be deleted**: Comprehensive list
- **What will be preserved**: Reassurance list

### 🔒 **Confirmation Prompt**
- Final confirmation message
- Two-step action (open modal → confirm)

### ⚡ **Loading State**
- Shows "Deleting..." during operation
- Disables actions during deletion
- Auto-closes on success

---

## Use Cases

### Use Case 1: Wrong Fixture Type
**Scenario:** Generated single elimination but need pool + knockout

**Solution:**
1. Delete fixtures
2. Regenerate with pool + knockout option

### Use Case 2: Incorrect Seeding
**Scenario:** Used random seeding but want registration order

**Solution:**
1. Delete fixtures
2. Regenerate with correct seeding option

### Use Case 3: Added More Participants
**Scenario:** Generated fixtures, then added 5 more participants

**Solution:**
1. Delete fixtures
2. Regenerate to include all participants

### Use Case 4: Testing/Development
**Scenario:** Testing different bracket configurations

**Solution:**
1. Generate fixtures to test
2. Delete and try different configuration
3. Repeat until satisfied

### Use Case 5: Category Separation Issues
**Scenario:** Mixed categories generated together, need separate divisions

**Solution:**
1. Delete fixtures
2. Use the improved category-aware generator
3. Get separate brackets per category

---

## Database Operations

### Tables Affected

1. **`matches`** - All records for tournament deleted
2. **`pools`** - All pool records deleted
3. **`pool_players`** - All pool player assignments deleted
4. **`tournaments`** - Status reset if `in_progress`
5. **`audit_logs`** - Deletion event logged

### Transaction Safety

The deletion process:
1. Deletes `pool_players` first (foreign key dependencies)
2. Deletes `matches`
3. Deletes `pools`
4. Updates tournament status
5. Logs audit event

All operations use Supabase service role for guaranteed permissions.

---

## Audit Logging

Every fixture deletion is logged:

```json
{
  "action": "DELETE_FIXTURES",
  "targetTable": "tournaments",
  "targetId": "tournament-id",
  "metadata": {
    "deletedMatches": 15,
    "deletedPools": 3,
    "previousStatus": "in_progress"
  },
  "actorId": "organizer-user-id",
  "timestamp": "2025-11-06T12:00:00Z"
}
```

---

## Workflow Examples

### Workflow 1: Generate → Delete → Regenerate

```
1. Generate fixtures (single elimination)
   ↓
2. Review fixtures
   ↓
3. Not satisfied → Click "Delete Fixtures"
   ↓
4. Confirm deletion
   ↓
5. Generate new fixtures (pool + knockout)
   ↓
6. Success!
```

### Workflow 2: Delete and Start Over

```
1. Tournament has fixtures with scores
   ↓
2. Major changes needed
   ↓
3. Click "Delete Fixtures"
   ↓
4. All fixtures cleared
   ↓
5. Tournament status → upcoming
   ↓
6. Fresh start available
```

---

## Integration Points

### Tournament Page
- Main action buttons area
- Shows when fixtures exist
- Hides for archived tournaments

### Fixtures Tab
- Inline with fixture viewer
- Shows match count
- Compact ghost button style

### Permission Checks
- Tournament organizer only
- Authenticated users only
- Service role for actual deletion

---

## Best Practices

### ✅ **Do:**
- Use delete when major changes needed
- Review what will be preserved before deleting
- Regenerate fixtures immediately after deletion
- Use for testing different bracket configurations

### ❌ **Don't:**
- Delete fixtures in the middle of a live tournament
- Delete without reviewing confirmation modal
- Delete if you only need minor adjustments
- Use as a way to edit individual matches (use score editing instead)

---

## Error Handling

### Common Errors

**No Authentication:**
- Ensure user is logged in
- Check auth token validity

**Not Tournament Organizer:**
- Only organizer can delete fixtures
- Check tournament ownership

**No Fixtures to Delete:**
- Returns success with 0 deleted
- Not an error, just informational

**Database Errors:**
- Check foreign key constraints
- Verify table permissions
- Check audit log insertion

---

## Performance Notes

- Deletion is fast (< 1 second for most tournaments)
- No limit on number of matches/pools
- Service role ensures permissions
- Cascading deletes handled automatically
- Query invalidation triggers UI refresh

---

## Future Enhancements

### Possible Additions:
- [ ] Soft delete option (mark as deleted, don't remove)
- [ ] Undo within 30 seconds
- [ ] Delete specific divisions only
- [ ] Export fixtures before deleting
- [ ] Scheduled deletion (e.g., after tournament ends)

---

## Related Documentation

- [FIXTURE_GENERATION_FIX.md](./FIXTURE_GENERATION_FIX.md) - Category-based fixture generation
- [FIXTURE_GENERATION_GUIDE.md](./FIXTURE_GENERATION_GUIDE.md) - How to generate fixtures
- [TOURNAMENT_SYSTEM_FINAL.md](./TOURNAMENT_SYSTEM_FINAL.md) - Tournament system overview

---

## Summary

The Delete Fixtures feature provides:
- ✅ Easy way to start fresh
- ✅ Clear warnings and confirmations
- ✅ Preserves participants and settings
- ✅ Audit trail for accountability
- ✅ Smart UI integration
- ✅ Safe deletion process

**Perfect for:** Testing, corrections, regeneration, and fresh starts!

---

**Status:** ✅ Complete and Ready to Use
**Breaking Changes:** None
**Database Changes:** None (uses existing tables)

