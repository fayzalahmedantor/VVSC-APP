const Jimp = require('jimp');

async function generateIcons() {
  try {
    const image = await Jimp.read('public/logo.png');
    
    // Original dimensions: 817x305
    // We want a square. We'll make it 817x817 or larger.
    const maxDim = Math.max(image.bitmap.width, image.bitmap.height);
    // Add some padding (e.g., 20%) so it doesn't touch the edges
    const paddedDim = Math.floor(maxDim * 1.2);
    
    // Create a new blank (transparent) image of the square size
    const square192 = new Jimp(192, 192, 0x00000000);
    const square512 = new Jimp(512, 512, 0x00000000);
    
    // Scale the original image so it fits nicely inside the square
    const scaleFactor512 = 512 / paddedDim;
    const scaled512 = image.clone().scale(scaleFactor512);
    
    const scaleFactor192 = 192 / paddedDim;
    const scaled192 = image.clone().scale(scaleFactor192);
    
    // Composite the scaled image onto the center of the square
    square512.composite(scaled512, (512 - scaled512.bitmap.width) / 2, (512 - scaled512.bitmap.height) / 2);
    square192.composite(scaled192, (192 - scaled192.bitmap.width) / 2, (192 - scaled192.bitmap.height) / 2);
    
    // Save them
    await square192.writeAsync('public/pwa-192x192.png');
    await square512.writeAsync('public/pwa-512x512.png');
    
    console.log('Icons generated successfully.');
  } catch (err) {
    console.error(err);
  }
}

generateIcons();
