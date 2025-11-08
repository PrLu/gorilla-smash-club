# Setting Up Your Gorilla Smash Club Logo

## Quick Setup Guide

Follow these steps to set the full Gorilla Smash Club logo as your website's main logo:

### Step 1: Save Your Logo Image

1. **Save the logo image** you have (the one with the gorilla, paddles, and "GORILLA SMASH CLUB" text)
   
2. **Rename it** to one of these:
   - `logo.png` (for PNG format)
   - `logo.svg` (for SVG format - recommended for scalability)
   - `logo.webp` (for WebP format - smaller file size)

3. **Place it** in the `public/brand/` directory:
   ```
   public/brand/logo.png   (or .svg or .webp)
   ```

### Step 2: Verify File Location

Your directory structure should look like:
```
public/
  brand/
    logo.png          ← Your new logo (replaces existing)
    logo-mark.svg     ← Icon version (keep for favicons)
    README.md         ← Brand assets guide
```

### Step 3: Clear Browser Cache

After placing the logo file:
1. **Hard refresh** your browser: `Ctrl + Shift + R` (Windows/Linux) or `Cmd + Shift + R` (Mac)
2. Or clear your browser cache completely

### Step 4: Verify Logo Appears

The logo should now appear in:
- ✅ Header (navigation bar) - full logo
- ✅ Home page hero section - large logo
- ✅ Footer - logo
- ✅ All pages across the site

---

## Recommended Logo Specifications

### For Best Results:

**Format**: 
- SVG (vector - scales perfectly at any size) ✨ **RECOMMENDED**
- PNG with transparent background
- WebP (smaller file size, good browser support)

**Dimensions**:
- Width: 600-800px
- Height: 200-300px (maintains aspect ratio of your logo)
- Aspect Ratio: ~3:1 (width:height)

**File Size**:
- Keep under 500KB for fast loading
- Optimize images using tools like TinyPNG or Squoosh

**Background**:
- Transparent background (for PNG/WebP)
- Works on both light and dark themes

---

## Current Logo Setup

The system is now configured to:
1. Show your full Gorilla Smash Club logo in the header
2. Use a larger size to display the complete branding
3. Automatically switch to user's custom logo if they upload one via Appearance Settings

---

## Alternative: Using Different Logo Versions

If you want different logos for different contexts:

### Header Logo (Navigation)
File: `public/brand/logo.svg`
- Use: Horizontal logo with text
- Size: Compact for navigation bar

### Homepage Hero Logo  
File: `public/brand/logo-hero.svg` or `logo-hero.png`
- Use: Large featured logo with tagline
- Size: Larger, more detailed version

### Icon/Favicon
File: `public/brand/logo-mark.svg`
- Use: Just the gorilla icon (no text)
- Size: Square, for favicons and app icons

---

## Testing Your Logo

### Test Pages:
1. **Home Page**: `/` - Hero section with large logo
2. **Dashboard**: `/dashboard` - Header logo in navigation
3. **Any Page**: Check the header across all pages

### Test Checklist:
- [ ] Logo appears in header
- [ ] Logo is clear and readable
- [ ] Logo works on light mode
- [ ] Logo works on dark mode
- [ ] Logo scales properly on mobile devices
- [ ] Logo loads quickly (check file size)
- [ ] Logo has transparent background (if PNG/WebP)

---

## Troubleshooting

### Logo Not Showing?

1. **Check file name**: Must be exactly `logo.png` or `logo.svg`
2. **Check file location**: Must be in `public/brand/` directory
3. **Hard refresh**: Press `Ctrl + Shift + R`
4. **Check file format**: Browsers support PNG, SVG, WebP, JPG
5. **Check file size**: Keep under 500KB
6. **Check browser console**: Press F12, look for 404 errors

### Logo Too Large or Small?

The header is configured to display the logo at:
- Height: 48px (h-12)
- Width: Auto-fit up to 180px
- You can adjust these in `src/components/Header.tsx`

### Logo Blurry on Retina Displays?

Use one of these solutions:
1. **Best**: Use SVG format (always crisp)
2. **Good**: Use PNG at 2x size (1600×600px for display at 800×300px)
3. **Alternative**: Use WebP with high quality setting

---

## Need Help?

If you encounter issues:
1. Check the browser console (F12) for errors
2. Verify the file path is correct
3. Ensure the image file format is supported
4. Try a different image format (e.g., PNG instead of JPG)
5. Check that the file isn't corrupted

---

## Custom User Logos

Remember: Users can upload their own logos via:
- **Path**: `/settings/appearance`
- **Feature**: Custom Logo Upload
- **Storage**: Supabase Storage (`custom-logos` bucket)

Their custom logo will override the default logo when they're logged in and viewing their instance.

