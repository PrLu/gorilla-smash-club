# Roles and Permissions System

## Overview

The application uses a Role-Based Access Control (RBAC) system with three distinct roles. All users who sign up normally are automatically assigned as **Players** (participants).

## User Roles

### 1. **Participant (Player)** 
**Default role for all new signups**

**Permissions:**
- ✅ View and register for tournaments
- ✅ Update own profile
- ✅ View own tournament history
- ✅ Manage own registrations
- ❌ Cannot access admin features
- ❌ Cannot access player management
- ❌ Cannot manage other users

**How users get this role:**
- Automatically assigned when they sign up on the website
- Can be manually assigned by admins during bulk import
- Can be manually created by admins

### 2. **Admin**
**Tournament and player management role**

**Permissions:**
- ✅ All participant permissions
- ✅ View all players
- ✅ Add/edit players manually
- ✅ Bulk import players
- ✅ Manage tournaments
- ✅ View admin list
- ❌ Cannot delete players
- ❌ Cannot assign admin or root roles
- ❌ Cannot access root-only features

**How users get this role:**
- Assigned by root users only
- Via Admins management page (`/settings/admins`)

### 3. **Root**
**Super administrator with full access**

**Permissions:**
- ✅ All admin permissions
- ✅ Delete players permanently
- ✅ Assign admin roles
- ✅ Assign root roles
- ✅ Full system access
- ✅ Access to all features

**How users get this role:**
- Manual SQL assignment (see `ADMIN_SETUP.md`)
- Typically only 1-2 root users per system

## Automatic Role Assignment

### New User Signup Flow

When a user signs up through the normal signup page:

1. **User creates account** (`/auth/signup`)
2. **Auth user is created** in Supabase Auth
3. **Profile is created** in `profiles` table
4. **Participant role is auto-assigned** via:
   - Client-side: JavaScript inserts into `user_roles` table
   - Server-side: Database trigger (backup/fallback)
5. **User is now a Player** by default

### Database Trigger (Automatic)

A database trigger (`auto_assign_participant_role`) ensures that even if the client-side role assignment fails, users still get the participant role:

```sql
-- Migration: 021_auto_assign_participant_role.sql
-- Automatically runs when a new profile is created
```

**When it runs:**
- ✅ After a new profile is inserted
- ✅ Only if `created_by` is NULL (self-signup)
- ✅ Only if user doesn't already have a role
- ✅ Assigns `participant` role with `global` scope

## Role Management Pages

### Players Page (`/settings/participants`)

**Who can access:** Admins and Root users

**What it shows:**
- All users with `participant` role (or no role)
- Excludes users with `admin` or `root` roles

**Actions:**
- Add player manually
- Edit player details
- Delete player (root only)
- Bulk import players

### Admins Page (`/settings/admins`)

**Who can access:** Admins and Root users

**What it shows:**
- All users with `admin` role
- Excludes `root` and `participant` users

**Actions:**
- View admin list
- Add admin (root only)
- Remove admin (root only)

## Database Schema

### `user_roles` Table

```sql
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY,
  profile_id UUID REFERENCES profiles(id),
  role TEXT CHECK (role IN ('root', 'admin', 'participant')),
  scope_type TEXT DEFAULT 'global',
  scope_id UUID,
  granted_by UUID REFERENCES profiles(id),
  granted_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Key Fields:**
- `profile_id` - User being assigned the role
- `role` - One of: `root`, `admin`, `participant`
- `scope_type` - Usually `global`
- `granted_by` - Who assigned this role

## Permission Checks

### Client-Side Checks

Example from `useUser` hook:
```typescript
const { user, loading } = useUser();

// Check if user exists
if (!user) return null;

// Check role
const { data: roleData } = await supabase
  .from('user_roles')
  .select('role')
  .eq('profile_id', user.id)
  .eq('role', 'admin')
  .single();

if (roleData) {
  // User is an admin
}
```

### Server-Side Checks

API routes check permissions:
```typescript
// Check user role
const { data: roleData } = await supabase
  .from('user_roles')
  .select('role')
  .eq('profile_id', user.id)
  .in('role', ['admin', 'root'])
  .single();

if (!roleData) {
  return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
}
```

### Database-Level Checks (RLS Policies)

Row Level Security policies enforce permissions:
```sql
-- Example: Only admins can view user_roles
CREATE POLICY "user_roles_select_own_or_admin" 
  ON public.user_roles
  FOR SELECT 
  USING (
    profile_id = auth.uid()
    OR public.is_root(auth.uid())
    OR public.is_admin(auth.uid(), NULL)
  );
```

## User Journey Examples

### Example 1: Normal User Signup
```
User visits website
  → Clicks "Sign Up"
  → Fills form (name, email, password)
  → Submits form
  → System creates:
      1. Auth user
      2. Profile
      3. Participant role (auto)
  → User is now a Player
  → Can participate in tournaments
```

### Example 2: Admin Creates Player
```
Admin logs in
  → Goes to Players page
  → Clicks "Add Player"
  → Fills form (name, email, etc.)
  → Submits
  → System creates:
      1. Auth user (via service role)
      2. Profile (with created_by = admin's ID)
      3. NO auto role assignment (created_by is set)
  → Player shows in Players list
  → Admin created, not self-signup
```

### Example 3: Root Assigns Admin Role
```
Root user logs in
  → Goes to Admins page
  → Clicks "Add Admin"
  → Enters existing user's email
  → System:
      1. Finds user profile
      2. Checks if already admin (prevents duplicates)
      3. Inserts admin role into user_roles
  → User is now an Admin
  → User gets admin permissions on next login
```

## Best Practices

### ✅ Do:
- Always assign roles through proper channels
- Use database trigger as backup
- Check permissions on both client and server
- Log role changes in audit logs
- Keep root users to minimum (1-2 max)

### ❌ Don't:
- Manually edit user_roles table without logging
- Skip permission checks on API routes
- Give root access to regular admins
- Delete root users without replacement
- Bypass RLS policies

## Troubleshooting

### User signed up but not showing in Players list
**Solution:**
1. Check if role was assigned:
   ```sql
   SELECT * FROM user_roles WHERE profile_id = 'USER_ID';
   ```
2. If no role exists, manually assign:
   ```sql
   INSERT INTO user_roles (profile_id, role, scope_type, granted_by)
   VALUES ('USER_ID', 'participant', 'global', 'USER_ID');
   ```

### Can't access admin features after being assigned admin role
**Solution:**
1. Sign out completely
2. Sign back in (refreshes session)
3. Check role assignment in database

### Trigger not auto-assigning participant role
**Solution:**
1. Check if trigger exists:
   ```sql
   SELECT * FROM pg_trigger WHERE tgname = 'trigger_auto_assign_participant_role';
   ```
2. If missing, run migration `021_auto_assign_participant_role.sql`

## Security Considerations

1. **Defense in Depth**: Permissions checked at multiple layers
   - Client-side (UI visibility)
   - API routes (server-side)
   - Database (RLS policies)

2. **Audit Trail**: All role assignments logged via triggers

3. **No Self-Promotion**: Users cannot assign themselves admin/root roles
   - Signup: Only participant role
   - Existing users: Cannot modify own role

4. **Immutable Root**: Root users protected from accidental deletion

## Migration Files

Related migrations:
- `010_phase3_roles_and_policies.sql` - Core RBAC structure
- `011_phase3_rls_policies.sql` - Row Level Security
- `020_add_participant_fields.sql` - Player fields (gender, DUPR)
- `021_auto_assign_participant_role.sql` - Auto role assignment

## API Endpoints

Role-related endpoints:
- None directly - roles managed through UI
- Players: `/api/participants/create`, `/api/participants/bulk-import`
- All endpoints check roles server-side

---

For setup instructions, see:
- `ADMIN_SETUP.md` - Creating first root user
- `PARTICIPANT_MANAGEMENT.md` - Managing players
- `BULK_IMPORT_GUIDE.md` - Bulk importing players

