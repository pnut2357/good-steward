/**
 * Parses nutrition information from OCR text of a nutrition label
 * 
 * Nutrition labels typically have formats like:
 * - "Calories 150" or "Energy 150kcal"
 * - "Total Fat 8g" or "Fat: 8 g"
 * - "Sugars 12g" or "of which sugars 12g"
 * - "Protein 5g"
 * - "Carbohydrate 20g" or "Total Carbs 20g"
 * - "Salt 0.5g" or "Sodium 200mg"
 */

import { NutritionData } from '../models/ScanResult';

/**
 * Pattern definitions for extracting nutrition values
 * Supports both raw OCR text and structured AI output
 */
const PATTERNS = {
  // Calories patterns - supports various formats including AI output
  calories: [
    /calories[:\s*]*(\d+(?:\.\d+)?)\s*(?:kcal|cal)?/i,
    /energy[:\s*]*(\d+(?:\.\d+)?)\s*(?:kcal|cal)/i,
    /(\d+(?:\.\d+)?)\s*(?:kcal|calories)/i,
    /cal[:\s*]*(\d+(?:\.\d+)?)/i,
    /\*\*calories\*\*[:\s]*(\d+(?:\.\d+)?)/i,  // **Calories**: 150 (markdown)
    /-\s*calories[:\s]*(\d+(?:\.\d+)?)/i,      // - Calories: 150 (list)
  ],
  
  // Sugar patterns
  sugar: [
    /sugars?[:\s*]*(\d+(?:\.\d+)?)\s*g/i,
    /of which sugars?[:\s*]*(\d+(?:\.\d+)?)\s*g/i,
    /total sugars?[:\s*]*(\d+(?:\.\d+)?)\s*g/i,
    /sugar[:\s*]*(\d+(?:\.\d+)?)/i,
    /\*\*sugars?\*\*[:\s]*(\d+(?:\.\d+)?)/i,
    /-\s*sugars?[:\s]*(\d+(?:\.\d+)?)/i,
  ],
  
  // Protein patterns
  protein: [
    /protein[:\s*]*(\d+(?:\.\d+)?)\s*g/i,
    /proteins?[:\s*]*(\d+(?:\.\d+)?)/i,
    /\*\*protein\*\*[:\s]*(\d+(?:\.\d+)?)/i,
    /-\s*protein[:\s]*(\d+(?:\.\d+)?)/i,
  ],
  
  // Carbohydrates patterns
  carbs: [
    /carbohydrates?[:\s*]*(\d+(?:\.\d+)?)\s*g/i,
    /total carbs?[:\s*]*(\d+(?:\.\d+)?)\s*g/i,
    /carbs?[:\s*]*(\d+(?:\.\d+)?)/i,
    /\*\*carbohydrates?\*\*[:\s]*(\d+(?:\.\d+)?)/i,
    /-\s*carbohydrates?[:\s]*(\d+(?:\.\d+)?)/i,
  ],
  
  // Fat patterns
  fat: [
    /total fat[:\s*]*(\d+(?:\.\d+)?)\s*g/i,
    /fat[:\s*]*(\d+(?:\.\d+)?)\s*g/i,
    /lipids?[:\s*]*(\d+(?:\.\d+)?)/i,
    /\*\*fat\*\*[:\s]*(\d+(?:\.\d+)?)/i,
    /-\s*fat[:\s]*(\d+(?:\.\d+)?)/i,
  ],
  
  // Saturated fat patterns
  saturatedFat: [
    /saturated fat[:\s*]*(\d+(?:\.\d+)?)\s*g/i,
    /saturates?[:\s*]*(\d+(?:\.\d+)?)\s*g/i,
    /of which saturates?[:\s*]*(\d+(?:\.\d+)?)/i,
    /sat\.?\s*fat[:\s*]*(\d+(?:\.\d+)?)/i,
    /\*\*saturated fat\*\*[:\s]*(\d+(?:\.\d+)?)/i,
  ],
  
  // Salt/Sodium patterns (sodium in mg, salt in g)
  salt: [
    /salt[:\s*]*(\d+(?:\.\d+)?)\s*g/i,
    /sodium[:\s*]*(\d+(?:\.\d+)?)\s*mg/i, // Will need conversion
    /\*\*salt\*\*[:\s]*(\d+(?:\.\d+)?)/i,
    /\*\*sodium\*\*[:\s]*(\d+(?:\.\d+)?)/i,
  ],
  
  // Fiber patterns
  fiber: [
    /fiber[:\s*]*(\d+(?:\.\d+)?)\s*g/i,
    /fibre[:\s*]*(\d+(?:\.\d+)?)\s*g/i,
    /dietary fiber[:\s*]*(\d+(?:\.\d+)?)/i,
    /\*\*fiber\*\*[:\s]*(\d+(?:\.\d+)?)/i,
  ],
  
  // Serving size patterns
  servingSize: [
    /serving size[:\s*]*(\d+(?:\.\d+)?)\s*g/i,
    /portion[:\s*]*(\d+(?:\.\d+)?)\s*g/i,
    /per (\d+(?:\.\d+)?)\s*g/i,
    /serving[:\s*]*(\d+(?:\.\d+)?)\s*g/i,
  ],
};

/**
 * Extract a numeric value using multiple patterns
 */
function extractValue(text: string, patterns: RegExp[]): number | undefined {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const value = parseFloat(match[1]);
      if (!isNaN(value) && value >= 0) {
        return value;
      }
    }
  }
  return undefined;
}

/**
 * Parse nutrition label text and extract nutrition data
 * 
 * @param ocrText - Raw text from OCR
 * @returns Parsed nutrition data (values per 100g if possible)
 */
export function parseNutritionLabel(ocrText: string): Partial<NutritionData> {
  // Normalize text: remove extra whitespace, handle common OCR errors
  const normalizedText = ocrText
    .replace(/\s+/g, ' ')
    .replace(/[oO]g/g, '0g')  // Common OCR error: O instead of 0
    .replace(/[lI]g/g, '1g')  // Common OCR error: l or I instead of 1
    .toLowerCase();

  const result: Partial<NutritionData> = {};

  // Extract each nutrition value
  const calories = extractValue(normalizedText, PATTERNS.calories);
  if (calories !== undefined) {
    result.calories_100g = calories;
  }

  const sugar = extractValue(normalizedText, PATTERNS.sugar);
  if (sugar !== undefined) {
    result.sugar_100g = sugar;
  }

  const protein = extractValue(normalizedText, PATTERNS.protein);
  if (protein !== undefined) {
    result.protein_100g = protein;
  }

  const carbs = extractValue(normalizedText, PATTERNS.carbs);
  if (carbs !== undefined) {
    result.carbs_100g = carbs;
  }

  const saturatedFat = extractValue(normalizedText, PATTERNS.saturatedFat);
  if (saturatedFat !== undefined) {
    result.saturated_fat_100g = saturatedFat;
  }

  // Salt: handle sodium (mg) to salt (g) conversion
  // Salt (g) = Sodium (mg) × 2.5 / 1000
  const saltPatterns = PATTERNS.salt;
  let salt = extractValue(normalizedText, [saltPatterns[0]]); // Try salt in g first
  if (salt === undefined) {
    const sodium = extractValue(normalizedText, [saltPatterns[1]]); // Try sodium in mg
    if (sodium !== undefined) {
      salt = Math.round((sodium * 2.5 / 1000) * 100) / 100; // Convert to g
    }
  }
  if (salt !== undefined) {
    result.salt_100g = salt;
  }

  const fiber = extractValue(normalizedText, PATTERNS.fiber);
  if (fiber !== undefined) {
    result.fiber_100g = fiber;
  }

  const servingSize = extractValue(normalizedText, PATTERNS.servingSize);
  if (servingSize !== undefined) {
    result.serving_size_g = servingSize;
  }

  // Mark as user-edited since this is user-contributed data
  if (Object.keys(result).length > 0) {
    result.isUserEdited = true;
  }

  return result;
}

/**
 * Check if parsed nutrition data is useful (has at least calories)
 */
export function hasUsefulNutrition(nutrition: Partial<NutritionData>): boolean {
  return nutrition.calories_100g !== undefined && nutrition.calories_100g > 0;
}

/**
 * Calculate confidence score for parsed nutrition (0-100)
 * Based on how many fields were successfully extracted
 */
export function calculateConfidence(nutrition: Partial<NutritionData>): number {
  const fields = [
    'calories_100g',
    'sugar_100g',
    'protein_100g',
    'carbs_100g',
    'saturated_fat_100g',
    'salt_100g',
  ];
  
  let found = 0;
  for (const field of fields) {
    if (nutrition[field as keyof NutritionData] !== undefined) {
      found++;
    }
  }
  
  return Math.round((found / fields.length) * 100);
}

/**
 * Format parsed nutrition for display
 */
export function formatParsedNutrition(nutrition: Partial<NutritionData>): string {
  const lines: string[] = [];
  
  if (nutrition.calories_100g !== undefined) {
    lines.push(`🔥 Calories: ${nutrition.calories_100g} kcal`);
  }
  if (nutrition.sugar_100g !== undefined) {
    lines.push(`🍬 Sugar: ${nutrition.sugar_100g}g`);
  }
  if (nutrition.protein_100g !== undefined) {
    lines.push(`💪 Protein: ${nutrition.protein_100g}g`);
  }
  if (nutrition.carbs_100g !== undefined) {
    lines.push(`🍞 Carbs: ${nutrition.carbs_100g}g`);
  }
  if (nutrition.saturated_fat_100g !== undefined) {
    lines.push(`🧈 Sat. Fat: ${nutrition.saturated_fat_100g}g`);
  }
  if (nutrition.salt_100g !== undefined) {
    lines.push(`🧂 Salt: ${nutrition.salt_100g}g`);
  }
  
  return lines.join('\n');
}

