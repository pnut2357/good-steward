/**
 * Food Recognition Service
 * 
 * Uses TensorFlow Lite on-device model to identify food from photos.
 * Based on the Food-101 dataset with 101 food categories.
 * 
 * Requirements:
 * - react-native-fast-tflite
 * - Development build (not Expo Go)
 * - Model file: assets/models/food_v1.tflite
 */

import { FOOD_101_LABELS, getDisplayName, getLabelFromIndex } from '../data/food101Labels';
import { FOOD_101_NUTRITION, FoodNutrition, getNutritionById } from '../data/food101Nutrition';

// Note: TFLite import will fail in Expo Go - that's expected
let TensorFlowLite: any = null;
try {
  // Dynamic import to prevent crash in Expo Go
  TensorFlowLite = require('react-native-fast-tflite').TensorFlowLite;
} catch (error) {
  console.warn('⚠️ react-native-fast-tflite not available - food recognition requires dev build');
}

export interface FoodRecognitionResult {
  foodId: string;
  displayName: string;
  confidence: number;
  nutrition: FoodNutrition | null;
  alternates: Array<{
    foodId: string;
    displayName: string;
    confidence: number;
  }>;
}

/**
 * Food Recognition Service (Singleton)
 * 
 * Handles on-device food recognition using TFLite
 */
class FoodRecognitionServiceClass {
  private static instance: FoodRecognitionServiceClass;
  private model: any = null;
  private isLoading: boolean = false;
  private isAvailable: boolean = false;

  private constructor() {
    // Check if TFLite is available
    this.isAvailable = TensorFlowLite !== null;
  }

  public static getInstance(): FoodRecognitionServiceClass {
    if (!FoodRecognitionServiceClass.instance) {
      FoodRecognitionServiceClass.instance = new FoodRecognitionServiceClass();
    }
    return FoodRecognitionServiceClass.instance;
  }

  /**
   * Check if food recognition is available
   * Returns false in Expo Go
   */
  public checkAvailability(): boolean {
    return this.isAvailable;
  }

  /**
   * Load the TFLite model
   * Must be called before recognizeFood()
   */
  public async loadModel(): Promise<boolean> {
    if (!this.isAvailable) {
      console.warn('⚠️ Food recognition not available - requires dev build');
      return false;
    }

    if (this.model) {
      console.log('✅ Food model already loaded');
      return true;
    }

    if (this.isLoading) {
      console.log('⏳ Model already loading...');
      return false;
    }

    try {
      this.isLoading = true;
      console.log('📦 Loading Food-101 TFLite model...');

      // Load the model from assets
      // Note: The model file must exist at this path
      this.model = await TensorFlowLite.loadModelFromAsset('models/food_v1.tflite');

      console.log('✅ Food model loaded successfully');
      this.isLoading = false;
      return true;
    } catch (error: any) {
      console.error('❌ Failed to load food model:', error.message);
      this.isLoading = false;
      return false;
    }
  }

  /**
   * Recognize food from an image
   * 
   * @param imageUri - URI of the image to analyze
   * @returns Recognition result with confidence and nutrition
   */
  public async recognizeFood(imageUri: string): Promise<FoodRecognitionResult | null> {
    if (!this.isAvailable) {
      console.warn('⚠️ Food recognition not available');
      return null;
    }

    if (!this.model) {
      const loaded = await this.loadModel();
      if (!loaded) {
        return null;
      }
    }

    try {
      console.log('🔍 Analyzing food image...');

      // Run inference on the image
      // The model expects 224x224 RGB image
      const output = await this.model.run(imageUri);

      // Output is an array of 101 probabilities
      const probabilities: number[] = Array.from(output[0]);

      // Find top predictions
      const indexed = probabilities.map((prob, idx) => ({ prob, idx }));
      indexed.sort((a, b) => b.prob - a.prob);

      const top = indexed[0];
      const topLabel = getLabelFromIndex(top.idx);

      if (!topLabel) {
        console.warn('⚠️ Unknown food label index:', top.idx);
        return null;
      }

      // Get alternates (top 3)
      const alternates = indexed.slice(1, 4).map(item => {
        const label = getLabelFromIndex(item.idx);
        return {
          foodId: label || 'unknown',
          displayName: label ? getDisplayName(label) : 'Unknown',
          confidence: Math.round(item.prob * 100),
        };
      });

      const result: FoodRecognitionResult = {
        foodId: topLabel,
        displayName: getDisplayName(topLabel),
        confidence: Math.round(top.prob * 100),
        nutrition: getNutritionById(topLabel) || null,
        alternates,
      };

      console.log(`✅ Identified: ${result.displayName} (${result.confidence}%)`);
      return result;
    } catch (error: any) {
      console.error('❌ Food recognition failed:', error.message);
      return null;
    }
  }

  /**
   * Search foods by name (for manual selection fallback)
   */
  public searchFoods(query: string): Array<{ id: string; name: string; nutrition: FoodNutrition }> {
    const lowerQuery = query.toLowerCase();
    
    return Object.values(FOOD_101_NUTRITION)
      .filter(food => 
        food.name.toLowerCase().includes(lowerQuery) ||
        food.id.toLowerCase().includes(lowerQuery)
      )
      .slice(0, 10)
      .map(food => ({
        id: food.id,
        name: food.name,
        nutrition: food,
      }));
  }

  /**
   * Get all available food categories
   */
  public getAllFoods(): Array<{ id: string; name: string }> {
    return FOOD_101_LABELS.map(id => ({
      id,
      name: getDisplayName(id),
    }));
  }

  /**
   * Get nutrition by food ID
   */
  public getNutrition(foodId: string): FoodNutrition | undefined {
    return getNutritionById(foodId);
  }

  /**
   * Check if model is loaded
   */
  public isModelLoaded(): boolean {
    return this.model !== null;
  }
}

// Export singleton instance
export const foodRecognitionService = FoodRecognitionServiceClass.getInstance();




