/**
 * Hybrid Food Recognition Service
 * 
 * Combines Vision LLM (primary) with TFLite (fallback) for best results.
 * 
 * Strategy:
 * 1. Online → Use Vision LLM (unlimited foods, mixed plates, portion estimation)
 * 2. Rate Limited → Fall back to TFLite or manual search
 * 3. Offline → Fall back to TFLite (101 categories, single food)
 * 4. Error → Show manual selection option
 * 
 * Benefits:
 * - Works in Expo Go (Vision LLM doesn't need native modules)
 * - Works offline with dev build (TFLite)
 * - Best accuracy when online
 * - Handles rate limits gracefully
 */

import * as Network from 'expo-network';
import { analyzeImageLocally, isLocalVisionReady, LocalVisionResult } from '../components/LocalVisionWebView';
import { FOOD_LABELS, getBasicNutrition } from '../data/foodLabels';
import { FoodRecognitionResult, foodRecognitionService } from './FoodRecognitionService';
import {
  checkApiUsage,
  checkVisionAvailability,
  FoodItem,
  recognizeFoodWithVision,
  VisionFoodResult
} from './VisionFoodService';

export type RecognitionMethod = 'vision_llm' | 'tflite' | 'local_blip' | 'manual';

/**
 * Service status information
 */
export interface ServiceStatus {
  visionLLM: {
    available: boolean;
    requestsUsed: number;
    requestsLimit: number;
    requestsRemaining: number;
    isRateLimited: boolean;
  };
  tflite: {
    available: boolean;
    categoryCount: number;
  };
  localBLIP: {
    available: boolean;
    modelDownloaded: boolean;
  };
  isOnline: boolean;
  recommendedMethod: RecognitionMethod;
}

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
 * Get detailed service status including rate limits
 */
export async function getServiceStatus(): Promise<ServiceStatus> {
  const [visionAvailable, networkState, apiUsage] = await Promise.all([
    checkVisionAvailability(),
    Network.getNetworkStateAsync().catch(() => ({ isConnected: false, isInternetReachable: false })),
    checkApiUsage().catch(() => ({ used: 0, limit: 50, remaining: 50, isLimited: false, message: '' })),
  ]);

  const tfliteAvailable = foodRecognitionService.checkAvailability();
  const isOnline = networkState.isConnected === true && networkState.isInternetReachable === true;

  // Determine recommended method
  let recommendedMethod: RecognitionMethod = 'manual';
  if (visionAvailable && isOnline && !apiUsage.isLimited) {
    recommendedMethod = 'vision_llm';
  } else if (tfliteAvailable) {
    recommendedMethod = 'tflite';
  }

  return {
    visionLLM: {
      available: visionAvailable && isOnline,
      requestsUsed: apiUsage.used,
      requestsLimit: apiUsage.limit,
      requestsRemaining: apiUsage.remaining,
      isRateLimited: apiUsage.isLimited,
    },
    tflite: {
      available: tfliteAvailable,
      categoryCount: tfliteAvailable ? 101 : 0,
    },
    localBLIP: {
      available: isLocalVisionReady(),
      modelDownloaded: isLocalVisionReady(),
    },
    isOnline,
    recommendedMethod,
  };
}

/**
 * Get user-friendly status message
 */
export async function getStatusMessage(): Promise<string> {
  const status = await getServiceStatus();

  if (status.visionLLM.available && !status.visionLLM.isRateLimited) {
    return `AI Vision ready (${status.visionLLM.requestsRemaining} scans left today)`;
  }

  if (status.visionLLM.isRateLimited) {
    return `Daily limit reached. Using ${status.tflite.available ? 'on-device AI' : 'manual search'}`;
  }

  if (status.tflite.available) {
    return 'Using on-device AI (101 food categories)';
  }

  return 'Manual food search only';
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
  
  const status = await getServiceStatus();
  console.log(`   Vision LLM: ${status.visionLLM.available ? '✅' : '❌'} (${status.visionLLM.requestsRemaining}/${status.visionLLM.requestsLimit} remaining)`);
  console.log(`   Local BLIP: ${status.localBLIP.available ? '✅' : '❌'} (WebView AI)`);
  console.log(`   TFLite: ${status.tflite.available ? '✅' : '❌'}`);
  console.log(`   Online: ${status.isOnline ? '✅' : '❌'}`);
  console.log(`   Recommended: ${status.recommendedMethod}`);

  let rateLimitError: string | null = null;

  // Strategy 1: Try Vision LLM if online and not rate limited (unless preferOffline)
  if (status.visionLLM.available && !status.visionLLM.isRateLimited && !preferOffline) {
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
      
      // Check if it's a rate limit error
      if (error.message.includes('Daily limit') || error.message.includes('Rate limit')) {
        rateLimitError = error.message;
        console.log('📊 Rate limited, falling back to TFLite...');
      }
      // Fall through to TFLite
    }
  } else if (status.visionLLM.isRateLimited) {
    rateLimitError = `Daily limit reached (${status.visionLLM.requestsUsed}/${status.visionLLM.requestsLimit}). Resets at midnight UTC.`;
  }

  // Strategy 2: Try Local BLIP (WebView) if available
  if (isLocalVisionReady()) {
    try {
      console.log('🖼️ Using Local BLIP (WebView)...');
      const localResult = await analyzeImageLocally(imageUri);
      
      if (localResult.success) {
        const result = convertLocalBLIPToHybrid(localResult);
        
        // Add rate limit info if applicable
        if (rateLimitError) {
          result.error = `(Cloud AI limited: ${rateLimitError})`;
        }
        
        console.log(`✅ Local BLIP identified: ${localResult.foodName}`);
        return result;
      } else {
        console.log('⚠️ Local BLIP failed:', localResult.error);
      }
    } catch (error: any) {
      console.warn('⚠️ Local BLIP failed:', error.message);
    }
  }

  // Strategy 3: Try TFLite if available (offline or Vision failed)
  if (status.tflite.available) {
    try {
      console.log('🧠 Using TFLite (fallback)...');
      const tfliteResult = await foodRecognitionService.recognizeFood(imageUri);
      
      if (tfliteResult && tfliteResult.confidence > 30) {
        const result = convertTfliteToHybrid(tfliteResult);
        
        // Add rate limit info if applicable
        if (rateLimitError) {
          result.error = `(AI Vision limited: ${rateLimitError})`;
        }
        
        return result;
      } else {
        console.log('⚠️ TFLite confidence too low');
      }
    } catch (error: any) {
      console.warn('⚠️ TFLite failed:', error.message);
    }
  }

  // Strategy 3: Return failure, suggest manual selection
  console.log('❌ All recognition methods failed');
  
  // Build helpful error message
  let errorMessage = 'Could not identify food.';
  
  if (rateLimitError) {
    errorMessage = rateLimitError + '\n\nUse manual food search below.';
  } else if (!status.isOnline) {
    errorMessage = 'No internet connection. Use manual food search or connect to internet.';
  } else if (!status.tflite.available) {
    errorMessage = 'AI not available. Try taking a clearer photo or use manual search.';
  } else {
    errorMessage = 'Could not identify this food. Try a clearer photo or use manual search.';
  }

  return {
    method: 'manual',
    success: false,
    productName: 'Unknown Food',
    confidence: 'low',
    isMultipleItems: false,
    error: errorMessage,
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
      sugar: item.sugar ?? undefined,
      fiber: item.fiber ?? undefined,
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
 * Convert Local BLIP result to hybrid format
 */
function convertLocalBLIPToHybrid(localResult: LocalVisionResult): HybridFoodResult {
  return {
    method: 'local_blip',
    success: true,
    productName: localResult.foodName,
    confidence: localResult.confidence >= 0.7 ? 'high' : localResult.confidence >= 0.4 ? 'medium' : 'low',
    calories: localResult.nutrition.calories,
    protein: localResult.nutrition.protein,
    carbs: localResult.nutrition.carbs,
    fat: localResult.nutrition.fat,
    servingSize: '100g (estimated)',
    servingGrams: 100,
    isMultipleItems: false,
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
    case 'local_blip':
      return 'Local AI';
    case 'manual':
      return 'Manual Selection';
    default:
      return 'Unknown';
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
 * Search foods from expanded label database (500+ foods)
 */
export function searchExpandedFoods(query: string): Array<{
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}> {
  const lower = query.toLowerCase();
  const matches = FOOD_LABELS
    .filter(label => label.toLowerCase().includes(lower))
    .slice(0, 20); // Limit to 20 results

  return matches.map((label, index) => {
    const nutrition = getBasicNutrition(label);
    return {
      id: `expanded_${index}`,
      name: label,
      calories: nutrition.calories,
      protein: nutrition.protein,
      carbs: nutrition.carbs,
      fat: nutrition.fat,
    };
  });
}

/**
 * Get all available food categories (from TFLite)
 */
export function getAllFoodCategories(): Array<{ id: string; name: string }> {
  return foodRecognitionService.getAllFoods();
}

/**
 * Get total number of searchable foods
 */
export function getTotalFoodCount(): number {
  return FOOD_LABELS.length + 101; // Expanded labels + Food-101
}

