-- Add rating and gender columns to players table
-- These fields are now required for tournament registration

ALTER TABLE public.players 
  ADD COLUMN IF NOT EXISTS player_rating TEXT CHECK (player_rating IN ('<3.2', '<3.6', '<3.8', 'open')),
  ADD COLUMN IF NOT EXISTS gender TEXT CHECK (gender IN ('male', 'female'));

-- Create indexes for filtering
CREATE INDEX IF NOT EXISTS idx_players_rating ON public.players(player_rating);
CREATE INDEX IF NOT EXISTS idx_players_gender ON public.players(gender);

-- Add metadata column to registrations for storing category-specific data
ALTER TABLE public.registrations
  ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- Comment explaining the new fields
COMMENT ON COLUMN public.players.player_rating IS 'Player skill rating: <3.2, <3.6, <3.8, or open';
COMMENT ON COLUMN public.players.gender IS 'Player gender: male or female';
COMMENT ON COLUMN public.registrations.metadata IS 'Stores category, rating, and gender at time of registration';

