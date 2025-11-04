-- Simplified Phase 2 Migration (Only what's needed for invitations)
-- Run this if the full Phase 2 migration is causing issues

-- Add columns to profiles table if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'is_placeholder'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN is_placeholder BOOLEAN NOT NULL DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'invite_token'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN invite_token TEXT;
  END IF;
END $$;

-- Create invitations table if it doesn't exist
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

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_invitations_email ON public.invitations(email);
CREATE INDEX IF NOT EXISTS idx_invitations_token ON public.invitations(token);
CREATE INDEX IF NOT EXISTS idx_invitations_tournament ON public.invitations(tournament_id);
CREATE INDEX IF NOT EXISTS idx_profiles_is_placeholder ON public.profiles(is_placeholder);

-- Enable RLS
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for invitations
DROP POLICY IF EXISTS "Organizers can view tournament invitations" ON public.invitations;
CREATE POLICY "Organizers can view tournament invitations" ON public.invitations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.tournaments t
      WHERE t.id = invitations.tournament_id AND t.organizer_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can view their own invitations" ON public.invitations;
CREATE POLICY "Users can view their own invitations" ON public.invitations
  FOR SELECT USING (
    email = (SELECT email FROM public.profiles WHERE id = auth.uid())
  );

DROP POLICY IF EXISTS "Organizers can update invitations" ON public.invitations;
CREATE POLICY "Organizers can update invitations" ON public.invitations
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.tournaments t
      WHERE t.id = invitations.tournament_id AND t.organizer_id = auth.uid()
    )
  );

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE invitations;

