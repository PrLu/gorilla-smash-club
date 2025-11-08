-- Add hero logo and footer logo fields to appearance_preferences table
ALTER TABLE appearance_preferences
ADD COLUMN IF NOT EXISTS custom_hero_logo_url TEXT,
ADD COLUMN IF NOT EXISTS custom_footer_logo_url TEXT;

-- Add comments
COMMENT ON COLUMN appearance_preferences.custom_hero_logo_url IS 'URL to custom logo for homepage hero section (can be different from header logo)';
COMMENT ON COLUMN appearance_preferences.custom_footer_logo_url IS 'URL to custom logo for footer (can be different from header/hero logos)';

