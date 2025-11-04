# API Examples - Phase 2 Invitations

Sample requests and responses for the invitation API endpoints.

## Prerequisites

Get your JWT token:
```bash
# Sign in and get session token
curl -X POST "https://your-project.supabase.co/auth/v1/token?grant_type=password" \
  -H "apikey: YOUR_SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "organizer@example.com",
    "password": "password123"
  }'
```

## 1. Manual Invite - New User (Placeholder)

```bash
curl -X POST "http://localhost:3000/api/tournaments/TOURNAMENT_ID/participants/manual-invite" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newplayer@example.com",
    "display_name": "Sam Player",
    "category": "singles",
    "role": "player",
    "sendInvite": true
  }'
```

**Response:**
```json
{
  "success": true,
  "registration": {
    "id": "reg-uuid",
    "tournament_id": "tournament-uuid",
    "player_id": "player-uuid",
    "status": "pending",
    "payment_status": "pending"
  },
  "invitation": "invitation-uuid",
  "isPlaceholder": true,
  "message": "Invitation sent successfully"
}
```

## 2. Manual Invite - Existing User

```bash
curl -X POST "http://localhost:3000/api/tournaments/TOURNAMENT_ID/participants/manual-invite" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "existinguser@example.com",
    "category": "doubles",
    "sendInvite": false
  }'
```

**Response:**
```json
{
  "success": true,
  "registration": {
    "id": "reg-uuid",
    "tournament_id": "tournament-uuid",
    "player_id": "player-uuid",
    "status": "confirmed",
    "payment_status": "paid"
  },
  "isPlaceholder": false,
  "message": "Participant added successfully"
}
```

## 3. Validate Invitation Token

```bash
curl "http://localhost:3000/api/invite/accept?token=INVITATION_TOKEN"
```

**Response (Valid):**
```json
{
  "valid": true,
  "invitation": {
    "email": "player@example.com",
    "display_name": "Sam Player",
    "tournament": {
      "id": "tournament-uuid",
      "title": "Summer Championship",
      "location": "City Courts",
      "start_date": "2024-06-15"
    },
    "status": "pending",
    "expired": false
  }
}
```

**Response (Expired):**
```json
{
  "valid": false,
  "invitation": {
    "email": "player@example.com",
    "status": "pending",
    "expired": true
  }
}
```

## 4. Accept Invitation (Logged In User)

```bash
curl -X POST "http://localhost:3000/api/invite/accept" \
  -H "Authorization: Bearer USER_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "token": "INVITATION_TOKEN"
  }'
```

**Response:**
```json
{
  "success": true,
  "tournament": {
    "id": "tournament-uuid",
    "title": "Summer Championship"
  },
  "message": "Invitation accepted successfully"
}
```

## 5. Accept Invitation (New User Signup)

```bash
curl -X POST "http://localhost:3000/api/invite/accept" \
  -H "Content-Type: application/json" \
  -d '{
    "token": "INVITATION_TOKEN",
    "name": "Sam Player",
    "password": "securepass123"
  }'
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "user-uuid",
    "email": "newplayer@example.com"
  },
  "tournament": {
    "id": "tournament-uuid",
    "title": "Summer Championship"
  },
  "message": "Account created and invitation accepted"
}
```

## 6. Resend Invitation

```bash
curl -X POST "http://localhost:3000/api/invitations/resend" \
  -H "Authorization: Bearer ORGANIZER_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "invitationId": "invitation-uuid",
    "regenerateToken": true
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Invitation resent successfully",
  "tokenRegenerated": true
}
```

## Error Responses

### 400 - Bad Request
```json
{
  "error": "Email and category are required"
}
```

### 401 - Unauthorized
```json
{
  "error": "Not authenticated"
}
```

### 403 - Forbidden
```json
{
  "error": "Invitation email does not match your account"
}
```

### 404 - Not Found
```json
{
  "error": "Tournament not found"
}
```

### 500 - Server Error
```json
{
  "error": "Failed to invite participant",
  "details": "Specific error message"
}
```

## Testing with Postman/Insomnia

1. Create collection with base URL: `http://localhost:3000`
2. Add Authorization header: `Bearer {{jwt_token}}`
3. Import these examples
4. Replace `TOURNAMENT_ID`, `INVITATION_TOKEN` with actual values

## Testing Email Flow Locally

1. Set `EMAIL_PROVIDER=console` in `.env.local`
2. Invite a participant
3. Check terminal output for email content
4. Copy invite link from console
5. Test acceptance flow

## Security Testing

```bash
# Test 1: Try to invite without auth
curl -X POST "http://localhost:3000/api/tournaments/TOURNAMENT_ID/participants/manual-invite" \
  -H "Content-Type: application/json" \
  -d '{"email": "test@test.com", "category": "singles"}'
# Expected: 401 Unauthorized

# Test 2: Non-organizer tries to invite
# Use JWT of user who doesn't own tournament
# Expected: 403 Forbidden

# Test 3: Accept expired token
# Use token with past expires_at
# Expected: 400 Bad Request
```

