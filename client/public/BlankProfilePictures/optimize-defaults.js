// Run this script to generate optimized versions of default profile pictures
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function optimizeDefaultImages() {
  const sourceDir = path.join(__dirname);
  const images = [
    { 
      source: 'BlankBabyPicture.png', 
      sizes: [40, 80, 160, 320] 
    },
    { 
      source: 'BlankProfilePicture.avif', 
      sizes: [40, 80, 160, 320] 
    }
  ];

  for (const image of images) {
    const sourceFile = path.join(sourceDir, image.source);
    const baseName = path.basename(image.source, path.extname(image.source));
    
    // Create WebP versions in multiple sizes
    for (const size of image.sizes) {
      const webpOutput = path.join(sourceDir, `${baseName}-${size}.webp`);
      const avifOutput = path.join(sourceDir, `${baseName}-${size}.avif`);
      
      await sharp(sourceFile)
        .resize(size, size)
        .webp({ quality: 80 })
        .toFile(webpOutput);
      
      try {
        await sharp(sourceFile)
          .resize(size, size)
          .avif({ quality: 60 })
          .toFile(avifOutput);
      } catch (error) {
        console.log(`AVIF conversion failed for ${baseName} at size ${size}px, using WebP only`);
      }
    }
  }
  
  console.log('Default profile pictures optimized successfully');
}

optimizeDefaultImages().catch(console.error);