# Admin Setup Guide

## Initial Root User Setup

The admin management features require an initial root or admin user to be set up. This is a one-time manual process.

### Option 1: Using Supabase SQL Editor (Recommended)

1. Go to your Supabase Dashboard: https://app.supabase.com
2. Select your project
3. Navigate to **SQL Editor** in the left sidebar
4. Run the following SQL to create your first root user:

```sql
-- First, find your profile ID
SELECT id, email FROM public.profiles WHERE email = 'your-email@example.com';

-- Then, assign root role (replace YOUR_PROFILE_ID with the ID from above)
INSERT INTO public.user_roles (profile_id, role, scope_type, granted_by, metadata)
VALUES (
  'YOUR_PROFILE_ID'::uuid,
  'root',
  'global',
  'YOUR_PROFILE_ID'::uuid,
  '{"created_method": "manual_seed", "notes": "Initial root user"}'::jsonb
);
```

### Option 2: Create an Admin User (Less Privileges)

If you want to create an admin user instead of root:

```sql
-- Find your profile ID
SELECT id, email FROM public.profiles WHERE email = 'your-email@example.com';

-- Assign admin role (replace YOUR_PROFILE_ID with the ID from above)
INSERT INTO public.user_roles (profile_id, role, scope_type, granted_by, metadata)
VALUES (
  'YOUR_PROFILE_ID'::uuid,
  'admin',
  'global',
  'YOUR_PROFILE_ID'::uuid,
  '{"created_method": "manual_seed", "notes": "Initial admin user"}'::jsonb
);
```

### Verify Your Role

After running the SQL, you can verify by running:

```sql
SELECT 
  ur.role,
  ur.scope_type,
  p.email,
  p.full_name
FROM public.user_roles ur
JOIN public.profiles p ON p.id = ur.profile_id
WHERE p.email = 'your-email@example.com';
```

## Role Differences

### Root
- **Full platform access**
- Can assign/remove any roles (including other root and admin users)
- Can delete any data
- Access to all features

### Admin  
- Can manage tournaments
- Can view and manage participants
- Can view admin lists
- **Cannot** assign other admin or root roles (only root can do this)

### Participant
- Default role for all users
- Can participate in tournaments
- Can update own profile

## Troubleshooting

### "Failed to load admins" Error

This means you don't have sufficient permissions. You need to:

1. Set up a root or admin user using the SQL commands above
2. Sign out and sign back in
3. Try accessing the admin pages again

### Row Level Security (RLS)

The application uses RLS policies defined in `supabase/migrations/011_phase3_rls_policies.sql`. 

If RLS is not enabled yet, you can enable it by running:

```sql
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
```

Note: Make sure you've created your root user BEFORE enabling RLS, or you might lock yourself out!

### Need More Help?

Check the migration files:
- `supabase/migrations/010_phase3_roles_and_policies.sql` - Role structure
- `supabase/migrations/011_phase3_rls_policies.sql` - Security policies

