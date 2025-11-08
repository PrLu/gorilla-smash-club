# Appearance Customization Feature

This feature allows users to customize the appearance of the Gorilla Smash Club platform, including font colors, background colors, and logo branding.

## Features

### 1. Custom Logo Upload
- Upload your organization's logo (JPG, PNG, SVG, or WebP)
- Maximum file size: 5MB
- Logo appears in the header and all branded areas
- Automatic replacement across the entire platform

### 2. Font Color Customization
Users can customize font colors for both light and dark modes:

#### Light Mode:
- **Primary Font**: Main text color throughout the app
- **Secondary Font**: Descriptive and helper text
- **Heading Font**: Page titles and section headers

#### Dark Mode:
- **Primary Font**: Main text color in dark mode
- **Secondary Font**: Descriptive and helper text in dark mode
- **Heading Font**: Titles and headers in dark mode

### 3. Background Color Customization
Users can customize background colors for both themes:

#### Light Mode:
- **Primary Background**: Main page background
- **Secondary Background**: Cards, sections, and containers

#### Dark Mode:
- **Primary Background**: Main page background in dark mode
- **Secondary Background**: Cards and sections in dark mode

### 4. Optional Brand Colors
- **Custom Accent Color**: For highlights, CTAs, and active states
- **Custom Primary Color**: For primary buttons and interactive elements

## How to Use

### Accessing Appearance Settings

1. Sign in to your account
2. Click on your profile avatar in the header
3. Select **"Appearance"** from the dropdown menu
4. Or navigate directly to `/settings/appearance`

### Uploading a Custom Logo

1. Go to Appearance Settings
2. In the "Custom Logo" section, click **"Upload Logo"**
3. Select your image file (max 5MB)
4. Logo will be uploaded and instantly reflected across the platform
5. Click **"Remove"** to revert to the default logo

### Customizing Colors

1. Each color section has a color picker and hex input
2. Click the color box to use the visual picker
3. Or type/paste a hex color code (e.g., `#FF5733`)
4. Colors are organized by theme (Light/Dark) and purpose (Font/Background)
5. Click **"Save Changes"** to apply your customization

### Resetting to Defaults

Click **"Reset to Defaults"** to restore all original colors. This will:
- Reset all font colors to defaults
- Reset all background colors to defaults
- Keep your custom logo (remove separately if needed)

## Technical Implementation

### Database Schema

```sql
-- Table: appearance_preferences
- custom_logo_url: URL to uploaded logo
- primary_font_color: Light mode primary text
- secondary_font_color: Light mode secondary text
- heading_font_color: Light mode headings
- dark_primary_font_color: Dark mode primary text
- dark_secondary_font_color: Dark mode secondary text
- dark_heading_font_color: Dark mode headings
- primary_bg_color: Light mode primary background
- secondary_bg_color: Light mode secondary background
- dark_primary_bg_color: Dark mode primary background
- dark_secondary_bg_color: Dark mode secondary background
- custom_accent_color: Optional accent color
- custom_primary_color: Optional primary brand color
```

### Storage

Custom logos are stored in Supabase Storage:
- Bucket: `custom-logos`
- Path: `{user_id}/logo-{timestamp}.{ext}`
- Public access for display
- Row-level security for uploads/deletions

### CSS Variables

Custom colors are applied as CSS variables:
```css
--custom-primary-font
--custom-secondary-font
--custom-heading-font
--custom-primary-bg
--custom-secondary-bg
--custom-dark-primary-font
--custom-dark-secondary-font
--custom-dark-heading-font
--custom-dark-primary-bg
--custom-dark-secondary-bg
```

### React Hooks

```typescript
// Fetch user's appearance preferences
const { data: preferences } = useAppearancePreferences();

// Update preferences
const updatePreferences = useUpdateAppearancePreferences();
updatePreferences.mutate({ primary_font_color: '#FF5733' });

// Upload logo
const uploadLogo = useUploadLogo();
uploadLogo.mutate(fileObject);
```

### Components

**AppearanceProvider** (`src/lib/AppearanceProvider.tsx`)
- Wraps the application
- Loads user preferences
- Applies CSS variables globally

**Appearance Settings Page** (`src/app/settings/appearance/page.tsx`)
- User interface for customization
- Color pickers and logo upload
- Real-time preview

## Default Colors

### Light Mode
- Primary Font: `#111827` (gray-900)
- Secondary Font: `#4b5563` (gray-600)
- Heading Font: `#111827` (gray-900)
- Primary Background: `#ffffff` (white)
- Secondary Background: `#f9fafb` (gray-50)

### Dark Mode
- Primary Font: `#f9fafb` (gray-50)
- Secondary Font: `#d1d5db` (gray-300)
- Heading Font: `#ffffff` (white)
- Primary Background: `#111827` (gray-900)
- Secondary Background: `#1f2937` (gray-800)

## Browser Compatibility

- Modern browsers with CSS custom properties support
- Chrome 49+
- Firefox 31+
- Safari 9.1+
- Edge 15+

## Migration

To apply this feature to an existing database, run:

```bash
supabase migration up
```

Or manually run the migration file:
```
supabase/migrations/027_appearance_preferences.sql
```

## Security

- Row-level security ensures users can only modify their own preferences
- Logo uploads are validated for type and size
- Only authorized users can upload to their own folder
- All preferences are scoped to the authenticated user

## Notes

- Changes are applied immediately after saving
- Logo changes may take a few seconds to propagate
- Color changes are instant
- Preferences are user-specific, not organization-wide
- No effect on other users' views

