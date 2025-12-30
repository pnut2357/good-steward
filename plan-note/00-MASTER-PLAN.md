# Good Steward - Master Plan

> **Last Updated**: December 25, 2024  
> **Status**: Phase 4 Complete (Vision LLM + TFLite Hybrid)  
> **Version**: 4.0 (Real Food Recognition with Vision LLM)

---

## 📋 Table of Contents

1. [Project Overview](#1-project-overview)
2. [Architecture](#2-architecture)
3. [Implementation Status](#3-implementation-status)
4. [Completed Features](#4-completed-features)
5. [Phase 4: Real Food Recognition](#5-phase-4-real-food-recognition-planned) ← **PLANNED**
6. [Phase 5: Future Enhancements](#6-phase-5-future-enhancements)
7. [Free API Resources](#7-free-api-resources)
8. [Legal Compliance](#8-legal-compliance)
9. [Technical Reference](#9-technical-reference)
10. [File Index](#10-file-index)

---

## 1. Project Overview

### What is Good Steward?
A mobile app that helps users understand food products through:
- **Barcode scanning** → Get nutrition facts from OpenFoodFacts
- **Photo scanning** → Read ingredient labels with OCR
- **Nutrition label scanning** → Photograph labels to auto-fill nutrition data (NEW!)
- **User filters** → Personal alerts for diabetes, pregnancy, allergies
- **Consumption tracking** → Log what you eat, track daily/weekly/monthly stats
- **History** → Track scanned products offline

### Core Principles
| Principle | Implementation |
|-----------|----------------|
| **Offline-First** | SQLite caching, instant repeat scans |
| **100% Free** | No paid APIs, on-device ML + free cloud OCR |
| **Legal-Safe** | Facts only, no health claims |
| **User-Controlled** | Filters based on user settings |

### Tech Stack
| Layer | Technology |
|-------|------------|
| Framework | React Native (Expo SDK 54) |
| Language | TypeScript |
| Database | expo-sqlite (local) |
| Camera | expo-camera |
| OCR (on-device) | @react-native-ml-kit/text-recognition |
| OCR (cloud) | OCR.space API (free tier: 25K/month) |
| AI (optional) | Groq (text summaries only) |
| APIs | OpenFoodFacts, USDA FoodData Central, OpenFDA |

---

## 2. Architecture

### System Diagram
```
┌─────────────────────────────────────────────────────────────────┐
│                         GOOD STEWARD APP                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌────────┐│
│  │   Scanner   │  │   History   │  │   Settings  │  │ About  ││ ← UI
│  │   Screen    │  │   Screen    │  │   Screen    │  │ Screen ││
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └────────┘│
│         │                │                │                     │
├─────────┴────────────────┴────────────────┴─────────────────────┤
│                                                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │  Analysis   │  │  Database   │  │   User      │  ← Services │
│  │  Service    │  │  Service    │  │   Filter    │             │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘             │
│         │                │                │                     │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │    OCR      │  │   Profile   │  │  Nutrition  │             │
│  │  Service    │  │   Service   │  │   Parser    │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌────────┐│
│  │ OpenFood   │  │   SQLite    │  │ AsyncStorage│  │OCR.space│ ← Data
│  │ Facts API   │  │   (Local)   │  │  (Profile)  │  │  API   ││
│  └─────────────┘  └─────────────┘  └─────────────┘  └────────┘│
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Data Flow
```
BARCODE SCAN:
  Scan → Check SQLite Cache → [Hit?] → Return Cached
                            → [Miss?] → Fetch OpenFoodFacts → Cache → Return

PHOTO SCAN:
  Photo → ML Kit/OCR.space → Extract Text → Search OpenFoodFacts → Return

NUTRITION LABEL SCAN (NEW):
  Photo of Label → OCR.space → Parse Nutrition → Review/Edit → Save to Product

CONSUMPTION TRACKING (NEW):
  Product → "I Ate This" → Portion Modal → Calculate Nutrition → Log to DB
  History → Stats (7/30/90 days) → Daily Averages & Trends

USER FILTERS:
  Product Data + User Profile → Generate Warnings → Display
```

### Folder Structure
```
good-steward/
├── app/
│   ├── (tabs)/
│   │   ├── index.tsx          # Scanner screen
│   │   ├── history.tsx        # History + Consumption stats
│   │   ├── settings.tsx       # User filter settings
│   │   ├── about.tsx          # About screen
│   │   └── _layout.tsx        # Tab navigation
│   ├── _layout.tsx            # Root layout
│   └── +not-found.tsx         # 404 screen
├── components/
│   ├── ScannerOverlay.tsx     # Barcode scanner overlay
│   ├── PhotoOverlay.tsx       # Photo capture overlay
│   ├── ModeToggle.tsx         # Barcode/Photo mode toggle
│   ├── ResultModal.tsx        # Product details modal
│   ├── HistoryItem.tsx        # Single history item
│   ├── WarningCard.tsx        # User filter warning display
│   ├── SearchModal.tsx        # Product search when barcode fails
│   ├── PortionModal.tsx       # Portion size selector (NEW)
│   ├── DailySummaryCard.tsx   # Today's nutrition totals (NEW)
│   ├── ConsumptionStats.tsx   # 7/30/90 day statistics (NEW)
│   ├── NutritionLabelScanner.tsx  # Scan nutrition labels (NEW)
│   └── NutritionEditor.tsx    # Manual nutrition input (NEW)
├── services/
│   ├── AnalysisService.ts     # Barcode/photo analysis
│   ├── DatabaseService.ts     # SQLite + consumption tracking
│   ├── OCRService.ts          # ML Kit + OCR.space fallback
│   ├── UserFilterService.ts   # Check products vs user profile
│   └── ProfileService.ts      # User profile (AsyncStorage)
├── models/
│   ├── ScanResult.ts          # Product data + consumption records
│   └── UserProfile.ts         # User health filters
├── utils/
│   └── nutritionLabelParser.ts  # Parse OCR text to nutrition (NEW)
├── plan-note/                 # Documentation
├── assets/
└── .env
```

---

## 3. Implementation Status

### ✅ Phase 1: Core Features (COMPLETE)
| Component | Status | File |
|-----------|--------|------|
| Project Setup | ✅ | package.json |
| Data Model | ✅ | models/ScanResult.ts |
| Database Service | ✅ | services/DatabaseService.ts |
| Analysis Service | ✅ | services/AnalysisService.ts |
| Scanner Screen | ✅ | app/(tabs)/index.tsx |
| History Screen | ✅ | app/(tabs)/history.tsx |
| About Screen | ✅ | app/(tabs)/about.tsx |
| Tab Navigation | ✅ | app/(tabs)/_layout.tsx |
| UI Components | ✅ | components/*.tsx |

### ✅ Phase 2: User Filters & Legal (COMPLETE)
| Component | Status | File |
|-----------|--------|------|
| Legal-safe language | ✅ | All files |
| Remove isSafe/judgments | ✅ | models/ScanResult.ts |
| User Profile model | ✅ | models/UserProfile.ts |
| Profile Service | ✅ | services/ProfileService.ts |
| Settings Screen | ✅ | app/(tabs)/settings.tsx |
| User Filter Service | ✅ | services/UserFilterService.ts |
| Warning Cards | ✅ | components/WarningCard.tsx |
| Text Search (fallback) | ✅ | components/SearchModal.tsx |

### ✅ Phase 3: Consumption Tracking (COMPLETE)
| Component | Status | File |
|-----------|--------|------|
| Consumption fields | ✅ | models/ScanResult.ts |
| "I Ate This" button | ✅ | components/ResultModal.tsx |
| Portion Modal | ✅ | components/PortionModal.tsx |
| Daily Summary Card | ✅ | components/DailySummaryCard.tsx |
| History Filters (All/Today/Consumed) | ✅ | app/(tabs)/history.tsx |
| Consumption Statistics (7/30/90 days) | ✅ | components/ConsumptionStats.tsx |
| Period Stats (DatabaseService) | ✅ | services/DatabaseService.ts |

### ✅ Phase 3.5: Nutrition Label Scanner (COMPLETE)
| Component | Status | File |
|-----------|--------|------|
| Nutrition Editor | ✅ | components/NutritionEditor.tsx |
| Nutrition Label Scanner | ✅ | components/NutritionLabelScanner.tsx |
| Nutrition Parser | ✅ | utils/nutritionLabelParser.ts |
| OCR Service (ML Kit + OCR.space) | ✅ | services/OCRService.ts |
| Expo SDK 54 File API | ✅ | Using `new File().base64()` |

### ✅ Phase 4A: TFLite Food Recognition (COMPLETE)
| Component | Status | File |
|-----------|--------|------|
| TFLite model (21MB) | ✅ | assets/models/food_v1.tflite |
| FoodRecognitionService | ✅ | services/FoodRecognitionService.ts |
| Food-101 labels | ✅ | data/food101Labels.ts |
| Food-101 nutrition | ✅ | data/food101Nutrition.ts |
| FoodIdentifyOverlay | ✅ | components/FoodIdentifyOverlay.tsx |
| FoodResultModal | ✅ | components/FoodResultModal.tsx |
| "Identify" mode in scanner | ✅ | app/(tabs)/index.tsx |

### ✅ Phase 4B: Vision LLM Upgrade (COMPLETE)
| Component | Status | File |
|-----------|--------|------|
| VisionFoodService | ✅ | services/VisionFoodService.ts |
| HybridFoodService | ✅ | services/HybridFoodService.ts |
| Mixed plate modal | ✅ | components/HybridFoodResultModal.tsx |
| Groq Vision integration | ✅ | Uses Llama 3.2 Vision |
| Updated Identify overlay | ✅ | components/FoodIdentifyOverlay.tsx |

---

## 4. Completed Features

### 4.1 Barcode Scanning
- Scan EAN-13, EAN-8, UPC-A, UPC-E barcodes
- Instant lookup via OpenFoodFacts API
- USDA FoodData Central as backup
- Results cached in SQLite for offline access

### 4.2 Photo Analysis
- Capture photo of food/product
- ML Kit OCR (on-device, requires dev build)
- OCR.space fallback (cloud, works in Expo Go)
- Search OpenFoodFacts with extracted text

### 4.3 User Health Filters
| Mode | What it Does |
|------|--------------|
| **Diabetes Mode** | Warns when sugar exceeds user's threshold |
| **Pregnancy Mode** | Flags alcohol/caffeine (if enabled) |
| **Allergy Mode** | Alerts for selected allergens + traces |

### 4.4 Consumption Tracking
| Feature | Description |
|---------|-------------|
| **"I Ate This"** | Log products you consume |
| **Portion Selection** | Preset portions + custom grams |
| **Daily Summary** | Today's calories, sugar, protein, carbs |
| **Statistics** | 7/30/90 day averages with trend indicators |
| **History Filters** | View all scans, today only, or consumed items |

### 4.5 Nutrition Label Scanner (NEW!)
When product is found but nutrition data is missing:
1. **Scan Label** - Take photo of nutrition label
2. **OCR Processing** - Extract text via OCR.space API
3. **Auto-Parse** - Detect calories, sugar, protein, etc.
4. **Review & Edit** - User confirms/corrects values
5. **Save** - Updates product in database

```
┌──────────────────────────────────────────┐
│  ⚠️ Nutrition Data Missing               │
│  Add nutrition info for accurate tracking │
│                                          │
│  [📷 Scan Label]   [✏️ Enter Manually]  │
└──────────────────────────────────────────┘
```

---

## 5. Phase 4: Real Food Recognition

### Current Status

#### Phase 4A: TFLite Food-101 ✅ COMPLETE
| Component | Status | File |
|-----------|--------|------|
| TFLite model (21MB) | ✅ | `assets/models/food_v1.tflite` |
| FoodRecognitionService | ✅ | `services/FoodRecognitionService.ts` |
| Food-101 nutrition database | ✅ | `data/food101Nutrition.ts` |
| "Identify" mode UI | ✅ | `components/FoodIdentifyOverlay.tsx` |

**Limitations of Food-101:**
- ❌ Only 101 fixed food categories (2014 dataset)
- ❌ Can't identify mixed plates (burger + fries)
- ❌ No portion estimation
- ❌ Requires Development Build (not Expo Go)

#### Phase 4B: Vision LLM Upgrade 📋 PLANNED
Modern Vision LLMs (2025) can recognize **any food**, handle **mixed plates**, and **estimate portions**.

### Solution Options (2025)
| Approach | Cost | Speed | Offline | Accuracy | Mixed Plates | Expo Go |
|----------|------|-------|---------|----------|--------------|---------|
| **TFLite Food-101** (current) | FREE | 50-200ms | ✅ Yes | Limited (101) | ❌ No | ❌ No |
| **Vision LLM** (proposed) | FREE tier | 300-800ms | ❌ No | Excellent | ✅ Yes | ✅ Yes |
| **Hybrid** ⭐ (recommended) | FREE | Best of both | ✅ Fallback | Excellent | ✅ Yes | ✅ Yes |

### Recommended: Hybrid Architecture
```
┌─────────────────────────────────────────────────────────────────┐
│                 FOOD RECOGNITION FLOW (v2.0)                     │
├─────────────────────────────────────────────────────────────────┤
│  📸 User takes photo                                             │
│         │                                                        │
│     ┌───┴───┐                                                   │
│   Online   Offline                                               │
│     │         │                                                  │
│     ▼         ▼                                                  │
│  Vision    TFLite                                                │
│   LLM     (fallback)                                             │
│     │         │                                                  │
│     └────┬────┘                                                 │
│          ▼                                                       │
│  🍕 Pizza + 🍟 Fries + 🥗 Salad                                  │
│  Total: ~850 kcal                                                │
└─────────────────────────────────────────────────────────────────┘
```

### Best Free Vision LLMs (2025)
Source: [Koyeb Blog](https://www.koyeb.com/blog/best-multimodal-vision-models-in-2025)

| Model | Provider | Free Tier | Best For |
|-------|----------|-----------|----------|
| **Llama 3.2 Vision 90B** | Groq | ✅ ~14,400 req/day | Best accuracy |
| **Llama 3.2 Vision 11B** | Groq | ✅ ~14,400 req/day | Fast, mobile |
| **Qwen 2.5 VL 7B** | Together.ai | ✅ Free tier | Detailed analysis |
| **Gemma 3 4B** | Google | ✅ Free tier | Fast, 140+ languages |
| **Phi-4 Multimodal** | Microsoft | ✅ MIT license | Low latency |

### Phase 4B: FREE Vision APIs ✅ IMPLEMENTED
| Task | Status |
|------|--------|
| Get HuggingFace token (FREE) | ✅ User action |
| Create VisionFoodService.ts | ✅ Done |
| Create HybridFoodService.ts | ✅ Done |
| Update scanner for mixed plates | ✅ Done |
| Add BLIP caption parsing | ✅ Done |

**See**: 
- [24-real-food-recognition.md](./24-real-food-recognition.md) - Full implementation
- [26-vision-api-strategy.md](./26-vision-api-strategy.md) - FREE API strategy

---

## 6. Phase 5: Future Enhancements

### Potential Features
| Feature | Priority | Description |
|---------|----------|-------------|
| **Onboarding Flow** | High | First-time setup wizard |
| **Daily Goals** | High | Set calorie/sugar targets |
| **Favorites** | Medium | Quick-add frequently consumed items |
| **Export Data** | Medium | CSV export of consumption history |
| **Dark Mode** | Low | Theme toggle |
| **Meal Categories** | Low | Tag as Breakfast/Lunch/Dinner/Snack |

---

## 7. Free API Resources

### Active APIs (In Use) - ALL FREE
| API | Purpose | Cost | Limits |
|-----|---------|------|--------|
| **OpenRouter** ⭐ | AI Vision (Llama) | **FREE tier** | Rate limited |
| **OpenFoodFacts** | Barcode → Product data | **FREE** | Unlimited |
| **USDA FoodData Central** | US product backup | **FREE** | 3,600/hour |
| **OCR.space** | Cloud OCR for labels | **FREE** | 25,000/month |
| **SQLite** | Local caching | **FREE** | Unlimited |

### On-Device (Development Build Only)
| Service | Purpose | Cost |
|---------|---------|------|
| **ML Kit OCR** | On-device text recognition | FREE |
| **TFLite Food-101** | On-device food recognition (101 categories) | FREE |

### Vision API Priority (All FREE)
| Priority | Provider | Model | Notes |
|----------|----------|-------|-------|
| 1️⃣ | **OpenRouter** | Llama 3.2 11B | Free tier, high accuracy |
| 2️⃣ | **TFLite** | Food-101 | Offline fallback (dev build only) |

### Best Open Source Vision Models (2025)
Source: [Koyeb Blog](https://www.koyeb.com/blog/best-multimodal-vision-models-in-2025)

| Model | Developer | Size | License |
|-------|-----------|------|---------|
| **Llama 3.2 Vision** | Meta | 11B-90B | Llama License |
| **Gemma 3** | Google | 4B-27B | Open weights |
| **Qwen 2.5 VL** | Alibaba | 7B-72B | Apache 2.0 |

### Removed/Deprecated
| API | Reason |
|-----|--------|
| Hugging Face Serverless | **Unreliable** (404/410 errors) for free vision |
| Groq Vision | **Decommissioned** (Dec 2024) |
| Together.ai | Requires payment for vision models |

### API Endpoints
```typescript
// OpenFoodFacts - Barcode Lookup
GET https://world.openfoodfacts.org/api/v2/product/{barcode}.json

// OpenFoodFacts - Search by Name
GET https://world.openfoodfacts.org/cgi/search.pl?search_terms={query}&json=1

// USDA FoodData Central - Search
GET https://api.nal.usda.gov/fdc/v1/foods/search?query={query}&api_key={key}

// OCR.space - Image to Text
POST https://api.ocr.space/parse/image
Headers: apikey: K85858573088957 (free demo key)
Body: FormData with base64Image

// Groq AI - Text Analysis  
POST https://api.groq.com/openai/v1/chat/completions
Model: llama-3.1-8b-instant
```

---

## 8. Legal Compliance

### ⚖️ Core Principle
**Good Steward is an INFORMATION TOOL, not a HEALTH ADVISOR.**

### Language Rules
| ❌ NEVER Say | ✅ ALWAYS Say |
|--------------|---------------|
| "This is healthy/unhealthy" | "Sugar: 15g per 100g" |
| "Safe/Not safe" | "Contains: Peanuts" |
| "Good choice/Bad choice" | "Nutriscore: C" |
| "Avoid this" | "Your filter flagged this" |
| "Recommended for diabetics" | "Your Diabetes Mode is active" |

### Warning Attribution
All warnings are attributed to USER's settings:
```
⚠️ YOUR DIABETES MODE FLAGGED THIS

Sugar content: 25g per 100g
Your threshold: 10g

This is based on your personal settings.
```

### Required Disclaimers
Present in About screen and ResultModal footer.

---

## 9. Technical Reference

### Environment Variables
```bash
# .env
EXPO_PUBLIC_GROQ_API_KEY=gsk_xxxxx  # Optional - for AI summaries
```

### Key Dependencies
```json
{
  "expo": "~54.0.0",
  "expo-camera": "~16.0.0",
  "expo-sqlite": "~15.0.0",
  "expo-file-system": "~18.0.0",
  "groq-sdk": "^0.5.0",
  "axios": "^1.7.0",
  "@react-native-async-storage/async-storage": "^2.0.0",
  "@react-native-ml-kit/text-recognition": "^2.0.0",
  "expo-dev-client": "~5.0.0"
}
```

### Expo SDK 54 File API
```typescript
// OLD (deprecated):
import * as FileSystem from 'expo-file-system';
const base64 = await FileSystem.readAsStringAsync(uri, { encoding: 'base64' });

// NEW (SDK 54):
import { File } from 'expo-file-system';
const file = new File(uri);
const base64 = await file.base64();
```

### Development Commands
```bash
# Start Expo (Expo Go - cloud OCR only)
npx expo start

# Create iOS build (enables ML Kit on-device OCR)
npx expo run:ios

# Create Android build
npx expo run:android

# Clear cache and restart
npx expo start --clear
```

---

## 10. File Index

### Plan Documents
| # | File | Content |
|---|------|---------|
| 00 | **00-MASTER-PLAN.md** | This file - consolidated plan |
| 00 | 00-quick-reference.md | Quick command reference |
| 01 | 01-implementation-plan.md | Original Phase 1 details |
| 02 | 02-phase1-dependencies.md | Dependency installation |
| 03 | 03-phase2-data-model.md | ScanResult model |
| 04 | 04-phase3-database-service.md | DatabaseService |
| 05 | 05-phase4-analysis-service.md | AnalysisService |
| 06 | 06-phase5-ui-components.md | UI components |
| 07 | 07-phase6-scanner-screen.md | Scanner screen |
| 08 | 08-phase7-history-screen.md | History screen |
| 09 | 09-phase8-about-screen.md | About screen |
| 10 | 10-phase9-navigation.md | Tab navigation |
| 11 | 11-phase10-polish.md | Final polish |
| 12 | 12-reference-projects.md | Yuka-inspired projects |
| 13 | 13-api-reference.md | API documentation |
| 14 | 14-cost-analysis.md | Cost breakdown |
| 15 | 15-latency-optimization.md | Performance |
| 16 | 16-photo-analysis-feature.md | Photo feature (deprecated) |
| 17 | 17-new-photo-strategy.md | ML Kit OCR approach |
| 18 | 18-medical-safety-features.md | User filters |
| 19 | 19-free-api-resources.md | API summary |
| 20 | 20-legal-safe-language.md | Legal compliance |
| 21 | 21-consumption-tracking.md | Consumption tracking |
| 22 | 22-filter-mode-reference.md | Filter mode details |
| 23 | 23-nutrition-label-scanner.md | Scan nutrition labels with OCR |
| 24 | 24-real-food-recognition.md | **Phase 4**: Real food recognition |
| 25 | 25-deployment-checklist.md | Testing & deployment guide |
| 26 | 26-vision-api-strategy.md | **FREE** Vision API strategy |

### Source Files
| Category | Files |
|----------|-------|
| **Screens** | app/(tabs)/index.tsx, history.tsx, settings.tsx, about.tsx |
| **Services** | AnalysisService, DatabaseService, OCRService, ProfileService, UserFilterService |
| **Models** | ScanResult.ts, UserProfile.ts |
| **Components** | ResultModal, PortionModal, ConsumptionStats, NutritionLabelScanner, etc. |
| **Utils** | nutritionLabelParser.ts |
| **Config** | .env, metro.config.js, app.json |

---

## Changelog

### v4.1 (December 29, 2024)
- ✅ Switched to **100% FREE** Vision APIs
- ✅ HuggingFace BLIP as primary (no credit card required)
- ✅ OpenRouter as backup (free tier)
- ✅ Removed Together.ai (requires payment)
- ✅ Removed Groq Vision (decommissioned)
- ✅ Added 26-vision-api-strategy.md

### v4.0 (December 25, 2024)
- ✅ Phase 4A: TFLite Food-101 on-device recognition (101 categories)
- ✅ Phase 4B: Vision LLM upgrade (unlimited foods, mixed plates)
- ✅ Hybrid architecture (Vision LLM primary + TFLite offline fallback)
- ✅ VisionFoodService.ts - Vision API integration
- ✅ HybridFoodService.ts - Combines Vision + TFLite
- ✅ HybridFoodResultModal.tsx - Displays mixed plate results
- ✅ Updated FoodIdentifyOverlay - Shows which AI method will be used

### v3.0 (December 21, 2024)
- ✅ Consumption tracking with "I Ate This" button
- ✅ Portion selection modal
- ✅ Daily summary card (Today's intake)
- ✅ Consumption statistics (7/30/90 day periods with trends)
- ✅ Nutrition label scanner (photo → OCR → parse → save)
- ✅ Manual nutrition editor
- ✅ OCR.space integration (replaced deprecated Groq Vision)
- ✅ Expo SDK 54 File API migration

### v2.0
- ✅ User health filters (diabetes, pregnancy, allergies)
- ✅ Legal-safe language throughout
- ✅ Text search fallback
- ✅ Settings screen

### v1.0
- ✅ Barcode scanning
- ✅ Photo analysis
- ✅ History screen
- ✅ SQLite caching
