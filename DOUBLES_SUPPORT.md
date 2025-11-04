# Doubles & Mixed Doubles Support

## Overview

Enhanced participant management to support team-based tournaments (doubles and mixed doubles) with partner details.

## New Features

### 1. Conditional Partner Fields

When selecting **Doubles** or **Mixed** category:
- ✅ Partner section automatically appears
- ✅ Partner Email (required)
- ✅ Partner Display Name (required)
- ✅ Partner Rating (required)
- ✅ Partner Gender (required)

When selecting **Singles**:
- ✅ Partner section hidden
- ✅ Only individual player details required

### 2. Partner Email Search

Same auto-fill functionality as main participant:
- Type partner email → Auto-search after 500ms
- **Partner found**: Green banner + auto-fill name, rating, gender
- **Partner not found**: Yellow banner + manual entry + invitation created

### 3. Team Creation

For doubles/mixed:
```
Player 1 + Player 2 → Creates Team → Registration linked to Team
```

**Team Name Format**: `{Player1 Name} & {Partner Name}`

Example: `John Doe & Jane Smith`

## Form Flow

### Singles Flow
```
1. Enter email → Search user
2. Fill: Display Name, Category: Singles, Rating, Gender
3. Submit → Creates player + registration
```

### Doubles/Mixed Flow
```
1. Enter email → Search user
2. Fill: Display Name, Category: Doubles/Mixed, Rating, Gender
3. Partner section appears ⬇️
4. Enter partner email → Search partner
5. Fill: Partner Name, Partner Rating, Partner Gender
6. Submit → Creates:
   - Player 1 (or finds existing)
   - Player 2 (or finds existing / creates invitation)
   - Team (links both players)
   - Registration (linked to team, not individuals)
```

## Database Structure

### Singles Registration
```
profiles → players → registrations
```

### Doubles/Mixed Registration
```
profiles → players ↘
                    → teams → registrations
profiles → players ↗
```

## Example Scenarios

### Scenario 1: Both Players Exist
```
Organizer adds:
- Email: john@example.com (exists)
- Partner: jane@example.com (exists)

Result:
- Finds both players
- Creates team: "John Doe & Jane Smith"
- Creates registration linked to team
- Both players confirmed
```

### Scenario 2: Partner Doesn't Exist
```
Organizer adds:
- Email: john@example.com (exists)
- Partner: newplayer@example.com (doesn't exist)

Result:
- Finds John
- Creates invitation for newplayer@example.com
- Creates team with John + pending partner slot
- Sends invitation email to partner
- Team shows as "John Doe & Partner pending"
```

### Scenario 3: Neither Player Exists
```
Organizer adds:
- Email: player1@example.com (new)
- Partner: player2@example.com (new)

Result:
- Creates 2 invitations
- Shows in pending invitations list
- Both receive invitation emails
- Team created after both accept
```

## Participant List Display

### Singles Participant
```
┌────────────────────────────────────┐
│ 👤 John Doe                        │
│ john@example.com • Confirmed       │
│ Rating: open • male                │
└────────────────────────────────────┘
```

### Team Participant
```
┌────────────────────────────────────┐
│ 👤 John Doe & Jane Smith   [Team]  │
│ Partner: Jane Smith                │
│ john@example.com • Confirmed       │
│ Rating: open • male                │
└────────────────────────────────────┘
```

### Pending Team Invitation
```
┌────────────────────────────────────┐
│ 👤 John Doe & Partner   [Team]     │
│                    [Pending Signup] │
│ Partner: Partner (new@example.com) │
│ john@example.com • Pending         │
│ Rating: <3.6 • male                │
│ Invite: pending • Sent Nov 4       │
│ [Resend] [Remove]                  │
└────────────────────────────────────┘
```

## Required Database Columns

Make sure these migrations are run:

### Migration 006: Rating & Gender
```sql
ALTER TABLE public.players 
  ADD COLUMN IF NOT EXISTS gender TEXT CHECK (gender IN ('male', 'female'));

ALTER TABLE public.players 
  ADD COLUMN IF NOT EXISTS player_rating TEXT CHECK (player_rating IN ('<3.2', '<3.6', '<3.8', 'open'));

ALTER TABLE public.registrations
  ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';
```

### Migration 005: Invitations (if using invites)
```sql
CREATE TABLE IF NOT EXISTS public.invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID NOT NULL REFERENCES public.tournaments(id),
  email TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  ...
);
```

## Testing

### Test 1: Add Singles Participant
1. Category: Singles
2. Verify partner section doesn't appear
3. Submit with only player details

### Test 2: Add Doubles (Both Exist)
1. Category: Doubles
2. Enter existing user emails for both
3. Verify auto-fill works for both
4. Submit
5. Check team created with both players

### Test 3: Add Doubles (Partner New)
1. Category: Doubles
2. Player exists, partner doesn't
3. Fill partner details manually
4. Submit
5. Check invitation sent to partner
6. Team shows "Partner pending"

### Test 4: Partner Search
1. Select Doubles
2. Type partner email slowly
3. Verify search indicator appears
4. Verify auto-fill when found

## Future Enhancements

- Allow swapping player 1 and player 2
- Team name customization
- Partner invitation from player's side
- Team statistics and history
- Partner recommendation based on rating

