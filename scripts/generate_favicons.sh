#!/bin/bash
# Favicon Generation Script
# Generates all required favicon sizes from logo.svg

set -e

echo "🎨 Generating favicons from logo..."

# Check if source logo exists
if [ ! -f "public/brand/logo-mark.svg" ]; then
  echo "❌ Error: public/brand/logo-mark.svg not found"
  exit 1
fi

# Using ImageMagick (install: brew install imagemagick or apt-get install imagemagick)
# Alternative: Use sharp-cli (npm install -g sharp-cli)

# Generate favicon sizes
convert public/brand/logo-mark.svg -resize 16x16 -background none public/favicon-16.png
convert public/brand/logo-mark.svg -resize 32x32 -background none public/favicon-32.png
convert public/brand/logo-mark.svg -resize 180x180 -background none public/apple-touch-icon.png
convert public/brand/logo-mark.svg -resize 192x192 -background none public/android-chrome-192x192.png
convert public/brand/logo-mark.svg -resize 512x512 -background none public/android-chrome-512x512.png

# Generate ICO file (multi-size)
convert public/favicon-16.png public/favicon-32.png public/favicon.ico

echo "✅ Favicons generated successfully!"
echo "📁 Files created:"
echo "  - public/favicon-16.png"
echo "  - public/favicon-32.png"
echo "  - public/favicon.ico"
echo "  - public/apple-touch-icon.png"
echo "  - public/android-chrome-192x192.png"
echo "  - public/android-chrome-512x512.png"

