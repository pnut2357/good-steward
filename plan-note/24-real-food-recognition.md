# Phase 4: Real Food Recognition (Planned)

> **Created**: December 21, 2024  
> **Status**: 📋 Planned (v2.0)  
> **Priority**: Medium  
> **Complexity**: High

---

## Overview

### The Problem
Currently, Good Steward works great for **packaged products** (barcode → database lookup). But users also want to analyze **real/unpackaged food**:

| Works Now ✅ | Needs Work 🔮 |
|--------------|---------------|
| Packaged snacks with barcode | Homemade meals |
| Branded products | Restaurant dishes |
| Nutrition labels | Fresh fruits/vegetables |
| | Prepared foods without packaging |

### The Goal
Take a photo of any food → Identify what it is → Estimate nutrition

```
📸 Photo of Plate
       ↓
🤖 Food Recognition AI
       ↓
🍕 "Pizza Margherita"
       ↓
📊 Estimated: 250 kcal, 12g fat, 8g protein...
```

---

## Research: Existing Solutions

### Reference Projects

#### 1. [FoodCalorieEstimation](https://github.com/virajmane/FoodCalorieEstimation)
- **Tech**: Python + Azure deployment
- **Approach**: Image → AI Vision → Calorie estimation
- **Demo**: https://foood.azurewebsites.net
- **Pros**: Simple, working demo
- **Cons**: Server-based, not mobile-native

#### 2. [Food101](https://github.com/GantMan/Food101)
- **Tech**: React Native + CoreML
- **Approach**: On-device ML using Food-101 dataset
- **Model**: Trained on 101 food categories
- **Pros**: On-device, fast, free
- **Cons**: Limited to 101 categories, iOS-focused (CoreML)

#### 3. [react-native-fast-tflite](https://github.com/mrousavy/react-native-fast-tflite)
- **Tech**: TensorFlow Lite for React Native
- **Approach**: Run any TFLite model on-device
- **Features**: GPU acceleration, frame processor support
- **Pros**: Fast, cross-platform, any model
- **Cons**: Requires development build, model selection

### Food Recognition Datasets
| Dataset | Categories | Images | Use Case |
|---------|------------|--------|----------|
| **Food-101** | 101 | 101,000 | General food recognition |
| **Food-2K** | 2,000 | 1M+ | More categories |
| **Nutrition5K** | 5,000 | Real portions with measured nutrition |

---

## Approach Options

### Option A: On-Device TensorFlow Lite (Recommended)
**Cost: FREE | Latency: ~50-200ms | Offline: YES**

```
┌─────────────────────────────────────────────────────────────┐
│  APPROACH A: On-Device TFLite                               │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  📸 Camera Frame                                            │
│         ↓                                                   │
│  🧠 TFLite Food-101 Model (on-device)                      │
│         ↓                                                   │
│  🏷️ "pizza" (confidence: 0.92)                             │
│         ↓                                                   │
│  📊 Lookup nutrition in local database                      │
│         ↓                                                   │
│  📱 Display: ~250 kcal per serving                         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Dependencies:**
```json
{
  "react-native-fast-tflite": "^1.x",
  "react-native-vision-camera": "^4.x"
}
```

**Pros:**
- ✅ Completely free
- ✅ Works offline
- ✅ Fast (50-200ms)
- ✅ No API costs ever
- ✅ Privacy (images never leave device)

**Cons:**
- ❌ Requires development build
- ❌ Limited to trained categories (101-2000)
- ❌ Model file adds ~20-50MB to app size
- ❌ Less accurate than cloud AI

---

### Option B: Google ML Kit Image Labeling
**Cost: FREE | Latency: ~100-300ms | Offline: Partial**

```
┌─────────────────────────────────────────────────────────────┐
│  APPROACH B: ML Kit Image Labeling                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  📸 Photo                                                   │
│         ↓                                                   │
│  🏷️ ML Kit: ["food", "pizza", "cheese", "tomato"]         │
│         ↓                                                   │
│  🔍 Search USDA/OFF for "pizza"                            │
│         ↓                                                   │
│  📊 Average nutrition for "pizza"                          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Dependencies:**
```json
{
  "@react-native-ml-kit/image-labeling": "^1.x"
}
```

**Pros:**
- ✅ Free (on-device)
- ✅ Easy integration
- ✅ Already using ML Kit for OCR

**Cons:**
- ❌ Generic labels, not food-specific
- ❌ May return "food" instead of "pizza"
- ❌ Requires development build

---

### Option C: Cloud Vision API (Free Tier)
**Cost: FREE tier | Latency: ~500-2000ms | Offline: NO**

| Provider | Free Tier | Food-Specific |
|----------|-----------|---------------|
| **Google Cloud Vision** | 1,000/month | Generic labels |
| **Clarifai Food Model** | 5,000/month | ✅ Food-specific |
| **LogMeal API** | 50/day | ✅ Food + Nutrition |
| **Foodvisor API** | Limited | ✅ Food + Portions |

**Pros:**
- ✅ Most accurate
- ✅ Works in Expo Go
- ✅ No model bundling

**Cons:**
- ❌ Requires internet
- ❌ Free tiers have limits
- ❌ Latency (network round-trip)
- ❌ Privacy concerns

---

### Option D: Hybrid Approach (Recommended for v2)
**Best of both worlds**

```
┌─────────────────────────────────────────────────────────────┐
│  APPROACH D: Hybrid (On-Device + Cloud Fallback)            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  📸 Photo                                                   │
│         ↓                                                   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ TRY: On-Device TFLite (Food-101)                    │   │
│  │      Fast, free, offline                            │   │
│  └─────────────────────────────────────────────────────┘   │
│         │                                                   │
│    [Confidence < 70%?]                                     │
│         │                                                   │
│         ▼                                                   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ FALLBACK: Cloud API (Clarifai/LogMeal)              │   │
│  │           More accurate, uses free tier             │   │
│  └─────────────────────────────────────────────────────┘   │
│         │                                                   │
│         ▼                                                   │
│  📊 Nutrition Estimate                                      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Recommended Implementation Plan

### Phase 4A: Food Recognition MVP
**Timeline**: 2-3 days | **Complexity**: Medium

1. **Install react-native-fast-tflite**
   ```bash
   npm install react-native-fast-tflite
   npx expo run:ios  # Requires dev build
   ```

2. **Download Food-101 TFLite Model**
   - Source: [TensorFlow Hub](https://tfhub.dev/google/lite-model/aiy/vision/classifier/food_V1/1)
   - Size: ~5MB (quantized)
   - Categories: 101 food types

3. **Create FoodRecognitionService**
   ```typescript
   // services/FoodRecognitionService.ts
   import { TensorFlowLite } from 'react-native-fast-tflite';
   
   class FoodRecognitionService {
     private model: TensorFlowLite | null = null;
     
     async loadModel() {
       this.model = await TensorFlowLite.loadModel(
         require('../assets/models/food_v1.tflite')
       );
     }
     
     async recognizeFood(imageUri: string): Promise<{
       food: string;
       confidence: number;
     }> {
       // Run inference
     }
   }
   ```

4. **Create Nutrition Database for 101 Foods**
   ```typescript
   // data/food101Nutrition.ts
   export const FOOD_NUTRITION: Record<string, NutritionData> = {
     'pizza': { calories_100g: 266, protein_100g: 11, ... },
     'hamburger': { calories_100g: 295, protein_100g: 17, ... },
     'sushi': { calories_100g: 150, protein_100g: 6, ... },
     // ... 101 foods
   };
   ```

5. **Add "Identify Food" Mode to Scanner**
   - New mode toggle: Barcode | Photo | Identify
   - Real-time frame processing with TFLite
   - Show food name + nutrition estimate

### Phase 4B: Portion Estimation (Advanced)
**Timeline**: 3-5 days | **Complexity**: High

Use depth estimation or reference objects to estimate portion size:

```
📸 Photo with reference (coin, hand, plate)
         ↓
🤖 Detect food + estimate area
         ↓
📏 Calculate approximate grams
         ↓
📊 Nutrition per estimated portion
```

---

## Food-101 Categories

The Food-101 dataset includes these 101 categories:

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

## Nutrition Data Sources

### For Generic Food Categories

1. **USDA FoodData Central** (FREE)
   - Search API: `https://api.nal.usda.gov/fdc/v1/foods/search`
   - Has "generic" food entries (e.g., "pizza, cheese")
   
2. **OpenFoodFacts Generic Products**
   - Some products are generic (no brand)
   - Search: `https://world.openfoodfacts.org/cgi/search.pl?search_terms=pizza`

3. **Local Pre-computed Database**
   - Bundle average nutrition for 101 foods
   - Fastest, no API calls needed
   - ~10KB JSON file

### Example Nutrition Mapping
```typescript
// data/food101Nutrition.ts
export const FOOD_NUTRITION = {
  'pizza': {
    name: 'Pizza (cheese)',
    serving_g: 107,  // 1 slice
    calories_100g: 266,
    protein_100g: 11,
    carbs_100g: 33,
    fat_100g: 10,
    sugar_100g: 3.6,
    source: 'USDA FDC #174836'
  },
  'hamburger': {
    name: 'Hamburger',
    serving_g: 226,  // 1 burger
    calories_100g: 295,
    protein_100g: 17,
    carbs_100g: 24,
    fat_100g: 14,
    sugar_100g: 5,
    source: 'USDA FDC #170720'
  },
  // ... 99 more foods
};
```

---

## UI Design

### New Scanner Mode: "Identify Food"

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  [Barcode]    [Photo]    [🍽️ Identify]                     │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                                                     │   │
│  │                  📸 Camera View                     │   │
│  │                                                     │   │
│  │         Point at food to identify                  │   │
│  │                                                     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  🍕 Pizza                           92% confidence   │   │
│  │  Estimated: 266 kcal / 100g                         │   │
│  │                                                     │   │
│  │  [View Details]              [Log This]             │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Result View

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  🍕 Pizza (Identified)                                      │
│                                                             │
│  ⚠️ This is an AI estimate, not exact nutrition data.      │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  ESTIMATED NUTRITION (per 100g)                      │   │
│  │                                                     │   │
│  │  🔥 266 kcal    🍞 33g carbs                        │   │
│  │  💪 11g protein  🧈 10g fat                         │   │
│  │  🍬 3.6g sugar                                      │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  📏 Estimate your portion:                                  │
│  [1 slice ~107g]  [2 slices]  [Custom]                     │
│                                                             │
│  [Add to Log]                                               │
│                                                             │
│  ────────────────────────────────────────────────────────  │
│  ⚠️ DISCLAIMER: Nutrition values are estimates based on    │
│  average data. Actual values may vary significantly.       │
│  For accurate tracking, use packaged products with         │
│  nutrition labels.                                         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Dependencies to Add

```json
{
  "dependencies": {
    // For on-device food recognition
    "react-native-fast-tflite": "^1.5.0",
    
    // For camera frame processing (already have expo-camera)
    "react-native-vision-camera": "^4.0.0",  // Optional: better frame processing
    
    // For GPU acceleration (optional)
    "react-native-worklets-core": "^1.0.0"
  }
}
```

**Note**: These require a **development build** (`npx expo run:ios`).

---

## Files to Create

| File | Purpose |
|------|---------|
| `services/FoodRecognitionService.ts` | TFLite model loading & inference |
| `data/food101Nutrition.ts` | Pre-computed nutrition for 101 foods |
| `data/food101Labels.ts` | Category labels for model output |
| `components/FoodIdentifyOverlay.tsx` | Real-time recognition UI |
| `assets/models/food_v1.tflite` | TensorFlow Lite model (~5MB) |

---

## Alternative: Simpler MVP

If TFLite integration is too complex for v2, consider:

### Simpler Option: Manual Food Selection

```
📸 Take photo (for reference)
         ↓
🔍 Search: "What did you eat?"
         ↓
📋 Select from common foods list
         ↓
📊 Show nutrition + log consumption
```

This avoids ML entirely but still provides value for unpackaged foods.

---

## Cost Summary

| Approach | Setup Cost | Runtime Cost | Offline |
|----------|------------|--------------|---------|
| **TFLite on-device** | Free | Free | ✅ Yes |
| **ML Kit Labels** | Free | Free | ✅ Yes |
| **Clarifai** | Free | 5K/month free | ❌ No |
| **LogMeal** | Free | 50/day free | ❌ No |
| **Manual Selection** | Free | Free | ✅ Yes |

**Recommendation**: Start with TFLite on-device (Option A) for v2.0, add cloud fallback later if needed.

---

## Timeline Estimate

| Phase | Task | Time |
|-------|------|------|
| 4A.1 | Setup react-native-fast-tflite | 0.5 day |
| 4A.2 | Download & integrate Food-101 model | 0.5 day |
| 4A.3 | Create FoodRecognitionService | 1 day |
| 4A.4 | Build nutrition database (101 foods) | 0.5 day |
| 4A.5 | Add "Identify" mode to scanner | 1 day |
| 4A.6 | Testing & refinement | 1 day |
| **Total** | | **4-5 days** |

---

## References

- [Food-101 Dataset](https://www.vision.ee.ethz.ch/datasets_extra/food-101/)
- [TensorFlow Hub Food Model](https://tfhub.dev/google/lite-model/aiy/vision/classifier/food_V1/1)
- [react-native-fast-tflite](https://github.com/mrousavy/react-native-fast-tflite)
- [GantMan/Food101](https://github.com/GantMan/Food101) - React Native example
- [FoodCalorieEstimation](https://github.com/virajmane/FoodCalorieEstimation) - Python example
- [USDA FoodData Central](https://fdc.nal.usda.gov/)

