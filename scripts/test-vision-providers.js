/**
 * Test Multiple Vision API Providers - Updated December 2025
 * 
 * Tests: HuggingFace Router, Replicate, DeepInfra, SambaNova (all free tiers)
 */

const fs = require('fs');
const path = require('path');

// Load keys from .env
const envPath = path.join(__dirname, '..', '.env');
let OPENROUTER_KEY = '';
let HF_TOKEN = '';

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  
  const orMatch = envContent.match(/EXPO_PUBLIC_OPENROUTER_API_KEY=(.+)/);
  if (orMatch) OPENROUTER_KEY = orMatch[1].trim();
  
  const hfMatch = envContent.match(/EXPO_PUBLIC_HF_TOKEN=(.+)/);
  if (hfMatch) HF_TOKEN = hfMatch[1].trim();
}

// Test images
const testImages = [
  'assets/images/food04-apple.jpg',
  'assets/images/food03-hamburger.jpg',
];

console.log('🚀 Testing Free Vision API Providers (December 2025)');
console.log('═'.repeat(60));
console.log(`📋 Keys found:`);
console.log(`   OpenRouter: ${OPENROUTER_KEY ? '✅' : '❌'}`);
console.log(`   HuggingFace: ${HF_TOKEN ? '✅' : '❌'}`);
console.log('═'.repeat(60));

// ========================================
// TEST 1: HuggingFace Router API (new endpoint)
// ========================================
async function testHuggingFaceRouter(imagePath) {
  if (!HF_TOKEN) return { success: false, error: 'No HF_TOKEN' };
  
  const fullPath = path.join(__dirname, '..', imagePath);
  const imageBuffer = fs.readFileSync(fullPath);
  const base64 = imageBuffer.toString('base64');
  
  // New HuggingFace Router API endpoint
  const url = 'https://router.huggingface.co/hf-inference/models/Salesforce/blip-image-captioning-large';
  
  try {
    const startTime = Date.now();
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${HF_TOKEN}`,
      },
      body: imageBuffer,
    });
    
    const elapsed = Date.now() - startTime;
    
    if (!response.ok) {
      const text = await response.text();
      return { success: false, error: `HTTP ${response.status}: ${text.substring(0, 100)}`, elapsed };
    }
    
    const data = await response.json();
    const caption = Array.isArray(data) ? data[0]?.generated_text : data.generated_text;
    return { success: true, result: caption, elapsed };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// ========================================
// TEST 2: HuggingFace Inference Endpoints (Vision Model)
// ========================================
async function testHuggingFaceVision(imagePath) {
  if (!HF_TOKEN) return { success: false, error: 'No HF_TOKEN' };
  
  const fullPath = path.join(__dirname, '..', imagePath);
  const imageBuffer = fs.readFileSync(fullPath);
  const base64 = imageBuffer.toString('base64');
  
  // Try VL Chat endpoint
  const url = 'https://router.huggingface.co/hf-inference/v1/chat/completions';
  
  try {
    const startTime = Date.now();
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${HF_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'Qwen/Qwen2.5-VL-7B-Instruct',
        messages: [{
          role: 'user',
          content: [
            { type: 'text', text: 'What food is this? Just name it briefly.' },
            { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${base64}` } },
          ],
        }],
        max_tokens: 50,
      }),
    });
    
    const elapsed = Date.now() - startTime;
    
    if (!response.ok) {
      const text = await response.text();
      return { success: false, error: `HTTP ${response.status}: ${text.substring(0, 200)}`, elapsed };
    }
    
    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || 'No response';
    return { success: true, result: content, elapsed };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// ========================================
// TEST 3: OpenRouter (Gemini Flash - free)
// ========================================
async function testOpenRouterGemini(imagePath) {
  if (!OPENROUTER_KEY) return { success: false, error: 'No OPENROUTER_KEY' };
  
  const fullPath = path.join(__dirname, '..', imagePath);
  const imageBuffer = fs.readFileSync(fullPath);
  const base64 = imageBuffer.toString('base64');
  
  try {
    const startTime = Date.now();
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://good-steward.app',
        'X-Title': 'Good Steward Food Scanner',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.0-flash-exp:free',
        messages: [{
          role: 'user',
          content: [
            { type: 'text', text: 'What food is this? Just name it briefly.' },
            { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${base64}` } },
          ],
        }],
        max_tokens: 50,
      }),
    });
    
    const elapsed = Date.now() - startTime;
    
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      return { success: false, error: `HTTP ${response.status}: ${data.error?.message || 'Unknown error'}`, elapsed };
    }
    
    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || 'No response';
    return { success: true, result: content, elapsed };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// ========================================
// TEST 4: SambaNova Cloud (free tier)
// ========================================
async function testSambaNova(imagePath) {
  // SambaNova has free tier for Llama models
  // API Key needed from: https://cloud.sambanova.ai
  return { success: false, error: 'Skipped (no key)' };
}

// ========================================
// TEST 5: DeepInfra (free credits)
// ========================================
async function testDeepInfra(imagePath) {
  // DeepInfra gives $20 free credits
  // API Key needed from: https://deepinfra.com
  return { success: false, error: 'Skipped (no key)' };
}

// ========================================
// TEST 6: Local BLIP Model (Transformers.js)
// ========================================
async function testLocalBLIP(imagePath) {
  // This would use @xenova/transformers for local inference
  return { success: false, error: 'Not implemented (would need npm install)' };
}

// Run all tests
async function runTests() {
  const tests = [
    { name: 'HuggingFace BLIP (Router)', fn: testHuggingFaceRouter },
    { name: 'HuggingFace Qwen VL (Router)', fn: testHuggingFaceVision },
    { name: 'OpenRouter Gemini Flash', fn: testOpenRouterGemini },
  ];
  
  const results = {};
  
  for (const test of tests) {
    console.log(`\n📡 Testing: ${test.name}`);
    console.log('-'.repeat(50));
    
    results[test.name] = {};
    
    for (const imagePath of testImages) {
      const fileName = path.basename(imagePath);
      process.stdout.write(`   ${fileName}: `);
      
      const result = await test.fn(imagePath);
      results[test.name][fileName] = result;
      
      if (result.success) {
        console.log(`✅ "${result.result}" (${result.elapsed}ms)`);
      } else {
        console.log(`❌ ${result.error}`);
      }
      
      // Small delay between requests
      await new Promise(r => setTimeout(r, 1000));
    }
  }
  
  // Summary
  console.log('\n' + '═'.repeat(60));
  console.log('📊 SUMMARY');
  console.log('═'.repeat(60));
  
  for (const [name, imageResults] of Object.entries(results)) {
    const successCount = Object.values(imageResults).filter(r => r.success).length;
    const totalCount = Object.values(imageResults).length;
    const status = successCount === totalCount ? '✅' : successCount > 0 ? '⚠️' : '❌';
    console.log(`${status} ${name}: ${successCount}/${totalCount} images`);
  }
  
  console.log('\n' + '═'.repeat(60));
  console.log('💡 ALTERNATIVES TO CONSIDER:');
  console.log('═'.repeat(60));
  console.log('1. SambaNova Cloud - Free tier for Llama 3.2 Vision');
  console.log('   https://cloud.sambanova.ai');
  console.log('2. DeepInfra - $20 free credits for vision models');
  console.log('   https://deepinfra.com');
  console.log('3. Fireworks AI - Free tier available');
  console.log('   https://fireworks.ai');
  console.log('4. Local BLIP - Use @xenova/transformers for offline');
  console.log('   npm install @xenova/transformers');
}

runTests().catch(console.error);
