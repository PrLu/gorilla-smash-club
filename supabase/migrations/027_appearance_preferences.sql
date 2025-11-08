-- Create appearance_preferences table for custom branding and theming
CREATE TABLE IF NOT EXISTS appearance_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Logo customization
  custom_logo_url TEXT,
  
  -- Font color customization (stored as hex color codes)
  primary_font_color VARCHAR(7) DEFAULT '#111827', -- gray-900
  secondary_font_color VARCHAR(7) DEFAULT '#4b5563', -- gray-600
  heading_font_color VARCHAR(7) DEFAULT '#111827', -- gray-900
  
  -- Dark mode font colors
  dark_primary_font_color VARCHAR(7) DEFAULT '#f9fafb', -- gray-50
  dark_secondary_font_color VARCHAR(7) DEFAULT '#d1d5db', -- gray-300
  dark_heading_font_color VARCHAR(7) DEFAULT '#ffffff', -- white
  
  -- Background color customization
  primary_bg_color VARCHAR(7) DEFAULT '#ffffff', -- white
  secondary_bg_color VARCHAR(7) DEFAULT '#f9fafb', -- gray-50
  
  -- Dark mode background colors
  dark_primary_bg_color VARCHAR(7) DEFAULT '#111827', -- gray-900
  dark_secondary_bg_color VARCHAR(7) DEFAULT '#1f2937', -- gray-800
  
  -- Accent colors (optional overrides)
  custom_accent_color VARCHAR(7),
  custom_primary_color VARCHAR(7),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure one preference per user
  UNIQUE(profile_id)
);

-- Enable RLS
ALTER TABLE appearance_preferences ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own appearance preferences
CREATE POLICY "Users can view own appearance preferences"
  ON appearance_preferences
  FOR SELECT
  USING (auth.uid() = profile_id);

-- Policy: Users can insert their own appearance preferences
CREATE POLICY "Users can insert own appearance preferences"
  ON appearance_preferences
  FOR INSERT
  WITH CHECK (auth.uid() = profile_id);

-- Policy: Users can update their own appearance preferences
CREATE POLICY "Users can update own appearance preferences"
  ON appearance_preferences
  FOR UPDATE
  USING (auth.uid() = profile_id);

-- Policy: Users can delete their own appearance preferences
CREATE POLICY "Users can delete own appearance preferences"
  ON appearance_preferences
  FOR DELETE
  USING (auth.uid() = profile_id);

-- Create updated_at trigger
CREATE TRIGGER update_appearance_preferences_updated_at
  BEFORE UPDATE ON appearance_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create storage bucket for custom logos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'custom-logos',
  'custom-logos',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/svg+xml', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for custom logos
CREATE POLICY "Users can upload their own logos"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'custom-logos' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update their own logos"
  ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'custom-logos' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own logos"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'custom-logos' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Custom logos are publicly readable"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'custom-logos');

-- Add helpful comment
COMMENT ON TABLE appearance_preferences IS 'Stores user-specific appearance preferences including custom logos, font colors, and background colors';

