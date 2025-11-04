# Brand Assets - Developer Guide

## Asset Locations

```
public/brand/
├── logo.svg              # Full logo with text (600×200px)
└── logo-mark.svg         # Icon only (200×200px)

public/
├── favicon-16.png        # Browser tab icon (16×16)
├── favicon-32.png        # Browser tab icon (32×32)
├── favicon.ico           # Multi-size ICO file
├── apple-touch-icon.png  # iOS home screen (180×180)
├── android-chrome-192x192.png  # Android (192×192)
├── android-chrome-512x512.png  # Android splash (512×512)
└── site.webmanifest      # PWA manifest
```

---

## Regenerating Favicons

### Prerequisites

Install Sharp (Node.js image processing):

```bash
npm install sharp --save-dev
```

OR install ImageMagick (system-level):

```bash
# macOS
brew install imagemagick

# Ubuntu/Debian
sudo apt-get install imagemagick

# Windows
choco install imagemagick
```

### Method 1: Node.js Script (Recommended)

```bash
node scripts/generate_favicons.js
```

This script:
1. Reads `public/brand/logo-mark.svg`
2. Generates all required favicon sizes
3. Outputs to `public/` directory

### Method 2: Bash Script

```bash
chmod +x scripts/generate_favicons.sh
bash scripts/generate_favicons.sh
```

Requires ImageMagick installed.

### Method 3: Manual (ImageMagick CLI)

```bash
# From logo-mark.svg, generate each size
convert public/brand/logo-mark.svg -resize 16x16 -background none public/favicon-16.png
convert public/brand/logo-mark.svg -resize 32x32 -background none public/favicon-32.png
convert public/brand/logo-mark.svg -resize 180x180 -background none public/apple-touch-icon.png
convert public/brand/logo-mark.svg -resize 192x192 -background none public/android-chrome-192x192.png
convert public/brand/logo-mark.svg -resize 512x512 -background none public/android-chrome-512x512.png

# Generate multi-size ICO
convert public/favicon-16.png public/favicon-32.png public/favicon.ico
```

---

## Updating Logo Files

### If You Have a New Logo PDF

1. **Convert PDF to SVG** (vector preferred):

```bash
# Using Inkscape
inkscape --export-type=svg logo.pdf -o public/brand/logo.svg

# Using pdf2svg
pdf2svg logo.pdf public/brand/logo.svg
```

2. **Or Convert PDF to PNG** (if vector fails):

```bash
# Using ImageMagick (4x resolution for quality)
convert -density 600 logo.pdf -resize 2400x800 -background none public/brand/logo.png

# Then trace to SVG using Potrace (optional)
potrace public/brand/logo.png -s -o public/brand/logo.svg
```

3. **Regenerate Favicons**:

```bash
node scripts/generate_favicons.js
```

---

## Optimizing SVG Files

### Clean and Minify SVGs

```bash
npm install -g svgo

svgo public/brand/logo.svg
svgo public/brand/logo-mark.svg
```

This removes:
- Unnecessary metadata
- Comments
- Hidden elements
- Duplicate definitions

---

## Color Palette Extraction

To extract colors from a new logo:

### Method 1: Node.js (Vibrant)

```bash
npm install node-vibrant

node -e "
const Vibrant = require('node-vibrant');
Vibrant.from('public/brand/logo.png').getPalette()
  .then(palette => console.log(palette));
"
```

### Method 2: Online Tools

- [Coolors.co Image Picker](https://coolors.co/image-picker)
- [Adobe Color Extract Theme](https://color.adobe.com/create/image)

### Method 3: Manual (Eyedropper)

Use browser DevTools or design software to sample colors directly.

---

## Font Management

### Google Fonts (Current Setup)

Fonts are auto-loaded via Next.js:

```typescript
// src/app/layout.tsx
import { Inter, Poppins } from 'next/font/google';
```

No manual `<link>` tags needed!

### Self-Hosted Fonts (Optional)

1. Download fonts from [Google Fonts](https://fonts.google.com)
2. Place in `public/fonts/`
3. Update `src/styles/globals.css`:

```css
@font-face {
  font-family: 'Poppins';
  src: url('/fonts/Poppins-Bold.woff2') format('woff2');
  font-weight: 700;
  font-display: swap;
}
```

---

## Design Token Updates

Edit `src/styles/tokens.json` to update:
- Colors
- Spacing
- Border radius
- Shadows
- Typography

After editing, restart dev server:

```bash
npm run dev
```

Tailwind automatically picks up token changes.

---

## Verifying Assets

### 1. Check Favicons

```bash
# List all favicon files
ls -lh public/*.png public/*.ico public/site.webmanifest

# Or on Windows
dir public\*.png public\*.ico public\site.webmanifest
```

### 2. Test Logo Rendering

```tsx
// In any component
<Image src="/brand/logo-mark.svg" alt="Logo" width={40} height={40} />
```

Open browser and check:
- Logo renders clearly
- No console errors
- Transparent background works

### 3. Test PWA Manifest

```bash
# Open in browser
http://localhost:3000/site.webmanifest

# Should return valid JSON
```

### 4. Check Dark Mode

Toggle theme in header and verify:
- Logo visible in both modes
- Colors adapt properly
- Text remains readable

---

## Deployment Checklist

Before deploying:

- [ ] All favicons generated and optimized
- [ ] `site.webmanifest` has correct URLs and theme color
- [ ] Logo SVGs are optimized (run `svgo`)
- [ ] Fonts loading correctly (check Network tab)
- [ ] Dark mode toggle works
- [ ] Logo visible on all pages
- [ ] Alt text present on all logo instances

---

## File Sizes (Target)

- logo.svg: < 15KB
- logo-mark.svg: < 8KB
- favicon-16.png: < 1KB
- favicon-32.png: < 2KB
- apple-touch-icon.png: < 10KB
- android-chrome-192x192.png: < 15KB
- android-chrome-512x512.png: < 40KB

---

## Troubleshooting

### Logo not showing

```
1. Check file exists: public/brand/logo-mark.svg
2. Check Next.js public folder is serving files
3. Clear browser cache (Cmd+Shift+R / Ctrl+Shift+R)
4. Check browser console for 404 errors
```

### Favicons not updating

```
1. Hard refresh browser (Ctrl+Shift+R)
2. Clear site data in browser DevTools
3. Check file names match manifest
4. Verify files in public/ directory
```

### Dark mode not working

```
1. Check Tailwind config has darkMode: 'class'
2. Verify dark: prefixes in component styles
3. Check theme toggle adds/removes 'dark' class on <html>
4. Inspect element to see if dark class applied
```

---

## Quick Commands

```bash
# Generate all favicons
node scripts/generate_favicons.js

# Optimize SVGs
npx svgo public/brand/*.svg

# Check file sizes
du -h public/brand/* public/*.png

# Preview design system
npm run dev
# Then visit http://localhost:3000/design
```

---

## Support

For questions or asset requests:
- See `PHASE2I_BRAND.md` for usage guidelines
- See `ACCESSIBILITY_BRAND_NOTES.md` for contrast verification
- Check `/design` page for interactive preview

