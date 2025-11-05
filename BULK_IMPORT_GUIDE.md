# Bulk Import Players Guide

## Overview

The bulk import feature allows admins and root users to upload multiple players at once using a CSV file. This is perfect for importing entire tournament rosters or adding many players quickly.

## Features

✅ **CSV Upload**: Drag & drop or browse for CSV files
✅ **Template Download**: Get a pre-formatted CSV template
✅ **Validation**: Automatic validation of required fields
✅ **Error Reporting**: Detailed report of successful and failed imports
✅ **Duplicate Detection**: Prevents importing players that already exist
✅ **Batch Processing**: Processes all players in one operation

## How to Use

### 1. Access Bulk Import

1. Navigate to **Players** page
2. Click the **"Bulk Import"** button (next to "Add Player")

### 2. Prepare Your CSV File

#### Option A: Download Template
Click **"Download CSV Template"** in the modal to get a pre-formatted file with example data.

#### Option B: Create Your Own
Create a CSV file with the following format:

```csv
full_name,email,phone,gender,dupr_id
John Doe,john@example.com,+1234567890,male,12345
Jane Smith,jane@example.com,+0987654321,female,67890
```

### 3. CSV Format Requirements

#### Required Columns:
- `full_name` - Player's full name (required)
- `email` - Player's email address (required, must be unique)

#### Optional Columns:
- `phone` - Phone number (any format)
- `gender` - Must be: `male`, `female`, or `other`
- `dupr_id` - DUPR rating ID

#### Important Notes:
- **First row must contain column headers**
- Column names are case-insensitive
- Alternate column names accepted:
  - `full_name` / `full name` / `name`
  - `phone` / `phone_number`
  - `dupr_id` / `dupr id` / `dupr`
- Empty optional fields are allowed
- Rows without an email address will be skipped

### 4. Upload and Import

1. **Drag & Drop** your CSV file into the upload area, or
2. **Click to browse** and select your file
3. Click **"Import Players"**
4. Wait for processing to complete

### 5. Review Results

After import, you'll see:
- **Total**: Number of players in the CSV
- **Success**: Players imported successfully (green)
- **Failed**: Players that couldn't be imported (red)

#### Failed Imports
If any players failed to import, you'll see a detailed list showing:
- Player name and email
- Specific error message for each failure

Common failure reasons:
- Email already exists in the system
- Missing required fields (name or email)
- Invalid email format
- Invalid gender value

### 6. Handle Failed Imports

If some players failed:
1. Review the error messages
2. Click **"Try Again"**
3. Fix the issues in your CSV
4. Re-upload the corrected file

## Example CSV Files

### Basic Import (Required Fields Only)
```csv
full_name,email
Alice Johnson,alice@example.com
Bob Williams,bob@example.com
Carol Davis,carol@example.com
```

### Complete Import (All Fields)
```csv
full_name,email,phone,gender,dupr_id
Alice Johnson,alice@example.com,+1-555-0100,female,ABC123
Bob Williams,bob@example.com,+1-555-0101,male,DEF456
Carol Davis,carol@example.com,+1-555-0102,female,GHI789
David Brown,david@example.com,+1-555-0103,male,JKL012
```

### Mixed (Some Optional Fields)
```csv
full_name,email,phone,gender,dupr_id
Emily White,emily@example.com,,female,MNO345
Frank Miller,frank@example.com,+1-555-0105,,PQR678
Grace Lee,grace@example.com,+1-555-0106,female,
```

## Tips for Success

### ✅ Best Practices
- Always download and use the provided template
- Test with a small file (2-3 players) first
- Keep a backup of your CSV file
- Use consistent data formats
- Remove any special characters from names if they cause issues

### ❌ Common Mistakes to Avoid
- Don't include empty rows
- Don't use quotes around values (unless necessary for commas in names)
- Don't include player IDs (system generates these)
- Don't mix different phone number formats (be consistent)
- Don't forget the header row

## Technical Details

### Processing Flow
1. File is validated (must be CSV)
2. CSV is parsed row by row
3. Each player is validated:
   - Required fields present
   - Email doesn't already exist
   - Gender value is valid (if provided)
4. Auth user is created
5. Profile is created with player data
6. If any step fails, that player is marked as failed
7. Results summary is displayed

### Data Created
For each successfully imported player:
- **Auth User**: Created in Supabase Auth
- **Profile**: Created in `profiles` table with:
  - `id` (from auth user)
  - `email`
  - `full_name`
  - `phone` (if provided)
  - `gender` (if provided)
  - `dupr_id` (if provided)
  - `created_by` (set to current admin/root user)
  - `created_at` (timestamp)

### Permissions
- **Root users**: Can bulk import ✅
- **Admin users**: Can bulk import ✅
- **Regular users**: Cannot bulk import ❌

## Troubleshooting

### "Insufficient permissions"
- Make sure you're logged in as an admin or root user
- Try signing out and back in to refresh your session

### "Players array is required"
- Your CSV file might be empty or improperly formatted
- Check that you have at least one data row (besides headers)

### "User with this email already exists"
- That email is already registered in the system
- Remove that row from your CSV or change the email
- Use the search feature to find existing players

### Import is slow
- Large CSV files (>100 players) may take time
- This is normal - each player must be created individually
- Don't close the modal while importing

### Some players imported, some failed
- This is normal if there are data issues
- Review the failed list carefully
- Fix the issues and import only the failed players again

## Limitations

- Maximum recommended file size: **1000 players per import**
- Only CSV format is supported (not Excel .xlsx)
- No duplicate email addresses allowed
- Phone numbers are stored as-is (no automatic formatting)
- Players created via bulk import will need to set their passwords later

## Next Steps After Import

After successfully importing players:
1. Players appear in the Players list immediately
2. You can search for them
3. You can edit their details individually
4. Players will need to be invited to tournaments separately
5. Players can later claim their accounts and set passwords

## Support

For issues or questions:
- Check error messages in the failed imports list
- Verify CSV format matches the template
- Ensure all required fields are present
- Contact your system administrator if problems persist

