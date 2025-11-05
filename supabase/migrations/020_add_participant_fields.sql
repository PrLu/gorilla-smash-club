-- Add gender and dupr_id columns to profiles table
-- These fields support participant management requirements

DO $$ 
BEGIN
  -- Add gender column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'gender'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN gender TEXT CHECK (gender IN ('male', 'female', 'other'));
  END IF;

  -- Add dupr_id column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'dupr_id'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN dupr_id TEXT;
  END IF;

  -- Add created_by column to track who created the profile
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'created_by'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN created_by UUID REFERENCES public.profiles(id);
  END IF;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_gender ON public.profiles(gender);
CREATE INDEX IF NOT EXISTS idx_profiles_dupr_id ON public.profiles(dupr_id);
CREATE INDEX IF NOT EXISTS idx_profiles_created_by ON public.profiles(created_by);

-- Comments explaining the fields
COMMENT ON COLUMN public.profiles.gender IS 'Participant gender: male, female, or other';
COMMENT ON COLUMN public.profiles.dupr_id IS 'DUPR (Dynamic Universal Pickleball Rating) ID';
COMMENT ON COLUMN public.profiles.created_by IS 'Profile ID of admin/root user who created this participant (if manually created)';

