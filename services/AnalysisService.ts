import axios from 'axios';
import * as ImageManipulator from 'expo-image-manipulator';
import Groq from 'groq-sdk';
import { NutritionData, ScanResult, createPhotoId } from '../models/ScanResult';
import { ocrService } from './OCRService';

// OpenFoodFacts API types
interface OFFProduct {
  code?: string;  // Barcode
  product_name?: string;
  product_name_en?: string;
  brands?: string;
  ingredients_text?: string;
  ingredients_text_en?: string;
  nutriscore_grade?: string;
  nova_group?: number;
  nutriments?: {
    sugars_100g?: number;
    salt_100g?: number;
    'saturated-fat_100g'?: number;
    'energy-kcal_100g'?: number;
    carbohydrates_100g?: number;
    proteins_100g?: number;
    fiber_100g?: number;
  };
  allergens_tags?: string[];
  traces_tags?: string[];
  additives_tags?: string[];
}

interface OFFResponse {
  status: number;
  status_verbose: string;
  product?: OFFProduct;
}

interface OFFSearchResponse {
  count: number;
  products: OFFProduct[];
}

// Configuration
const FETCH_TIMEOUT = 15000;  // Increased from 5s to 15s for slower connections
const AI_TIMEOUT = 10000;
const MAX_IMAGE_SIZE = 800;  // Higher res for OCR
const IMAGE_QUALITY = 0.8;   // Better quality for OCR

/**
 * Singleton class for product analysis
 * 
 * LEGAL: Returns factual data only, no health judgments.
 * All "isSafe" values are kept for backward compatibility but NOT displayed.
 * 
 * DATA SOURCES:
 * - Barcode → OpenFoodFacts (FREE, unlimited)
 * - Photo → ML Kit OCR + OpenFoodFacts Search (FREE)
 * - Text AI → Groq (FREE tier) - for factual summaries only
 */
export class AnalysisService {
  private groq: Groq | null = null;
  private static instance: AnalysisService | null = null;

  private constructor() {
    const apiKey = process.env.EXPO_PUBLIC_GROQ_API_KEY;
    
    if (apiKey && apiKey.startsWith('gsk_')) {
      try {
        this.groq = new Groq({
          apiKey,
          dangerouslyAllowBrowser: true,
          timeout: AI_TIMEOUT,
        });
        console.log('✅ Groq AI initialized');
      } catch (error) {
        console.error('❌ Failed to initialize Groq:', error);
      }
    } else {
      console.log('⚠️ Groq API key not configured - using basic summaries');
    }
  }

  public static getInstance(): AnalysisService {
    if (!AnalysisService.instance) {
      AnalysisService.instance = new AnalysisService();
    }
    return AnalysisService.instance;
  }

  // ============================================
  // BARCODE ANALYSIS (OpenFoodFacts)
  // ============================================

  private async fetchProduct(barcode: string): Promise<OFFProduct | null> {
    // Try OpenFoodFacts first (global database)
    try {
      console.log(`🔍 Searching OpenFoodFacts for: ${barcode}`);
      const url = `https://world.openfoodfacts.org/api/v2/product/${barcode}.json`;
      const { data } = await axios.get<OFFResponse>(url, {
        headers: { 'User-Agent': 'GoodSteward/1.0' },
        timeout: FETCH_TIMEOUT
      });

      if (data.status === 1 && data.product?.product_name) {
        console.log(`✅ Found in OpenFoodFacts: ${data.product.product_name}`);
        return data.product;
      }
    } catch (error) {
      console.log('OpenFoodFacts lookup failed, trying USDA...');
    }

    // Fallback: Try USDA FoodData Central (great for US products)
    try {
      console.log(`🔍 Searching USDA FoodData Central for: ${barcode}`);
      const usdaProduct = await this.fetchFromUSDA(barcode);
      if (usdaProduct) {
        return usdaProduct;
      }
    } catch (error) {
      console.log('USDA lookup failed');
    }

    console.log('❌ Product not found in any database');
    return null;
  }

  /**
   * Fetch product from USDA FoodData Central (FREE, no API key needed for basic search)
   * Great for US products including store brands
   */
  private async fetchFromUSDA(barcode: string): Promise<OFFProduct | null> {
    try {
      // USDA FoodData Central search by GTIN/UPC
      const url = `https://api.nal.usda.gov/fdc/v1/foods/search?query=${barcode}&dataType=Branded&pageSize=1&api_key=DEMO_KEY`;
      
      const { data } = await axios.get(url, { timeout: FETCH_TIMEOUT });
      
      if (!data.foods || data.foods.length === 0) {
        return null;
      }

      const food = data.foods[0];
      console.log(`✅ Found in USDA: ${food.description}`);
      
      // Convert USDA format to OpenFoodFacts-like format
      const nutrients: Record<string, number> = {};
      
      if (food.foodNutrients) {
        for (const nutrient of food.foodNutrients) {
          // Convert per serving to per 100g (approximate)
          const servingSize = food.servingSize || 100;
          const per100g = (nutrient.value / servingSize) * 100;
          
          switch (nutrient.nutrientName) {
            case 'Total Sugars':
              nutrients.sugars_100g = per100g;
              break;
            case 'Sodium, Na':
              nutrients.salt_100g = per100g / 400; // Convert mg sodium to g salt
              break;
            case 'Fatty acids, total saturated':
              nutrients['saturated-fat_100g'] = per100g;
              break;
            case 'Energy':
              nutrients['energy-kcal_100g'] = nutrient.unitName === 'KCAL' ? per100g : per100g / 4.184;
              break;
            case 'Carbohydrate, by difference':
              nutrients.carbohydrates_100g = per100g;
              break;
            case 'Protein':
              nutrients.proteins_100g = per100g;
              break;
            case 'Fiber, total dietary':
              nutrients.fiber_100g = per100g;
              break;
          }
        }
      }

      // Return in OpenFoodFacts-compatible format
      return {
        product_name: food.description,
        product_name_en: food.description,
        brands: food.brandOwner || food.brandName || 'Unknown Brand',
        ingredients_text: food.ingredients || '',
        ingredients_text_en: food.ingredients || '',
        nutriments: nutrients,
        allergens_tags: [], // USDA doesn't provide allergen tags in the same format
        traces_tags: [],
        // USDA doesn't provide Nutriscore/NOVA, we'll calculate below
      } as OFFProduct;
    } catch (error) {
      console.log('USDA API error:', error);
      return null;
    }
  }

  /**
   * Extract nutrition data from OpenFoodFacts product
   */
  private extractNutrition(product: OFFProduct): NutritionData {
    const nutrients = product.nutriments || {};
    
    return {
      nutriscore: product.nutriscore_grade?.toLowerCase(),
      nova: product.nova_group,
      sugar_100g: nutrients.sugars_100g,
      salt_100g: nutrients.salt_100g,
      saturated_fat_100g: nutrients['saturated-fat_100g'],
      calories_100g: nutrients['energy-kcal_100g'],
      carbs_100g: nutrients.carbohydrates_100g,
      protein_100g: nutrients.proteins_100g,
      fiber_100g: nutrients.fiber_100g,
    };
  }

  /**
   * Generate a FACTUAL summary (no health judgments)
   */
  private generateFactualSummary(product: OFFProduct): string {
    const parts: string[] = [];
    const nutrition = this.extractNutrition(product);
    
    // Nutriscore (official rating)
    if (nutrition.nutriscore) {
      parts.push(`Nutriscore ${nutrition.nutriscore.toUpperCase()}`);
    }
    
    // NOVA group (official classification)
    if (nutrition.nova) {
      const novaLabels: Record<number, string> = {
        1: 'unprocessed/minimally processed',
        2: 'processed culinary ingredients',
        3: 'processed foods',
        4: 'ultra-processed foods',
      };
      parts.push(`NOVA ${nutrition.nova} (${novaLabels[nutrition.nova] || ''})`);
    }
    
    // Key nutrition facts
    const facts: string[] = [];
    if (nutrition.sugar_100g !== undefined) {
      facts.push(`${nutrition.sugar_100g}g sugar`);
    }
    if (nutrition.salt_100g !== undefined) {
      facts.push(`${nutrition.salt_100g}g salt`);
    }
    if (nutrition.calories_100g !== undefined) {
      facts.push(`${nutrition.calories_100g} kcal`);
    }
    
    if (facts.length > 0) {
      parts.push(`Per 100g: ${facts.join(', ')}`);
    }
    
    // Allergen count
    const allergenCount = product.allergens_tags?.length || 0;
    if (allergenCount > 0) {
      parts.push(`Contains ${allergenCount} allergen(s)`);
    }
    
    return parts.length > 0 
      ? parts.join('. ') + '.'
      : 'Limited nutrition data available.';
  }

  /**
   * Use AI to generate a concise factual summary (optional enhancement)
   */
  private async generateAISummary(product: OFFProduct): Promise<string> {
    if (!this.groq) {
      return this.generateFactualSummary(product);
    }

    // LEGAL: Prompt asks for FACTS only, no recommendations
    const prompt = `Summarize this food product in 1-2 factual sentences. 
NO health advice, NO "good" or "bad" judgments, just facts.

Product: ${product.product_name || 'Unknown'}
Nutriscore: ${product.nutriscore_grade?.toUpperCase() || 'N/A'}
NOVA: ${product.nova_group || 'N/A'}
Sugar: ${product.nutriments?.sugars_100g || 'N/A'}g/100g
Ingredients: ${(product.ingredients_text || '').substring(0, 150)}

Respond with JSON: {"summary": "factual description"}`;

    try {
      const response = await this.groq.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model: 'llama-3.1-8b-instant',
        response_format: { type: 'json_object' },
        temperature: 0.1,
        max_tokens: 100
      });

      const content = response.choices[0]?.message?.content;
      if (!content) throw new Error('Empty response');

      const parsed = JSON.parse(content);
      return parsed.summary || this.generateFactualSummary(product);
    } catch (error) {
      console.log('⚠️ AI summary failed, using basic summary');
      return this.generateFactualSummary(product);
    }
  }

  /**
   * Analyze a barcode and return product information
   */
  public async analyzeBarcode(barcode: string): Promise<ScanResult | null> {
    const startTime = Date.now();
    console.log(`🔍 Analyzing barcode: ${barcode}`);
    
    try {
      const product = await this.fetchProduct(barcode);
      if (!product) return null;

      const nutrition = this.extractNutrition(product);
      const summary = await this.generateAISummary(product);
      
      console.log(`⚡ Analyzed in ${Date.now() - startTime}ms`);

      return {
        barcode,
        name: product.product_name || product.product_name_en || 'Unknown Product',
        brand: product.brands,
        ingredients: product.ingredients_text || product.ingredients_text_en || 'No ingredients listed',
        summary,
        nutrition,
        allergens: product.allergens_tags,
        traces: product.traces_tags,
        // DEPRECATED: isSafe kept for DB compatibility, but not used in UI
        isSafe: true,
        timestamp: new Date().toISOString(),
        source: 'barcode',
        dataSource: 'OpenFoodFacts.org',
      };
    } catch (error) {
      console.error('❌ Barcode analysis failed:', error);
      return null;
    }
  }

  // ============================================
  // PHOTO ANALYSIS (ML Kit OCR + Search)
  // ============================================

  /**
   * Optimize image for OCR (higher quality than before)
   */
  private async optimizeImageForOCR(uri: string): Promise<string> {
    try {
      const result = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: MAX_IMAGE_SIZE } }],
        { compress: IMAGE_QUALITY, format: ImageManipulator.SaveFormat.JPEG }
      );
      console.log('📸 Image optimized for OCR');
      return result.uri;
    } catch (error) {
      console.log('⚠️ Image optimization failed, using original');
      return uri;
    }
  }

  /**
   * Search OpenFoodFacts by product name
   */
  public async searchProducts(query: string, limit: number = 5): Promise<OFFProduct[]> {
    try {
      console.log(`🔍 Searching OpenFoodFacts for: "${query}"`);
      
      const url = `https://world.openfoodfacts.org/cgi/search.pl?` +
        `search_terms=${encodeURIComponent(query)}` +
        `&search_simple=1&action=process&json=1&page_size=${limit}`;
      
      const { data } = await axios.get<OFFSearchResponse>(url, {
        headers: { 'User-Agent': 'GoodSteward/1.0' },
        timeout: FETCH_TIMEOUT
      });
      
      console.log(`✅ Found ${data.products?.length || 0} products`);
      return data.products || [];
    } catch (error) {
      console.error('Search error:', error);
      return [];
    }
  }

  /**
   * Search products by text and return simplified results for UI
   * Used when barcode is not found - user can type product name
   */
  public async searchByText(query: string): Promise<Array<{
    barcode: string;
    name: string;
    brand?: string;
  }>> {
    // Search both OpenFoodFacts and USDA
    const results: Array<{ barcode: string; name: string; brand?: string }> = [];
    
    // OpenFoodFacts search
    try {
      const offProducts = await this.searchProducts(query, 8);
      for (const product of offProducts) {
        if (product.code && product.product_name) {
          results.push({
            barcode: product.code,
            name: product.product_name || product.product_name_en || 'Unknown',
            brand: product.brands,
          });
        }
      }
    } catch (error) {
      console.log('OpenFoodFacts text search failed');
    }

    // USDA search (for US products)
    try {
      const url = `https://api.nal.usda.gov/fdc/v1/foods/search?query=${encodeURIComponent(query)}&dataType=Branded&pageSize=5&api_key=DEMO_KEY`;
      const { data } = await axios.get(url, { timeout: FETCH_TIMEOUT });
      
      if (data.foods) {
        for (const food of data.foods) {
          // Use GTIN/UPC if available, otherwise use FDC ID
          const barcode = food.gtinUpc || `USDA-${food.fdcId}`;
          if (!results.find(r => r.barcode === barcode)) {
            results.push({
              barcode,
              name: food.description,
              brand: food.brandOwner || food.brandName,
            });
          }
        }
      }
    } catch (error) {
      console.log('USDA text search failed');
    }

    console.log(`🔍 Text search found ${results.length} total results`);
    return results.slice(0, 10); // Return top 10
  }

  /**
   * Analyze photo using OCR + OpenFoodFacts Search
   * 
   * Flow:
   * 1. Optimize image for OCR
   * 2. Run ML Kit OCR to extract text
   * 3. Extract product name / search terms
   * 4. Search OpenFoodFacts
   * 5. Return best match or OCR-only result
   */
  public async analyzePhoto(photoUri: string): Promise<ScanResult | null> {
    const startTime = Date.now();
    console.log('📸 Starting photo analysis with OCR...');

    try {
      // Step 1: Optimize image
      const optimizedUri = await this.optimizeImageForOCR(photoUri);
      
      // Step 2: Check if OCR is available
      const ocrAvailable = await ocrService.checkAvailability();
      
      if (!ocrAvailable) {
        console.log('⚠️ OCR not available - will show manual search');
        console.log('   To enable auto OCR, create a development build');
        // Return null to trigger manual search modal in UI
        return null;
      }

      // Step 3: Run OCR
      const ocrResult = await ocrService.recognizeText(optimizedUri);
      
      // Check if OCR is now unavailable (failed due to linking)
      const stillAvailable = await ocrService.checkAvailability();
      if (!stillAvailable) {
        console.log('⚠️ OCR became unavailable (likely running in Expo Go)');
        // Return null to trigger manual search modal in UI
        return null;
      }
      
      if (!ocrResult.fullText || ocrResult.fullText.length < 10) {
        console.log('⚠️ OCR found no readable text');
        // Return null to trigger manual search modal in UI
        return null;
      }

      console.log(`📝 OCR extracted: "${ocrResult.fullText.substring(0, 100)}..."`);

      // Step 4: Get search terms and search OpenFoodFacts
      const searchTerms = ocrService.getSearchTerms(ocrResult);
      let bestMatch: OFFProduct | null = null;
      
      for (const term of searchTerms) {
        if (term.length < 3) continue;
        
        const products = await this.searchProducts(term, 3);
        if (products.length > 0) {
          bestMatch = products[0];
          console.log(`✅ Found match: ${bestMatch.product_name}`);
          break;
        }
      }

      // Step 5: Return result
      const elapsed = Date.now() - startTime;
      console.log(`⚡ Photo analyzed in ${elapsed}ms`);

      if (bestMatch) {
        // Found a matching product in OpenFoodFacts
        const nutrition = this.extractNutrition(bestMatch);
        const summary = await this.generateAISummary(bestMatch);
        
        return {
          barcode: createPhotoId(),
          name: bestMatch.product_name || bestMatch.product_name_en || ocrResult.productName || 'Detected Product',
          brand: bestMatch.brands,
          ingredients: bestMatch.ingredients_text || bestMatch.ingredients_text_en || 
                       (ocrResult.ingredients?.join(', ') || 'See product label'),
          summary,
          nutrition,
          allergens: bestMatch.allergens_tags,
          traces: bestMatch.traces_tags,
          isSafe: true,
          timestamp: new Date().toISOString(),
          source: 'photo',
          photoUri: photoUri,
          dataSource: 'OpenFoodFacts.org (via OCR search)',
        };
      } else {
        // No match found - return OCR-only result
        return {
          barcode: createPhotoId(),
          name: ocrResult.productName || 'Detected Text',
          ingredients: ocrResult.ingredients?.join(', ') || 'See extracted text below',
          summary: `Text extracted from photo. Product not found in database. Extracted text: "${ocrResult.fullText.substring(0, 200)}${ocrResult.fullText.length > 200 ? '...' : ''}"`,
          isSafe: true,
          timestamp: new Date().toISOString(),
          source: 'photo',
          photoUri: photoUri,
          dataSource: 'ML Kit OCR (no database match)',
        };
      }
    } catch (error: any) {
      console.error('❌ Photo analysis error:', error?.message);
      
      return {
        barcode: createPhotoId(),
        name: 'Photo Captured',
        ingredients: 'Analysis failed',
        summary: `Error during photo analysis: ${error?.message || 'Unknown error'}. Try barcode scanning instead.`,
        isSafe: true,
        timestamp: new Date().toISOString(),
        source: 'photo',
        photoUri: photoUri,
        dataSource: 'Error',
      };
    }
  }

  /**
   * Check if OCR is available
   */
  public async isOCRAvailable(): Promise<boolean> {
    return ocrService.checkAvailability();
  }

  public isAIAvailable(): boolean {
    return this.groq !== null;
  }
}

export const analysisService = AnalysisService.getInstance();
