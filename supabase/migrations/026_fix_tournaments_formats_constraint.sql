-- Fix tournaments formats constraint to allow dynamic categories
-- This allows any active category from the categories table

-- Drop the old restrictive constraint
ALTER TABLE public.tournaments
  DROP CONSTRAINT IF EXISTS tournaments_formats_check;

-- Add new flexible constraint that just ensures:
-- 1. formats is not empty
-- 2. formats is an array of text values
ALTER TABLE public.tournaments
  ADD CONSTRAINT tournaments_formats_check 
  CHECK (
    formats IS NOT NULL AND
    array_length(formats, 1) > 0
  );

-- Optional: Add a function to validate formats against active categories
-- This can be called from application code to ensure only valid categories
CREATE OR REPLACE FUNCTION validate_tournament_formats(formats_array TEXT[])
RETURNS BOOLEAN AS $$
DECLARE
  valid_categories TEXT[];
BEGIN
  -- Get all active category names
  SELECT ARRAY_AGG(name) INTO valid_categories
  FROM categories
  WHERE is_active = true;
  
  -- Check if all formats are in valid categories
  RETURN formats_array <@ valid_categories;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION validate_tournament_formats IS 'Validates tournament formats against active categories';

-- Update existing tournaments that might have issues
-- This ensures all existing data passes the new constraint
UPDATE public.tournaments
SET formats = ARRAY['singles']::TEXT[]
WHERE formats IS NULL OR array_length(formats, 1) IS NULL OR array_length(formats, 1) = 0;

