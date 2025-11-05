# Role Assignment Rules

## Overview

Users in the system have **ONE exclusive role**. Roles are mutually exclusive - a user is either a Player, Admin, or Root (not multiple roles simultaneously).

## Role Assignment by Creation Method

### 1. Self-Signup (Normal Website Registration)
**When:** User visits `/auth/signup` and creates an account

**Process:**
1. User fills signup form (name, email, password)
2. Auth user created
3. Profile created with `created_by = NULL`
4. **Client-side:** Assigns `participant` role
5. **Database trigger:** Assigns `participant` role (backup/fallback)

**Result:** User is a **Player** only ✅

**Code Location:** `src/app/auth/signup/page.tsx`

---

### 2. Created via Players Page
**When:** Admin/Root creates player via `/settings/participants` → "Add Player"

**Process:**
1. Admin fills form (name, email, etc.)
2. API creates auth user (service role)
3. Profile created with `created_by = admin_id`
4. **Database trigger:** Does NOT run (created_by is set)
5. **API explicitly:** Assigns `participant` role

**Result:** User is a **Player** only ✅

**Code Location:** `src/app/api/participants/create/route.ts`

---

### 3. Created via Bulk Import
**When:** Admin/Root uploads CSV via "Bulk Import"

**Process:**
1. Admin uploads CSV file
2. For each player in CSV:
   - API creates auth user (service role)
   - Profile created with `created_by = admin_id`
   - **Database trigger:** Does NOT run (created_by is set)
   - **API explicitly:** Assigns `participant` role

**Result:** All imported users are **Players** only ✅

**Code Location:** `src/app/api/participants/bulk-import/route.ts`

---

### 4. Promoted to Admin
**When:** Root user adds admin via `/settings/admins` → "Add Admin"

**Process:**
1. Root enters existing user's email
2. System finds the user's profile
3. **Removes** any existing `participant` role
4. **Assigns** `admin` role (exclusive)

**Result:** User is an **Admin** only (no longer a player) ✅

**Code Location:** `src/app/settings/admins/page.tsx`

---

### 5. Admin Demoted to Player
**When:** Root user removes admin via `/settings/admins` → "Remove"

**Process:**
1. Root confirms removal
2. **Removes** `admin` role
3. **Assigns** `participant` role
4. Confirmation message: "Admin removed and converted to player"

**Result:** User is a **Player** again ✅

**Code Location:** `src/app/settings/admins/page.tsx`

---

### 6. Assigned Root Role
**When:** Manual SQL assignment (not via UI)

**Process:**
1. Run SQL in Supabase dashboard
2. Insert `root` role into `user_roles` table
3. No automatic cleanup of other roles

**Result:** User is **Root** ⚠️ (should manually remove participant/admin roles)

**Code Location:** Manual SQL (see `ADMIN_SETUP.md`)

## Role Exclusivity Matrix

| Action | Removes Previous Role | Assigns New Role | Final Role |
|--------|----------------------|------------------|------------|
| Signup | N/A | `participant` | Player |
| Add Player (UI) | N/A | `participant` | Player |
| Bulk Import | N/A | `participant` | Player |
| Promote to Admin | ✅ Removes `participant` | `admin` | Admin |
| Demote Admin | ✅ Removes `admin` | `participant` | Player |
| Assign Root (SQL) | ⚠️ Manual | `root` | Root |

## Database Trigger Logic

### `auto_assign_participant_role()` Trigger

**When it runs:**
```sql
AFTER INSERT ON public.profiles
```

**Condition to assign role:**
```sql
IF NEW.created_by IS NULL -- Only self-signups
AND NOT EXISTS (
  SELECT 1 FROM user_roles WHERE profile_id = NEW.id
)
```

**What it does:**
```sql
INSERT INTO user_roles (profile_id, role, scope_type, granted_by)
VALUES (NEW.id, 'participant', 'global', NEW.id);
```

**When it does NOT run:**
- If `created_by` is set (admin-created users)
- If user already has a role (prevents duplicates)

## Code Examples

### Checking User Role
```typescript
// Get user's role
const { data: roleData } = await supabase
  .from('user_roles')
  .select('role')
  .eq('profile_id', user.id)
  .single();

if (roleData?.role === 'admin') {
  // User is an admin
} else if (roleData?.role === 'participant') {
  // User is a player
} else if (roleData?.role === 'root') {
  // User is root
}
```

### Promoting User to Admin
```typescript
// Remove participant role
await supabase
  .from('user_roles')
  .delete()
  .eq('profile_id', userId)
  .eq('role', 'participant');

// Add admin role
await supabase
  .from('user_roles')
  .insert({
    profile_id: userId,
    role: 'admin',
    scope_type: 'global',
    granted_by: currentUserId,
  });
```

## Page Visibility Logic

### Players Page (`/settings/participants`)
**Shows:**
- Users with `participant` role
- Users with NO role (edge case)

**Hides:**
- Users with `admin` role
- Users with `root` role

**Query:**
```typescript
// Get all profiles
const profiles = await supabase.from('profiles').select('*');

// Get admin/root users
const adminRootIds = await supabase
  .from('user_roles')
  .select('profile_id')
  .in('role', ['admin', 'root']);

// Filter out admin/root
const players = profiles.filter(p => !adminRootIds.includes(p.id));
```

### Admins Page (`/settings/admins`)
**Shows:**
- Users with `admin` role only

**Hides:**
- Users with `participant` role
- Users with `root` role

**Query:**
```typescript
const admins = await supabase
  .from('user_roles')
  .select('*, profiles!inner(*)')
  .eq('role', 'admin')
  .eq('scope_type', 'global');
```

## Important Notes

### ✅ Best Practices
1. **Always use UI to manage roles** (except root creation)
2. **One role per user** - no mixing
3. **Promote/demote cleanly** - remove old role first
4. **Log role changes** - audit trail maintained

### ⚠️ Edge Cases
1. **User with no role:** Possible if trigger fails - should be manually fixed
2. **User with multiple roles:** Should not happen, but can be cleaned up manually
3. **Root user demotion:** Not supported via UI - requires manual SQL

### 🔧 Manual Cleanup
If a user somehow has multiple roles:
```sql
-- See all roles for a user
SELECT * FROM user_roles WHERE profile_id = 'USER_ID';

-- Remove unwanted roles
DELETE FROM user_roles 
WHERE profile_id = 'USER_ID' 
AND role = 'participant'; -- or 'admin'
```

## Summary

| User Type | Has Role | Created Via | Can Access |
|-----------|----------|-------------|------------|
| **Player** | `participant` | Signup / Players page / Bulk import | Tournaments only |
| **Admin** | `admin` | Promoted by Root | Players, Admins (view), Tournaments |
| **Root** | `root` | Manual SQL | Everything |

**Key Principle:** One user → One role → One purpose ✅

