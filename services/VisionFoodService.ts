/**
 * Vision Food Service
 * 
 * Uses OpenRouter (Free Tier) to identify food from photos.
 * Hugging Face Free Tier is currently unreliable for Vision models (404/410 errors).
 * 
 * Features:
 * - Unlimited food categories (not limited to 101)
 * - Mixed plate support (burger + fries + salad)
 * - Portion estimation
 * - Nutrition estimation per item
 * 
 * Requirements:
 * - EXPO_PUBLIC_OPENROUTER_API_KEY (free tier)
 * - Internet connection
 */

import * as FileSystem from 'expo-file-system';
import * as Network from 'expo-network';

// Provider configurations
const PROVIDERS = {
  openrouter: {
    url: 'https://openrouter.ai/api/v1/chat/completions',
    // Using Google Gemini 2.0 Flash (Free) as it is more reliable than Llama 3.2 Vision on free tier
    model: 'google/gemini-2.0-flash-exp:free', 
    modelFast: 'google/gemini-2.0-flash-exp:free',
    keyEnv: 'EXPO_PUBLIC_OPENROUTER_API_KEY',
    type: 'chat' as const,
  },
};

export interface VisionServiceOptions {
  useFastModel?: boolean;
  maxTokens?: number;
  provider?: 'openrouter';
}

type ProviderName = 'openrouter';
type ProviderConfig = typeof PROVIDERS.openrouter;

export interface FoodItem {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  sugar?: number | null;
  fiber?: number | null;
  portion_g: number;
  portion_description: string;
}

export interface VisionFoodResult {
  items: FoodItem[];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  confidence: 'high' | 'medium' | 'low';
  description: string;
  isMultipleItems: boolean;
}

/**
 * Get the available provider (OpenRouter only)
 */
function getAvailableProvider(): { name: ProviderName; apiKey: string; config: ProviderConfig } | null {
  const openrouterKey = process.env.EXPO_PUBLIC_OPENROUTER_API_KEY;
  if (openrouterKey) {
    return { name: 'openrouter', apiKey: openrouterKey, config: PROVIDERS.openrouter };
  }
  return null;
}

/**
 * Check if Vision service is available
 */
export async function checkVisionAvailability(): Promise<boolean> {
  const provider = getAvailableProvider();
  if (!provider) {
    console.warn('⚠️ No OpenRouter API key set. Add EXPO_PUBLIC_OPENROUTER_API_KEY to .env');
    console.warn('   Get FREE key at: https://openrouter.ai');
    return false;
  }

  console.log(`✅ Vision provider available: ${provider.name}`);

  try {
    const networkState = await Network.getNetworkStateAsync();
    if (!networkState.isConnected || !networkState.isInternetReachable) {
      console.warn('⚠️ No internet connection - Vision unavailable');
      return false;
    }
    return true;
  } catch (error) {
    console.warn('⚠️ Could not check network state');
    return false;
  }
}

/**
 * Recognize food from an image using Vision API
 */
export async function recognizeFoodWithVision(
  imageUri: string,
  options: VisionServiceOptions = {}
): Promise<VisionFoodResult> {
  const provider = getAvailableProvider();
  
  if (!provider) {
    throw new Error('No Vision API key configured.\nAdd EXPO_PUBLIC_OPENROUTER_API_KEY to .env\nGet FREE key at: https://openrouter.ai');
  }

  console.log(`🔍 Analyzing food with ${provider.name}...`);
  const startTime = Date.now();

  try {
    // Read image as base64
    let base64: string;
    
    // Check if using new File API (Expo SDK 54+) or legacy
    if (FileSystem.File) {
      const file = new FileSystem.File(imageUri);
      base64 = await file.base64();
    } else {
      // Fallback for older SDK
      base64 = await FileSystem.readAsStringAsync(imageUri, {
        encoding: 'base64' as any,
      });
    }

    // Always use Chat API for OpenRouter
    const result = await recognizeWithChatAPI(base64, provider, options);
    
    const elapsed = Date.now() - startTime;
    console.log(`✅ ${provider.name} identified ${result.items.length} item(s) in ${elapsed}ms`);
    
    if (result.items.length > 0) {
      result.items.forEach(item => {
        console.log(`   - ${item.name}: ${item.calories} kcal (${item.portion_description || item.portion_g + 'g'})`);
      });
    }

    return result;

  } catch (error: any) {
    console.error('❌ Vision food recognition failed:', error.message);
    throw error;
  }
}

/**
 * Recognize food using OpenAI-compatible chat API (OpenRouter)
 */
async function recognizeWithChatAPI(
  base64: string, 
  provider: { name: ProviderName; apiKey: string; config: ProviderConfig },
  options: VisionServiceOptions
): Promise<VisionFoodResult> {
  const headers: Record<string, string> = {
    'Authorization': `Bearer ${provider.apiKey}`,
    'Content-Type': 'application/json',
    'HTTP-Referer': 'https://good-steward.app',
    'X-Title': 'Good Steward Food Scanner',
  };

  const promptText = `You are a nutrition expert. Analyze this food photo and identify ALL food items visible.

For each item, estimate:
- Name (be specific, e.g., "Pepperoni Pizza" not just "Pizza")
- Calories, protein, carbs, fat (in grams)
- Portion size in grams and description (e.g., "1 medium slice")

Return ONLY valid JSON in this exact format:
{
  "items": [
    {
      "name": "Food name",
      "calories": number,
      "protein": number,
      "carbs": number,
      "fat": number,
      "sugar": number or null,
      "fiber": number or null,
      "portion_g": number,
      "portion_description": "e.g., 1 slice, 1 cup"
    }
  ],
  "totalCalories": sum of all calories,
  "totalProtein": sum of all protein,
  "totalCarbs": sum of all carbs,
  "totalFat": sum of all fat,
  "confidence": "high" or "medium" or "low",
  "description": "Brief description of what you see",
  "isMultipleItems": true or false
}

If you cannot identify the food, return:
{
  "items": [],
  "totalCalories": 0,
  "totalProtein": 0,
  "totalCarbs": 0,
  "totalFat": 0,
  "confidence": "low",
  "description": "Could not identify food in image",
  "isMultipleItems": false
}`;

  const response = await fetch(provider.config.url, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model: provider.config.model,
      messages: [{
        role: 'user',
        content: [
          { type: 'text', text: promptText },
          { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${base64}` } },
        ],
      }],
      temperature: 0.1,
      max_tokens: options.maxTokens || 1000,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error(`❌ ${provider.name} API error:`, response.status, errorData);
    throw new Error(`Vision API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error('No response from Vision API');
  }

  // Parse JSON from response (handle markdown code blocks)
  let jsonStr = content;
  const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) {
    jsonStr = jsonMatch[1];
  } else {
    const rawMatch = content.match(/\{[\s\S]*\}/);
    if (rawMatch) {
      jsonStr = rawMatch[0];
    }
  }

  return JSON.parse(jsonStr);
}

/**
 * Quick check if the image contains food
 */
export async function isImageFood(imageUri: string): Promise<boolean> {
  const provider = getAvailableProvider();
  
  if (!provider) {
    return true; // Assume yes if no provider
  }

  try {
    let base64: string;
    if (FileSystem.File) {
      const file = new FileSystem.File(imageUri);
      base64 = await file.base64();
    } else {
      base64 = await FileSystem.readAsStringAsync(imageUri, {
        encoding: 'base64' as any,
      });
    }

    const headers: Record<string, string> = {
      'Authorization': `Bearer ${provider.apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://good-steward.app',
      'X-Title': 'Good Steward Food Scanner',
    };

    const response = await fetch(provider.config.url, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: provider.config.modelFast,
        messages: [{
          role: 'user',
          content: [
            { type: 'text', text: 'Does this image contain food? Reply with only "yes" or "no".' },
            { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${base64}` } },
          ],
        }],
        temperature: 0,
        max_tokens: 10,
      }),
    });

    if (!response.ok) return true; // Assume yes on error

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content?.toLowerCase() || '';
    return content.includes('yes');

  } catch (error) {
    console.warn('⚠️ Food detection check failed');
    return true; // Assume yes on error
  }
}

/**
 * Convert a VisionFoodResult to a ScanResult
 */
export function convertToScanResult(visionResult: VisionFoodResult, photoUri: string): any {
  // Take the first item or create a summary item
  const mainItem = visionResult.items[0];
  
  if (!mainItem) return null;

  return {
    id: Date.now().toString(),
    code: 'vision-' + Date.now(),
    name: visionResult.items.length > 1 
      ? `Mixed Plate: ${visionResult.description}`
      : mainItem.name,
    nutrition: {
      calories_100g: Math.round(visionResult.totalCalories), // Approximate as total for the plate
      protein_100g: Math.round(visionResult.totalProtein),
      carbs_100g: Math.round(visionResult.totalCarbs),
      fat_100g: Math.round(visionResult.totalFat),
      sugar_100g: 0,
      fiber_100g: 0,
      serving_size_g: 100, // Normalized
    },
    image_url: photoUri,
    source: 'photo',
    consumed: true, // Default to true for consumed items
    isUserEdited: true,
  };
}