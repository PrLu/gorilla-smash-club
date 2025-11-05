-- Cleanup script for Phase 3 RBAC migrations
-- Run this BEFORE running 010 and 011 if you need to reset

-- Drop triggers first (they depend on functions)
DROP TRIGGER IF EXISTS audit_user_roles ON public.user_roles;
DROP TRIGGER IF EXISTS user_roles_updated_at ON public.user_roles;

-- Drop policies (they depend on functions and tables)
DROP POLICY IF EXISTS "audit_logs_select_admin_root" ON public.audit_logs;
DROP POLICY IF EXISTS "audit_logs_no_update" ON public.audit_logs;
DROP POLICY IF EXISTS "audit_logs_no_delete" ON public.audit_logs;

DROP POLICY IF EXISTS "user_roles_select_own_or_admin" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_insert_restricted" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_delete_restricted" ON public.user_roles;

DROP POLICY IF EXISTS "tournaments_select_public" ON public.tournaments;
DROP POLICY IF EXISTS "tournaments_insert_admin_root" ON public.tournaments;
DROP POLICY IF EXISTS "tournaments_update_admin_root" ON public.tournaments;
DROP POLICY IF EXISTS "tournaments_delete_root_only" ON public.tournaments;

DROP POLICY IF EXISTS "registrations_select_own_or_admin" ON public.registrations;
DROP POLICY IF EXISTS "registrations_insert_admin_root" ON public.registrations;
DROP POLICY IF EXISTS "registrations_update_admin_root_or_owner" ON public.registrations;
DROP POLICY IF EXISTS "registrations_delete_root_only" ON public.registrations;

DROP POLICY IF EXISTS "matches_select_public" ON public.matches;
DROP POLICY IF EXISTS "matches_insert_admin_root" ON public.matches;
DROP POLICY IF EXISTS "matches_update_admin_root" ON public.matches;
DROP POLICY IF EXISTS "matches_delete_root_only" ON public.matches;

DROP POLICY IF EXISTS "profiles_select_public" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own_or_admin" ON public.profiles;
DROP POLICY IF EXISTS "profiles_delete_root_only" ON public.profiles;

-- Drop functions (after triggers and policies)
DROP FUNCTION IF EXISTS public.audit_role_assignment() CASCADE;
DROP FUNCTION IF EXISTS public.update_updated_at() CASCADE;
DROP FUNCTION IF EXISTS public.has_role(uuid, text, text, uuid) CASCADE;
DROP FUNCTION IF EXISTS public.is_admin(uuid, uuid) CASCADE;
DROP FUNCTION IF EXISTS public.is_root(uuid) CASCADE;

-- Drop tables last (with CASCADE to clean up any remaining dependencies)
DROP TABLE IF EXISTS public.audit_logs CASCADE;
DROP TABLE IF EXISTS public.user_roles CASCADE;

