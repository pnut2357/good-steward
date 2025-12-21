# API Reference Guide

## 🌐 OpenFoodFacts API

### Overview
Open Food Facts is a free, open, collaborative database of food products. No API key required.

### Base URL
```
https://world.openfoodfacts.org/api/v2/
```

### Product Lookup by Barcode

**Endpoint:**
```
GET /product/{barcode}.json
```

**Example Request:**
```
https://world.openfoodfacts.org/api/v2/product/3017620422003.json
```

### Response Structure

```json
{
  "code": "3017620422003",
  "status": 1,
  "status_verbose": "product found",
  "product": {
    "product_name": "Nutella",
    "brands": "Ferrero",
    "ingredients_text": "Sugar, Palm Oil, Hazelnuts 13%, Skimmed Milk Powder 8.7%, Fat-Reduced Cocoa 7.4%, Emulsifier: Lecithins (Soy), Vanillin",
    "ingredients_text_en": "...",
    "nutriscore_grade": "e",
    "nutriscore_score": 26,
    "nova_group": 4,
    "nutrition_grades": "e",
    "nutriments": {
      "energy-kcal_100g": 539,
      "fat_100g": 30.9,
      "saturated-fat_100g": 10.6,
      "carbohydrates_100g": 57.5,
      "sugars_100g": 56.3,
      "fiber_100g": 0,
      "proteins_100g": 6.3,
      "salt_100g": 0.107,
      "sodium_100g": 0.0428
    },
    "additives_tags": [
      "en:e322",
      "en:e322i"
    ],
    "allergens_tags": [
      "en:milk",
      "en:nuts",
      "en:soybeans"
    ],
    "image_front_url": "https://images.openfoodfacts.org/images/products/301/762/042/2003/front_en.425.400.jpg",
    "categories_tags": [
      "en:spreads",
      "en:breakfasts",
      "en:sweet-spreads",
      "en:chocolate-spreads",
      "en:hazelnut-spreads"
    ]
  }
}
```

### Key Fields for Analysis

| Field | Description | Use Case |
|-------|-------------|----------|
| `product_name` | Product name | Display in UI |
| `brands` | Brand name | Display context |
| `ingredients_text` | Full ingredients list | Send to AI for analysis |
| `nutriscore_grade` | A-E rating (A=best) | Quick health indicator |
| `nova_group` | 1-4 processing level (1=best) | Processing indicator |
| `nutriments.sugars_100g` | Sugar per 100g | Health analysis |
| `nutriments.saturated-fat_100g` | Sat fat per 100g | Health analysis |
| `nutriments.salt_100g` | Salt per 100g | Health analysis |
| `additives_tags` | E-number additives | Flag artificial additives |
| `allergens_tags` | Known allergens | Safety warnings |

### Status Codes

| Status | Meaning |
|--------|---------|
| `status: 1` | Product found |
| `status: 0` | Product not found |

### Error Handling

```typescript
// Check if product exists
if (data.status !== 1) {
  // Product not in database
  return null;
}

// Check if required fields exist
const product = data.product;
const name = product.product_name || product.product_name_en || 'Unknown Product';
const ingredients = product.ingredients_text || product.ingredients_text_en || 'No ingredients listed';
```

### Rate Limiting
- No strict rate limits, but be respectful
- Add `User-Agent` header with app name and contact

```typescript
const response = await axios.get(url, {
  headers: {
    'User-Agent': 'GoodSteward/1.0 (contact@example.com)'
  }
});
```

---

## 🤖 Groq AI API

### Overview
Groq provides fast AI inference with models like Llama 3. API key required.

### SDK Installation
```bash
npm install groq-sdk
```

### Available Models (December 2024)

| Model | Context | Speed | Recommended For |
|-------|---------|-------|-----------------|
| `llama-3.1-8b-instant` | 128K | Fastest | Quick responses |
| `llama-3.1-70b-versatile` | 128K | Fast | Complex analysis |
| `llama3-8b-8192` | 8K | Fast | Legacy, still works |
| `llama3-70b-8192` | 8K | Medium | Better analysis |
| `mixtral-8x7b-32768` | 32K | Fast | Good alternative |

**Recommended:** `llama-3.1-8b-instant` for speed or `llama-3.1-70b-versatile` for quality.

### Basic Usage

```typescript
import Groq from 'groq-sdk';

const groq = new Groq({
  apiKey: process.env.EXPO_PUBLIC_GROQ_API_KEY,
  dangerouslyAllowBrowser: true // Required for React Native/browser
});

const response = await groq.chat.completions.create({
  messages: [
    { role: 'system', content: 'You are a nutrition expert.' },
    { role: 'user', content: 'Analyze this product...' }
  ],
  model: 'llama-3.1-8b-instant',
  temperature: 0.3, // Lower = more consistent
  max_tokens: 500
});

const content = response.choices[0].message.content;
```

### JSON Mode (Structured Output)

```typescript
const response = await groq.chat.completions.create({
  messages: [
    { 
      role: 'user', 
      content: `Analyze this product and respond ONLY with JSON:
        Product: ${productName}
        Ingredients: ${ingredients}
        
        Format: {"summary": "...", "isSafe": true/false}`
    }
  ],
  model: 'llama-3.1-8b-instant',
  response_format: { type: 'json_object' }, // Forces JSON output
  temperature: 0.3
});

const result = JSON.parse(response.choices[0].message.content || '{}');
```

### Optimized Prompt for Food Analysis

```typescript
const prompt = `You are a nutrition expert analyzing food products.

PRODUCT NAME: ${name}
INGREDIENTS: ${ingredients}
NUTRISCORE: ${nutriscore || 'N/A'}
NOVA GROUP: ${novaGroup || 'N/A'}

Analyze this product and provide a health assessment.

RULES:
- Be concise (2-3 sentences max)
- Flag high sugar (>15g/100g), high salt (>1.5g/100g), high saturated fat (>5g/100g)
- Flag artificial additives (E-numbers like E621, E951, etc.)
- Flag ultra-processed foods (NOVA 4)
- Consider overall nutritional balance

Respond ONLY with this JSON format:
{
  "summary": "Brief health assessment",
  "isSafe": true/false,
  "concerns": ["list", "of", "concerns"] 
}

Set isSafe to false if there are significant health concerns.
`;
```

### Error Handling

```typescript
try {
  const response = await groq.chat.completions.create({ ... });
  
  if (!response.choices?.[0]?.message?.content) {
    throw new Error('Empty response from AI');
  }
  
  const parsed = JSON.parse(response.choices[0].message.content);
  
  // Validate required fields
  if (typeof parsed.summary !== 'string' || typeof parsed.isSafe !== 'boolean') {
    throw new Error('Invalid response structure');
  }
  
  return parsed;
  
} catch (error) {
  if (error.status === 429) {
    console.error('Rate limited - wait and retry');
  } else if (error.status === 401) {
    console.error('Invalid API key');
  } else {
    console.error('AI analysis failed:', error);
  }
  
  // Return safe default
  return {
    summary: 'Unable to analyze product. Please check ingredients manually.',
    isSafe: true,
    concerns: []
  };
}
```

### Rate Limits (Free Tier)

| Limit | Value |
|-------|-------|
| Requests per minute | 30 |
| Requests per day | 14,400 |
| Tokens per minute | 6,000 |

---

## 🔄 Offline-First Strategy

### Flow Diagram

```
Barcode Scanned
      │
      ▼
┌─────────────────┐
│ Check SQLite DB │ ← ALWAYS check local first
└─────────────────┘
      │
      ├── Found ──► Return cached result (instant!)
      │
      └── Not Found
            │
            ▼
      ┌─────────────────┐
      │ OpenFoodFacts   │ ← Only if not in local DB
      │ API Call        │
      └─────────────────┘
            │
            ▼
      ┌─────────────────┐
      │ Groq AI         │
      │ Analysis        │
      └─────────────────┘
            │
            ▼
      ┌─────────────────┐
      │ Save to SQLite  │ ← Cache for future
      └─────────────────┘
            │
            ▼
      Return result
```

### Benefits
1. **Fast:** Repeat scans are instant (no network)
2. **Offline:** Works without internet after first scan
3. **Cost-Effective:** Reduces API calls to Groq
4. **Reliable:** No dependency on network for cached products

---

## 📊 Extended Data Model

For more detailed analysis, you can extend the ScanResult:

```typescript
export interface ScanResultExtended {
  // Core fields
  barcode: string;
  name: string;
  ingredients: string;
  summary: string;
  isSafe: boolean;
  timestamp: string;
  
  // Extended fields (optional)
  brand?: string;
  imageUrl?: string;
  nutriscoreGrade?: 'a' | 'b' | 'c' | 'd' | 'e';
  novaGroup?: 1 | 2 | 3 | 4;
  concerns?: string[];
  
  // Nutriments
  sugars100g?: number;
  salt100g?: number;
  saturatedFat100g?: number;
  calories100g?: number;
}
```

---

## 🧪 Testing Endpoints

### Test OpenFoodFacts API
```bash
curl "https://world.openfoodfacts.org/api/v2/product/3017620422003.json" | jq '.product.product_name, .product.nutriscore_grade'
```

### Test Groq API
```bash
curl -X POST "https://api.groq.com/openai/v1/chat/completions" \
  -H "Authorization: Bearer $GROQ_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "llama-3.1-8b-instant",
    "messages": [{"role": "user", "content": "Say hello"}]
  }'
```

---

*API Reference - December 2024*

