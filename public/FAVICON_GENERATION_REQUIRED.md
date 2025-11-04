# Favicon Generation Required

The favicon PNG files need to be generated from the SVG logo.

## Quick Setup

Run one of these commands:

### Option 1: Node.js Script (Requires Sharp)

```bash
npm install sharp --save-dev
node scripts/generate_favicons.js
```

### Option 2: Bash Script (Requires ImageMagick)

```bash
bash scripts/generate_favicons.sh
```

### Option 3: Online Tool

1. Go to https://realfavicongenerator.net/
2. Upload `public/brand/logo-mark.svg`
3. Download generated files
4. Extract to `public/` directory

## Required Files

After generation, you should have:

```
public/
├── favicon-16.png
├── favicon-32.png
├── favicon.ico
├── apple-touch-icon.png
├── android-chrome-192x192.png
└── android-chrome-512x512.png
```

## Verification

```bash
# Check files exist
ls public/*.png public/*.ico

# Check they're referenced in layout
# src/app/layout.tsx should have icon metadata
```

**Note**: The SVG logo (`public/brand/logo-mark.svg`) is already created and ready to use as the source for favicon generation.

