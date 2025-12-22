# Phase 4: Real Food Recognition

> **Last Updated**: December 21, 2024  
> **Status**: ✅ IMPLEMENTED  
> **Priority**: Medium  
> **Complexity**: Medium-High

---

## 📋 Table of Contents

1. [Problem Statement](#1-problem-statement)
2. [Solution Options Comparison](#2-solution-options-comparison)
3. [Recommended Approach](#3-recommended-approach)
4. [Implementation Plan](#4-implementation-plan)
5. [Food-101 Model Details](#5-food-101-model-details)
6. [Nutrition Database](#6-nutrition-database)
7. [UI Design](#7-ui-design)
8. [Files to Create](#8-files-to-create)
9. [References](#9-references)

---

## 1. Problem Statement

### What Works Now ✅
- **Barcode scanning** → OpenFoodFacts lookup
- **Photo of packaged product** → OCR → Search database
- **Nutrition label scanning** → OCR → Parse values

### What's Missing 🔮
| Scenario | Current Behavior | Desired Behavior |
|----------|------------------|------------------|
| Photo of pizza | "Product not found" | "Pizza - ~266 kcal/100g" |
| Fresh apple | No barcode to scan | "Apple - ~52 kcal/100g" |
| Restaurant meal | Can't identify | "Hamburger - ~295 kcal/100g" |
| Homemade salad | No label | "Salad - ~20 kcal/100g" |

### The Goal
```
📸 Photo of ANY food
       ↓
🤖 AI identifies: "Pizza"
       ↓
📊 Shows: ~266 kcal, 11g protein, 33g carbs
       ↓
📝 User logs consumption
```

---

## 2. Solution Options Comparison

### Option A: On-Device TFLite ⭐ RECOMMENDED
| Aspect | Details |
|--------|---------|
| **How it works** | Download model once (~5MB), runs on phone |
| **Cost** | FREE forever |
| **Speed** | 50-200ms |
| **Offline** | ✅ Yes |
| **Accuracy** | Good (101 food categories) |
| **Requirements** | Dev build (`npx expo run:ios`) |

```
📱 App contains TFLite model
       ↓
📸 Photo taken
       ↓
🧠 On-device inference (no internet)
       ↓
🍕 "Pizza" (confidence: 92%)
```

### Option B: Cloud APIs
| Provider | Free Tier | Food-Specific | Offline |
|----------|-----------|---------------|---------|
| **Clarifai** | 1,000/month | ✅ Yes | ❌ No |
| **Google Vision** | 1,000/month | ❌ Generic | ❌ No |
| **LogMeal** | 50/day | ✅ Yes + nutrition | ❌ No |

⚠️ **Cloud APIs are NOT downloaded** - you send images to their servers.

### Option C: ML Kit Image Labeling
| Aspect | Details |
|--------|---------|
| **How it works** | Google's on-device ML |
| **Cost** | FREE |
| **Offline** | ✅ Yes |
| **Food-specific** | ❌ No (generic labels) |

❌ **Problem**: Returns "food" instead of "pizza"

### Option D: Manual Selection (Simplest)
| Aspect | Details |
|--------|---------|
| **How it works** | User searches/selects food type |
| **Cost** | FREE |
| **Offline** | ✅ Yes |
| **Accuracy** | User-dependent |

```
📸 Take photo (reference only)
       ↓
🔍 User searches: "pizza"
       ↓
📋 Select from list
       ↓
📊 Show nutrition
```

---

## 3. Recommended Approach

### Primary: TFLite Food-101 (On-Device)
**Why this approach?**
- ✅ **100% FREE** - no API costs, ever
- ✅ **Works offline** - no internet needed
- ✅ **Fast** - 50-200ms inference
- ✅ **Private** - images never leave device
- ✅ **Food-specific** - trained on 101 food categories

### Fallback: Manual Selection
If AI confidence is low (<60%), let user manually select:
```
🤖 AI: "Not sure... maybe pizza? (45%)"
       ↓
👤 User: Selects "Pizza" from list
       ↓
📊 Show nutrition
```

### Architecture
```
┌─────────────────────────────────────────────────────────────┐
│  REAL FOOD RECOGNITION FLOW                                 │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  📸 User takes photo of food                                │
│         ↓                                                   │
│  🧠 TFLite Model (on-device)                               │
│         ↓                                                   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Confidence >= 70%?                                  │   │
│  │   YES → Show result: "🍕 Pizza (92%)"              │   │
│  │   NO  → Show options: "Did you mean: Pizza? Bread?"│   │
│  └─────────────────────────────────────────────────────┘   │
│         ↓                                                   │
│  📊 Lookup nutrition from local database                    │
│         ↓                                                   │
│  📱 Display: 266 kcal, 11g protein, 33g carbs              │
│         ↓                                                   │
│  📝 User can log consumption                                │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 4. Implementation Plan

### Phase 4A: Core Food Recognition (3-4 days)

| Step | Task | Time | Status |
|------|------|------|--------|
| 4A.1 | Install dependencies | 0.5 day | 📋 |
| 4A.2 | Download & bundle TFLite model | 0.5 day | 📋 |
| 4A.3 | Create `FoodRecognitionService.ts` | 1 day | 📋 |
| 4A.4 | Create `food101Nutrition.ts` database | 0.5 day | 📋 |
| 4A.5 | Add "Identify" mode to scanner | 1 day | 📋 |
| 4A.6 | Testing & refinement | 0.5 day | 📋 |

### Dependencies to Install
```bash
# TensorFlow Lite for React Native
npm install react-native-fast-tflite

# Required peer dependency
npm install react-native-worklets-core

# Create development build (required!)
npx expo run:ios
# or
npx expo run:android
```

### Phase 4B: Enhancements (Optional, 2-3 days)
| Step | Task | Time |
|------|------|------|
| 4B.1 | Add manual food search fallback | 0.5 day |
| 4B.2 | Add common portion presets | 0.5 day |
| 4B.3 | Add "Not this food" correction flow | 0.5 day |
| 4B.4 | Improve UI/UX | 1 day |

---

## 5. Food-101 Model Details

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

## 6. Nutrition Database

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

## 7. UI Design

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

## 8. Files to Create

### New Files
| File | Purpose |
|------|---------|
| `assets/models/food_v1.tflite` | TFLite model (~5MB) |
| `services/FoodRecognitionService.ts` | Model loading & inference |
| `data/food101Nutrition.ts` | Nutrition data for 101 foods |
| `data/food101Labels.ts` | Label index mappings |
| `components/FoodIdentifyOverlay.tsx` | "Identify" mode UI |
| `components/FoodResultModal.tsx` | Show identified food |

### Files to Modify
| File | Changes |
|------|---------|
| `app/(tabs)/index.tsx` | Add "Identify" mode |
| `components/ModeToggle.tsx` | Add third mode button |
| `package.json` | Add TFLite dependencies |

---

## 9. References

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

---

## Cost Summary

| Component | Cost |
|-----------|------|
| TFLite model | FREE |
| react-native-fast-tflite | FREE |
| USDA nutrition data | FREE |
| Development time | ~4-5 days |
| **Runtime cost** | **$0 forever** |

---

## Implementation Status

1. ✅ Plan documented
2. ✅ Install dependencies (`react-native-fast-tflite`, `react-native-worklets-core`)
3. ✅ Download TFLite model (`assets/models/food_v1.tflite` - 21MB)
4. ✅ Create nutrition database (`data/food101Nutrition.ts`)
5. ✅ Create label mappings (`data/food101Labels.ts`)
6. ✅ Implement FoodRecognitionService (`services/FoodRecognitionService.ts`)
7. ✅ Update ModeToggle component (3 modes: Barcode, Label, Identify)
8. ✅ Create FoodIdentifyOverlay component
9. ✅ Create FoodResultModal component
10. ✅ Update scanner screen with Identify mode
11. ✅ Update metro.config.js for .tflite assets
12. ✅ Create babel.config.js for worklets plugin

## Testing Notes

**Requires Development Build** - The TFLite model will NOT work in Expo Go.

To test:
```bash
# Clean and rebuild
npx expo prebuild --clean
npx expo run:ios
# or
npx expo run:android
```
