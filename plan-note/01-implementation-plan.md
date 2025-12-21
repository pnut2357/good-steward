# 🌿 Good Steward App - Implementation Plan (Refined)

## Overview

A food scanner app that analyzes **barcodes** AND **photos** using AI, storing results locally for offline access. Inspired by the Yuka app with an AI-powered analysis layer.

**Architecture:** Offline-First + Modular OOP  
**Framework:** Expo SDK 54 (React Native) + TypeScript  
**AI:** Groq SDK (Llama 3.1 text + Llama 3.2 vision)  
**Database:** expo-sqlite (synchronous API)  
**Navigation:** expo-router (file-based)

## 📷 Dual Input Modes

| Mode | Use Case | AI Model |
|------|----------|----------|
| **Barcode** | Packaged products | `llama-3.1-8b-instant` |
| **Photo** | Fresh food, meals, no-barcode items | `llama-3.2-11b-vision-preview` |  

---

## 📁 Target Folder Structure

```
good-steward/
├── app/
│   ├── (tabs)/
│   │   ├── index.tsx         ← Scanner (Home)
│   │   ├── history.tsx       ← Scan History
│   │   ├── about.tsx         ← Mission & Credits
│   │   └── _layout.tsx       ← Tab Configuration
│   ├── _layout.tsx           ← App Entry (Providers)
│   └── +not-found.tsx
├── components/
│   ├── ScannerOverlay.tsx    ← Green targeting frame
│   ├── ResultModal.tsx       ← Analysis result popup
│   └── HistoryItem.tsx       ← Single history row
├── services/
│   ├── DatabaseService.ts    ← SQLite Manager (Singleton)
│   └── AnalysisService.ts    ← AI & API Manager (Singleton)
├── models/
│   └── ScanResult.ts         ← TypeScript Interface
├── assets/
│   └── images/
├── plan-note/                ← This documentation folder
├── .env                      ← EXPO_PUBLIC_GROQ_API_KEY
├── app.json
└── package.json
```

---

## 🎨 Design Theme (Yuka-Inspired)

| Element | Value | Usage |
|---------|-------|-------|
| Primary Color | `#2E7D32` | Emerald Green - safe products, buttons |
| Secondary | `#F57C00` | Orange - caution products |
| Danger | `#D32F2F` | Red - avoid products |
| Background | `#FFFFFF` | White - main background |
| Surface | `#F5F5F5` | Light Gray - cards, boxes |
| Text Primary | `#212121` | Dark - main text |
| Text Subtle | `#757575` | Gray - secondary text |
| Border Radius | 12-16px | Rounded corners |
| Font | System default | Platform native |

---

## 📋 Implementation Phases

### Phase 1: Dependencies & Setup
Install expo-camera, expo-sqlite, groq-sdk, axios. Create folder structure.

### Phase 2: Data Model
Create `ScanResult` TypeScript interface.

### Phase 3: Database Service
SQLite singleton for local storage.

### Phase 4: Analysis Service (AI + API)
OpenFoodFacts fetching + Groq AI analysis.

### Phase 5: UI Components
ScannerOverlay, ResultModal, HistoryItem.

### Phase 6: Scanner Screen
Main camera screen with barcode detection.

### Phase 7: History Screen
List of past scans with safety indicators.

### Phase 8: About Screen
Mission statement, how it works, credits.

### Phase 9: Tab Navigation
Configure tab bar with icons.

### Phase 10: Environment & Polish
API keys, testing, final touches.

---

## 📱 App Flow (Detailed)

```
┌─────────────────────────────────────────────────────────┐
│                    APP LAUNCH                           │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│                  SCANNER SCREEN                         │
│  ┌───────────────────────────────────────────────────┐  │
│  │    [🔲 Barcode]  │  [📷 Photo]   ← Mode Toggle   │  │
│  └───────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────┐  │
│  │                  Camera View                      │  │
│  │                                                   │  │
│  │     ┌───────────────────────────┐                 │  │
│  │     │   [Scan Frame / Photo]   │                 │  │
│  │     │                           │                 │  │
│  │     └───────────────────────────┘                 │  │
│  │                                                   │  │
│  │   "Point at barcode" / "Center food, tap 📷"     │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                           │
                    Barcode Detected
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│              OFFLINE-FIRST CHECK                        │
│                                                         │
│   dbService.getScan(barcode)                            │
│                           │                             │
│          ┌────────────────┼────────────────┐            │
│          │                │                │            │
│       FOUND          NOT FOUND        NOT FOUND         │
│   (from cache)     (with network)   (no network)        │
│          │                │                │            │
│          ▼                ▼                ▼            │
│      Use cached    Fetch from API    Show error         │
│       result       + AI analysis                        │
│          │                │                             │
│          │                ▼                             │
│          │        Save to SQLite                        │
│          │                │                             │
│          └────────────────┴─────────┐                   │
│                                     │                   │
└─────────────────────────────────────│───────────────────┘
                                      ▼
┌─────────────────────────────────────────────────────────┐
│                   RESULT MODAL                          │
│  ┌───────────────────────────────────────────────────┐  │
│  │                                                   │  │
│  │         ✓ Good Choice!                            │  │
│  │              or                                   │  │
│  │         ⚠ Use Caution                             │  │
│  │                                                   │  │
│  │    Product Name                                   │  │
│  │                                                   │  │
│  │    ┌─────────────────────────────────────────┐    │  │
│  │    │ AI Analysis                             │    │  │
│  │    │ "This product contains high sugar..."   │    │  │
│  │    └─────────────────────────────────────────┘    │  │
│  │                                                   │  │
│  │    Ingredients: Sugar, Flour, ...                │  │
│  │                                                   │  │
│  │    [──────────── Done ────────────]              │  │
│  │                                                   │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                           │
                    User taps Done
                           │
                           ▼
              Reset scanner, allow new scan
```

---

## 🔗 External Services

### OpenFoodFacts API
- **Endpoint:** `https://world.openfoodfacts.org/api/v2/product/{barcode}.json`
- **Cost:** Free (open database)
- **Authentication:** None required
- **Data:** Product name, ingredients, Nutriscore, nutrition facts
- **Coverage:** 3+ million products worldwide

### Groq AI
- **Model:** `llama-3.1-8b-instant` (fast) or `llama-3.1-70b-versatile` (detailed)
- **Cost:** Free tier available (14,400 requests/day)
- **Authentication:** API key required
- **Purpose:** Analyze ingredients and provide health assessment

---

## 📊 Database Schema

```sql
CREATE TABLE scans (
  barcode TEXT PRIMARY KEY,       -- Product barcode (EAN/UPC)
  name TEXT,                      -- Product name
  ingredients TEXT,               -- Ingredients list
  summary TEXT,                   -- AI-generated summary
  isSafe INTEGER,                 -- 1 = safe, 0 = caution
  timestamp TEXT                  -- ISO 8601 timestamp
);
```

---

## ✅ Progress Tracker

- [ ] Phase 1: Dependencies & Setup
- [ ] Phase 2: Data Model
- [ ] Phase 3: Database Service
- [ ] Phase 4: Analysis Service
- [ ] Phase 5: UI Components
- [ ] Phase 6: Scanner Screen
- [ ] Phase 7: History Screen
- [ ] Phase 8: About Screen
- [ ] Phase 9: Navigation
- [ ] Phase 10: Polish & Testing

---

## 🧪 Testing Strategy

### Manual Testing
1. Scan known products (Coca-Cola: `5449000000996`)
2. Verify offline mode works after first scan
3. Check history persists after app restart
4. Test with unknown barcode (should handle gracefully)

### Test Barcodes
| Product | Barcode | Expected Result |
|---------|---------|-----------------|
| Coca-Cola | 5449000000996 | Caution (high sugar) |
| Nutella | 3017620406874 | Caution (sugar, palm oil) |
| Evian Water | 3068320122694 | Safe |
| Oreo | 7622210449283 | Caution (processed) |

---

## 📱 Device Compatibility

- **iOS:** 15.0+ (via Expo)
- **Android:** API 23+ (via Expo)
- **Camera:** Back camera with barcode scanning
- **Network:** Required for first scan, offline for cached

---

## ⚡ Performance Targets

| Scenario | Target | Maximum |
|----------|--------|---------|
| Cached product | < 200ms | 500ms |
| New product | < 2s | 4s |
| Timeout fallback | < 1s | 2s |

**Optimizations:**
- Groq's `llama-3.1-8b-instant` model (10x faster than GPT)
- SQLite cache checked first (instant for repeat scans)
- Short prompts (~100 tokens) for faster AI response
- Progressive loading messages for perceived speed

---

## 🔒 Privacy Considerations

1. **Local Storage:** All scan data stored on device only
2. **No User Accounts:** No personal information collected
3. **API Calls:** Only barcode sent to OpenFoodFacts
4. **AI Analysis:** Only product data sent to Groq (no user data)

---

*Refined Implementation Plan - December 2024*
