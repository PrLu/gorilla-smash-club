-- Add custom team-based categories for the tournament
-- This migration adds custom categories mentioned in the tournament:
-- - doubles & k_db (team-based)
-- - team events (team-based)
-- - mojo_dojo (team-based)
-- - k_db (team-based)

-- Insert custom categories
INSERT INTO public.categories (name, display_name, description, is_team_based, is_active, sort_order) VALUES
  ('mojo_dojo', 'Mojo Dojo', 'Mojo Dojo team competition', true, true, 4),
  ('k_db', 'K_DB', 'K_DB team competition', true, true, 5),
  ('doubles_and_k_db', 'Doubles & K_DB', 'Combined doubles and K_DB competition', true, true, 6),
  ('team_events', 'Team Events', 'General team events competition', true, true, 7)
ON CONFLICT (name) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  is_team_based = EXCLUDED.is_team_based,
  is_active = EXCLUDED.is_active,
  sort_order = EXCLUDED.sort_order,
  updated_at = NOW();

-- Add comment
COMMENT ON COLUMN public.categories.name IS 'Internal name (lowercase, underscores for spaces, no special chars like &)';


