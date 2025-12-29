# Phase 4: Real Food Recognition

> **Last Updated**: December 29, 2024  
> **Status**: ✅ IMPLEMENTED (FREE Vision APIs)  
> **Priority**: High  
> **Complexity**: Medium  
> **Cost**: **$0** (All providers are free)

---

## 📋 Table of Contents

1. [Problem Statement](#1-problem-statement)
2. [Current Implementation](#2-current-implementation)
3. [FREE Vision Strategy](#3-free-vision-strategy)
4. [Solution Options Comparison 2025](#4-solution-options-comparison-2025)
5. [Recommended: Hybrid Architecture](#5-recommended-hybrid-architecture)
6. [Implementation Plan](#6-implementation-plan)
7. [Food-101 Model Details (Legacy)](#7-food-101-model-details-legacy)
8. [Nutrition Database](#8-nutrition-database)
9. [UI Design](#9-ui-design)
10. [Files to Create/Modify](#10-files-to-createmodify)
11. [References](#11-references)

**See also:** [26-vision-api-strategy.md](./26-vision-api-strategy.md) for detailed API strategy

---

## 1. Problem Statement

### What Works Now ✅
- **Barcode scanning** → OpenFoodFacts lookup
- **Photo of packaged product** → OCR → Search database
- **Nutrition label scanning** → OCR → Parse values
- **TFLite Food-101** → On-device food recognition (101 categories only)

### What's Missing 🔮
| Scenario | Current Behavior | Desired Behavior |
|----------|------------------|------------------|
| Photo of pizza | "Pizza" (if in 101 categories) | "Pizza with pepperoni - ~285 kcal/slice" |
| Mixed plate (burger + fries) | Only identifies ONE food | "Hamburger + French Fries - ~650 kcal" |
| Fresh fruits/vegetables | Limited recognition | "Red Apple (Fuji) - ~52 kcal/100g" |
| Restaurant meal | Generic guess | "Pad Thai with shrimp - ~350 kcal" |
| Homemade salad | "Salad" only | "Caesar salad with chicken - ~180 kcal" |
| Unknown ethnic foods | Fails entirely | "Bibimbap - ~580 kcal" |

### The Problem with Food-101
The current TFLite Food-101 model:
- ❌ **Outdated** - trained in 2014, only 101 categories
- ❌ **No mixed plates** - can't identify multiple foods
- ❌ **No portions** - can't estimate serving size
- ❌ **Fixed vocabulary** - fails on foods outside 101 categories
- ❌ **Requires dev build** - doesn't work in Expo Go

---

## 2. Current Implementation (TFLite)

### What's Implemented ✅
| Component | Status | File |
|-----------|--------|------|
| TFLite model (~21MB) | ✅ | `assets/models/food_v1.tflite` |
| FoodRecognitionService | ✅ | `services/FoodRecognitionService.ts` |
| Food-101 labels | ✅ | `data/food101Labels.ts` |
| Food-101 nutrition | ✅ | `data/food101Nutrition.ts` |
| FoodIdentifyOverlay | ✅ | `components/FoodIdentifyOverlay.tsx` |
| FoodResultModal | ✅ | `components/FoodResultModal.tsx` |

### Limitations
```
📱 Current: Food-101 TFLite
- Only 101 food categories
- Single food per image
- No portion estimation
- Requires Development Build (not Expo Go)
```

---

## 3. FREE Vision Strategy

### Why FREE Vision APIs?
- ⚠️ **Groq Vision**: Decommissioned (December 2024)
- ⚠️ **Together.ai**: Requires payment for most models
- ✅ **HuggingFace**: 100% FREE, no credit card required
- ✅ **OpenRouter**: FREE tier available

### Our FREE Solution

| Priority | Provider | Model | Cost | Accuracy |
|----------|----------|-------|------|----------|
| 1️⃣ | **HuggingFace** | BLIP Large | **FREE** | Medium |
| 2️⃣ | **OpenRouter** | Llama 3.2 11B | **FREE tier** | High |
| 3️⃣ | **TFLite** | Food-101 | **FREE** | Limited (101) |

### Best Open Source Vision Models (2025)
Source: [Koyeb - Best Multimodal Vision Models 2025](https://www.koyeb.com/blog/best-multimodal-vision-models-in-2025)

| Model | Developer | Size | License |
|-------|-----------|------|---------|
| **Gemma 3** | Google | 4B-27B | Open weights |
| **Qwen 2.5 VL** | Alibaba | 7B-72B | Apache 2.0 |
| **Pixtral** | Mistral | 12B-124B | Apache 2.0 |
| **Phi-4 Multimodal** | Microsoft | 5.6B | MIT |
| **DeepSeek Janus-Pro** | DeepSeek | 7B | MIT |
| **Llama 3.2 Vision** | Meta | 11B-90B | Llama License |

### Recommendation: **HuggingFace BLIP**
- **Cost**: $0 (100% free, no credit card)
- **Latency**: ~1-3 seconds
- **Works in Expo Go**: No native modules needed
- **Reliability**: Stable, no rate limits for normal use

---

## 4. Solution Options Comparison 2025

| Approach | Cost | Speed | Offline | Accuracy | Mixed Plates | Expo Go |
|----------|------|-------|---------|----------|--------------|---------|
| **TFLite Food-101** (current) | FREE | 50-200ms | ✅ Yes | Limited (101) | ❌ No | ❌ No |
| **Vision LLM** (proposed) | FREE tier | 300-800ms | ❌ No | Excellent | ✅ Yes | ✅ Yes |
| **Hybrid** ⭐ (recommended) | FREE | Best of both | ✅ Fallback | Excellent | ✅ Yes | ✅ Yes |
| Clarifai Food | $0.002/call | 500-1500ms | ❌ No | Good | ❌ No | ✅ Yes |
| Google Vision | $1.50/1000 | 300-600ms | ❌ No | Generic | ❌ No | ✅ Yes |

---

## 5. Recommended: Hybrid Architecture

### Architecture Diagram
```
┌─────────────────────────────────────────────────────────────────┐
│                 FOOD RECOGNITION FLOW (v2.0)                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  📸 User takes photo of food                                     │
│         │                                                        │
│         ▼                                                        │
│  ┌──────────────────┐                                           │
│  │  Check Network   │                                           │
│  └────────┬─────────┘                                           │
│           │                                                      │
│     ┌─────┴─────┐                                               │
│     │           │                                                │
│  Online      Offline                                             │
│     │           │                                                │
│     ▼           ▼                                                │
│  ┌──────────────────┐    ┌──────────────────────────────┐       │
│  │  Vision LLM API  │    │  TFLite Food-101 (fallback)  │       │
│  │  (Groq + Llama)  │    │  On-device, 101 categories   │       │
│  └────────┬─────────┘    └──────────────┬───────────────┘       │
│           │                             │                        │
│           └──────────┬──────────────────┘                        │
│                      ▼                                           │
│           ┌──────────────────────────────┐                       │
│           │  Merge/Display Results       │                       │
│           │                              │                       │
│           │  🍕 Pizza with Pepperoni     │                       │
│           │  🍟 + French Fries           │                       │
│           │  🥗 + Side Salad             │                       │
│           │                              │                       │
│           │  Total: ~850 kcal            │                       │
│           └──────────────────────────────┘                       │
│                      │                                           │
│                      ▼                                           │
│           ┌──────────────────────────────┐                       │
│           │  📝 User confirms & logs     │                       │
│           └──────────────────────────────┘                       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Priority Order
1. **Online + Vision LLM** (best quality, unlimited foods)
2. **Offline + TFLite** (fallback, 101 foods only)
3. **Manual Selection** (user picks from list)

---

## 6. Implementation Plan

### Phase 4A: TFLite Food-101 ✅ COMPLETE
| Step | Task | Status |
|------|------|--------|
| 4A.1 | Install dependencies | ✅ Done |
| 4A.2 | Download & bundle TFLite model | ✅ Done |
| 4A.3 | Create `FoodRecognitionService.ts` | ✅ Done |
| 4A.4 | Create `food101Nutrition.ts` database | ✅ Done |
| 4A.5 | Add "Identify" mode to scanner | ✅ Done |
| 4A.6 | Testing & refinement | ✅ Done |

### Phase 4B: Vision LLM Upgrade ✅ COMPLETE
| Step | Task | Time | Status |
|------|------|------|--------|
| 4B.1 | Get Groq API key | 5 min | ✅ User action needed |
| 4B.2 | Create `VisionFoodService.ts` | 1 day | ✅ Done |
| 4B.3 | Update scanner to use Vision LLM as primary | 0.5 day | ✅ Done |
| 4B.4 | Add network check for hybrid fallback | 0.5 day | ✅ Done |
| 4B.5 | Update UI for mixed plate display | 0.5 day | ✅ Done |
| 4B.6 | Testing & refinement | 0.5 day | 📋 User testing |

### Vision LLM Service Implementation
```typescript
// services/VisionFoodService.ts
import * as FileSystem from 'expo-file-system';

const GROQ_API_KEY = process.env.EXPO_PUBLIC_GROQ_API_KEY;

export interface VisionFoodResult {
  items: Array<{
    name: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    portion_g: number;
  }>;
  totalCalories: number;
  confidence: 'high' | 'medium' | 'low';
  description: string;
}

export async function recognizeFoodWithVision(imageUri: string): Promise<VisionFoodResult> {
  // Read image as base64
  const file = new FileSystem.File(imageUri);
  const base64 = await file.base64();

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${GROQ_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: "llama-3.2-90b-vision-preview", // or 11b for faster
      messages: [{
        role: "user",
        content: [
          { 
            type: "text", 
            text: `Analyze this food photo. Identify ALL food items visible.
For each item, estimate nutrition per portion shown.

Return ONLY valid JSON:
{
  "items": [
    {
      "name": "Food name",
      "calories": number,
      "protein": number (grams),
      "carbs": number (grams),
      "fat": number (grams),
      "portion_g": estimated weight in grams
    }
  ],
  "totalCalories": sum of all calories,
  "confidence": "high|medium|low",
  "description": "Brief description of what you see"
}`
          },
          { 
            type: "image_url", 
            image_url: { url: `data:image/jpeg;base64,${base64}` } 
          }
        ]
      }],
      temperature: 0.1,
      max_tokens: 800
    })
  });

  const data = await response.json();
  const content = data.choices[0].message.content;
  
  // Parse JSON from response
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    return JSON.parse(jsonMatch[0]);
  }
  
  throw new Error('Could not parse food recognition result');
}
```

### Dependencies
```bash
# For Vision LLM (works in Expo Go!)
# No new packages needed - uses fetch API

# For TFLite fallback (already installed)
npm install react-native-fast-tflite react-native-worklets-core
```

### Environment Setup
```bash
# .env
EXPO_PUBLIC_GROQ_API_KEY=gsk_xxxxx  # Get from https://console.groq.com
```

---

## 7. Food-101 Model Details (Legacy)

### Model Source
- **TensorFlow Hub**: [Food V1](https://tfhub.dev/google/lite-model/aiy/vision/classifier/food_V1/1)
- **Format**: TensorFlow Lite (.tflite)
- **Size**: ~5MB (quantized)
- **Input**: 224x224 RGB image
- **Output**: 101 class probabilities

### Download Instructions
```bash
# Download from TensorFlow Hub
curl -L "https://tfhub.dev/google/lite-model/aiy/vision/classifier/food_V1/1?lite-format=tflite" \
  -o assets/models/food_v1.tflite
```

### The 101 Food Categories
```
apple_pie, baby_back_ribs, baklava, beef_carpaccio, beef_tartare,
beet_salad, beignets, bibimbap, bread_pudding, breakfast_burrito,
bruschetta, caesar_salad, cannoli, caprese_salad, carrot_cake,
ceviche, cheese_plate, cheesecake, chicken_curry, chicken_quesadilla,
chicken_wings, chocolate_cake, chocolate_mousse, churros, clam_chowder,
club_sandwich, crab_cakes, creme_brulee, croque_madame, cup_cakes,
deviled_eggs, donuts, dumplings, edamame, eggs_benedict, escargots,
falafel, filet_mignon, fish_and_chips, foie_gras, french_fries,
french_onion_soup, french_toast, fried_calamari, fried_rice,
frozen_yogurt, garlic_bread, gnocchi, greek_salad, grilled_cheese_sandwich,
grilled_salmon, guacamole, gyoza, hamburger, hot_and_sour_soup,
hot_dog, huevos_rancheros, hummus, ice_cream, lasagna, lobster_bisque,
lobster_roll_sandwich, macaroni_and_cheese, macarons, miso_soup,
mussels, nachos, omelette, onion_rings, oysters, pad_thai, paella,
pancakes, panna_cotta, peking_duck, pho, pizza, pork_chop, poutine,
prime_rib, pulled_pork_sandwich, ramen, ravioli, red_velvet_cake,
risotto, samosa, sashimi, scallops, seaweed_salad, shrimp_and_grits,
spaghetti_bolognese, spaghetti_carbonara, spring_rolls, steak,
strawberry_shortcake, sushi, tacos, takoyaki, tiramisu, tuna_tartare,
waffles
```

---

## 8. Nutrition Database

### Structure
```typescript
// data/food101Nutrition.ts

export interface FoodNutrition {
  id: string;           // e.g., "pizza"
  name: string;         // e.g., "Pizza (Cheese)"
  serving_g: number;    // Typical serving in grams
  calories_100g: number;
  protein_100g: number;
  carbs_100g: number;
  fat_100g: number;
  sugar_100g?: number;
  fiber_100g?: number;
  source: string;       // e.g., "USDA FDC #174836"
}

export const FOOD_NUTRITION: Record<string, FoodNutrition> = {
  'pizza': {
    id: 'pizza',
    name: 'Pizza (Cheese)',
    serving_g: 107,      // 1 slice
    calories_100g: 266,
    protein_100g: 11,
    carbs_100g: 33,
    fat_100g: 10,
    sugar_100g: 3.6,
    source: 'USDA FDC #174836'
  },
  'hamburger': {
    id: 'hamburger',
    name: 'Hamburger',
    serving_g: 226,      // 1 burger
    calories_100g: 295,
    protein_100g: 17,
    carbs_100g: 24,
    fat_100g: 14,
    sugar_100g: 5,
    source: 'USDA FDC #170720'
  },
  // ... 99 more entries
};
```

### Data Sources
| Source | Use |
|--------|-----|
| **USDA FoodData Central** | Primary - official US nutrition data |
| **OpenFoodFacts** | Backup - community data |
| **Manual research** | Fill gaps |

---

## 9. UI Design

### Scanner Mode Toggle
```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  [📊 Barcode]    [📷 Label]    [🍽️ Identify]              │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                                                     │   │
│  │                  📸 Camera View                     │   │
│  │                                                     │   │
│  │           Point camera at your food                │   │
│  │                                                     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  🍕 Pizza                           92% confident   │   │
│  │  Estimated: 266 kcal per 100g                       │   │
│  │                                                     │   │
│  │  [View Details]              [📝 Log This]         │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Result Modal
```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  🍕 Pizza                                                   │
│  Identified with 92% confidence                             │
│                                                             │
│  ⚠️ AI ESTIMATE - values are approximate                   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  ESTIMATED NUTRITION (per 100g)                      │   │
│  │                                                     │   │
│  │  🔥 266 kcal    💪 11g protein                      │   │
│  │  🍞 33g carbs   🧈 10g fat                          │   │
│  │  🍬 3.6g sugar                                      │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  📏 How much did you eat?                                   │
│  [1 slice ~107g]  [2 slices]  [Custom]                     │
│                                                             │
│  [📝 Add to Log]                                           │
│                                                             │
│  ────────────────────────────────────────────────────────  │
│  [🔄 Not pizza? Search manually]                           │
│                                                             │
│  ⚠️ DISCLAIMER: AI estimates may vary from actual          │
│  nutrition. For accurate tracking, use labeled products.   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 10. Files to Create/Modify

### Phase 4A Files ✅ (Already Created)
| File | Purpose | Status |
|------|---------|--------|
| `assets/models/food_v1.tflite` | TFLite model (~21MB) | ✅ Done |
| `services/FoodRecognitionService.ts` | TFLite model loading & inference | ✅ Done |
| `data/food101Nutrition.ts` | Nutrition data for 101 foods | ✅ Done |
| `data/food101Labels.ts` | Label index mappings | ✅ Done |
| `components/FoodIdentifyOverlay.tsx` | "Identify" mode UI | ✅ Done |
| `components/FoodResultModal.tsx` | Show identified food | ✅ Done |

### Phase 4B Files (Vision LLM Upgrade) ✅ COMPLETE
| File | Purpose | Status |
|------|---------|--------|
| `services/VisionFoodService.ts` | Groq Vision LLM integration | ✅ Created |
| `services/HybridFoodService.ts` | Combines Vision LLM + TFLite | ✅ Created |
| `components/HybridFoodResultModal.tsx` | Display results w/ mixed plates | ✅ Created |

### Files Modified (Phase 4B) ✅
| File | Changes |
|------|---------|
| `app/(tabs)/index.tsx` | Uses hybrid service, handles mixed plates |
| `components/FoodIdentifyOverlay.tsx` | Shows which AI method will be used |
| `.env` | Add EXPO_PUBLIC_GROQ_API_KEY (user action) |

---

## 11. References

### Models & Datasets
- [Food-101 Dataset](https://www.vision.ee.ethz.ch/datasets_extra/food-101/) - Original dataset
- [TensorFlow Hub Food Model](https://tfhub.dev/google/lite-model/aiy/vision/classifier/food_V1/1) - TFLite model
- [USDA FoodData Central](https://fdc.nal.usda.gov/) - Nutrition data

### Libraries
- [react-native-fast-tflite](https://github.com/mrousavy/react-native-fast-tflite) - TFLite for RN
- [react-native-vision-camera](https://github.com/mrousavy/react-native-vision-camera) - Camera frames

### Example Projects
- [GantMan/Food101](https://github.com/GantMan/Food101) - React Native + CoreML
- [FoodCalorieEstimation](https://github.com/virajmane/FoodCalorieEstimation) - Python demo

### Vision LLMs (2025)
| Resource | Description | Link |
|----------|-------------|------|
| **Groq Vision** | Free Llama 3.2 Vision API | [console.groq.com](https://console.groq.com) |
| **Qwen 2.5 VL** | Alibaba multimodal model | [huggingface.co/Qwen](https://huggingface.co/Qwen/Qwen2.5-VL-7B-Instruct) |
| **Gemma 3** | Google multimodal (4B-27B) | [ai.google.dev](https://ai.google.dev/gemma) |
| **Phi-4 Multimodal** | Microsoft (MIT license) | [huggingface.co/microsoft](https://huggingface.co/microsoft/phi-4-multimodal) |
| **Koyeb Blog** | Vision model comparison | [koyeb.com](https://www.koyeb.com/blog/best-multimodal-vision-models-in-2025) |
| **Kaludi Food Classifier** | HuggingFace model | [huggingface.co](https://huggingface.co/Kaludi/food-category-classification) |

---

## Cost Summary

| Component | Cost | Notes |
|-----------|------|-------|
| TFLite model | FREE | Bundled in app (21MB) |
| Groq Vision API | FREE | ~14,400 req/day free tier |
| USDA nutrition data | FREE | Public domain |
| Development time | ~2-3 days | For Vision LLM upgrade |
| **Runtime cost** | **$0** | Within free tier limits |

---

## Implementation Status

### Phase 4A: TFLite ✅ COMPLETE
1. ✅ Install dependencies (`react-native-fast-tflite`, `react-native-worklets-core`)
2. ✅ Download TFLite model (`assets/models/food_v1.tflite` - 21MB)
3. ✅ Create nutrition database (`data/food101Nutrition.ts`)
4. ✅ Create label mappings (`data/food101Labels.ts`)
5. ✅ Implement FoodRecognitionService (`services/FoodRecognitionService.ts`)
6. ✅ Update ModeToggle component (3 modes: Barcode, Label, Identify)
7. ✅ Create FoodIdentifyOverlay component
8. ✅ Create FoodResultModal component
9. ✅ Update scanner screen with Identify mode
10. ✅ Update metro.config.js for .tflite assets
11. ✅ Create babel.config.js for worklets plugin

### Phase 4B: Vision LLM Upgrade ✅ IMPLEMENTED
1. ✅ Get Groq API key from https://console.groq.com (user action)
2. ✅ Add `EXPO_PUBLIC_GROQ_API_KEY` to `.env` (user action)
3. ✅ Create `VisionFoodService.ts`
4. ✅ Create `HybridFoodService.ts` (Vision LLM + TFLite fallback)
5. ✅ Update scanner to use hybrid approach
6. ✅ Add UI for mixed plate display
7. 📋 Test with various food types (user testing)

## Testing Notes

### TFLite Mode (Offline Fallback)
**Requires Development Build** - The TFLite model will NOT work in Expo Go.
```bash
npx expo prebuild --clean
npx expo run:ios --device
```

### Vision LLM Mode (Recommended)
**Works in Expo Go!** - No native modules needed.
```bash
npx expo start
# Scan QR with Expo Go app
```

---

## Comparison: Food-101 vs Vision LLM

| Aspect | Food-101 (Current) | Vision LLM (Upgrade) |
|--------|-------------------|---------------------|
| **Categories** | 101 fixed | Unlimited |
| **Mixed plates** | ❌ No | ✅ Yes |
| **Portions** | ❌ No | ✅ Estimates |
| **Offline** | ✅ Yes | ❌ No |
| **Expo Go** | ❌ No | ✅ Yes |
| **Accuracy** | Limited | Excellent |
| **Latency** | 50-200ms | 300-800ms |
| **Cost** | $0 | $0 (free tier) |
