/**
 * Favicon Generation Script (Node.js alternative to bash script)
 * Requires: npm install sharp
 * Usage: node scripts/generate_favicons.js
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const sizes = [
  { name: 'favicon-16.png', size: 16 },
  { name: 'favicon-32.png', size: 32 },
  { name: 'apple-touch-icon.png', size: 180 },
  { name: 'android-chrome-192x192.png', size: 192 },
  { name: 'android-chrome-512x512.png', size: 512 },
];

const inputFile = path.join(__dirname, '../public/brand/logo-mark.svg');
const outputDir = path.join(__dirname, '../public');

async function generateFavicons() {
  console.log('🎨 Generating favicons from logo...\n');

  if (!fs.existsSync(inputFile)) {
    console.error('❌ Error: public/brand/logo-mark.svg not found');
    process.exit(1);
  }

  try {
    for (const { name, size } of sizes) {
      const outputPath = path.join(outputDir, name);
      
      await sharp(inputFile)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 },
        })
        .png()
        .toFile(outputPath);
      
      console.log(`✅ Generated ${name} (${size}x${size})`);
    }

    console.log('\n✨ All favicons generated successfully!');
    console.log('\n📁 Files created in public/:');
    sizes.forEach(({ name }) => console.log(`  - ${name}`));
    
  } catch (error) {
    console.error('❌ Error generating favicons:', error.message);
    process.exit(1);
  }
}

generateFavicons();

