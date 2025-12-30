const fs = require('fs');
const path = require('path');

// Load API Key from .env
const envPath = path.join(__dirname, '..', '.env');
let openrouterKey = process.env.EXPO_PUBLIC_OPENROUTER_API_KEY;

if (!openrouterKey && fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const match = envContent.match(/EXPO_PUBLIC_OPENROUTER_API_KEY=(.+)/);
  if (match) {
    openrouterKey = match[1].trim();
  }
}

if (!openrouterKey) {
  console.error('❌ Error: EXPO_PUBLIC_OPENROUTER_API_KEY not found in .env');
  process.exit(1);
}

const imagesToTest = [
  'assets/images/food04-apple.jpg',
  'assets/images/food01-pizza.jpg',
  'assets/images/food03-hamburger.jpg'
];

async function testImage(relativePath) {
  const imagePath = path.join(__dirname, '..', relativePath);
  
  if (!fs.existsSync(imagePath)) {
    console.error(`\n⚠️  Skipping ${relativePath}: File not found`);
    return;
  }

  console.log(`\n📸 Testing ${relativePath}...`);
  const imageBuffer = fs.readFileSync(imagePath);
  const base64 = imageBuffer.toString('base64');

  // OpenRouter API 
  const url = 'https://openrouter.ai/api/v1/chat/completions';
  const model = 'google/gemini-2.0-flash-exp:free';

  const prompt = `Identify this food. Return JSON: { "name": "food name", "calories": number, "description": "brief description" }`;

  try {
    const startTime = Date.now();
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openrouterKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://good-steward.app',
        'X-Title': 'Good Steward Test',
      },
      body: JSON.stringify({
        model: model,
        messages: [{
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${base64}` } },
          ],
        }],
        temperature: 0.1,
        max_tokens: 500,
      }),
    });

    const elapsed = Date.now() - startTime;

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error(`❌ API Error (${response.status}):`, JSON.stringify(errorData, null, 2));
      return;
    }

    const result = await response.json();
    console.log(`✅ Success in ${elapsed}ms!`);
    console.log(`🤖 Model: ${model}`);
    
    const content = result.choices?.[0]?.message?.content;
    console.log(`📝 Response:\n${content}`);

  } catch (error) {
    console.error('❌ Request failed:', error.message);
  }
}

async function run() {
  console.log('🚀 Starting Vision API Test (OpenRouter + Gemini 2.0 Flash)...');
  console.log(`🔑 Using Key: ${openrouterKey.substring(0, 10)}...`);
  
  for (const img of imagesToTest) {
    await testImage(img);
  }
}

run();
