/**
 * USDA FoodData Central API Service
 * 
 * Free API for searching generic foods (rice, steak, pho, bibimbap, etc.)
 * Commercial use allowed - Public Domain (US Government data)
 * 
 * Documentation: https://fdc.nal.usda.gov/api-guide.html
 * 
 * Note: Requires API key from https://api.nal.usda.gov
 * Add to .env: EXPO_PUBLIC_USDA_API_KEY=your_key_here
 */

const USDA_API_KEY = process.env.EXPO_PUBLIC_USDA_API_KEY;
const USDA_BASE_URL = 'https://api.nal.usda.gov/fdc/v1';

// Nutrient IDs in USDA database
// Note: Some foods use different Energy IDs depending on calculation method
const NUTRIENT_IDS = {
  ENERGY: 1008,           // Energy (kcal) - standard
  ENERGY_ATWATER: 2047,   // Energy (Atwater General Factors) - some Foundation foods
  ENERGY_ATWATER_SP: 2048,// Energy (Atwater Specific Factors) - alternative
  PROTEIN: 1003,          // Protein (g)
  CARBS: 1005,            // Carbohydrates (g)
  FAT: 1004,              // Total lipid/fat (g)
  SUGAR: 2000,            // Total sugars (g)
  SODIUM: 1093,           // Sodium (mg)
  FIBER: 1079,            // Fiber (g)
};

export interface USDAFoodResult {
  fdcId: number;
  name: string;
  brand?: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  sugar: number;
  sodium: number;
  servingSize?: number;
  servingUnit?: string;
  dataSource: 'usda';
}

/**
 * Check if USDA API is available
 */
export function isUSDAAvailable(): boolean {
  return !!USDA_API_KEY;
}

/**
 * Search USDA FoodData Central for generic foods
 * 
 * @param query - Food name to search (e.g., "pho", "bibimbap", "steak")
 * @param limit - Maximum results to return (default 10)
 */
export async function searchUSDAFoods(query: string, limit: number = 10): Promise<USDAFoodResult[]> {
  if (!USDA_API_KEY) {
    console.warn('⚠️ USDA API key not configured. Add EXPO_PUBLIC_USDA_API_KEY to .env');
    console.warn('   Get free key at: https://api.nal.usda.gov');
    return [];
  }

  try {
    console.log(`🔍 Searching USDA for: "${query}"...`);
    const startTime = Date.now();

    // USDA requires api_key as query parameter
    const response = await fetch(`${USDA_BASE_URL}/foods/search?api_key=${USDA_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: query,
        dataType: ['Foundation', 'Survey (FNDDS)', 'SR Legacy'],  // Generic foods, not brands
        pageSize: limit,
        sortBy: 'dataType.keyword',
        sortOrder: 'asc',
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ USDA API error (${response.status}):`, errorText);
      return [];
    }

    const data = await response.json();
    const elapsed = Date.now() - startTime;
    
    if (!data.foods || data.foods.length === 0) {
      console.log(`⚠️ No USDA results for "${query}" (${elapsed}ms)`);
      return [];
    }

    // Map USDA response to our format
    const results: USDAFoodResult[] = data.foods.map((food: any) => ({
      fdcId: food.fdcId,
      name: cleanFoodName(food.description),
      brand: food.brandOwner || undefined,
      calories: getEnergyValue(food),
      protein: getNutrientValue(food, NUTRIENT_IDS.PROTEIN),
      carbs: getNutrientValue(food, NUTRIENT_IDS.CARBS),
      fat: getNutrientValue(food, NUTRIENT_IDS.FAT),
      sugar: getNutrientValue(food, NUTRIENT_IDS.SUGAR),
      sodium: getNutrientValue(food, NUTRIENT_IDS.SODIUM),
      servingSize: food.servingSize || 100,
      servingUnit: food.servingSizeUnit || 'g',
      dataSource: 'usda' as const,
    }));

    console.log(`✅ USDA found ${results.length} results for "${query}" (${elapsed}ms)`);
    
    return results;
  } catch (error: any) {
    console.error('❌ USDA search failed:', error.message);
    return [];
  }
}

/**
 * Get nutrient value from USDA food item
 * 
 * Note: USDA search API returns different structures:
 * - Search: { nutrientId: 1008, value: 86 }
 * - Details: { nutrient: { id: 1008 }, amount: 86 }
 */
function getNutrientValue(food: any, nutrientId: number): number {
  if (!food.foodNutrients) return 0;
  
  const nutrient = food.foodNutrients.find((n: any) => {
    // Search API format: { nutrientId: 1008, value: 86 }
    if (n.nutrientId === nutrientId) return true;
    
    // Details API format: { nutrient: { id: 1008 }, amount: 86 }
    if (n.nutrient && n.nutrient.id === nutrientId) return true;
    
    // Some responses use nutrientNumber (string)
    if (n.nutrientNumber === String(nutrientId)) return true;
    
    return false;
  });
  
  if (!nutrient) return 0;
  
  // Value can be in 'value' (search) or 'amount' (details)
  const value = nutrient.value ?? nutrient.amount ?? 0;
  return Math.round(value * 10) / 10;
}

/**
 * Get energy/calories value from USDA food item
 * 
 * USDA uses different nutrient IDs for energy depending on the food:
 * - 1008: Standard Energy (kcal) - most foods
 * - 2047: Energy (Atwater General Factors) - Foundation foods
 * - 2048: Energy (Atwater Specific Factors) - alternative calculation
 */
function getEnergyValue(food: any): number {
  // Try standard energy first (most common)
  let energy = getNutrientValue(food, NUTRIENT_IDS.ENERGY);
  
  // If not found, try Atwater General Factors (used by Foundation foods like raw vegetables)
  if (energy === 0) {
    energy = getNutrientValue(food, NUTRIENT_IDS.ENERGY_ATWATER);
  }
  
  // If still not found, try Atwater Specific Factors
  if (energy === 0) {
    energy = getNutrientValue(food, NUTRIENT_IDS.ENERGY_ATWATER_SP);
  }
  
  return energy;
}

/**
 * Clean up USDA food names (they're often verbose)
 * e.g., "Rice, white, long-grain, regular, cooked" → "White Rice (cooked)"
 */
function cleanFoodName(name: string): string {
  if (!name) return 'Unknown Food';
  
  // Capitalize first letter of each word
  let cleaned = name
    .toLowerCase()
    .split(',')
    .map(part => part.trim())
    .filter(Boolean);
  
  // Take first 3 parts max
  if (cleaned.length > 3) {
    cleaned = cleaned.slice(0, 3);
  }
  
  // Rejoin and capitalize
  const result = cleaned
    .join(', ')
    .replace(/\b\w/g, c => c.toUpperCase());
  
  return result;
}

/**
 * Get detailed nutrition for a specific USDA food
 */
export async function getUSDAFoodDetails(fdcId: number): Promise<USDAFoodResult | null> {
  if (!USDA_API_KEY) {
    return null;
  }

  try {
    const response = await fetch(
      `${USDA_BASE_URL}/food/${fdcId}?api_key=${USDA_API_KEY}`
    );

    if (!response.ok) {
      return null;
    }

    const food = await response.json();
    
    return {
      fdcId: food.fdcId,
      name: cleanFoodName(food.description),
      calories: getEnergyValue(food),
      protein: getNutrientValue(food, NUTRIENT_IDS.PROTEIN),
      carbs: getNutrientValue(food, NUTRIENT_IDS.CARBS),
      fat: getNutrientValue(food, NUTRIENT_IDS.FAT),
      sugar: getNutrientValue(food, NUTRIENT_IDS.SUGAR),
      sodium: getNutrientValue(food, NUTRIENT_IDS.SODIUM),
      servingSize: food.servingSize || 100,
      servingUnit: food.servingSizeUnit || 'g',
      dataSource: 'usda',
    };
  } catch (error) {
    console.error('Failed to get USDA food details:', error);
    return null;
  }
}

