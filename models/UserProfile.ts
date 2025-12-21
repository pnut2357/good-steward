/**
 * User Profile Model
 * 
 * Stores user preferences for personal health filters.
 * These are USER-DEFINED settings, not app recommendations.
 * 
 * LEGAL: The app displays warnings based on USER's own settings,
 * not health advice from the app.
 */

/**
 * Common food allergens (OpenFoodFacts standard codes)
 */
export const ALLERGEN_OPTIONS = [
  { code: 'en:gluten', name: 'Gluten', emoji: '🌾' },
  { code: 'en:milk', name: 'Milk/Dairy', emoji: '🥛' },
  { code: 'en:eggs', name: 'Eggs', emoji: '🥚' },
  { code: 'en:peanuts', name: 'Peanuts', emoji: '🥜' },
  { code: 'en:nuts', name: 'Tree Nuts', emoji: '🌰' },
  { code: 'en:soybeans', name: 'Soy', emoji: '🫘' },
  { code: 'en:fish', name: 'Fish', emoji: '🐟' },
  { code: 'en:crustaceans', name: 'Shellfish', emoji: '🦐' },
  { code: 'en:sesame-seeds', name: 'Sesame', emoji: '🌱' },
  { code: 'en:celery', name: 'Celery', emoji: '🥬' },
  { code: 'en:mustard', name: 'Mustard', emoji: '🟡' },
  { code: 'en:sulphur-dioxide-and-sulphites', name: 'Sulphites', emoji: '⚗️' },
  { code: 'en:lupin', name: 'Lupin', emoji: '🌸' },
  { code: 'en:molluscs', name: 'Molluscs', emoji: '🦪' },
] as const;

/**
 * User's personal health profile
 */
export interface UserProfile {
  /**
   * Diabetes mode - flags high sugar products
   */
  diabetesMode: boolean;
  
  /**
   * User's sugar threshold (g per 100g)
   * Products exceeding this will be flagged
   */
  sugarThreshold: number;
  
  /**
   * Pregnancy mode - flags alcohol, caffeine, etc.
   */
  pregnancyMode: boolean;
  
  /**
   * Allergy mode - flags products containing user's allergens
   */
  allergyMode: boolean;
  
  /**
   * List of allergen codes the user wants to flag
   * e.g., ['en:peanuts', 'en:gluten']
   */
  allergens: string[];
  
  /**
   * Show "may contain traces of" warnings
   */
  showTraces: boolean;
  
  /**
   * Salt threshold (g per 100g) - optional
   */
  saltThreshold?: number;
  
  /**
   * Calories threshold (kcal per 100g) - optional
   */
  caloriesThreshold?: number;
}

/**
 * Default profile - all filters off
 */
export const DEFAULT_PROFILE: UserProfile = {
  diabetesMode: false,
  sugarThreshold: 10, // Default: flag > 10g sugar per 100g
  pregnancyMode: false,
  allergyMode: false,
  allergens: [],
  showTraces: true,
  saltThreshold: undefined,
  caloriesThreshold: undefined,
};

/**
 * Get allergen display info by code
 */
export function getAllergenInfo(code: string) {
  return ALLERGEN_OPTIONS.find(a => a.code === code);
}

/**
 * Format allergen code for display
 * "en:peanuts" → "Peanuts"
 */
export function formatAllergenName(code: string): string {
  const info = getAllergenInfo(code);
  if (info) return info.name;
  
  // Fallback: clean up the code
  return code
    .replace(/^en:/, '')
    .replace(/-/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
}

