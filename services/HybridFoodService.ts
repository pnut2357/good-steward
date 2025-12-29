/**
 * Hybrid Food Recognition Service
 * 
 * Combines Vision LLM (primary) with TFLite (fallback) for best results.
 * 
 * Strategy:
 * 1. Online → Use Vision LLM (unlimited foods, mixed plates, portion estimation)
 * 2. Offline → Fall back to TFLite (101 categories, single food)
 * 3. Error → Show manual selection option
 * 
 * Benefits:
 * - Works in Expo Go (Vision LLM doesn't need native modules)
 * - Works offline with dev build (TFLite)
 * - Best accuracy when online
 */

import * as Network from 'expo-network';
import { FoodRecognitionResult, foodRecognitionService } from './FoodRecognitionService';
import {
  checkVisionAvailability,
  FoodItem,
  recognizeFoodWithVision,
  VisionFoodResult
} from './VisionFoodService';

export type RecognitionMethod = 'vision_llm' | 'tflite' | 'manual';

export interface HybridFoodResult {
  method: RecognitionMethod;
  success: boolean;
  
  // Common fields
  productName: string;
  confidence: 'high' | 'medium' | 'low';
  
  // Nutrition (per serving or per 100g depending on source)
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  sugar?: number;
  fiber?: number;
  
  // Serving info
  servingSize?: string;
  servingGrams?: number;
  
  // For mixed plates (Vision LLM only)
  items?: FoodItem[];
  isMultipleItems: boolean;
  
  // Original results for detailed display
  visionResult?: VisionFoodResult;
  tfliteResult?: FoodRecognitionResult;
  
  // Error info
  error?: string;
}

/**
 * Check what recognition methods are available
 */
export async function checkAvailableMethods(): Promise<{
  visionLLM: boolean;
  tflite: boolean;
  isOnline: boolean;
}> {
  const [visionAvailable, networkState] = await Promise.all([
    checkVisionAvailability(),
    Network.getNetworkStateAsync().catch(() => ({ isConnected: false, isInternetReachable: false })),
  ]);

  const tfliteAvailable = foodRecognitionService.checkAvailability();
  const isOnline = networkState.isConnected === true && networkState.isInternetReachable === true;

  return {
    visionLLM: visionAvailable && isOnline,
    tflite: tfliteAvailable,
    isOnline,
  };
}

/**
 * Recognize food using the best available method
 * 
 * @param imageUri - Local URI of the food image
 * @param preferOffline - Force TFLite even when online (for testing)
 * @returns Recognition result with food info
 */
export async function recognizeFood(
  imageUri: string,
  preferOffline: boolean = false
): Promise<HybridFoodResult> {
  console.log('🍽️ Starting hybrid food recognition...');
  
  const methods = await checkAvailableMethods();
  console.log(`   Vision LLM: ${methods.visionLLM ? '✅' : '❌'}`);
  console.log(`   TFLite: ${methods.tflite ? '✅' : '❌'}`);
  console.log(`   Online: ${methods.isOnline ? '✅' : '❌'}`);

  // Strategy 1: Try Vision LLM if online (unless preferOffline)
  if (methods.visionLLM && !preferOffline) {
    try {
      console.log('🤖 Using Vision LLM (primary)...');
      const visionResult = await recognizeFoodWithVision(imageUri);
      
      if (visionResult.items.length > 0) {
        return convertVisionToHybrid(visionResult);
      } else {
        console.log('⚠️ Vision LLM could not identify food, trying TFLite...');
      }
    } catch (error: any) {
      console.warn('⚠️ Vision LLM failed:', error.message);
      // Fall through to TFLite
    }
  }

  // Strategy 2: Try TFLite if available (offline or Vision failed)
  if (methods.tflite) {
    try {
      console.log('🧠 Using TFLite (fallback)...');
      const tfliteResult = await foodRecognitionService.recognizeFood(imageUri);
      
      if (tfliteResult && tfliteResult.confidence > 30) {
        return convertTfliteToHybrid(tfliteResult);
      } else {
        console.log('⚠️ TFLite confidence too low');
      }
    } catch (error: any) {
      console.warn('⚠️ TFLite failed:', error.message);
    }
  }

  // Strategy 3: Return failure, suggest manual selection
  console.log('❌ All recognition methods failed');
  return {
    method: 'manual',
    success: false,
    productName: 'Unknown Food',
    confidence: 'low',
    isMultipleItems: false,
    error: methods.isOnline 
      ? 'Could not identify food. Try taking a clearer photo or select manually.'
      : 'Offline and TFLite unavailable. Connect to internet or use manual selection.',
  };
}

/**
 * Convert Vision LLM result to hybrid format
 */
function convertVisionToHybrid(visionResult: VisionFoodResult): HybridFoodResult {
  if (visionResult.items.length === 0) {
    return {
      method: 'vision_llm',
      success: false,
      productName: 'Unknown Food',
      confidence: 'low',
      isMultipleItems: false,
      visionResult,
      error: 'Could not identify food in image',
    };
  }

  // Single item
  if (visionResult.items.length === 1) {
    const item = visionResult.items[0];
    return {
      method: 'vision_llm',
      success: true,
      productName: item.name,
      confidence: visionResult.confidence,
      calories: item.calories,
      protein: item.protein,
      carbs: item.carbs,
      fat: item.fat,
      sugar: item.sugar,
      fiber: item.fiber,
      servingSize: item.portion_description,
      servingGrams: item.portion_g,
      isMultipleItems: false,
      visionResult,
    };
  }

  // Multiple items (mixed plate)
  const names = visionResult.items.map(i => i.name);
  const totalGrams = visionResult.items.reduce((sum, i) => sum + i.portion_g, 0);
  
  return {
    method: 'vision_llm',
    success: true,
    productName: names.join(' + '),
    confidence: visionResult.confidence,
    calories: visionResult.totalCalories,
    protein: visionResult.totalProtein,
    carbs: visionResult.totalCarbs,
    fat: visionResult.totalFat,
    servingSize: `Combined (~${totalGrams}g)`,
    servingGrams: totalGrams,
    items: visionResult.items,
    isMultipleItems: true,
    visionResult,
  };
}

/**
 * Convert TFLite result to hybrid format
 */
function convertTfliteToHybrid(tfliteResult: FoodRecognitionResult): HybridFoodResult {
  const nutrition = tfliteResult.nutrition;
  
  return {
    method: 'tflite',
    success: true,
    productName: tfliteResult.displayName,
    confidence: tfliteResult.confidence >= 70 ? 'high' : tfliteResult.confidence >= 50 ? 'medium' : 'low',
    calories: nutrition?.calories_100g,
    protein: nutrition?.protein_100g,
    carbs: nutrition?.carbs_100g,
    fat: nutrition?.fat_100g,
    sugar: nutrition?.sugar_100g,
    fiber: nutrition?.fiber_100g,
    servingSize: nutrition ? `${nutrition.serving_g}g (typical serving)` : undefined,
    servingGrams: nutrition?.serving_g,
    isMultipleItems: false,
    tfliteResult,
  };
}

/**
 * Get human-readable method name
 */
export function getMethodDisplayName(method: RecognitionMethod): string {
  switch (method) {
    case 'vision_llm':
      return 'AI Vision';
    case 'tflite':
      return 'On-Device AI';
    case 'manual':
      return 'Manual Selection';
  }
}

/**
 * Search foods manually (from TFLite database)
 */
export function searchFoods(query: string): Array<{ id: string; name: string; calories?: number }> {
  const tfliteResults = foodRecognitionService.searchFoods(query);
  return tfliteResults.map(r => ({
    id: r.id,
    name: r.name,
    calories: r.nutrition.calories_100g,
  }));
}

/**
 * Get all available food categories (from TFLite)
 */
export function getAllFoodCategories(): Array<{ id: string; name: string }> {
  return foodRecognitionService.getAllFoods();
}

