# Filter Mode Reference

> **Status**: ✅ Implemented  
> **Version**: 2.2

---

## Overview

Good Steward uses **user-controlled filters** to flag products based on the user's personal settings. This is NOT medical advice - it's a personal tracking tool.

**Key Principle**: The app never says "this is bad for you." Instead, it says "YOUR FILTER flagged this because it exceeds YOUR threshold."

---

## 1. Sugar Monitoring (Diabetes Mode)

### Settings

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `diabetesMode` | boolean | `false` | Enable/disable sugar checking |
| `sugarThreshold` | number | `10` | Flag products with sugar > this (g/100g) |

### How It Works

```typescript
// services/UserFilterService.ts → checkSugar()

if (profile.diabetesMode) {
  const sugar = product.nutrition?.sugar_100g;
  
  if (sugar !== undefined && sugar > profile.sugarThreshold) {
    warnings.push({
      level: sugar > profile.sugarThreshold * 2 ? 'danger' : 'warning',
      mode: 'sugar',
      fact: `${sugar}g sugar per 100g`,
      threshold: `Your threshold: ${profile.sugarThreshold}g`,
      message: `Sugar content (${sugar}g) exceeds your threshold (${profile.sugarThreshold}g)`,
      emoji: '🩸',
    });
  }
}
```

### User Experience

1. User goes to **Settings** → Enables **Sugar Monitoring**
2. User sets threshold (e.g., 10g per 100g)
3. User scans a product with 26g sugar
4. ResultModal shows:
   ```
   🩸 YOUR FILTER FLAGGED THIS
   Sugar Monitoring
   
   Sugar content (26g) exceeds your threshold (10g)
   
   Found: 26g sugar per 100g
   Setting: Your threshold: 10g
   ```

---

## 2. Pregnancy Mode

### Settings

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `pregnancyMode` | boolean | `false` | Enable/disable pregnancy warnings |

### What It Checks

**Ingredient Keywords:**
- Alcohol: `alcohol`, `wine`, `beer`, `spirits`, `liquor`, `vodka`, `whiskey`, `rum`
- Caffeine: `caffeine`, `coffee`, `espresso`, `guarana`, `energy drink`
- Raw Dairy: `raw milk`, `unpasteurized`, `lait cru`, `raw cheese`

**OpenFoodFacts Labels:**
- `en:not-recommended-for-pregnant-women`
- `en:contains-alcohol`

### How It Works

```typescript
// services/UserFilterService.ts → checkPregnancy()

if (profile.pregnancyMode) {
  const ingredients = (product.ingredients || '').toLowerCase();

  // Check for alcohol
  for (const keyword of PREGNANCY_KEYWORDS.alcohol) {
    if (ingredients.includes(keyword)) {
      warnings.push({
        level: 'danger',
        mode: 'pregnancy',
        fact: `Contains "${keyword}"`,
        threshold: 'Your pregnancy filter is active',
        message: `Ingredient list includes "${keyword}"`,
        emoji: '🤰',
      });
      break;
    }
  }

  // Check for caffeine
  for (const keyword of PREGNANCY_KEYWORDS.caffeine) {
    if (ingredients.includes(keyword)) {
      warnings.push({
        level: 'warning',
        mode: 'pregnancy',
        fact: `Contains "${keyword}"`,
        threshold: 'Your pregnancy filter is active',
        message: `Ingredient list includes "${keyword}"`,
        emoji: '🤰',
      });
      break;
    }
  }
}
```

### User Experience

1. User enables **Pregnancy Mode** in Settings
2. User scans a coffee drink
3. ResultModal shows:
   ```
   🤰 YOUR FILTER FLAGGED THIS
   Pregnancy Mode
   
   Ingredient list includes "caffeine"
   
   Found: Contains "caffeine"
   Setting: Your pregnancy filter is active
   ```

---

## 3. Allergy Mode

### Settings

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `allergyMode` | boolean | `false` | Enable/disable allergen checking |
| `allergens` | string[] | `[]` | User's allergen codes |
| `showTraces` | boolean | `true` | Also warn for "may contain" |

### Available Allergens

| Code | Display Name |
|------|--------------|
| `en:gluten` | Gluten |
| `en:milk` | Milk |
| `en:eggs` | Eggs |
| `en:peanuts` | Peanuts |
| `en:nuts` | Tree Nuts |
| `en:soybeans` | Soy |
| `en:fish` | Fish |
| `en:crustaceans` | Shellfish |
| `en:celery` | Celery |
| `en:mustard` | Mustard |
| `en:sesame` | Sesame |
| `en:sulphites` | Sulphites |

### How It Works

```typescript
// services/UserFilterService.ts → checkAllergens()

if (profile.allergyMode && profile.allergens.length > 0) {
  const productAllergens = product.allergens || [];
  const productTraces = product.traces || [];

  for (const userAllergen of profile.allergens) {
    // Check direct allergens
    if (productAllergens.includes(userAllergen)) {
      warnings.push({
        level: 'danger',
        mode: 'allergy',
        fact: `Contains ${formatAllergen(userAllergen)}`,
        threshold: `You flagged: ${formatAllergen(userAllergen)}`,
        message: `Product contains ${formatAllergen(userAllergen)}`,
        emoji: '⚠️',
      });
    }
    
    // Check traces (if enabled)
    else if (profile.showTraces && productTraces.includes(userAllergen)) {
      warnings.push({
        level: 'warning',
        mode: 'trace',
        fact: `May contain ${formatAllergen(userAllergen)}`,
        threshold: `You flagged: ${formatAllergen(userAllergen)} (including traces)`,
        message: `Product may contain traces of ${formatAllergen(userAllergen)}`,
        emoji: '⚠️',
      });
    }
  }
}
```

### User Experience

1. User enables **Allergy Mode** in Settings
2. User selects **Peanuts** and **Milk** as allergens
3. User enables **Show Traces**
4. User scans a chocolate bar with milk and "may contain peanuts"
5. ResultModal shows:
   ```
   ⚠️ YOUR FILTER FLAGGED THIS (2 warnings)
   
   [DANGER] Allergy Alert
   Product contains Milk
   Found: Contains Milk
   Setting: You flagged: Milk
   
   [WARNING] Trace Alert  
   Product may contain traces of Peanuts
   Found: May contain Peanuts
   Setting: You flagged: Peanuts (including traces)
   ```

---

## 4. Integration Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                      FILTER INTEGRATION FLOW                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. APP STARTUP                                                 │
│     ProfileService.loadProfile() → Caches user settings         │
│                                                                 │
│  2. PRODUCT SCANNED                                             │
│     AnalysisService.analyzeBarcode() → Returns ScanResult       │
│                                                                 │
│  3. RESULT MODAL OPENS                                          │
│     ResultModal useEffect:                                      │
│       → userFilterService.checkProductSync(result)              │
│       → Returns UserWarning[]                                   │
│       → Sets warnings state                                     │
│                                                                 │
│  4. WARNINGS DISPLAYED                                          │
│     {warnings.map((w) => <WarningCard warning={w} />)}          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 5. Files Reference

| File | Purpose |
|------|---------|
| `models/UserProfile.ts` | TypeScript interface for user settings |
| `services/ProfileService.ts` | Load/save profile with AsyncStorage |
| `services/UserFilterService.ts` | Check products against user profile |
| `components/WarningCard.tsx` | Display a single warning |
| `components/ResultModal.tsx` | Integrates warnings into product view |
| `app/(tabs)/settings.tsx` | UI for configuring all filter modes |

---

## 6. Testing Checklist

### Sugar Monitoring
- [ ] Enable Sugar Monitoring in Settings
- [ ] Set threshold to 10g
- [ ] Scan a high-sugar product (e.g., candy)
- [ ] Verify warning appears with correct values

### Pregnancy Mode
- [ ] Enable Pregnancy Mode in Settings
- [ ] Scan a product with alcohol (e.g., cooking wine)
- [ ] Verify DANGER warning appears
- [ ] Scan a product with caffeine (e.g., energy drink)
- [ ] Verify WARNING appears

### Allergy Mode
- [ ] Enable Allergy Mode in Settings
- [ ] Add Peanuts to your allergens
- [ ] Scan a product containing peanuts
- [ ] Verify DANGER warning appears
- [ ] Enable "Show Traces"
- [ ] Scan a product with "may contain peanuts"
- [ ] Verify WARNING appears for traces

### All Modes Off
- [ ] Disable all filter modes
- [ ] Scan any product
- [ ] Verify NO warnings appear (just nutrition facts)

---

## 7. Legal Note

All filter warnings clearly state:
- "YOUR FILTER flagged this"
- Reference to the user's specific threshold/setting
- No health advice or recommendations

This ensures the app is an **information tool**, not a medical device.

