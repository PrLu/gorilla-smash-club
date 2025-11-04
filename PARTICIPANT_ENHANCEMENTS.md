# Participant Management Enhancements

## Overview

Enhanced the participant invitation system with mandatory fields (Category, Rating, Gender) and email search functionality.

## New Features

### 1. Mandatory Fields
All participants must now provide:
- ✅ **Category**: Singles, Doubles, or Mixed
- ✅ **Rating**: <3.2, <3.6, <3.8, or Open
- ✅ **Gender**: Male or Female

### 2. Email Search & Auto-fill
- Type email address in the form
- System automatically searches for existing users (500ms debounce)
- If user found: Auto-fills display name and shows success message
- If user not found: Shows "New User" message

### 3. Visual Feedback
- **Existing User**: Green success banner with user details
- **New User**: Yellow warning banner explaining invitation will be sent
- **Searching**: Loading spinner in email input field

## Database Changes

### New Migration: `006_add_rating_gender.sql`

Adds to `players` table:
```sql
- player_rating TEXT CHECK (player_rating IN ('<3.2', '<3.6', '<3.8', 'open'))
- gender TEXT CHECK (gender IN ('male', 'female'))
```

Adds to `registrations` table:
```sql
- metadata JSONB DEFAULT '{}'
```

Metadata stores: `{ category, rating, gender, role }`

## How It Works

### Email Search Flow

1. User types email: `john@example.com`
2. System waits 500ms (debounce)
3. Queries `profiles` table for matching email
4. If found:
   - ✅ Shows success banner
   - ✅ Auto-fills display name
   - ✅ Sets button text to "Add Existing User"
5. If not found:
   - ⚠️ Shows "New User" banner
   - ⚠️ Sets button text to "Create & Invite"

### Form Validation

Before submission, checks:
```typescript
- email (required, valid format)
- display_name (required)
- category (required)
- rating (required)
- gender (required)
```

Button is disabled if any required field is empty.

### Data Storage

**Existing User:**
```typescript
// Updates player record
UPDATE players SET
  player_rating = 'open',
  gender = 'male'
WHERE profile_id = '...'

// Creates registration with metadata
INSERT INTO registrations (metadata)
VALUES ('{"category": "singles", "rating": "open", "gender": "male"}')
```

**New User (Placeholder):**
```typescript
// Creates placeholder profile
INSERT INTO profiles (is_placeholder = true)

// Creates player with rating and gender
INSERT INTO players (player_rating, gender)

// Creates registration with metadata
INSERT INTO registrations (status = 'pending', metadata)
```

## Usage

### 1. Run Migration

In Supabase SQL Editor:
```sql
-- Copy and run supabase/migrations/006_add_rating_gender.sql
```

### 2. Add Participant

1. Go to tournament → "Manage Participants"
2. Click "Add Participant"
3. Enter email address
4. Wait for search result (green or yellow banner)
5. Fill remaining fields:
   - Display Name (auto-filled if user exists)
   - Category (required)
   - Rating (required)  
   - Gender (required)
6. Toggle "Send invitation email" if needed
7. Click "Add Existing User" or "Create & Invite"

### 3. View Participant Details

Participant row now shows:
```
John Doe
john@example.com • Confirmed
Rating: open • male
```

## API Changes

### Manual Invite Endpoint

**Updated Request:**
```json
POST /api/tournaments/{id}/participants/manual-invite

{
  "email": "player@example.com",
  "display_name": "John Doe",
  "category": "singles",
  "rating": "open",
  "gender": "male",
  "sendInvite": true
}
```

**Validation:**
- Email, category, rating, and gender are all required
- Returns 400 if any missing

## Benefits

### For Organizers
- ✅ Better tournament organization by rating brackets
- ✅ Gender-based divisions
- ✅ Quick participant addition via email search
- ✅ No duplicate user creation

### For Participants
- ✅ Accurate placement in correct divisions
- ✅ Fair matchmaking based on rating
- ✅ Proper categorization

### For System
- ✅ Rich participant data for analytics
- ✅ Easier fixture generation by category
- ✅ Better user experience with auto-fill

## Troubleshooting

### Email search not working

- Check Supabase connection
- Verify profiles table has data
- Check browser console for errors
- Try refreshing the page

### Rating/Gender not saving

- Run migration `006_add_rating_gender.sql`
- Verify columns exist in players table:
  ```sql
  SELECT column_name FROM information_schema.columns 
  WHERE table_name = 'players' 
  AND column_name IN ('player_rating', 'gender');
  ```

### Form won't submit

- Check all required fields filled
- Verify email format is valid
- Check browser console for validation errors

## Future Enhancements

- Skill rating autocomplete based on past tournaments
- Gender: Add "Other" option
- Rating: Add more granular options (3.0, 3.5, 4.0, etc.)
- Bulk import with rating/gender columns
- Filter participants by rating/gender on participants page

