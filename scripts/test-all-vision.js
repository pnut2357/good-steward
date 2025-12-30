/**
 * Comprehensive Vision API Test - December 2025
 * 
 * Tests all available free Vision AI providers
 */

const fs = require('fs');
const path = require('path');

// Load .env
const envPath = path.join(__dirname, '..', '.env');
const keys = {};
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  
  const matches = {
    OPENROUTER: envContent.match(/EXPO_PUBLIC_OPENROUTER_API_KEY=(.+)/),
    HF_TOKEN: envContent.match(/EXPO_PUBLIC_HF_TOKEN=(.+)/),
    GROQ: envContent.match(/EXPO_PUBLIC_GROQ_API_KEY=(.+)/),
  };
  
  for (const [key, match] of Object.entries(matches)) {
    if (match) keys[key] = match[1].trim();
  }
}

console.log('═'.repeat(70));
console.log('🧪 COMPREHENSIVE VISION AI TEST - December 2025');
console.log('═'.repeat(70));
console.log(`\n📋 API Keys Found:`);
console.log(`   OpenRouter:   ${keys.OPENROUTER ? '✅' : '❌'}`);
console.log(`   HuggingFace:  ${keys.HF_TOKEN ? '✅' : '❌'}`);
console.log(`   Groq:         ${keys.GROQ ? '✅' : '❌'}`);

const testImage = 'assets/images/food04-apple.jpg';
const fullPath = path.join(__dirname, '..', testImage);
const imageBuffer = fs.readFileSync(fullPath);
const base64 = imageBuffer.toString('base64');

console.log(`\n📸 Test Image: ${testImage}`);
console.log('═'.repeat(70));

// Test functions
async function testOpenRouter(model) {
  if (!keys.OPENROUTER) return { status: 'SKIP', error: 'No API key' };
  
  try {
    const startTime = Date.now();
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${keys.OPENROUTER}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://good-steward.app',
      },
      body: JSON.stringify({
        model,
        messages: [{
          role: 'user',
          content: [
            { type: 'text', text: 'What food is this? Just name it.' },
            { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${base64}` } },
          ],
        }],
        max_tokens: 50,
      }),
    });
    
    const elapsed = Date.now() - startTime;
    const data = await response.json();
    
    if (!response.ok) {
      if (response.status === 429) {
        return { status: 'RATE_LIMITED', error: data.error?.message, elapsed };
      }
      return { status: 'ERROR', error: data.error?.message || `HTTP ${response.status}`, elapsed };
    }
    
    return { 
      status: 'OK', 
      result: data.choices?.[0]?.message?.content, 
      elapsed 
    };
  } catch (err) {
    return { status: 'ERROR', error: err.message };
  }
}

async function testHuggingFace(model) {
  if (!keys.HF_TOKEN) return { status: 'SKIP', error: 'No API key' };
  
  try {
    const startTime = Date.now();
    const response = await fetch(`https://api-inference.huggingface.co/models/${model}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${keys.HF_TOKEN}`,
      },
      body: imageBuffer,
    });
    
    const elapsed = Date.now() - startTime;
    
    if (!response.ok) {
      const text = await response.text();
      return { status: 'ERROR', error: `HTTP ${response.status}`, elapsed };
    }
    
    const data = await response.json();
    const caption = Array.isArray(data) ? data[0]?.generated_text : data.generated_text;
    return { status: 'OK', result: caption, elapsed };
  } catch (err) {
    return { status: 'ERROR', error: err.message };
  }
}

async function testGroq(model) {
  if (!keys.GROQ) return { status: 'SKIP', error: 'No API key' };
  
  try {
    const startTime = Date.now();
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${keys.GROQ}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: [{
          role: 'user',
          content: [
            { type: 'text', text: 'What food is this? Just name it.' },
            { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${base64}` } },
          ],
        }],
        max_tokens: 50,
      }),
    });
    
    const elapsed = Date.now() - startTime;
    const data = await response.json();
    
    if (!response.ok) {
      return { status: 'ERROR', error: data.error?.message || `HTTP ${response.status}`, elapsed };
    }
    
    return { 
      status: 'OK', 
      result: data.choices?.[0]?.message?.content, 
      elapsed 
    };
  } catch (err) {
    return { status: 'ERROR', error: err.message };
  }
}

async function testLocalBLIP() {
  try {
    // Check if transformers is installed
    const transformers = await import('@xenova/transformers');
    const pipeline = transformers.pipeline;
    const env = transformers.env;
    
    env.cacheDir = path.join(__dirname, '..', '.transformers-cache');
    if (keys.HF_TOKEN) env.HF_TOKEN = keys.HF_TOKEN;
    
    const startTime = Date.now();
    const captioner = await pipeline('image-to-text', 'Xenova/vit-gpt2-image-captioning');
    const loadTime = Date.now() - startTime;
    
    const inferStart = Date.now();
    const result = await captioner(fullPath);
    const inferTime = Date.now() - inferStart;
    
    return { 
      status: 'OK', 
      result: result[0]?.generated_text,
      loadTime,
      inferTime,
      elapsed: loadTime + inferTime
    };
  } catch (err) {
    return { status: 'ERROR', error: err.message };
  }
}

// Run all tests
async function runAllTests() {
  const tests = [
    { 
      name: 'OpenRouter (Gemini Flash Free)', 
      fn: () => testOpenRouter('google/gemini-2.0-flash-exp:free'),
      provider: 'Cloud',
      cost: 'FREE (50/day)',
    },
    { 
      name: 'OpenRouter (Qwen VL Free)', 
      fn: () => testOpenRouter('qwen/qwen2.5-vl-72b-instruct:free'),
      provider: 'Cloud',
      cost: 'FREE (50/day)',
    },
    { 
      name: 'OpenRouter (Llama Vision Free)', 
      fn: () => testOpenRouter('meta-llama/llama-3.2-11b-vision-instruct:free'),
      provider: 'Cloud',
      cost: 'FREE (50/day)',
    },
    { 
      name: 'HuggingFace BLIP Caption', 
      fn: () => testHuggingFace('Salesforce/blip-image-captioning-large'),
      provider: 'Cloud',
      cost: 'FREE',
    },
    { 
      name: 'Groq (Llama 3.2 Vision)', 
      fn: () => testGroq('llama-3.2-11b-vision-preview'),
      provider: 'Cloud',
      cost: 'FREE',
    },
    { 
      name: 'Local BLIP (Transformers.js)', 
      fn: testLocalBLIP,
      provider: 'Local',
      cost: 'FREE (Unlimited)',
    },
  ];
  
  const results = [];
  
  for (const test of tests) {
    console.log(`\n🧪 Testing: ${test.name}`);
    console.log(`   Provider: ${test.provider} | Cost: ${test.cost}`);
    process.stdout.write('   Result: ');
    
    const result = await test.fn();
    results.push({ ...test, ...result });
    
    if (result.status === 'OK') {
      console.log(`✅ "${result.result}" (${result.elapsed}ms)`);
    } else if (result.status === 'RATE_LIMITED') {
      console.log(`⏳ Rate Limited - Try again tomorrow`);
    } else if (result.status === 'SKIP') {
      console.log(`⏭️ Skipped - ${result.error}`);
    } else {
      console.log(`❌ ${result.error}`);
    }
    
    // Delay between cloud tests
    if (test.provider === 'Cloud') {
      await new Promise(r => setTimeout(r, 1000));
    }
  }
  
  // Summary
  console.log('\n' + '═'.repeat(70));
  console.log('📊 SUMMARY - WORKING PROVIDERS');
  console.log('═'.repeat(70));
  
  const working = results.filter(r => r.status === 'OK');
  const rateLimited = results.filter(r => r.status === 'RATE_LIMITED');
  const broken = results.filter(r => r.status === 'ERROR');
  
  if (working.length > 0) {
    console.log('\n✅ WORKING:');
    working.forEach(r => {
      console.log(`   • ${r.name} (${r.elapsed}ms)`);
    });
  }
  
  if (rateLimited.length > 0) {
    console.log('\n⏳ RATE LIMITED (will work tomorrow):');
    rateLimited.forEach(r => {
      console.log(`   • ${r.name}`);
    });
  }
  
  if (broken.length > 0) {
    console.log('\n❌ NOT AVAILABLE:');
    broken.forEach(r => {
      console.log(`   • ${r.name}: ${r.error?.substring(0, 50)}...`);
    });
  }
  
  console.log('\n' + '═'.repeat(70));
  console.log('💡 RECOMMENDATION');
  console.log('═'.repeat(70));
  
  if (working.some(r => r.name.includes('Local'))) {
    console.log('\n🎯 LOCAL BLIP IS WORKING!');
    console.log('   → No rate limits, works offline');
    console.log('   → Integrate with onnxruntime-react-native for mobile');
  } else if (working.length > 0) {
    console.log('\n🎯 Use:', working[0].name);
  } else if (rateLimited.length > 0) {
    console.log('\n🎯 Wait until tomorrow for rate limit reset');
    console.log('   → Or pay $10 for 1000 requests/day on OpenRouter');
  } else {
    console.log('\n🎯 All cloud providers unavailable');
    console.log('   → Consider integrating local BLIP with ONNX Runtime RN');
  }
}

runAllTests().catch(console.error);

