-- supabase/migrations/010_phase3_roles_and_policies.sql
-- Phase 3: RBAC with Root/Admin/Participant roles
-- Creates user_roles table, audit_logs, and helper functions

-- =============================================================================
-- USER ROLES TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('root', 'admin', 'participant')),
  scope_type TEXT NOT NULL DEFAULT 'global' CHECK (scope_type IN ('global', 'tournament', 'organization')),
  scope_id UUID, -- Foreign key to tournament/organization if scoped
  granted_by UUID REFERENCES public.profiles(id),
  granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Unique constraint: one role per user per scope
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_roles_unique 
  ON public.user_roles(profile_id, role, scope_type, COALESCE(scope_id, '00000000-0000-0000-0000-000000000000'::uuid));

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_roles_profile ON public.user_roles(profile_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles(role);
CREATE INDEX IF NOT EXISTS idx_user_roles_scope ON public.user_roles(scope_type, scope_id);

COMMENT ON TABLE public.user_roles IS 'RBAC table: root (platform owner), admin (tournament manager), participant (player)';

-- =============================================================================
-- AUDIT LOGS TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE', 'ASSIGN_ROLE', 'REVOKE_ROLE', 'GENERATE_FIXTURES')),
  target_table TEXT NOT NULL,
  target_id UUID,
  old_data JSONB,
  new_data JSONB,
  metadata JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON public.audit_logs(actor_profile_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_table ON public.audit_logs(target_table);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON public.audit_logs(created_at DESC);

COMMENT ON TABLE public.audit_logs IS 'Append-only audit trail for all critical actions';

-- =============================================================================
-- HELPER FUNCTIONS
-- =============================================================================

-- Check if user is Root (global scope)
CREATE OR REPLACE FUNCTION public.is_root(check_profile_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE profile_id = check_profile_id
      AND role = 'root'
      AND scope_type = 'global'
      AND (expires_at IS NULL OR expires_at > NOW())
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user is Admin (global or tournament-scoped)
CREATE OR REPLACE FUNCTION public.is_admin(check_profile_id UUID, check_tournament_id UUID DEFAULT NULL)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE profile_id = check_profile_id
      AND role = 'admin'
      AND (
        scope_type = 'global' 
        OR (scope_type = 'tournament' AND scope_id = check_tournament_id)
      )
      AND (expires_at IS NULL OR expires_at > NOW())
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user has specific role
CREATE OR REPLACE FUNCTION public.has_role(
  check_profile_id UUID,
  check_role TEXT,
  check_scope_type TEXT DEFAULT 'global',
  check_scope_id UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE profile_id = check_profile_id
      AND role = check_role
      AND scope_type = check_scope_type
      AND (check_scope_id IS NULL OR scope_id = check_scope_id)
      AND (expires_at IS NULL OR expires_at > NOW())
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- TRIGGER: Auto-update updated_at
-- =============================================================================

CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER user_roles_updated_at
  BEFORE UPDATE ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- =============================================================================
-- MANUAL ROOT SEEDING INSTRUCTIONS
-- =============================================================================

-- To create the initial ROOT user, run this SQL manually:
-- Replace 'YOUR_PROFILE_ID' with the actual profile UUID from profiles table
--
-- INSERT INTO public.user_roles (profile_id, role, scope_type, granted_by, metadata)
-- VALUES (
--   'YOUR_PROFILE_ID'::uuid,
--   'root',
--   'global',
--   'YOUR_PROFILE_ID'::uuid,
--   '{"created_method": "manual_seed", "notes": "Initial root user"}'::jsonb
-- );
--
-- Or use the CLI script: node scripts/create-admin.js --email root@example.com --role root

-- =============================================================================
-- TRIGGER: Audit log on role assignment (optional, can be done in application)
-- =============================================================================

CREATE OR REPLACE FUNCTION public.audit_role_assignment()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.audit_logs (actor_profile_id, action, target_table, target_id, new_data, metadata)
    VALUES (
      NEW.granted_by,
      'ASSIGN_ROLE',
      'user_roles',
      NEW.id,
      to_jsonb(NEW),
      jsonb_build_object('role', NEW.role, 'profile_id', NEW.profile_id, 'scope_type', NEW.scope_type)
    );
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.audit_logs (actor_profile_id, action, target_table, target_id, old_data, metadata)
    VALUES (
      auth.uid(),
      'REVOKE_ROLE',
      'user_roles',
      OLD.id,
      to_jsonb(OLD),
      jsonb_build_object('role', OLD.role, 'profile_id', OLD.profile_id)
    );
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER audit_user_roles
  AFTER INSERT OR DELETE ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_role_assignment();

-- =============================================================================
-- ENABLE RLS (commented out by default - enable after testing)
-- =============================================================================

-- ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Note: RLS policies are in 011_phase3_rls_policies.sql

