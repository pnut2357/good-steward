# 17. New Photo Analysis Strategy

## Problem: Hugging Face 410 Gone

The Hugging Face Inference API models are returning **HTTP 410 Gone** errors:
- `google/vit-base-patch16-224` - 410 Gone
- `microsoft/resnet-50` - 410 Gone  
- `facebook/deit-base-distilled-patch16-224` - 410 Gone

**Root Cause**: These models have been deprecated or removed from the free inference tier.

---

## New Strategy: On-Device OCR + Search

Instead of trying to classify food images with cloud AI, we use a more reliable approach:

### 1. ML Kit Text Recognition (OCR)
- **Library**: `@react-native-ml-kit/text-recognition`
- **Cost**: FREE (runs on device!)
- **Speed**: Instant (no network needed)
- **Purpose**: Read ingredient text from photos

### 2. OpenFoodFacts Search API
- **Endpoint**: `https://world.openfoodfacts.org/cgi/search.pl`
- **Cost**: FREE (unlimited)
- **Purpose**: Find product by name/ingredient text

---

## New Photo Flow

```
User takes photo of ingredients label
         │
         ▼
┌─────────────────────────┐
│   ML Kit OCR (offline)  │  ← Extracts text from image
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│   Extract key terms     │  ← "Organic Peanut Butter"
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│  OpenFoodFacts Search   │  ← Find matching products
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│   Display Results       │  ← Show nutrition + safety
└─────────────────────────┘
```

---

## Benefits Over Cloud Vision

| Aspect | Cloud Vision (Old) | ML Kit OCR (New) |
|--------|-------------------|------------------|
| Cost | Varies (often paid) | FREE |
| Speed | 1-5 seconds | <500ms |
| Offline | ❌ No | ✅ Yes |
| Reliability | Models get deprecated | Bundled with app |
| Accuracy | Generic classification | Reads actual text |

---

## Installation

```bash
# React Native ML Kit for text recognition
npx expo install @react-native-ml-kit/text-recognition

# Note: This is a native module, requires expo-dev-client for Expo
npx expo install expo-dev-client
```

---

## Code Example: OCR Service

```typescript
// services/OCRService.ts
import TextRecognition from '@react-native-ml-kit/text-recognition';

export class OCRService {
  private static instance: OCRService | null = null;
  
  public static getInstance(): OCRService {
    if (!OCRService.instance) {
      OCRService.instance = new OCRService();
    }
    return OCRService.instance;
  }
  
  /**
   * Extract text from an image URI
   * Runs OFFLINE on the device!
   */
  public async recognizeText(imageUri: string): Promise<string> {
    try {
      const result = await TextRecognition.recognize(imageUri);
      
      // Combine all text blocks
      const allText = result.blocks
        .map(block => block.text)
        .join(' ');
      
      console.log(`📝 OCR extracted ${allText.length} characters`);
      return allText;
    } catch (error) {
      console.error('❌ OCR failed:', error);
      return '';
    }
  }
  
  /**
   * Extract product name or key ingredients from OCR text
   */
  public extractProductInfo(ocrText: string): {
    productName: string;
    ingredients: string[];
  } {
    const lines = ocrText.split('\n').filter(l => l.trim());
    
    // Usually product name is in first few lines
    const productName = lines.slice(0, 2).join(' ').trim();
    
    // Look for ingredients section
    const ingredientStart = ocrText.toLowerCase().indexOf('ingredient');
    let ingredients: string[] = [];
    
    if (ingredientStart > -1) {
      const ingredientText = ocrText.substring(ingredientStart);
      ingredients = ingredientText
        .replace(/ingredients?:?/i, '')
        .split(/[,;]/)
        .map(i => i.trim())
        .filter(i => i.length > 2);
    }
    
    return { productName, ingredients };
  }
}

export const ocrService = OCRService.getInstance();
```

---

## OpenFoodFacts Search API

### Endpoint
```
GET https://world.openfoodfacts.org/cgi/search.pl
```

### Parameters
| Param | Value | Description |
|-------|-------|-------------|
| `search_terms` | "peanut butter" | Text to search |
| `search_simple` | 1 | Simple search mode |
| `action` | "process" | Required |
| `json` | 1 | Return JSON |
| `page_size` | 5 | Limit results |

### Example
```typescript
const searchUrl = `https://world.openfoodfacts.org/cgi/search.pl?` +
  `search_terms=${encodeURIComponent(searchText)}` +
  `&search_simple=1&action=process&json=1&page_size=5`;

const response = await axios.get(searchUrl);
const products = response.data.products; // Array of product objects
```

---

## Fallback Strategy

```
1. User scans barcode
   └── Success? → Use OpenFoodFacts barcode API
   └── Fail? → Try photo mode

2. User takes photo
   └── OCR extracts text
   └── Search OpenFoodFacts with extracted text
   └── Show matching products
   └── User selects correct product

3. No matches found
   └── Show generic "Unknown Product" result
   └── Allow manual entry (future feature)
```

---

## Migration Plan

### Phase 1: Install ML Kit
```bash
npx expo install @react-native-ml-kit/text-recognition expo-dev-client
```

### Phase 2: Create OCRService
- New file: `services/OCRService.ts`
- Implement text recognition

### Phase 3: Update AnalysisService
- Replace Hugging Face calls with OCR + Search
- Keep barcode flow unchanged

### Phase 4: Update UI
- Show "Reading text..." during OCR
- Show search results for user to select

---

## Notes

- ML Kit requires a **development build** (not Expo Go)
- User needs to create dev build: `npx expo run:ios` or `npx expo run:android`
- First build takes longer, but subsequent builds are faster
- OCR works offline after initial build!

