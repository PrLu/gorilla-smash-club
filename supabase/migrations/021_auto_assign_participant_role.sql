-- Auto-assign participant role to new users
-- This ensures all new signups are automatically players by default
-- BUT: If admin/root creates them, no auto-assignment (they assign role explicitly)

-- Function to auto-assign participant role ONLY for self-signups
CREATE OR REPLACE FUNCTION public.auto_assign_participant_role()
RETURNS TRIGGER AS $$
BEGIN
  -- Only assign role if this is a self-signup (created_by is NULL)
  -- When admins create users, created_by is set, so this won't run
  IF NEW.created_by IS NULL THEN
    -- Check if user already has a role (prevent duplicates)
    IF NOT EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE profile_id = NEW.id
    ) THEN
      -- Assign participant role for self-signup users
      INSERT INTO public.user_roles (profile_id, role, scope_type, granted_by)
      VALUES (NEW.id, 'participant', 'global', NEW.id)
      ON CONFLICT DO NOTHING;
    END IF;
  END IF;
  -- If created_by is set, the creator (admin/root) will assign the appropriate role
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on profiles table
DROP TRIGGER IF EXISTS trigger_auto_assign_participant_role ON public.profiles;
CREATE TRIGGER trigger_auto_assign_participant_role
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_assign_participant_role();

-- Comment
COMMENT ON FUNCTION public.auto_assign_participant_role() IS 'Automatically assigns participant role to new self-signup users';

