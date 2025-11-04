-- Quick fix: Add missing columns to players table
-- Run this in Supabase SQL Editor

-- Add gender column
ALTER TABLE public.players 
  ADD COLUMN IF NOT EXISTS gender TEXT CHECK (gender IN ('male', 'female'));

-- Add player_rating column  
ALTER TABLE public.players 
  ADD COLUMN IF NOT EXISTS player_rating TEXT CHECK (player_rating IN ('<3.2', '<3.6', '<3.8', 'open'));

-- Add metadata column to registrations (if not exists)
ALTER TABLE public.registrations
  ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_players_rating ON public.players(player_rating);
CREATE INDEX IF NOT EXISTS idx_players_gender ON public.players(gender);

-- Verify columns were added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'players' 
AND column_name IN ('gender', 'player_rating', 'rating');

