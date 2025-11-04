-- Allow different entry fees for each tournament format
-- Adds entry_fees JSONB column to store fees per format

-- Add entry_fees column (JSONB to store format-specific fees)
ALTER TABLE public.tournaments
  ADD COLUMN IF NOT EXISTS entry_fees JSONB DEFAULT '{}';

-- Migrate existing entry_fee to entry_fees
UPDATE public.tournaments
SET entry_fees = jsonb_build_object(
  COALESCE(format, 'singles'), entry_fee
)
WHERE entry_fees = '{}' OR entry_fees IS NULL;

-- Example entry_fees structure:
-- {
--   "singles": 500,
--   "doubles": 800,
--   "mixed": 600
-- }

-- Comment
COMMENT ON COLUMN public.tournaments.entry_fees IS 'Format-specific entry fees as JSON object: {"singles": 500, "doubles": 800, "mixed": 600}';

-- Keep entry_fee column for backward compatibility (represents minimum or default fee)
COMMENT ON COLUMN public.tournaments.entry_fee IS 'Legacy single entry fee - use entry_fees for format-specific pricing';

