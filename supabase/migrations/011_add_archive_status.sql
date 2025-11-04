-- Add 'archived' status to tournaments
-- Tournaments are soft-deleted by archiving instead of hard deletion

-- Update tournament status constraint to include 'archived'
ALTER TABLE public.tournaments DROP CONSTRAINT IF EXISTS tournaments_status_check;

ALTER TABLE public.tournaments 
  ADD CONSTRAINT tournaments_status_check 
  CHECK (status IN ('draft', 'open', 'closed', 'in_progress', 'completed', 'cancelled', 'archived'));

-- Add archived_at timestamp
ALTER TABLE public.tournaments
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS archived_by UUID REFERENCES public.profiles(id);

-- Create index for archived tournaments
CREATE INDEX IF NOT EXISTS idx_tournaments_archived ON public.tournaments(archived_at) WHERE archived_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tournaments_status_archived ON public.tournaments(status) WHERE status = 'archived';

-- Update RLS policy to allow viewing archived tournaments by organizer
DROP POLICY IF EXISTS "Organizers can view their tournaments" ON public.tournaments;
CREATE POLICY "Organizers can view all their tournaments" ON public.tournaments
  FOR SELECT USING (auth.uid() = organizer_id);

-- Comment
COMMENT ON COLUMN public.tournaments.archived_at IS 'Timestamp when tournament was archived (soft delete)';
COMMENT ON COLUMN public.tournaments.archived_by IS 'Profile ID of user who archived the tournament';

