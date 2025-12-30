/**
 * Test script for USDA FoodData Central API
 * Run: node scripts/test-usda-api.js
 */

const fs = require('fs');
const path = require('path');

// Load API Key from .env
const envPath = path.join(__dirname, '..', '.env');
let usdaKey = process.env.EXPO_PUBLIC_USDA_API_KEY;

if (!usdaKey && fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const match = envContent.match(/EXPO_PUBLIC_USDA_API_KEY=(.+)/);
  if (match) {
    usdaKey = match[1].trim();
  }
}

if (!usdaKey) {
  console.error('❌ Error: EXPO_PUBLIC_USDA_API_KEY not found in .env');
  console.log('   Get free key at: https://api.nal.usda.gov');
  process.exit(1);
}

const USDA_URL = 'https://api.nal.usda.gov/fdc/v1/foods/search';

// Test searches - including international foods
const testFoods = [
  'pho',
  'bibimbap', 
  'bulgogi',
  'steak',
  'taco',
  'pizza',
];

async function searchFood(query) {
  console.log(`\n🔍 Searching USDA for: "${query}"...`);
  const startTime = Date.now();

  try {
    // USDA requires api_key as query parameter
    const url = `${USDA_URL}?api_key=${usdaKey}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: query,
        dataType: ['Foundation', 'Survey (FNDDS)', 'SR Legacy'],
        pageSize: 5,
      }),
    });

    const elapsed = Date.now() - startTime;

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ API Error (${response.status}): ${errorText}`);
      return;
    }

    const data = await response.json();
    
    if (!data.foods || data.foods.length === 0) {
      console.log(`⚠️ No results found (${elapsed}ms)`);
      return;
    }

    console.log(`✅ Found ${data.totalHits} results in ${elapsed}ms`);
    console.log(`   Top ${Math.min(3, data.foods.length)} results:`);
    
    data.foods.slice(0, 3).forEach((food, i) => {
      const calories = food.foodNutrients?.find(n => n.nutrientId === 1008)?.value || 'N/A';
      const protein = food.foodNutrients?.find(n => n.nutrientId === 1003)?.value || 'N/A';
      console.log(`   ${i + 1}. ${food.description}`);
      console.log(`      Calories: ${calories} kcal/100g | Protein: ${protein}g/100g`);
    });

  } catch (error) {
    console.error(`❌ Request failed: ${error.message}`);
  }
}

async function run() {
  console.log('🚀 Testing USDA FoodData Central API...');
  console.log(`🔑 Using Key: ${usdaKey.substring(0, 8)}...`);
  console.log('═'.repeat(50));

  for (const food of testFoods) {
    await searchFood(food);
  }

  console.log('\n' + '═'.repeat(50));
  console.log('✅ USDA API test complete!');
}

run();

