# Complete Logo Management System

## Overview

The Gorilla Smash Club platform now has **three separate logo upload areas** for complete branding control:

1. **Header Logo** - Navigation bar (top of all pages)
2. **Homepage Hero Logo** - Main homepage display (first thing visitors see)
3. **Footer Logo** - Bottom of all pages

Each logo can be customized independently via the Appearance Settings page.

---

## 🎯 Three Logo Areas Explained

### 1. Header Logo (Navigation Bar)
- **Location**: Top navigation bar on all pages
- **Visibility**: Always visible while browsing
- **Recommended Size**: 180×60px (compact, horizontal)
- **Best For**: Simple logo, icon + text, or wordmark
- **Example**: Small gorilla icon with "GORILLA SMASH CLUB" text

### 2. Homepage Hero Logo (Main Display)
- **Location**: Center of homepage, above main headline
- **Visibility**: First thing visitors see when landing on site
- **Recommended Size**: 800×400px or larger (can be detailed)
- **Best For**: Full featured logo with all details, graphics, and text
- **Example**: Complete Gorilla Smash Club logo with gorilla character, paddles, flames, text, and tagline

### 3. Footer Logo (Bottom of Pages)
- **Location**: Footer section at bottom of all pages
- **Visibility**: Always visible at page bottom
- **Recommended Size**: 240×80px (medium, horizontal)
- **Best For**: Simplified logo or same as header
- **Example**: Horizontal logo with text

---

## 📤 How to Upload Logos

### Step-by-Step Instructions:

1. **Navigate to Appearance Settings**
   - Click your profile avatar in the header
   - Select **"Appearance"** from dropdown
   - Or go directly to: `/settings/appearance`

2. **You'll See Three Sections:**

   #### A. Header Logo
   - Click **"Upload Header Logo"**
   - Select your compact logo file
   - Save changes

   #### B. Homepage Hero Logo
   - Click **"Upload Homepage Logo"**
   - Select your full featured Gorilla Smash Club logo
   - Save changes

   #### C. Footer Logo
   - Click **"Upload Footer Logo"**
   - Select your footer logo file
   - Save changes

3. **Verify Changes**
   - Visit homepage to see hero logo
   - Check header on any page
   - Scroll to bottom to see footer logo

---

## 🎨 Logo Specifications

### File Requirements (All Logos):
- **Formats**: JPG, PNG, SVG, WebP
- **Max Size**: 5MB per file
- **Background**: Transparent (PNG/SVG) recommended
- **Quality**: High resolution for sharp display

### Specific Recommendations:

| Logo Type | Recommended Size | Aspect Ratio | Best Format |
|-----------|-----------------|--------------|-------------|
| Header | 180×60px | 3:1 | SVG or PNG |
| Hero | 800×400px | 2:1 | PNG or SVG |
| Footer | 240×80px | 3:1 | SVG or PNG |

---

## 💡 Logo Strategy Recommendations

### Strategy 1: Use Same Logo Everywhere
- Upload the same logo to all three sections
- **Pros**: Consistent branding
- **Cons**: May not be optimized for each context

### Strategy 2: Different Logos for Different Areas (Recommended)
- **Header**: Compact horizontal logo (icon + text)
- **Hero**: Full featured logo with all graphics
- **Footer**: Simplified version or same as header
- **Pros**: Optimized for each context, better user experience
- **Cons**: Requires multiple logo files

### Strategy 3: Gorilla Smash Club Branding
- **Header**: Small gorilla icon + "GORILLA SMASH CLUB" text
- **Hero**: Full logo with gorilla character holding paddles, flames, etc.
- **Footer**: Horizontal logo with text only or icon + text

---

## 🔧 Technical Details

### Database Schema

```sql
-- appearance_preferences table
custom_logo_url         TEXT    -- Header logo URL
custom_hero_logo_url    TEXT    -- Homepage hero logo URL
custom_footer_logo_url  TEXT    -- Footer logo URL
```

### Storage Location
All logos are stored in Supabase Storage:
- **Bucket**: `custom-logos`
- **Path**: `{user_id}/logo-{timestamp}.{ext}`
- **Access**: Public (read), user-specific (upload/delete)

### React Hooks

```typescript
// Get appearance preferences
const { data: appearance } = useAppearancePreferences();

// Access specific logos
const headerLogo = appearance?.custom_logo_url || '/brand/logo-mark.svg';
const heroLogo = appearance?.custom_hero_logo_url || '/brand/logo.png';
const footerLogo = appearance?.custom_footer_logo_url || '/brand/logo.svg';
```

### Component Integration

**Header** (`src/components/Header.tsx`):
```typescript
const logoUrl = appearance?.custom_logo_url || '/brand/logo-mark.svg';
```

**Homepage** (`src/app/page.tsx`):
```typescript
const heroLogoUrl = appearance?.custom_hero_logo_url || '/brand/logo.png';
const footerLogoUrl = appearance?.custom_footer_logo_url || '/brand/logo.svg';
```

---

## 📋 Upload Checklist

Before uploading, ensure your logo:

- [ ] Has transparent background (if PNG/WebP)
- [ ] Is properly sized for its location
- [ ] Is under 5MB file size
- [ ] Is in a supported format (JPG, PNG, SVG, WebP)
- [ ] Looks good in both light and dark modes
- [ ] Is optimized and compressed
- [ ] Has appropriate resolution (144 DPI for retina)

---

## 🚀 Quick Start Guide

### For Gorilla Smash Club Logo:

1. **Prepare Your Logos:**
   - Save your full logo (with gorilla) as `hero-logo.png`
   - Save a compact version as `header-logo.png`
   - Save footer version as `footer-logo.png`

2. **Upload via Appearance Settings:**
   - Go to `/settings/appearance`
   - Upload hero logo → Homepage Hero Logo section
   - Upload header logo → Header Logo section
   - Upload footer logo → Footer Logo section
   - Click "Save Changes"

3. **Verify:**
   - Check homepage for large logo
   - Check header on all pages
   - Scroll to bottom to see footer logo

---

## 🎭 Dark Mode Considerations

For logos to work well in both light and dark modes:

### Option 1: Transparent Background (Recommended)
- Use PNG with transparent background
- Logo adapts to any background color
- Works automatically in light and dark modes

### Option 2: Two Versions (Advanced)
- Create `logo-light.png` (dark logo for light backgrounds)
- Create `logo-dark.png` (light logo for dark backgrounds)
- Manually switch based on theme (custom code needed)

### Option 3: SVG with CSS (Best)
- Use SVG format
- Colors can be controlled via CSS
- Perfect adaptation to any theme

---

## 🔄 Logo Management Workflow

### Initial Setup:
1. Design your logos
2. Export in correct sizes
3. Upload via Appearance Settings
4. Verify across all pages

### Updates:
1. Go to Appearance Settings
2. Click "Change [Logo Type]"
3. Select new logo file
4. Old logo is automatically replaced

### Removal:
1. Go to Appearance Settings
2. Click "Remove" button for specific logo
3. Reverts to default logo

---

## 📍 Where Each Logo Appears

### Header Logo:
- `/` - Homepage
- `/dashboard` - Dashboard
- `/tournament/*` - All tournament pages
- `/admin/*` - Admin pages
- `/auth/*` - Sign in/Sign up pages
- All other pages

### Hero Logo:
- `/` - Homepage hero section only
- Large, prominent display

### Footer Logo:
- `/` - Homepage
- `/dashboard` - Dashboard
- All pages with footer
- Bottom of every page

---

## 💾 Default Fallback Logos

If no custom logo is uploaded, the system uses:

- **Header**: `/brand/logo-mark.svg` (gorilla icon)
- **Hero**: `/brand/logo.png` (full logo)
- **Footer**: `/brand/logo.svg` (horizontal logo)

You can replace these default files to change the system-wide defaults.

---

## 🆘 Troubleshooting

### Logo doesn't appear after upload?
- Hard refresh: `Ctrl + Shift + R`
- Clear browser cache
- Check file size (under 5MB)
- Verify file format is supported

### Logo is cut off or distorted?
- Check aspect ratio matches recommendations
- Ensure image has proper dimensions
- Try larger image resolution

### Upload fails?
- Check file size (max 5MB)
- Verify file format (JPG, PNG, SVG, WebP)
- Check internet connection
- Try a different file format

### Changes don't save?
- Ensure you're logged in
- Run database migration: `supabase migration up`
- Check browser console for errors

---

## 📖 Related Documentation

- `LOGO_REPLACEMENT_GUIDE.md` - General logo setup
- `APPEARANCE_CUSTOMIZATION.md` - Full appearance features
- `public/brand/README-LOGO-SETUP.md` - File-based logo setup

---

## 🎉 Summary

You now have **complete control** over your branding:

✅ **Header Logo** - Compact logo for navigation
✅ **Homepage Logo** - Full featured logo for first impression  
✅ **Footer Logo** - Branding at page bottom
✅ **Easy Management** - Upload, change, or remove via Settings
✅ **Instant Updates** - Changes reflect immediately
✅ **User-Specific** - Each user can have their own logos

Upload your Gorilla Smash Club logos now at `/settings/appearance`! 🚀

