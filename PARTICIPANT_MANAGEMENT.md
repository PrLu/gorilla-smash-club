# Participant Management System

## Overview

A comprehensive participant management system with role-based access control, supporting manual participant creation by admins/root users with flexible field requirements.

## Features Implemented

### 1. **Settings Menu**
- Profile dropdown menu with "Settings" submenu
- Settings contains:
  - **Admins** - Manage admin users
  - **Participants** - Manage tournament participants

### 2. **Admin Management** (`/settings/admins`)
- ✅ View all users with `admin` role
- ✅ Add new admins (requires root access)
- ✅ Remove admin access
- ✅ Only root users can assign/remove admin roles
- ✅ Excludes root and participant users

### 3. **Participant Management** (`/settings/participants`)
- ✅ View all participants (excludes admin/root users)
- ✅ Search by name, email, phone, or DUPR ID
- ✅ Add participants manually
- ✅ Edit participant details
- ✅ Delete participants (root only)
- ✅ Display: Name, Email, Phone, Gender, DUPR ID, Join Date

## Database Schema Updates

### New Migration: `020_add_participant_fields.sql`

Adds the following columns to the `profiles` table:

```sql
- gender: TEXT (male, female, other)
- dupr_id: TEXT (DUPR ID)
- created_by: UUID (profile ID of admin/root who created this participant)
```

**To apply this migration:**
1. Go to Supabase Dashboard → SQL Editor
2. Copy and run `supabase/migrations/020_add_participant_fields.sql`

## Field Requirements

### When Created by Admin/Root (Manual Creation)

**Mandatory:**
- Full Name ✅
- Email ✅

**Optional:**
- Phone Number
- Gender
- DUPR ID

### When Self-Registered (Users)

All fields in the profile page are available:
- Full Name
- Email (read-only after creation)
- Phone Number
- Gender
- DUPR ID

**Note:** You can enforce stricter validation during tournament registration if needed.

## Permissions & Security

### Root Users
- ✅ Can add participants
- ✅ Can edit any participant
- ✅ Can delete participants
- ✅ Can assign admin roles

### Admin Users
- ✅ Can add participants
- ✅ Can edit any participant
- ❌ Cannot delete participants
- ❌ Cannot assign admin roles

### Participants
- ✅ Can edit their own profile
- ❌ Cannot edit email (locked after creation)
- ❌ Cannot access admin/participant management pages

## API Routes

### Create Participant
**Endpoint:** `POST /api/participants/create`

**Requires:** Admin or Root role

**Body:**
```json
{
  "email": "user@example.com",
  "full_name": "John Doe",
  "phone": "+1234567890",
  "gender": "male",
  "dupr_id": "123456"
}
```

### Delete Participant
**Endpoint:** `DELETE /api/participants/[id]/delete`

**Requires:** Root role only

**Note:** This permanently deletes the user and all associated data.

## Environment Variables Required

Make sure you have the following in your `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key  # Required for creating/deleting users
```

## Usage Instructions

### Setup (First Time)

1. **Run the migration:**
   ```sql
   -- In Supabase SQL Editor
   -- Copy content from supabase/migrations/020_add_participant_fields.sql
   ```

2. **Create your first root user** (if not already done):
   ```sql
   -- Find your profile ID
   SELECT id, email FROM public.profiles WHERE email = 'your-email@example.com';
   
   -- Assign root role
   INSERT INTO public.user_roles (profile_id, role, scope_type, granted_by)
   VALUES (
     'YOUR_PROFILE_ID'::uuid,
     'root',
     'global',
     'YOUR_PROFILE_ID'::uuid
   );
   ```

3. **Sign out and sign back in** to refresh your session

### Adding Participants

1. Navigate to **Profile → Settings → Participants**
2. Click **"Add Participant"**
3. Fill in the form:
   - Full Name (required)
   - Email (required)
   - Phone (optional)
   - Gender (optional)
   - DUPR ID (optional)
4. Click **"Add Participant"**

The participant will be created with a placeholder account. They can later accept an invitation to set their password.

### Editing Participants

1. Go to **Settings → Participants**
2. Click **"Edit"** on any participant
3. Update fields (all except email are editable)
4. Click **"Update Participant"**

### Deleting Participants

**⚠️ Root access required**

1. Go to **Settings → Participants**
2. Click **"Delete"** on a participant (only visible to root users)
3. Confirm deletion
4. **This action cannot be undone!**

### Managing Admins

1. Navigate to **Profile → Settings → Admins**
2. View all users with admin role
3. Click **"Add Admin"** to promote a user (requires root access)
4. Click **"Remove"** to revoke admin access

## File Structure

```
src/
├── app/
│   ├── settings/
│   │   ├── admins/page.tsx           # Admin management
│   │   └── participants/page.tsx     # Participant management
│   ├── profile/page.tsx               # User profile (updated with gender & DUPR)
│   └── api/
│       └── participants/
│           ├── create/route.ts        # Create participant API
│           └── [id]/delete/route.ts   # Delete participant API
├── components/
│   ├── Header.tsx                     # Updated with settings dropdown
│   └── ui/
│       └── Dropdown.tsx               # New dropdown component
supabase/
└── migrations/
    └── 020_add_participant_fields.sql # New migration
```

## Testing Checklist

- [ ] Root user can access admin and participant management
- [ ] Admin user can access participant management
- [ ] Admin user can add participants
- [ ] Root user can delete participants
- [ ] Admin user cannot delete participants
- [ ] Email field is read-only when editing
- [ ] Search works for name, email, phone, and DUPR ID
- [ ] Profile page shows gender and DUPR ID fields
- [ ] Mobile menu shows Settings submenu

## Troubleshooting

### "Failed to load admins/participants"
- Ensure you have root or admin role assigned
- Sign out and sign back in to refresh session
- Check RLS policies are enabled

### "Failed to create participant"
- Check `SUPABASE_SERVICE_ROLE_KEY` is set in `.env.local`
- Ensure migration `020_add_participant_fields.sql` has been run
- Verify you have admin/root permissions

### Delete button not showing
- Only root users can see the delete button
- Check your user role with: `SELECT * FROM user_roles WHERE profile_id = 'YOUR_ID';`

## Future Enhancements

Potential improvements:
- Bulk import participants from CSV
- Email invitations to participants
- Participant activity history
- Export participant list
- Advanced filtering and sorting
- Participant groups/categories

