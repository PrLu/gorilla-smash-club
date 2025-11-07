-- Create categories master data table
-- This allows admins to configure available tournament categories

CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  description TEXT,
  is_team_based BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES public.profiles(id)
);

-- Add comments
COMMENT ON TABLE public.categories IS 'Master data for tournament categories (singles, doubles, mixed, etc.)';
COMMENT ON COLUMN public.categories.name IS 'Internal name (lowercase, no spaces)';
COMMENT ON COLUMN public.categories.display_name IS 'Display name shown to users';
COMMENT ON COLUMN public.categories.is_team_based IS 'True if this category requires teams (doubles/mixed), false for individual (singles)';
COMMENT ON COLUMN public.categories.is_active IS 'Only active categories are shown in forms';
COMMENT ON COLUMN public.categories.sort_order IS 'Display order in dropdowns (lower first)';

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_categories_is_active ON public.categories(is_active);
CREATE INDEX IF NOT EXISTS idx_categories_sort_order ON public.categories(sort_order);

-- Insert default categories
INSERT INTO public.categories (name, display_name, description, is_team_based, is_active, sort_order) VALUES
  ('singles', 'Singles', 'Individual player competition', false, true, 1),
  ('doubles', 'Doubles', 'Team of 2 players (same gender)', true, true, 2),
  ('mixed', 'Mixed Doubles', 'Team of 2 players (mixed gender)', true, true, 3)
ON CONFLICT (name) DO NOTHING;

-- Enable RLS
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Policies: Anyone can read active categories
DROP POLICY IF EXISTS "Anyone can view active categories" ON public.categories;
CREATE POLICY "Anyone can view active categories"
  ON public.categories
  FOR SELECT
  USING (is_active = true OR auth.uid() IS NOT NULL);

-- Only admins and root can insert/update/delete
DROP POLICY IF EXISTS "Admins can manage categories" ON public.categories;
CREATE POLICY "Admins can manage categories"
  ON public.categories
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.profile_id = auth.uid()
      AND user_roles.role IN ('admin', 'root')
      AND user_roles.scope_type = 'global'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.profile_id = auth.uid()
      AND user_roles.role IN ('admin', 'root')
      AND user_roles.scope_type = 'global'
    )
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_categories_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
DROP TRIGGER IF EXISTS categories_updated_at ON public.categories;
CREATE TRIGGER categories_updated_at
  BEFORE UPDATE ON public.categories
  FOR EACH ROW
  EXECUTE FUNCTION update_categories_updated_at();

