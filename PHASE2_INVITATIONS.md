# Phase 2: Manual Participant Invitations

This document explains the invitation system for adding participants manually to tournaments.

## Overview

Organizers can now:
- ✅ Add participants by email (existing users or new invitations)
- ✅ Send email invitations with secure tokens
- ✅ Track invitation status (pending/accepted/expired)
- ✅ Resend invitations
- ✅ Manage all participants from a central page

## Environment Variables

Add these to your `.env.local`:

```env
# Email Provider Configuration
EMAIL_PROVIDER=resend           # Options: resend, sendgrid, console (dev)
EMAIL_API_KEY=re_xxx           # Your Resend or SendGrid API key
EMAIL_FROM=PickleTourneys <no-reply@yourdomain.com>
INVITE_TOKEN_EXPIRY_HOURS=72   # Default 72 hours (3 days)
```

### Email Provider Setup

#### Option 1: Resend (Recommended)

1. Sign up at https://resend.com
2. Get API key from dashboard
3. Set `EMAIL_PROVIDER=resend`
4. Set `EMAIL_API_KEY=re_your_api_key`

#### Option 2: SendGrid

1. Sign up at https://sendgrid.com
2. Create API key with Mail Send permissions
3. Set `EMAIL_PROVIDER=sendgrid`
4. Set `EMAIL_API_KEY=SG.your_api_key`

#### Option 3: Console (Development)

- Set `EMAIL_PROVIDER=console`
- Emails will be logged to server console instead of sent
- Perfect for local testing

## Database Migration

Run the migration to add invitations table:

```bash
# In Supabase SQL Editor, run:
supabase/migrations/005_phase2_participants_invites.sql
```

This adds:
- `invitations` table with token-based invites
- `is_placeholder` and `invite_token` columns to `profiles`
- RLS policies for invitation management
- Indexes for performance

## How It Works

### 1. Organizer Invites Participant

```typescript
POST /api/tournaments/{id}/participants/manual-invite

{
  "email": "newplayer@example.com",
  "display_name": "Sam Player",
  "category": "singles",
  "role": "player",
  "sendInvite": true
}
```

**Flow:**
- ✅ Check if email exists in system
  - **Existing user**: Create registration immediately (status=`confirmed`)
  - **New email**: Create placeholder profile + invitation + send email

### 2. Placeholder Profile Created

When inviting a new email:

```sql
-- Placeholder profile
INSERT INTO profiles (id, email, full_name, is_placeholder, invite_token)
VALUES (gen_random_uuid(), 'email@example.com', 'Display Name', true, 'secure_token');

-- Player record
INSERT INTO players (profile_id, first_name, last_name)
VALUES (placeholder_id, 'First', 'Last');

-- Registration (pending)
INSERT INTO registrations (tournament_id, player_id, status, payment_status)
VALUES (tournament_id, player_id, 'pending', 'pending');

-- Invitation
INSERT INTO invitations (tournament_id, email, token, expires_at, invited_by)
VALUES (tournament_id, 'email@example.com', 'token', now() + interval '72 hours', organizer_id);
```

### 3. Invitation Email Sent

Email contains:
- Tournament details
- Personalized greeting
- Accept link: `https://yourdomain.com/invite?token=<secure_token>`
- Expires in 72 hours

### 4. Participant Accepts Invitation

**Scenario A: User Already Has Account**
1. User clicks invite link → `/invite?token=xxx`
2. User signs in
3. System verifies email matches invitation
4. Placeholder profile merged into real profile
5. Registration updated to `confirmed`

**Scenario B: New User**
1. User clicks invite link
2. User creates account with email + password
3. Profile created
4. Placeholder merged automatically
5. Registration confirmed
6. User redirected to tournament page

### 5. Merge Process

When a user accepts an invitation:

```typescript
mergePlaceholderProfile(placeholderProfileId, realProfileId)
```

1. Find all `players` linked to placeholder profile
2. Update `registrations.player_id` to point to real player
3. Delete placeholder player records
4. Delete placeholder profile
5. Mark invitation as `accepted`

## API Endpoints

### Manual Invite
```bash
POST /api/tournaments/{id}/participants/manual-invite
Authorization: Bearer {user_jwt}

Request:
{
  "email": "player@example.com",
  "display_name": "Player Name",
  "category": "singles",
  "sendInvite": true
}

Response:
{
  "success": true,
  "registration": {...},
  "invitation": "uuid",
  "isPlaceholder": true,
  "message": "Invitation sent successfully"
}
```

### Accept Invitation
```bash
POST /api/invite/accept

Request:
{
  "token": "invite_token",
  "name": "Full Name",      // Required for new signups
  "password": "password123" // Required for new signups
}

Response:
{
  "success": true,
  "tournament": {...},
  "message": "Invitation accepted successfully"
}
```

### Resend Invitation
```bash
POST /api/invitations/resend
Authorization: Bearer {organizer_jwt}

Request:
{
  "invitationId": "uuid",
  "regenerateToken": true
}

Response:
{
  "success": true,
  "message": "Invitation resent successfully",
  "tokenRegenerated": true
}
```

## Testing Locally

### 1. Set Email Provider to Console

```env
EMAIL_PROVIDER=console
```

Now invitation emails are logged to terminal instead of sent.

### 2. Invite a Participant

1. Create a tournament as organizer
2. Go to "Manage Participants"
3. Click "Add Participant"
4. Enter email: `test@example.com`
5. Check terminal for email output
6. Copy the invite link from console

### 3. Accept Invitation

1. Open invite link in incognito window
2. Create account or sign in
3. Verify participant appears in tournament

### 4. Test Realtime

1. Window 1: Organizer view `/tournament/{id}/participants`
2. Window 2: Add participant via form
3. Window 1: See participant appear in real-time (via React Query refetch)

## Security Notes

- ✅ Tokens are 32-byte random hex strings (cryptographically secure)
- ✅ Tokens expire after 72 hours (configurable)
- ✅ RLS policies prevent unauthorized access
- ✅ Only organizers can create invitations
- ✅ Only invited email can accept invitation
- ✅ Service role key required for server operations
- ✅ Email validation prevents invalid addresses

## Troubleshooting

### Emails not sending

- Check `EMAIL_PROVIDER` is set correctly
- Verify `EMAIL_API_KEY` is valid
- Check email provider dashboard for errors
- Use `EMAIL_PROVIDER=console` for local testing

### Invitation not found

- Check token hasn't expired
- Verify invitation.status is 'pending'
- Check URL contains complete token

### Merge fails

- Ensure email matches between invitation and account
- Check placeholder profile has `is_placeholder=true`
- Verify SUPABASE_SERVICE_ROLE_KEY is set

## Future Enhancements

- Bulk invite (CSV upload)
- Custom email templates
- SMS invitations
- Team invitations (invite both partners at once)
- Invitation analytics (open rate, acceptance rate)

