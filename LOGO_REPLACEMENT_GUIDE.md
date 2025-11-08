# How to Replace the Gorilla Smash Club Logo

## Quick Guide to Replace Your Logo

You have **TWO ways** to manage your logo:

---

## Method 1: Replace via Appearance Settings (Recommended) ✨

This is the easiest way and doesn't require file access:

1. **Sign in** to your account
2. Go to **Settings** → **Appearance** (or navigate to `/settings/appearance`)
3. Click **"Upload Logo"** in the "Custom Logo" section
4. Select your Gorilla Smash Club logo image
5. Click **"Save Changes"**

**Done!** Your logo will appear everywhere instantly.

---

## Method 2: Replace the Default Logo File

If you want to change the default logo for all users:

### Step 1: Prepare Your Logo

Save your Gorilla Smash Club logo as:
- **`logo.png`** (recommended for photos/complex graphics)
- or **`logo.svg`** (recommended for vector graphics - best quality)

**Recommended specs:**
- Width: 800-1200px
- Height: 400-600px
- Format: PNG with transparent background or SVG
- File size: Under 500KB

### Step 2: Replace the File

1. Navigate to: `public/brand/`
2. Replace the existing `logo.svg` or add `logo.png`
3. **Important**: Keep the filename exactly as `logo.svg` or `logo.png`

### Step 3: File Structure

```
public/
  brand/
    logo.svg           ← Your full logo (REPLACE THIS)
    logo-mark.svg      ← Small icon version (for favicons)
```

### Step 4: Refresh

- Hard refresh your browser: `Ctrl + Shift + R` (Windows) or `Cmd + Shift + R` (Mac)
- Or clear browser cache

---

## Where Your Logo Appears

After replacement, your logo will show in:

✅ **Header Navigation** - Top left corner, all pages
✅ **Homepage Hero** - Large logo in the main section
✅ **Footer** - Bottom of all pages
✅ **Mobile Menu** - When viewing on mobile devices
✅ **Appearance Settings** - As the default logo option

---

## Logo Version Recommendations

### For Best Results, Prepare 2 Versions:

1. **Full Logo** (`logo.svg` or `logo.png`)
   - Complete logo with gorilla, text, and graphics
   - Use: Header, homepage, footer
   - Size: 800×400px minimum

2. **Icon/Mark** (`logo-mark.svg`)
   - Just the gorilla icon or simplified version
   - Use: Favicons, app icons, mobile header
   - Size: 200×200px (square)

---

## Current Logo Setup

The system is configured to display your logo in these places:

### 1. Header (Navigation)
```typescript
// File: src/components/Header.tsx
// Shows logo with text beside it
```

### 2. Homepage Hero Section
```typescript
// File: src/app/page.tsx
// Large display with icon + text
```

### 3. Footer
```typescript
// File: src/app/page.tsx
// Smaller version in footer
```

---

## Managing Logo via Database (Advanced)

Logos uploaded through Appearance Settings are stored in:
- **Storage Bucket**: `custom-logos`
- **Database Table**: `appearance_preferences`
- **Column**: `custom_logo_url`

To view/manage uploaded logos:
1. Open Supabase Dashboard
2. Go to **Storage** → `custom-logos` bucket
3. See all uploaded logos organized by user ID

---

## Troubleshooting

### Logo Not Showing?

1. **Check filename**: Must be exactly `logo.svg` or `logo.png`
2. **Check location**: Must be in `public/brand/` directory
3. **Hard refresh**: Press `Ctrl + Shift + R`
4. **Check file size**: Must be under 5MB (for uploads) or 500KB (for default)
5. **Check format**: PNG, SVG, WebP, or JPG
6. **Clear cache**: Browser cache might be showing old logo

### Logo Appears Blurry?

- Use SVG format (scales perfectly)
- Or use PNG at 2x size (1600×800 for display at 800×400)
- Increase image resolution

### Logo Too Large or Small?

Edit the size in the code:
- Header: `src/components/Header.tsx` (line ~98)
- Homepage: `src/app/page.tsx` (line ~22)

### Logo Not Working in Dark Mode?

Ensure your logo has:
- Transparent background (PNG/SVG)
- Or light-colored elements that show on dark backgrounds
- Consider creating a separate dark mode version

---

## Image Optimization Tips

Before uploading/replacing:

1. **Compress PNG files**: Use [TinyPNG](https://tinypng.com)
2. **Optimize SVG**: Use [SVGOMG](https://jakearchibald.github.io/svgomg/)
3. **Convert to WebP**: For smaller file sizes
4. **Remove metadata**: Strip EXIF data
5. **Use appropriate resolution**: 144 DPI for retina displays

---

## Next Steps

1. Save your Gorilla Smash Club logo to `public/brand/logo.png`
2. Refresh your browser
3. Or use Appearance Settings to upload it
4. Verify it appears in header, homepage, and footer

---

## Need Help?

If you encounter issues:
1. Check browser console (F12) for errors
2. Verify file path is correct
3. Ensure file format is supported
4. Try a different browser
5. Clear all browser data and try again

**Remember**: Users can always upload their own custom logos via Settings → Appearance, which will override the default logo!

