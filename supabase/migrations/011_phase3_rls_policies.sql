-- supabase/migrations/011_phase3_rls_policies.sql
-- Row Level Security policies for RBAC enforcement
-- Defense-in-depth: API routes should ALSO check permissions

-- =============================================================================
-- IMPORTANT: Enable RLS on tables
-- =============================================================================

-- Uncomment these after testing to enable RLS:
-- ALTER TABLE public.tournaments ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- TOURNAMENTS POLICIES
-- =============================================================================

-- Anyone can SELECT (view) tournaments
DROP POLICY IF EXISTS "tournaments_select_public" ON public.tournaments;
CREATE POLICY "tournaments_select_public"
  ON public.tournaments
  FOR SELECT
  USING (true);

-- Only Root and Admin can INSERT tournaments
DROP POLICY IF EXISTS "tournaments_insert_admin_root" ON public.tournaments;
CREATE POLICY "tournaments_insert_admin_root"
  ON public.tournaments
  FOR INSERT
  WITH CHECK (
    public.is_root(auth.uid()) OR public.is_admin(auth.uid(), NULL)
  );

-- Only Root and Admin can UPDATE tournaments
DROP POLICY IF EXISTS "tournaments_update_admin_root" ON public.tournaments;
CREATE POLICY "tournaments_update_admin_root"
  ON public.tournaments
  FOR UPDATE
  USING (
    public.is_root(auth.uid()) 
    OR public.is_admin(auth.uid(), id)
    OR organizer_id = auth.uid()
  );

-- Only Root can DELETE tournaments
DROP POLICY IF EXISTS "tournaments_delete_root_only" ON public.tournaments;
CREATE POLICY "tournaments_delete_root_only"
  ON public.tournaments
  FOR DELETE
  USING (public.is_root(auth.uid()));

-- =============================================================================
-- REGISTRATIONS POLICIES
-- =============================================================================

-- Anyone can SELECT their own registrations; Admin/Root can see all
DROP POLICY IF EXISTS "registrations_select_own_or_admin" ON public.registrations;
CREATE POLICY "registrations_select_own_or_admin"
  ON public.registrations
  FOR SELECT
  USING (
    -- Participant can see their own
    player_id IN (
      SELECT id FROM public.players WHERE profile_id = auth.uid()
    )
    OR team_id IN (
      SELECT t.id FROM public.teams t
      JOIN public.players p ON p.id = t.player1_id OR p.id = t.player2_id
      WHERE p.profile_id = auth.uid()
    )
    -- Admin/Root can see all in their tournaments
    OR public.is_admin(auth.uid(), tournament_id)
    OR public.is_root(auth.uid())
  );

-- Admin/Root can INSERT registrations
DROP POLICY IF EXISTS "registrations_insert_admin_root" ON public.registrations;
CREATE POLICY "registrations_insert_admin_root"
  ON public.registrations
  FOR INSERT
  WITH CHECK (
    public.is_root(auth.uid())
    OR public.is_admin(auth.uid(), tournament_id)
  );

-- Admin/Root or owner can UPDATE registrations
DROP POLICY IF EXISTS "registrations_update_admin_root_or_owner" ON public.registrations;
CREATE POLICY "registrations_update_admin_root_or_owner"
  ON public.registrations
  FOR UPDATE
  USING (
    public.is_root(auth.uid())
    OR public.is_admin(auth.uid(), tournament_id)
    OR player_id IN (
      SELECT id FROM public.players WHERE profile_id = auth.uid()
    )
  );

-- Only Root can DELETE registrations
DROP POLICY IF EXISTS "registrations_delete_root_only" ON public.registrations;
CREATE POLICY "registrations_delete_root_only"
  ON public.registrations
  FOR DELETE
  USING (public.is_root(auth.uid()));

-- =============================================================================
-- MATCHES POLICIES
-- =============================================================================

-- Anyone can SELECT matches
DROP POLICY IF EXISTS "matches_select_public" ON public.matches;
CREATE POLICY "matches_select_public"
  ON public.matches
  FOR SELECT
  USING (true);

-- Admin/Root can INSERT matches (fixture generation)
DROP POLICY IF EXISTS "matches_insert_admin_root" ON public.matches;
CREATE POLICY "matches_insert_admin_root"
  ON public.matches
  FOR INSERT
  WITH CHECK (
    public.is_root(auth.uid())
    OR public.is_admin(auth.uid(), tournament_id)
  );

-- Admin/Root can UPDATE matches (scores)
DROP POLICY IF EXISTS "matches_update_admin_root" ON public.matches;
CREATE POLICY "matches_update_admin_root"
  ON public.matches
  FOR UPDATE
  USING (
    public.is_root(auth.uid())
    OR public.is_admin(auth.uid(), tournament_id)
  );

-- Only Root can DELETE matches
DROP POLICY IF EXISTS "matches_delete_root_only" ON public.matches;
CREATE POLICY "matches_delete_root_only"
  ON public.matches
  FOR DELETE
  USING (public.is_root(auth.uid()));

-- =============================================================================
-- PROFILES POLICIES
-- =============================================================================

-- Anyone can SELECT profiles (for participant lists)
DROP POLICY IF EXISTS "profiles_select_public" ON public.profiles;
CREATE POLICY "profiles_select_public"
  ON public.profiles
  FOR SELECT
  USING (true);

-- Users can UPDATE their own profile; Admin/Root can update any
DROP POLICY IF EXISTS "profiles_update_own_or_admin" ON public.profiles;
CREATE POLICY "profiles_update_own_or_admin"
  ON public.profiles
  FOR UPDATE
  USING (
    id = auth.uid()
    OR public.is_root(auth.uid())
    OR public.is_admin(auth.uid(), NULL)
  );

-- Only Root can DELETE profiles (participants)
DROP POLICY IF EXISTS "profiles_delete_root_only" ON public.profiles;
CREATE POLICY "profiles_delete_root_only"
  ON public.profiles
  FOR DELETE
  USING (public.is_root(auth.uid()));

-- =============================================================================
-- USER_ROLES POLICIES
-- =============================================================================

-- Root and Admins can SELECT roles; users can see their own
DROP POLICY IF EXISTS "user_roles_select_own_or_admin" ON public.user_roles;
CREATE POLICY "user_roles_select_own_or_admin"
  ON public.user_roles
  FOR SELECT
  USING (
    profile_id = auth.uid()
    OR public.is_root(auth.uid())
    OR public.is_admin(auth.uid(), NULL)
  );

-- Only Root can INSERT admin roles (global); Admin can assign participant roles
DROP POLICY IF EXISTS "user_roles_insert_restricted" ON public.user_roles;
CREATE POLICY "user_roles_insert_restricted"
  ON public.user_roles
  FOR INSERT
  WITH CHECK (
    -- Root can assign any role
    public.is_root(auth.uid())
    -- Admin can only assign participant roles scoped to tournaments
    OR (
      public.is_admin(auth.uid(), scope_id)
      AND role = 'participant'
      AND scope_type = 'tournament'
    )
  );

-- Only Root can DELETE admin roles; Admin can revoke participant roles in their scope
DROP POLICY IF EXISTS "user_roles_delete_restricted" ON public.user_roles;
CREATE POLICY "user_roles_delete_restricted"
  ON public.user_roles
  FOR DELETE
  USING (
    -- Root can revoke any role
    public.is_root(auth.uid())
    -- Admin can revoke participant roles in their tournament scope
    OR (
      public.is_admin(auth.uid(), scope_id)
      AND role = 'participant'
      AND scope_type = 'tournament'
    )
  );

-- =============================================================================
-- AUDIT_LOGS POLICIES
-- =============================================================================

-- Root and Admin can SELECT audit logs
DROP POLICY IF EXISTS "audit_logs_select_admin_root" ON public.audit_logs;
CREATE POLICY "audit_logs_select_admin_root"
  ON public.audit_logs
  FOR SELECT
  USING (
    public.is_root(auth.uid())
    OR public.is_admin(auth.uid(), NULL)
  );

-- Audit logs are append-only (no UPDATE or DELETE)
DROP POLICY IF EXISTS "audit_logs_no_update" ON public.audit_logs;
CREATE POLICY "audit_logs_no_update"
  ON public.audit_logs
  FOR UPDATE
  USING (false);

DROP POLICY IF EXISTS "audit_logs_no_delete" ON public.audit_logs;
CREATE POLICY "audit_logs_no_delete"
  ON public.audit_logs
  FOR DELETE
  USING (false);

-- =============================================================================
-- NOTES
-- =============================================================================

-- 1. These policies are defense-in-depth; API routes MUST also check roles.
-- 2. To enable RLS, uncomment the ALTER TABLE statements at the top.
-- 3. Test policies thoroughly before enabling in production.
-- 4. Use service role key for admin creation and bypass RLS when needed.

