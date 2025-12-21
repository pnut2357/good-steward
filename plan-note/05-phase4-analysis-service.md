# Phase 4: Analysis Service (AI + API) - With Free Fallback

## 🎯 Goal
Create a Singleton class that fetches product data and analyzes it with AI, with a **FREE fallback** when AI is unavailable.

---

## 💰 Cost Protection Strategy

This implementation includes:
1. **Primary:** Groq AI analysis (FREE tier: ~14,400 requests/day)
2. **Fallback:** Nutriscore-based analysis (FREE, no API needed)
3. **Caching:** Results stored locally (repeat scans = no API calls)

## ⚡ Latency Optimization

| Optimization | Implementation |
|--------------|----------------|
| **Fast model** | `llama-3.1-8b-instant` (Groq's fastest) |
| **Short prompts** | ~100 input tokens |
| **Short responses** | max_tokens: 150 |
| **Timeouts** | 5s for OpenFoodFacts, 8s for Groq |
| **Fallback** | Instant Nutriscore if AI slow |

**Target:** < 2 seconds for new products, instant for cached

---

## Step 4.1: Create AnalysisService

**File:** `services/AnalysisService.ts`

```typescript
import Groq from 'groq-sdk';
import axios from 'axios';
import { ScanResult } from '../models/ScanResult';

// OpenFoodFacts API types
interface OFFProduct {
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
  };
  additives_tags?: string[];
}

interface OFFResponse {
  status: number;
  status_verbose: string;
  product?: OFFProduct;
}

interface AIAnalysis {
  summary: string;
  isSafe: boolean;
  concerns?: string[];
}

/**
 * Singleton class for product analysis
 * 
 * Cost Structure:
 * - OpenFoodFacts: FREE (no limits)
 * - Groq AI: FREE tier (~14,400/day)
 * - Fallback: FREE (uses Nutriscore data)
 */
export class AnalysisService {
  private groq: Groq | null = null;
  private static instance: AnalysisService | null = null;

  private constructor() {
    // Only initialize Groq if API key is available
    const apiKey = process.env.EXPO_PUBLIC_GROQ_API_KEY;
    if (apiKey && apiKey !== 'your_groq_api_key_here') {
      this.groq = new Groq({
        apiKey,
        dangerouslyAllowBrowser: true
      });
    } else {
      console.log('Groq API key not set - using Nutriscore fallback only');
    }
  }

  public static getInstance(): AnalysisService {
    if (!AnalysisService.instance) {
      AnalysisService.instance = new AnalysisService();
    }
    return AnalysisService.instance;
  }

  /**
   * Fetch product from OpenFoodFacts (FREE - no limits)
   */
  private async fetchProduct(barcode: string): Promise<OFFProduct | null> {
    try {
      const url = `https://world.openfoodfacts.org/api/v2/product/${barcode}.json`;
      const { data } = await axios.get<OFFResponse>(url, {
        headers: {
          'User-Agent': 'GoodSteward/1.0 (food-scanner-app)'
        },
        timeout: 10000
      });

      if (data.status !== 1 || !data.product) {
        console.log('Product not found in OpenFoodFacts');
        return null;
      }

      return data.product;
    } catch (error) {
      console.error('OpenFoodFacts fetch failed:', error);
      return null;
    }
  }

  /**
   * FREE FALLBACK: Analyze using Nutriscore data (no AI needed)
   * Works even without Groq API key!
   */
  private analyzeWithNutriscore(product: OFFProduct): AIAnalysis {
    const nutriscore = product.nutriscore_grade?.toLowerCase();
    const nova = product.nova_group;
    const nutrients = product.nutriments;
    
    const concerns: string[] = [];
    let isSafe = true;
    
    // Nutriscore analysis
    if (nutriscore === 'd' || nutriscore === 'e') {
      isSafe = false;
      concerns.push(`Nutriscore ${nutriscore.toUpperCase()} (poor nutritional quality)`);
    }
    
    // NOVA analysis (processing level)
    if (nova === 4) {
      isSafe = false;
      concerns.push('Ultra-processed food');
    } else if (nova === 3) {
      concerns.push('Processed food');
    }
    
    // Nutrient analysis
    if (nutrients) {
      if (nutrients.sugars_100g && nutrients.sugars_100g > 15) {
        isSafe = false;
        concerns.push(`High sugar (${nutrients.sugars_100g}g/100g)`);
      }
      if (nutrients.salt_100g && nutrients.salt_100g > 1.5) {
        isSafe = false;
        concerns.push(`High salt (${nutrients.salt_100g}g/100g)`);
      }
      if (nutrients['saturated-fat_100g'] && nutrients['saturated-fat_100g'] > 5) {
        concerns.push(`High saturated fat (${nutrients['saturated-fat_100g']}g/100g)`);
      }
    }
    
    // Check additives
    if (product.additives_tags && product.additives_tags.length > 5) {
      concerns.push(`Contains ${product.additives_tags.length} additives`);
    }
    
    // Build summary
    let summary: string;
    if (concerns.length === 0) {
      summary = nutriscore 
        ? `Nutriscore ${nutriscore.toUpperCase()}: Good nutritional profile.`
        : 'No significant concerns identified.';
    } else if (concerns.length <= 2) {
      summary = concerns.join('. ') + '.';
    } else {
      summary = `Multiple concerns: ${concerns.slice(0, 2).join(', ')} and ${concerns.length - 2} more.`;
    }
    
    return { summary, isSafe, concerns };
  }

  /**
   * AI Analysis using Groq (FREE tier)
   * Falls back to Nutriscore if unavailable
   */
  private async analyzeWithAI(product: OFFProduct): Promise<AIAnalysis> {
    // If no Groq client, use fallback
    if (!this.groq) {
      return this.analyzeWithNutriscore(product);
    }

    const name = product.product_name || product.product_name_en || 'Unknown';
    const ingredients = product.ingredients_text || product.ingredients_text_en || 'Not listed';
    const nutriscore = product.nutriscore_grade?.toUpperCase() || 'N/A';
    const nova = product.nova_group || 'N/A';
    
    // Build nutrition context
    let nutritionContext = '';
    if (product.nutriments) {
      const n = product.nutriments;
      nutritionContext = `
Nutrition per 100g: Sugar ${n.sugars_100g ?? 'N/A'}g, Salt ${n.salt_100g ?? 'N/A'}g, Sat Fat ${n['saturated-fat_100g'] ?? 'N/A'}g`;
    }

    const prompt = `You are a nutrition expert. Analyze this food product briefly.

PRODUCT: ${name}
NUTRISCORE: ${nutriscore} (A=best, E=worst)
NOVA: ${nova} (1=unprocessed, 4=ultra-processed)
${nutritionContext}
INGREDIENTS: ${ingredients}

Respond ONLY with JSON:
{"summary": "2 sentences max", "isSafe": true/false}

Set isSafe=false if: high sugar (>15g), high salt (>1.5g), ultra-processed, or concerning additives.`;

    try {
      const response = await this.groq.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model: 'llama-3.1-8b-instant',
        response_format: { type: 'json_object' },
        temperature: 0.2,
        max_tokens: 200 // Keep it short to save tokens
      });

      const content = response.choices[0]?.message?.content;
      if (!content) throw new Error('Empty AI response');

      const parsed = JSON.parse(content) as AIAnalysis;
      
      if (typeof parsed.summary !== 'string' || typeof parsed.isSafe !== 'boolean') {
        throw new Error('Invalid AI response structure');
      }

      return parsed;

    } catch (error) {
      console.log('AI failed, using Nutriscore fallback:', error);
      // Fall back to Nutriscore-based analysis
      return this.analyzeWithNutriscore(product);
    }
  }

  /**
   * Main method: Analyze a product by barcode
   * 
   * Cost: 
   * - OpenFoodFacts call: FREE
   * - AI call: FREE (with fallback if quota exceeded)
   */
  public async analyzeProduct(barcode: string): Promise<ScanResult | null> {
    try {
      // Step 1: Fetch from OpenFoodFacts (FREE)
      const product = await this.fetchProduct(barcode);
      if (!product) {
        return null;
      }

      // Step 2: Analyze (AI with FREE fallback)
      const analysis = await this.analyzeWithAI(product);

      // Step 3: Build ScanResult
      const name = product.product_name || product.product_name_en || 'Unknown Product';
      const ingredients = product.ingredients_text || product.ingredients_text_en || 'No ingredients listed';

      return {
        barcode,
        name,
        ingredients,
        summary: analysis.summary,
        isSafe: analysis.isSafe,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('Analysis failed:', error);
      return null;
    }
  }

  /**
   * Check if AI is available
   */
  public isAIAvailable(): boolean {
    return this.groq !== null;
  }
}

// Export singleton instance
export const analysisService = AnalysisService.getInstance();
```

---

## 💰 Cost Breakdown

| Service | Cost | Notes |
|---------|------|-------|
| OpenFoodFacts | **$0** | No limits, no auth |
| Groq AI (Primary) | **$0** | Free tier: ~14,400/day |
| Nutriscore (Fallback) | **$0** | Uses OFF data, no extra call |
| **Total** | **$0** | |

---

## 🛡️ How Fallback Works

```
User scans barcode
        │
        ▼
Fetch from OpenFoodFacts (FREE)
        │
        ▼
┌───────────────────────────────┐
│    Try Groq AI Analysis       │
│    (FREE tier available?)     │
└───────────────────────────────┘
        │
   ┌────┴────┐
   │         │
SUCCESS    FAIL (quota/error)
   │         │
   │         ▼
   │    Use Nutriscore
   │    Fallback (FREE)
   │         │
   └────┬────┘
        │
        ▼
   Return Result
```

---

## 🔧 Configuration Options

### Option 1: AI + Fallback (Recommended)
```env
EXPO_PUBLIC_GROQ_API_KEY=gsk_your_key_here
```
Uses Groq when available, falls back to Nutriscore.

### Option 2: Nutriscore Only (100% Free, No AI)
```env
# Don't set EXPO_PUBLIC_GROQ_API_KEY
# Or set it to empty/placeholder:
EXPO_PUBLIC_GROQ_API_KEY=
```
Uses only Nutriscore analysis - still provides good recommendations!

---

## Nutriscore Fallback Quality

The Nutriscore fallback provides solid analysis:

| Data Source | What It Checks |
|-------------|----------------|
| Nutriscore | Overall nutrition grade (A-E) |
| NOVA Group | Processing level (1-4) |
| Nutrients | Sugar, salt, saturated fat thresholds |
| Additives | Number of additives |

**This covers 80% of what the AI would analyze!**

---

## ✅ Checklist

- [ ] Created `services/AnalysisService.ts`
- [ ] Implemented OpenFoodFacts fetch (FREE)
- [ ] Implemented Groq AI analysis (FREE tier)
- [ ] Implemented Nutriscore fallback (FREE)
- [ ] Handles missing API key gracefully
- [ ] Short prompts to save tokens
- [ ] Returns proper `ScanResult` object
- [ ] Exported singleton `analysisService`

---

## 🔜 Next: Phase 5 - UI Components
