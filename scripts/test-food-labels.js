/**
 * Test food labels and nutrition database
 */

const { FOOD_LABELS } = require('../data/foodLabels');
const { getBasicNutrition } = require('../data/foodLabels');

console.log('🍽️ Testing Food Labels Database');
console.log('═'.repeat(60));

// Count labels
console.log(`\n📊 Total food labels: ${FOOD_LABELS.length}`);

// Test some searches
const testQueries = ['pizza', 'apple', 'burger', 'sushi', 'pasta', 'salad', 'curry'];

console.log('\n🔍 Search Tests:');
for (const query of testQueries) {
  const matches = FOOD_LABELS.filter(l => l.toLowerCase().includes(query));
  console.log(`   "${query}": ${matches.length} matches`);
  if (matches.length > 0) {
    console.log(`      → ${matches.slice(0, 3).join(', ')}${matches.length > 3 ? '...' : ''}`);
  }
}

// Test nutrition estimates
console.log('\n🥗 Nutrition Estimates (per 100g):');
const testFoods = ['apple', 'pizza', 'hamburger', 'salmon', 'ice cream', 'salad'];

for (const food of testFoods) {
  const nutrition = getBasicNutrition(food);
  console.log(`   ${food}:`);
  console.log(`      ${nutrition.calories} kcal | ${nutrition.protein}g protein | ${nutrition.carbs}g carbs | ${nutrition.fat}g fat`);
}

console.log('\n✅ Food labels database is working!');
console.log('═'.repeat(60));

