-- Phase 3: RLS Policy Hardening
-- Strengthens Row Level Security across all tables

-- Update tournament policies to include admin override
DROP POLICY IF EXISTS "Anyone can view open tournaments" ON public.tournaments;
CREATE POLICY "Anyone can view open tournaments" ON public.tournaments
  FOR SELECT USING (
    status IN ('open', 'closed', 'in_progress', 'completed') OR 
    auth.uid() = organizer_id OR
    public.is_admin(auth.uid())
  );

-- Update matches policies to include referee role
DROP POLICY IF EXISTS "Organizers can update matches" ON public.matches;
CREATE POLICY "Organizers and referees can update matches" ON public.matches
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.tournaments t
      WHERE t.id = matches.tournament_id AND t.organizer_id = auth.uid()
    ) OR
    public.has_role(auth.uid(), 'referee') OR
    public.is_admin(auth.uid())
  );

-- Ensure registrations can only be modified by organizers or admins
DROP POLICY IF EXISTS "Users can update their registrations" ON public.registrations;
CREATE POLICY "Users and organizers can update registrations" ON public.registrations
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.players p
      WHERE p.id = registrations.player_id AND p.profile_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM public.tournaments t
      WHERE t.id = registrations.tournament_id AND t.organizer_id = auth.uid()
    ) OR
    public.is_admin(auth.uid())
  );

-- Add admin override for all tables
CREATE POLICY "Admins have full access to tournaments" ON public.tournaments
  FOR ALL USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins have full access to matches" ON public.matches
  FOR ALL USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins have full access to registrations" ON public.registrations
  FOR ALL USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins have full access to players" ON public.players
  FOR ALL USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins have full access to teams" ON public.teams
  FOR ALL USING (public.is_admin(auth.uid()));

-- Prevent non-admins from deleting audit logs
ALTER TABLE public.audit_logs FORCE ROW LEVEL SECURITY;

-- Add indexes for RLS performance
CREATE INDEX IF NOT EXISTS idx_tournaments_organizer_status ON public.tournaments(organizer_id, status);
CREATE INDEX IF NOT EXISTS idx_registrations_tournament_status ON public.registrations(tournament_id, status);
CREATE INDEX IF NOT EXISTS idx_matches_tournament_status ON public.matches(tournament_id, status);

-- Comment documenting the RLS strategy
COMMENT ON TABLE public.audit_logs IS 'Append-only audit trail - no updates or deletes allowed except by database owner';
COMMENT ON TABLE public.user_roles IS 'User role assignments - only super_admin can modify';
COMMENT ON FUNCTION public.is_admin IS 'Helper function to check if a user has super_admin role';

