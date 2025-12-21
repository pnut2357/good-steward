import { File } from 'expo-file-system';
import { Platform } from 'react-native';

/**
 * OCR Service for text recognition from images
 * 
 * Primary: @react-native-ml-kit/text-recognition for on-device OCR (requires dev build)
 * Fallback: Groq Vision AI for cloud-based OCR (works in Expo Go)
 */

// Dynamic import to prevent bundling errors
let TextRecognition: any = null;

/**
 * Recognized text block from OCR
 */
export interface TextBlock {
  text: string;
  confidence?: number;
}

/**
 * OCR Result
 */
export interface OCRResult {
  fullText: string;
  blocks: TextBlock[];
  productName?: string;
  ingredients?: string[];
  source?: 'mlkit' | 'groq-vision' | 'none';
}

/**
 * Singleton service for OCR operations
 */
export class OCRService {
  private static instance: OCRService | null = null;
  private isInitialized: boolean = false;
  private mlKitAvailable: boolean = false;

  private constructor() {
    this.initialize();
  }

  /**
   * Initialize ML Kit (lazy loading)
   */
  private async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    if (Platform.OS === 'web') {
      console.log('⚠️ On-device OCR not available on web');
      this.isInitialized = true;
      this.mlKitAvailable = false;
      return;
    }

    try {
      // Dynamic import to prevent bundling issues
      TextRecognition = require('@react-native-ml-kit/text-recognition').default;
      this.mlKitAvailable = true;
      console.log('✅ ML Kit Text Recognition initialized');
    } catch (error) {
      console.log('⚠️ ML Kit not available - will use Groq Vision fallback');
      this.mlKitAvailable = false;
    }
    
    this.isInitialized = true;
  }

  public static getInstance(): OCRService {
    if (!OCRService.instance) {
      OCRService.instance = new OCRService();
    }
    return OCRService.instance;
  }

  /**
   * Check if on-device OCR is available
   */
  public async checkAvailability(): Promise<boolean> {
    await this.initialize();
    return this.mlKitAvailable;
  }

  /**
   * Recognize text from an image
   * Uses ML Kit if available, falls back to Groq Vision AI
   * 
   * @param imageUri - Local file URI of the image
   * @returns OCR result with extracted text
   */
  public async recognizeText(imageUri: string): Promise<OCRResult> {
    await this.initialize();
    
    // Try ML Kit first (faster, on-device, free)
    if (this.mlKitAvailable && TextRecognition) {
      const result = await this.recognizeWithMLKit(imageUri);
      if (result.fullText.length > 0) {
        return result;
      }
    }
    
    // Fall back to Groq Vision AI (cloud-based, works in Expo Go)
    console.log('🤖 Using Groq Vision AI for OCR...');
    return this.recognizeWithCloudOCR(imageUri);
  }

  /**
   * Recognize text using ML Kit (on-device)
   */
  private async recognizeWithMLKit(imageUri: string): Promise<OCRResult> {
    try {
      console.log('📝 Starting ML Kit OCR...');
      const startTime = Date.now();
      
      const result = await TextRecognition.recognize(imageUri);
      
      const elapsed = Date.now() - startTime;
      console.log(`📝 ML Kit OCR completed in ${elapsed}ms`);
      
      const blocks: TextBlock[] = result.blocks?.map((block: any) => ({
        text: block.text,
        confidence: block.recognizedLanguages?.[0]?.confidence,
      })) || [];
      
      const fullText = blocks.map(b => b.text).join('\n');
      
      console.log(`📝 Extracted ${fullText.length} characters from ${blocks.length} blocks`);
      
      const productInfo = this.extractProductInfo(fullText);
      
      return {
        fullText,
        blocks,
        productName: productInfo.productName,
        ingredients: productInfo.ingredients,
        source: 'mlkit',
      };
    } catch (error: any) {
      const errorMsg = error?.message || '';
      
      if (errorMsg.includes("doesn't seem to be linked") || 
          errorMsg.includes('not using Expo managed workflow')) {
        console.log('⚠️ ML Kit not linked - need development build');
        this.mlKitAvailable = false;
      } else {
        console.error('❌ ML Kit OCR error:', errorMsg);
      }
      
      return {
        fullText: '',
        blocks: [],
        source: 'none',
      };
    }
  }

  /**
   * Recognize text using OCR.space API (cloud-based fallback)
   * Free tier: 25,000 requests/month
   * This works in Expo Go without a development build
   */
  private async recognizeWithCloudOCR(imageUri: string): Promise<OCRResult> {
    try {
      console.log('🌐 Reading image for Cloud OCR...');
      
      // Read image as base64 using new Expo SDK 54 File API
      const file = new File(imageUri);
      const base64 = await file.base64();
      
      // Determine image type from URI
      const isJpeg = imageUri.toLowerCase().includes('.jpg') || imageUri.toLowerCase().includes('.jpeg');
      const fileType = isJpeg ? 'JPG' : 'PNG';
      
      console.log('🌐 Sending to OCR.space API...');
      const startTime = Date.now();
      
      // OCR.space API - free tier with demo key
      // Get your own free key at https://ocr.space/ocrapi for higher limits
      const formData = new FormData();
      formData.append('base64Image', `data:image/${fileType.toLowerCase()};base64,${base64}`);
      formData.append('language', 'eng');
      formData.append('isOverlayRequired', 'false');
      formData.append('detectOrientation', 'true');
      formData.append('scale', 'true');
      formData.append('OCREngine', '2'); // Engine 2 is better for receipts/labels
      
      const response = await fetch('https://api.ocr.space/parse/image', {
        method: 'POST',
        headers: {
          'apikey': 'K85858573088957', // Free demo API key
        },
        body: formData,
      });

      const elapsed = Date.now() - startTime;
      console.log(`🌐 OCR.space completed in ${elapsed}ms`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('OCR.space API error:', response.status, errorText);
        throw new Error(`OCR.space API error: ${response.status}`);
      }

      const data = await response.json();
      
      // Check for API-level errors
      if (data.IsErroredOnProcessing) {
        console.error('OCR.space processing error:', data.ErrorMessage);
        throw new Error(data.ErrorMessage?.[0] || 'OCR processing failed');
      }
      
      // Extract text from all parsed results
      const parsedResults = data.ParsedResults || [];
      const fullText = parsedResults
        .map((result: any) => result.ParsedText || '')
        .join('\n')
        .trim();
      
      console.log(`🌐 Extracted ${fullText.length} characters via OCR.space`);
      if (fullText.length > 0) {
        console.log('📝 Extracted text preview:', fullText.substring(0, 300) + '...');
      }
      
      const productInfo = this.extractProductInfo(fullText);
      
      return {
        fullText,
        blocks: [{ text: fullText }],
        productName: productInfo.productName,
        ingredients: productInfo.ingredients,
        source: 'groq-vision', // Keep same source identifier for UI compatibility
      };
    } catch (error: any) {
      console.error('❌ Cloud OCR error:', error.message);
      return {
        fullText: '',
        blocks: [],
        source: 'none',
      };
    }
  }

  /**
   * Extract product name and ingredients from OCR text
   */
  private extractProductInfo(text: string): { productName?: string; ingredients?: string[] } {
    const lines = text.split('\n').filter(l => l.trim().length > 0);
    
    if (lines.length === 0) {
      return {};
    }
    
    // Product name is usually in the first few lines (larger text)
    let productName: string | undefined;
    const firstLines = lines.slice(0, 3);
    for (const line of firstLines) {
      // Skip lines that look like ingredients or nutrition info
      if (line.toLowerCase().includes('ingredient') ||
          line.toLowerCase().includes('nutrition') ||
          line.toLowerCase().includes('per 100g') ||
          line.length < 3) {
        continue;
      }
      productName = line.trim();
      break;
    }
    
    // Look for ingredients section
    let ingredients: string[] | undefined;
    const textLower = text.toLowerCase();
    
    // Find the start of ingredients
    const ingredientMarkers = ['ingredients:', 'ingredients', 'ingrédients:', 'ingrédients', 'contains:'];
    let ingredientStart = -1;
    
    for (const marker of ingredientMarkers) {
      const idx = textLower.indexOf(marker);
      if (idx !== -1) {
        ingredientStart = idx + marker.length;
        break;
      }
    }
    
    if (ingredientStart !== -1) {
      let ingredientText = text.substring(ingredientStart);
      
      const endMarkers = ['nutrition', 'per 100g', 'allergens:', 'storage:', 'best before', 'use by'];
      for (const marker of endMarkers) {
        const idx = ingredientText.toLowerCase().indexOf(marker);
        if (idx !== -1) {
          ingredientText = ingredientText.substring(0, idx);
          break;
        }
      }
      
      ingredients = ingredientText
        .replace(/\n/g, ' ')
        .split(/[,;]/)
        .map(i => i.trim())
        .filter(i => i.length > 1 && i.length < 50);
    }
    
    return { productName, ingredients };
  }

  /**
   * Extract search terms from OCR result for OpenFoodFacts search
   */
  public getSearchTerms(ocrResult: OCRResult): string[] {
    const terms: string[] = [];
    
    if (ocrResult.productName) {
      terms.push(ocrResult.productName);
    }
    
    const firstBlocks = ocrResult.blocks.slice(0, 3);
    for (const block of firstBlocks) {
      const text = block.text.trim();
      if (text.length >= 3 && text.length <= 50) {
        terms.push(text);
      }
    }
    
    const uniqueTerms = [...new Set(terms)].slice(0, 5);
    
    return uniqueTerms;
  }
}

export const ocrService = OCRService.getInstance();
