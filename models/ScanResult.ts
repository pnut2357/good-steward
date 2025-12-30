/**
 * Represents a scanned product with nutrition data
 * 
 * LEGAL NOTE: This model stores FACTS only, no health judgments.
 * The app is an information tool, not a health advisor.
 */

/**
 * Nutrition data from OpenFoodFacts
 * All values are per 100g unless specified
 */
export interface NutritionData {
  /** Nutriscore grade (a, b, c, d, e) - official rating */
  nutriscore?: string;
  /** NOVA group (1-4) - processing level */
  nova?: number;
  /** Sugar in grams per 100g */
  sugar_100g?: number;
  /** Salt in grams per 100g */
  salt_100g?: number;
  /** Total fat in grams per 100g */
  fat_100g?: number;
  /** Saturated fat in grams per 100g */
  saturated_fat_100g?: number;
  /** Calories per 100g */
  calories_100g?: number;
  /** Carbohydrates per 100g */
  carbs_100g?: number;
  /** Protein per 100g */
  protein_100g?: number;
  /** Fiber per 100g */
  fiber_100g?: number;
  /** Serving size in grams (if available) */
  serving_size_g?: number;
  /** Whether this nutrition data was manually entered/edited by user */
  isUserEdited?: boolean;
}

/**
 * Consumption record - when user marks a product as consumed
 */
export interface ConsumptionRecord {
  /** When the item was consumed */
  consumedAt: string;
  /** Portion size in grams */
  portionGrams: number;
  /** Calculated nutrition for this portion */
  portionNutrition: {
    calories?: number;
    sugar?: number;
    salt?: number;
    protein?: number;
    carbs?: number;
    saturatedFat?: number;
  };
}

export interface ScanResult {
  /** 
   * Product barcode OR photo ID (photo_timestamp)
   * Photo IDs start with "photo_" to distinguish from barcodes
   */
  barcode: string;
  
  /** 
   * Product name from OpenFoodFacts or detected text
   */
  name: string;
  
  /**
   * Brand name (if available)
   */
  brand?: string;
  
  /** 
   * Raw ingredients list from label
   */
  ingredients: string;
  
  /** 
   * Factual summary of nutrition data
   * NO health judgments - just facts
   */
  summary: string;
  
  /**
   * Structured nutrition data (NEW)
   * Contains actual values from label
   */
  nutrition?: NutritionData;
  
  /**
   * List of allergens (from OpenFoodFacts)
   * e.g., ["en:gluten", "en:milk", "en:peanuts"]
   */
  allergens?: string[];
  
  /**
   * May contain traces of (from OpenFoodFacts)
   * e.g., ["en:tree-nuts", "en:soy"]
   */
  traces?: string[];
  
  /** 
   * @deprecated - Kept for database backward compatibility
   * DO NOT use for UI display - no longer shown to users
   */
  isSafe: boolean;
  
  /** 
   * ISO 8601 timestamp of when scan occurred
   */
  timestamp: string;
  
  /**
   * Source of the scan
   */
  source?: 'barcode' | 'photo' | 'search';
  
  /**
   * Photo URI for display (only for photo scans)
   */
  photoUri?: string;
  
  /**
   * Data source attribution (required for legal)
   */
  dataSource?: string;
  
  // ============ CONSUMPTION TRACKING (Phase 3) ============
  
  /**
   * Whether the user has marked this as consumed
   */
  consumed?: boolean;
  
  /**
   * Consumption records (can have multiple if consumed multiple times)
   * Most recent first
   */
  consumptions?: ConsumptionRecord[];
}

/**
 * Check if a scan result is from a photo
 */
export function isPhotoScan(result: ScanResult): boolean {
  return result.barcode.startsWith('photo_') || result.source === 'photo';
}

/**
 * Create a unique ID for photo-based scans
 */
export function createPhotoId(): string {
  return `photo_${Date.now()}`;
}

/**
 * Format Nutriscore for display
 */
export function formatNutriscore(grade?: string): string {
  if (!grade) return 'N/A';
  return grade.toUpperCase();
}

/**
 * Format NOVA group for display
 */
export function formatNova(nova?: number): string {
  if (!nova) return 'N/A';
  const labels: Record<number, string> = {
    1: '1 - Unprocessed',
    2: '2 - Processed ingredients',
    3: '3 - Processed foods',
    4: '4 - Ultra-processed',
  };
  return labels[nova] || `${nova}`;
}

/**
 * Format allergen code for display
 * "en:peanuts" → "Peanuts"
 */
export function formatAllergen(code: string): string {
  return code
    .replace(/^en:/, '')
    .replace(/-/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
}

// ============ CONSUMPTION UTILITIES ============

/**
 * Calculate nutrition for a specific portion
 */
export function calculatePortionNutrition(
  nutrition: NutritionData | undefined,
  portionGrams: number
): ConsumptionRecord['portionNutrition'] {
  if (!nutrition) return {};
  
  const factor = portionGrams / 100;
  
  return {
    calories: nutrition.calories_100g ? Math.round(nutrition.calories_100g * factor) : undefined,
    sugar: nutrition.sugar_100g ? Math.round(nutrition.sugar_100g * factor * 10) / 10 : undefined,
    salt: nutrition.salt_100g ? Math.round(nutrition.salt_100g * factor * 10) / 10 : undefined,
    protein: nutrition.protein_100g ? Math.round(nutrition.protein_100g * factor * 10) / 10 : undefined,
    carbs: nutrition.carbs_100g ? Math.round(nutrition.carbs_100g * factor * 10) / 10 : undefined,
    saturatedFat: nutrition.saturated_fat_100g ? Math.round(nutrition.saturated_fat_100g * factor * 10) / 10 : undefined,
  };
}

/**
 * Get total consumed nutrition for a scan result
 */
export function getTotalConsumedNutrition(result: ScanResult): ConsumptionRecord['portionNutrition'] {
  if (!result.consumptions || result.consumptions.length === 0) {
    return {};
  }
  
  return result.consumptions.reduce((total, consumption) => ({
    calories: (total.calories || 0) + (consumption.portionNutrition.calories || 0),
    sugar: Math.round(((total.sugar || 0) + (consumption.portionNutrition.sugar || 0)) * 10) / 10,
    salt: Math.round(((total.salt || 0) + (consumption.portionNutrition.salt || 0)) * 10) / 10,
    protein: Math.round(((total.protein || 0) + (consumption.portionNutrition.protein || 0)) * 10) / 10,
    carbs: Math.round(((total.carbs || 0) + (consumption.portionNutrition.carbs || 0)) * 10) / 10,
    saturatedFat: Math.round(((total.saturatedFat || 0) + (consumption.portionNutrition.saturatedFat || 0)) * 10) / 10,
  }), {} as ConsumptionRecord['portionNutrition']);
}

/**
 * Check if a scan was consumed today
 */
export function wasConsumedToday(result: ScanResult): boolean {
  if (!result.consumptions || result.consumptions.length === 0) return false;
  
  const today = new Date().toDateString();
  return result.consumptions.some(c => new Date(c.consumedAt).toDateString() === today);
}

/**
 * Get consumption records for today
 */
export function getTodayConsumptions(result: ScanResult): ConsumptionRecord[] {
  if (!result.consumptions) return [];
  
  const today = new Date().toDateString();
  return result.consumptions.filter(c => new Date(c.consumedAt).toDateString() === today);
}
