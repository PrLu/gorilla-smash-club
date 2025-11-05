# Tournament Participant Import Guide

## Overview

Quickly import multiple participants directly to a specific tournament using CSV upload. This feature creates players (if they don't exist) and automatically registers them to your tournament in one step.

## How to Access

1. Navigate to your tournament's participant management page:
   - Go to tournament → **Manage Participants** tab
   - Or visit: `/tournament/[tournament-id]/participants`

2. Click the **"Import CSV"** button in the top right

## CSV Format

### Required Columns (All Players)
- **full_name** - Player's full name (e.g., "John Doe")
- **email** - Player's email address (must be unique)
- **category** - Tournament category: `singles`, `doubles`, or `mixed`
- **rating** - Player skill rating: `<3.2`, `<3.6`, `<3.8`, or `open`
- **gender** - Player gender: `male` or `female`

### Conditionally Required
- **partner_email** - Required ONLY for `doubles` or `mixed` category (leave empty for singles)

### Optional Columns
- **phone** - Phone number (any format)
- **dupr_id** - DUPR rating ID
- **payment_status** - `paid` or `pending` (defaults to `pending`)

### Template Download

Click **"Download CSV Template"** in the import modal to get a pre-formatted file with examples for all categories.

### Example CSV

```csv
full_name,email,category,rating,gender,partner_email,phone,dupr_id,payment_status
John Doe,john@example.com,singles,<3.2,male,,+1234567890,12345,paid
Jane Smith,jane@example.com,doubles,<3.6,female,partner@example.com,+0987654321,67890,pending
Partner Pro,partner@example.com,doubles,<3.6,male,jane@example.com,+1112223333,PP111,pending
Mike Johnson,mike@example.com,mixed,<3.8,male,alice@example.com,+4445556666,MJ222,paid
Alice Williams,alice@example.com,mixed,<3.8,female,mike@example.com,+7778889999,AW333,paid
```

## What Happens During Import

For each player in the CSV:

1. **Check if player exists**
   - Looks up by email address
   - If exists: Uses existing player

2. **Create new player (if needed)**
   - Creates auth user account
   - Creates profile
   - Assigns "participant" role
   - Creates player record

3. **Register to tournament**
   - Checks if already registered
   - Creates registration with status: `confirmed`
   - Payment status set to: `pending`

4. **Report results**
   - Shows count of successful registrations
   - Lists failed registrations with error messages

## Import Results

After import completes, you'll see:

### Success Summary
- ✅ **Total**: Number of players in CSV
- ✅ **Registered**: Players successfully added to tournament
- ❌ **Failed**: Players that couldn't be registered

### Failed Registrations
Detailed list showing:
- Player name and email
- Specific error for each failure

## Common Scenarios

### Scenario 1: New Player
```
CSV: John Doe, john@example.com
Result:
  ✓ Creates new user account
  ✓ Creates profile
  ✓ Creates player record
  ✓ Registers to tournament
Status: SUCCESS
```

### Scenario 2: Existing Player
```
CSV: Jane Smith, jane@example.com (already in system)
Result:
  ✓ Finds existing player
  ✓ Registers to tournament
Status: SUCCESS
```

### Scenario 3: Already Registered
```
CSV: Mike Johnson, mike@example.com (already in tournament)
Result:
  ✗ Player already registered to this tournament
Status: FAILED (with explanation)
```

### Scenario 4: Duplicate Email
```
CSV: Alice, alice@example.com (email used by someone else)
Result:
  ✗ Email already exists in system
Status: FAILED (with explanation)
```

## Error Messages

| Error | Meaning | Solution |
|-------|---------|----------|
| "Email and full name are required" | Missing required fields | Add missing data |
| "Category is required and must be..." | Category missing or invalid | Use: singles, doubles, or mixed |
| "Rating is required and must be..." | Rating missing or wrong format | Use: <3.2, <3.6, <3.8, or open (with < symbol) |
| "Gender is required and must be..." | Gender missing or invalid | Use: male or female (lowercase) |
| "Partner email is required for..." | Missing partner for doubles/mixed | Add partner_email column value |
| "Already registered to this tournament" | Player already in tournament | Remove from CSV |
| "User with this email already exists" | Email belongs to different user | Check email address |

## Tips for Success

### ✅ Best Practices

1. **Download template first** - Always start with the provided template
2. **Test with small batch** - Import 2-3 players first to verify format
3. **Check for duplicates** - Remove players already in tournament
4. **Use consistent formats** - Keep phone numbers, gender values consistent
5. **Keep backup** - Save your CSV file before importing

### ❌ Common Mistakes

- Using spaces in column names (use underscores)
- Including empty rows
- Mixing different date/phone formats
- Forgetting required columns
- Using duplicate emails

## Differences from General Player Import

### Tournament Import (This Feature)
- **Purpose**: Add players TO A SPECIFIC TOURNAMENT
- **Location**: Tournament participants page
- **Result**: Players are REGISTERED to the tournament
- **Use When**: You have a list of participants for one tournament

### General Player Import
- **Purpose**: Add players to the SYSTEM
- **Location**: `/settings/participants` (Players page)
- **Result**: Players are added but NOT registered to any tournament
- **Use When**: You want to pre-populate your player database

## Step-by-Step Guide

### Step 1: Prepare Your CSV

```csv
full_name,email,phone,gender,dupr_id
Alice Williams,alice@example.com,+1234567890,female,A123
Bob Chen,bob@example.com,+0987654321,male,B456
Carol Davis,carol@example.com,+5555555555,female,C789
```

### Step 2: Access Import

1. Go to your tournament page
2. Click **"Manage Participants"** tab (or button)
3. Click **"Import CSV"** button

### Step 3: Upload File

1. Drag and drop your CSV file, OR
2. Click to browse and select file
3. File name will appear when selected

### Step 4: Import

1. Click **"Import to Tournament"** button
2. Wait for processing (1-2 seconds per player)
3. Don't close the modal while importing

### Step 5: Review Results

1. Check the success/failed counts
2. If any failed, review error messages
3. Fix issues in your CSV
4. Click **"Try Again"** to retry failed players

### Step 6: Verify

1. Close the modal
2. Check the participants list
3. All successfully imported players should appear

## Advanced Usage

### Large Tournaments

For tournaments with 100+ participants:
- Split into multiple CSV files (50 players each)
- Import in batches
- Allows better error handling

### Mixed New/Existing Players

CSV can contain both:
- Players who don't exist in system (will be created)
- Players who already exist (will be registered)
- System handles both automatically

### Partial Success

If some players fail:
1. Import continues for remaining players
2. Successful players are registered
3. Failed players are reported
4. Fix failures and re-import just those players

## Permissions

**Who can import participants?**
- ✅ Root users
- ✅ Admin users
- ❌ Regular players

**Requirements:**
- Must be authenticated
- Must have admin or root role

## After Import

### What Players Can Do
- Players receive no email notification (import is silent)
- They can log in (password sent to email during account creation)
- They can view their tournament registration
- They can update their profile

### What Organizers Can Do
- View all registered participants
- Manually add more participants
- Remove participants if needed
- Generate fixtures once all participants are registered

## Troubleshooting

### Import Button Not Visible
- **Check:** Are you logged in as admin/root?
- **Check:** Are you on the tournament participants page?

### "Insufficient permissions" Error
- **Solution:** Make sure you're logged in as admin or root user
- **Solution:** Try signing out and back in

### Some Players Failed to Import
- **Review:** Check the error message for each failed player
- **Common:** Already registered, duplicate email, missing data
- **Fix:** Correct the CSV and try again with just failed players

### Import Takes Too Long
- **Normal:** 1-2 seconds per player
- **For 50 players:** Expect 60-100 seconds
- **Recommendation:** Import in batches of 25-50 players

### Players Imported But Not Showing
- **Solution:** Refresh the page
- **Solution:** Check if tournament has participant limit (max_participants)

## Example Workflow

```
Tournament Organizer Workflow:

1. Create tournament
2. Download participant CSV template
3. Fill in participants from your list
4. Go to tournament → Manage Participants
5. Click "Import CSV"
6. Upload your file
7. Review results
8. Fix any failures (if any)
9. Verify all participants are registered
10. Generate fixtures
11. Start tournament!
```

## Support

For issues:
- Check error messages in import results
- Verify CSV format matches template
- Ensure you have admin/root permissions
- Try importing just 1-2 players as a test

---

**Related Guides:**
- `BULK_IMPORT_GUIDE.md` - General player import (not tournament-specific)
- `PARTICIPANT_MANAGEMENT.md` - Managing players system-wide
- `ROLES_AND_PERMISSIONS.md` - Understanding user roles

