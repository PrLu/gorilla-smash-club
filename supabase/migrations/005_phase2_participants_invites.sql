-- Phase 2: Participant Invitations & Placeholder Profiles
-- This migration adds support for inviting participants via email and managing placeholder profiles

-- Add placeholder and invite token columns to profiles
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS is_placeholder BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS invite_token TEXT;

-- Create invitations table
CREATE TABLE IF NOT EXISTS public.invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  invited_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'rejected')),
  token TEXT NOT NULL UNIQUE,
  display_name TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  accepted_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for invitations
CREATE INDEX IF NOT EXISTS idx_invitations_email ON public.invitations(email);
CREATE INDEX IF NOT EXISTS idx_invitations_token ON public.invitations(token);
CREATE INDEX IF NOT EXISTS idx_invitations_tournament ON public.invitations(tournament_id);
CREATE INDEX IF NOT EXISTS idx_invitations_status ON public.invitations(status);
CREATE INDEX IF NOT EXISTS idx_profiles_invite_token ON public.profiles(invite_token);
CREATE INDEX IF NOT EXISTS idx_profiles_is_placeholder ON public.profiles(is_placeholder);

-- Updated_at trigger for invitations
CREATE TRIGGER update_invitations_updated_at BEFORE UPDATE ON public.invitations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS for invitations
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for invitations

-- Organizers can view invitations for their tournaments
CREATE POLICY "Organizers can view tournament invitations" ON public.invitations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.tournaments t
      WHERE t.id = invitations.tournament_id AND t.organizer_id = auth.uid()
    )
  );

-- Server-only: invitations can be created via service role
-- (No INSERT policy for regular users - must use server API)

-- Users can view invitations sent to their email
CREATE POLICY "Users can view their own invitations" ON public.invitations
  FOR SELECT USING (
    email = (SELECT email FROM public.profiles WHERE id = auth.uid())
  );

-- Organizers can update invitation status
CREATE POLICY "Organizers can update invitations" ON public.invitations
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.tournaments t
      WHERE t.id = invitations.tournament_id AND t.organizer_id = auth.uid()
    )
  );

-- Function to auto-expire old invitations
CREATE OR REPLACE FUNCTION expire_old_invitations()
RETURNS void AS $$
BEGIN
  UPDATE public.invitations
  SET status = 'expired'
  WHERE status = 'pending' 
    AND expires_at IS NOT NULL 
    AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a scheduled job to expire invitations (requires pg_cron extension)
-- NOTE: This is optional and requires enabling pg_cron extension in Supabase
-- Uncomment if you want automatic expiry:
-- SELECT cron.schedule(
--   'expire-invitations',
--   '0 * * * *',  -- Every hour
--   $$ SELECT expire_old_invitations(); $$
-- );

-- Enable Realtime for invitations (organizers can see when invites are accepted)
ALTER PUBLICATION supabase_realtime ADD TABLE invitations;

