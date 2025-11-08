# Gorilla Smash Club Logo Setup

## 🎯 Quick Setup (3 Steps)

### Step 1: Save Your Logo
Save your Gorilla Smash Club logo (the one with the gorilla character holding paddles) as:
- **Filename**: `logo.png` or `logo.svg`
- **Location**: `public/brand/logo.png`

### Step 2: Replace Existing File
Place your logo file in this directory (`public/brand/`) to replace the placeholder.

### Step 3: Refresh
Hard refresh your browser: `Ctrl + Shift + R` (Windows) or `Cmd + Shift + R` (Mac)

**Done!** Your logo now appears everywhere.

---

## 📁 Files in This Directory

```
public/brand/
├── logo.png              ← FULL LOGO - Replace this with yours
├── logo-mark.svg         ← Icon only (for favicons)
├── HOW_TO_REPLACE_LOGO.txt
└── README-LOGO-SETUP.md  ← This file
```

---

## 🎨 Logo Specifications

### For the Full Logo (`logo.png`):
- **Dimensions**: 800-1200px wide × 400-600px tall
- **Format**: PNG (with transparency) or SVG
- **File Size**: Under 500KB recommended
- **Background**: Transparent (so it works on light & dark themes)

### For the Icon (`logo-mark.svg`):
- **Dimensions**: 200×200px (square)
- **Format**: SVG or PNG
- **Use**: Favicons, mobile icons, app icons

---

## 🔧 Logo Management Options

### Option A: File Replacement (This Method)
1. Replace `logo.png` in this directory
2. Refresh browser
3. Done!

**Pros**: Changes default logo for everyone
**Cons**: Requires file system access

### Option B: Appearance Settings (User-Friendly)
1. Go to `/settings/appearance`
2. Click "Upload Logo"
3. Select your image
4. Save

**Pros**: No file access needed, user-specific
**Cons**: Each user manages their own logo

---

## 📍 Where Your Logo Appears

After replacement, your Gorilla Smash Club logo will display in:

1. **Header Navigation** (top-left, all pages)
2. **Homepage Hero Section** (large, prominent display)
3. **Footer** (bottom of pages)
4. **Mobile Menu** (responsive design)
5. **Authentication Pages** (sign in, sign up)

---

## 🎭 Dark Mode Support

Your logo should work in both light and dark themes:

- Use **transparent background** (PNG with alpha channel)
- Or provide two versions:
  - `logo-light.png` (for light backgrounds)
  - `logo-dark.png` (for dark backgrounds)

The system will automatically adapt based on user's theme preference.

---

## 🚀 Advanced: Programmatic Logo Change

To change the logo via code:

```typescript
// In any component
import Image from 'next/image';

<Image 
  src="/brand/logo.png"
  alt="Gorilla Smash Club"
  width={800}
  height={400}
/>
```

---

## ✅ Verification Checklist

After replacing the logo, verify:

- [ ] Logo appears in header (desktop)
- [ ] Logo appears in header (mobile)
- [ ] Logo appears on homepage
- [ ] Logo appears in footer
- [ ] Logo looks good in light mode
- [ ] Logo looks good in dark mode
- [ ] Logo loads quickly (check file size)
- [ ] Logo has proper aspect ratio

---

## 🆘 Troubleshooting

### Logo doesn't appear?
- Check filename: Must be `logo.png` or `logo.svg`
- Check location: Must be in `public/brand/`
- Clear browser cache
- Try different browser

### Logo is cut off or distorted?
- Check aspect ratio (should be ~2:1 width:height)
- Ensure image has transparent background
- Try larger resolution

### Logo doesn't work in dark mode?
- Use transparent background
- Ensure logo has light-colored elements
- Test with `dark:` Tailwind classes

---

## 📞 Support

For detailed documentation, see:
- `LOGO_REPLACEMENT_GUIDE.md` (in project root)
- `HOW_TO_REPLACE_LOGO.txt` (this directory)

For appearance settings UI:
- Navigate to `/settings/appearance` in your browser
- Upload logo there for user-specific customization

---

**Remember**: The logo you place here becomes the DEFAULT logo for all users. 
Individual users can override it by uploading their own via Appearance Settings.

