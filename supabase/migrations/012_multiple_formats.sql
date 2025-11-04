-- Allow tournaments to have multiple formats
-- Change format from single value to array

-- Add new column for formats array
ALTER TABLE public.tournaments
  ADD COLUMN IF NOT EXISTS formats TEXT[] DEFAULT ARRAY['singles']::TEXT[];

-- Copy existing format to formats array for existing data
UPDATE public.tournaments
SET formats = ARRAY[format]::TEXT[]
WHERE formats IS NULL OR formats = '{}';

-- Keep old format column for backward compatibility (can be dropped later)
-- Or drop it if you want:
-- ALTER TABLE public.tournaments DROP COLUMN IF EXISTS format;

-- Add check constraint for formats array
ALTER TABLE public.tournaments
  ADD CONSTRAINT tournaments_formats_check 
  CHECK (
    formats <@ ARRAY['singles', 'doubles', 'mixed']::TEXT[] AND
    array_length(formats, 1) > 0
  );

-- Create index on formats for filtering
CREATE INDEX IF NOT EXISTS idx_tournaments_formats ON public.tournaments USING GIN(formats);

-- Comment
COMMENT ON COLUMN public.tournaments.formats IS 'Array of tournament formats - can include singles, doubles, and/or mixed';

