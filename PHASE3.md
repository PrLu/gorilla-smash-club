# Phase 3: Admin, Reporting & Platform Management

## Overview

Phase 3 adds enterprise-grade features for platform administration, financial tracking, reporting, and security.

## New Capabilities

### 🔐 Role-Based Access Control (RBAC)
- **5 Roles**: super_admin, organizer, referee, finance, support
- Scoped permissions (global, tournament, organization)
- Role expiry support
- Audit trail for all role changes

### 📊 Reporting & Analytics
- Tournament summary views (materialized for performance)
- Player statistics (matches played, win rate)
- CSV export functionality
- Real-time dashboard metrics

### 💰 Manual Finance Tracking
- Entry fee collection tracking
- Payment method recording (cash, UPI, card)
- Collector name attribution
- Payout management for organizers
- Revenue calculations

### 🔍 Audit Logging
- Automatic logging of all critical actions
- Tracks: INSERT, UPDATE, DELETE operations
- Stores old_data and new_data for comparisons
- Searchable and filterable audit trail

### 🔒 Enhanced Security
- Hardened RLS policies
- Admin override capabilities
- Append-only audit logs
- Role-based endpoint protection

---

## Database Schema

### New Tables

#### `roles`
```sql
id UUID PRIMARY KEY
name TEXT UNIQUE (super_admin, organizer, referee, finance, support)
description TEXT
created_at TIMESTAMPTZ
```

#### `user_roles`
```sql
id UUID PRIMARY KEY
profile_id UUID → profiles(id)
role_id UUID → roles(id)
scope_type TEXT (global, tournament, organization)
scope_id UUID
granted_by UUID → profiles(id)
created_at TIMESTAMPTZ
expires_at TIMESTAMPTZ (optional)
```

#### `audit_logs`
```sql
id UUID PRIMARY KEY
actor_profile_id UUID → profiles(id)
action TEXT (INSERT, UPDATE, DELETE)
target_table TEXT
target_id UUID
old_data JSONB
new_data JSONB
metadata JSONB
ip_address INET
user_agent TEXT
created_at TIMESTAMPTZ
```

#### `payouts`
```sql
id UUID PRIMARY KEY
tournament_id UUID → tournaments(id)
organizer_profile_id UUID → profiles(id)
amount NUMERIC(10, 2)
currency TEXT DEFAULT 'INR'
status TEXT (draft, pending, paid, cancelled)
payment_method TEXT
reference_number TEXT
notes TEXT
paid_at TIMESTAMPTZ
created_by UUID
approved_by UUID
created_at TIMESTAMPTZ
updated_at TIMESTAMPTZ
```

### Updated Tables

#### `registrations` (Finance Fields Added)
```sql
+ entry_fee_paid NUMERIC(10, 2) DEFAULT 0
+ collected_by_name TEXT
+ payment_method TEXT (cash, upi, card, bank_transfer, other)
+ payment_reference TEXT
+ payment_date TIMESTAMPTZ
```

### Materialized Views

#### `vw_tournament_summary`
Aggregates:
- Total/confirmed/paid registrations
- Total/completed/pending matches
- Total revenue collected

#### `vw_player_stats_global`
Aggregates:
- Tournaments played
- Matches won/lost
- Win rate percentage
- Last match date

---

## Database Diagram

Visualize the complete schema at [dbdiagram.io](https://dbdiagram.io):

```
Table profiles {
  id uuid [pk, ref: > auth.users.id]
  email text
  full_name text
  ...
}

Table user_roles {
  id uuid [pk]
  profile_id uuid [ref: > profiles.id]
  role_id uuid [ref: > roles.id]
  scope_type text
  scope_id uuid
}

Table roles {
  id uuid [pk]
  name text [unique]
}

Table audit_logs {
  id uuid [pk]
  actor_profile_id uuid [ref: > profiles.id]
  action text
  target_table text
  target_id uuid
}

Table payouts {
  id uuid [pk]
  tournament_id uuid [ref: > tournaments.id]
  organizer_profile_id uuid [ref: > profiles.id]
  amount numeric
  status text
}

// ... other tables
```

---

## Admin Roles Explained

### super_admin
- Full platform access
- Can assign/remove roles
- Access to all audit logs
- Can modify any tournament/registration
- Database-level permissions

**Use cases**: Platform owner, tech team

### organizer
- Create and manage own tournaments
- View participants and matches
- Update financial records for own tournaments
- Request payouts

**Use cases**: Tournament directors, event organizers

### referee
- Update match scores and status
- View all matches across tournaments
- No financial access
- No user management

**Use cases**: On-court referees, match coordinators

### finance
- View all financial records
- Approve payout requests
- Generate financial reports
- No tournament modification

**Use cases**: Accountants, finance team

### support
- View audit logs
- Assist users with issues
- No modification permissions
- Read-only access

**Use cases**: Customer support, help desk

---

## Setup Instructions

### 1. Run Migrations

Execute in Supabase SQL Editor (in order):

```bash
007_phase3_roles_audit.sql      # RBAC + Audit logging
008_phase3_reporting.sql        # Materialized views
009_phase3_manual_finance.sql   # Finance tracking
010_phase3_rls_hardening.sql    # Security policies
```

### 2. Assign First Admin

```sql
-- Find your profile ID
SELECT id, email FROM profiles WHERE email = 'your@email.com';

-- Insert super_admin role
INSERT INTO user_roles (profile_id, role_id, scope_type, granted_by)
SELECT 
  'YOUR-PROFILE-ID-HERE',
  (SELECT id FROM roles WHERE name = 'super_admin'),
  'global',
  'YOUR-PROFILE-ID-HERE';
```

### 3. Refresh Materialized Views

```sql
SELECT refresh_reporting_views();
```

Or set up hourly refresh (requires pg_cron):

```sql
SELECT cron.schedule(
  'refresh-views',
  '0 * * * *',
  $$ SELECT refresh_reporting_views(); $$
);
```

---

## Using Admin Features

### Access Admin Panel

Navigate to: `/admin/dashboard`

**Requires**: super_admin, finance, or support role

### View Audit Logs

1. Go to `/admin/audit-logs`
2. Filter by action, table, or date
3. View who made what changes and when

### Generate Reports

1. Go to `/admin/reports`
2. Select date range (optional)
3. Click "Export My Data" (organizer) or "Export All Data" (admin)
4. CSV downloads automatically

### Assign Roles

1. Go to `/admin/roles`
2. Enter user email
3. Select role type
4. Click "Assign Role"
5. Role assignment logged in audit trail

### Track Finances

Organizer view:
1. Go to tournament → Participants
2. Mark payments as collected
3. Track who paid via which method

Admin view:
1. View all payouts in `/admin/dashboard`
2. Approve payout requests
3. Generate financial reports

---

## API Endpoints

### Admin APIs

```
GET  /api/admin/audit-logs?action=UPDATE&targetTable=tournaments
POST /api/admin/roles (body: {profileId, roleName})
DELETE /api/admin/roles?userRoleId=xxx
```

### Reporting APIs

```
GET  /api/tournaments/:id/reports/summary
GET  /api/reports/export?format=csv&scope=organizer
```

### Finance APIs

```
PATCH /api/tournaments/:id/finance/update
  Body: {
    registrationId, 
    payment_status, 
    entry_fee_paid,
    payment_method,
    collected_by_name
  }
```

---

## Monitoring & Backups

### Database Backups

Run automated backup:

```bash
chmod +x scripts/backup_db.sh
bash scripts/backup_db.sh
```

Set up cron job:

```bash
# Daily backup at 2 AM
0 2 * * * /path/to/scripts/backup_db.sh >> /var/log/backup.log 2>&1
```

Backups are:
- Compressed (gzip)
- Stored in `./backups/`
- Auto-cleaned after 30 days

### Performance Monitoring

Slow queries (>500ms) are automatically logged:

```typescript
import { measureQuery } from '@/lib/performance/logSlowQueries';

const data = await measureQuery(
  'fetch-tournaments',
  () => supabase.from('tournaments').select('*')
);
```

### Recommended Tools

**Frontend Monitoring**:
- Sentry (errors & performance)
- Vercel Analytics (Core Web Vitals)

**Backend Monitoring**:
- Supabase Logs & Metrics
- PostgreSQL pg_stat_statements

---

## Security Considerations

### RLS Policies

All tables enforce Row Level Security:
- ✅ Non-admins can't modify other users' data
- ✅ Audit logs are append-only (no updates/deletes)
- ✅ Finance data requires appropriate role
- ✅ Admin role has emergency override

### Audit Trail

Every critical operation is logged:
- Tournament creation/update/deletion
- Match score changes
- Registration modifications
- Role assignments

### Service Role Key

**Never** expose `SUPABASE_SERVICE_ROLE_KEY` to client code.

Only use in:
- Server-side API routes
- Audit logging
- Role checking
- Report generation

---

## Testing

Run Phase 3 tests:

```bash
npm run test -- audit-logs
npm run test -- reports.summary
npm run test -- roles.permissions
```

---

## Troubleshooting

### Materialized views not updating

```sql
-- Manual refresh
SELECT refresh_reporting_views();

-- Check last refresh time
SELECT schemaname, matviewname, last_refresh 
FROM pg_matviews 
WHERE schemaname = 'public';
```

### Role not working

```sql
-- Check user roles
SELECT ur.*, r.name as role_name
FROM user_roles ur
JOIN roles r ON r.id = ur.role_id
WHERE ur.profile_id = 'YOUR-USER-ID';

-- Check if expired
SELECT * FROM user_roles 
WHERE profile_id = 'YOUR-USER-ID'
AND (expires_at IS NULL OR expires_at > NOW());
```

### Audit logs not appearing

```sql
-- Check triggers are active
SELECT trigger_name, event_manipulation, event_object_table
FROM information_schema.triggers
WHERE trigger_name LIKE 'audit_%';

-- Manually test trigger
UPDATE tournaments SET title = title WHERE id = 'some-id';
SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 1;
```

---

## Future Enhancements

- Automated payout processing
- Financial dashboards with charts (Recharts)
- Email notifications for audit alerts
- Role inheritance and hierarchies
- Multi-organization support
- Advanced analytics (revenue trends, growth metrics)
- API rate limiting
- Webhook integrations

---

## Support

For Phase 3 questions:
- See `README.md` for general setup
- See `ACCESSIBILITY_BRAND_NOTES.md` for UI compliance
- Check audit logs for debugging actions

