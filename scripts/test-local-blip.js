/**
 * Test Local BLIP Model with Food Images
 * 
 * This script tests the same model used in LocalVisionWebView
 * to verify it can recognize food images.
 * 
 * Run: node scripts/test-local-blip.js
 */

const { pipeline } = require('@xenova/transformers');
const fs = require('fs');
const path = require('path');

// Food images to test
const TEST_IMAGES = [
  'assets/images/food01-pizza.jpg',
  'assets/images/food02-pizza.jpg',
  'assets/images/food03-hamburger.jpg',
  'assets/images/food04-apple.jpg',
];

async function testLocalBLIP() {
  console.log('🔄 Loading Local BLIP model (vit-gpt2-image-captioning)...');
  console.log('   This may take a minute on first run (downloading ~400MB model)\n');
  
  const startLoad = Date.now();
  
  try {
    // Load the same model used in LocalVisionWebView
    const captioner = await pipeline('image-to-text', 'Xenova/vit-gpt2-image-captioning', {
      progress_callback: (progress) => {
        if (progress.status === 'downloading') {
          const pct = Math.round((progress.loaded / progress.total) * 100);
          process.stdout.write(`\r   Downloading: ${pct}%   `);
        } else if (progress.status === 'loading') {
          process.stdout.write(`\r   Loading model...        `);
        }
      }
    });
    
    const loadTime = ((Date.now() - startLoad) / 1000).toFixed(1);
    console.log(`\n✅ Model loaded in ${loadTime}s\n`);
    
    // Test each image
    console.log('━'.repeat(60));
    console.log('Testing Food Images:');
    console.log('━'.repeat(60));
    
    for (const imagePath of TEST_IMAGES) {
      const fullPath = path.join(process.cwd(), imagePath);
      
      if (!fs.existsSync(fullPath)) {
        console.log(`\n❌ ${imagePath} - File not found`);
        continue;
      }
      
      console.log(`\n📷 ${path.basename(imagePath)}`);
      
      try {
        // Read image as base64
        const imageBuffer = fs.readFileSync(fullPath);
        const base64 = imageBuffer.toString('base64');
        const dataUrl = `data:image/jpeg;base64,${base64}`;
        
        const startAnalysis = Date.now();
        const output = await captioner(dataUrl);
        const analysisTime = Date.now() - startAnalysis;
        
        const caption = output[0]?.generated_text || 'No caption generated';
        
        console.log(`   Caption: "${caption}"`);
        console.log(`   Time: ${analysisTime}ms`);
        
        // Extract likely food name
        const foodName = extractFoodFromCaption(caption);
        console.log(`   Detected Food: ${foodName}`);
        
      } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
      }
    }
    
    console.log('\n' + '━'.repeat(60));
    console.log('✅ Test complete!\n');
    
  } catch (error) {
    console.error('\n❌ Failed to load model:', error.message);
    process.exit(1);
  }
}

/**
 * Extract food name from caption
 */
function extractFoodFromCaption(caption) {
  const lower = caption.toLowerCase();
  
  // Common food keywords
  const foodWords = [
    'pizza', 'burger', 'hamburger', 'sandwich', 'salad', 
    'apple', 'orange', 'banana', 'chicken', 'fish', 
    'rice', 'pasta', 'soup', 'cake', 'cookie', 'bread',
    'steak', 'meat', 'vegetable', 'fruit', 'food', 'plate'
  ];
  
  for (const word of foodWords) {
    if (lower.includes(word)) {
      return word.charAt(0).toUpperCase() + word.slice(1);
    }
  }
  
  // Return cleaned caption
  return caption.replace(/^a\s+/i, '').split(' ').slice(0, 3).join(' ') || 'Unknown';
}

// Run test
testLocalBLIP();
