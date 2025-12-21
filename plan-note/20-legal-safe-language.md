# 20. Legal-Safe Language Guidelines

## ⚖️ Critical: Avoid Medical/Health Claims

**Good Steward is an INFORMATION TOOL, not a HEALTH ADVISOR.**

The app must NEVER:
- Tell users what is "good" or "bad" for them
- Recommend eating or avoiding specific foods
- Make health claims about products
- Provide medical advice

---

## Language Comparison

### ❌ DANGEROUS (Lawsuit Risk)

| Phrase | Problem |
|--------|---------|
| "Good choice!" | Health recommendation |
| "Not safe" / "Safe" | Medical judgment |
| "Healthy" / "Unhealthy" | Health claim |
| "You should avoid this" | Medical advice |
| "Good for diabetics" | Medical claim |
| "Safe during pregnancy" | Medical advice |
| "This is bad for you" | Personal health judgment |

### ✅ SAFE (Information Only)

| Phrase | Why it's safe |
|--------|---------------|
| "Sugar: 15g per 100g" | Factual label data |
| "Contains: Peanuts" | Factual allergen list |
| "Nutriscore: D" | Official third-party rating |
| "NOVA Group: 4 (Ultra-processed)" | Official classification |
| "Ingredients: Sugar, Palm Oil, Salt..." | Label transcription |
| "⚠️ Flagged by your Diabetes mode" | User's own setting |

---

## The Legal Protection Strategy

### 1. Report Facts, Not Opinions

```
❌ "This product has too much sugar"
✅ "Sugar content: 25g per 100g"

❌ "Not recommended for diabetics"
✅ "Your Diabetes Mode flags items with >10g sugar. This item has 25g."

❌ "Dangerous allergen detected"
✅ "Contains: Peanuts. Your profile includes peanut sensitivity."
```

### 2. User-Controlled Filtering

The app doesn't decide what's "safe" - the USER sets their own thresholds:

```typescript
// User Profile (set by user, not app)
{
  diabetesMode: true,
  sugarThreshold: 10,  // User's choice
  allergens: ['peanuts', 'gluten'],  // User's list
  pregnancyMode: false
}
```

When a warning appears, it's because of **the user's own settings**, not the app's judgment.

### 3. Attribution to Official Sources

Always cite where the data comes from:

```
Nutrition data from OpenFoodFacts.org
Nutriscore rating by Santé Publique France
```

---

## Updated Data Model

### OLD Model (Remove)
```typescript
interface ScanResult {
  isSafe: boolean;        // ❌ REMOVE
  summary: string;        // ❌ REMOVE if judgmental
}
```

### NEW Model
```typescript
interface ScanResult {
  barcode: string;
  name: string;
  brand?: string;
  
  // Factual nutrition data
  nutrition: {
    sugar_100g?: number;
    carbs_100g?: number;
    fat_100g?: number;
    salt_100g?: number;
    calories_100g?: number;
    nutriscore?: string;  // 'a' | 'b' | 'c' | 'd' | 'e'
    nova?: number;        // 1 | 2 | 3 | 4
  };
  
  // Factual allergen data
  allergens: string[];    // ['en:peanuts', 'en:milk']
  traces: string[];       // ['en:tree-nuts']
  
  // Raw ingredients text (from label)
  ingredients: string;
  
  // User-triggered warnings (NOT app judgments)
  userWarnings: UserWarning[];
  
  // Metadata
  timestamp: string;
  source: 'barcode' | 'photo' | 'search';
  dataSource: string;     // "OpenFoodFacts.org"
}

interface UserWarning {
  mode: 'diabetes' | 'pregnancy' | 'allergy' | 'custom';
  triggerValue: string;   // "25g sugar per 100g"
  userThreshold: string;  // "Your setting: flag items > 10g"
  message: string;        // "Flagged by your Diabetes mode"
}
```

---

## Warning Message Templates

### Diabetes Mode
```
⚠️ DIABETES MODE ALERT

This product contains 25g sugar per 100g.
Your filter flags items exceeding 10g sugar.

[This is based on your personal settings, not medical advice.]
```

### Pregnancy Mode
```
⚠️ PREGNANCY MODE ALERT

Ingredient list includes: "Alcohol (12%)"
Your filter flags products containing alcohol.

[Consult your healthcare provider for dietary guidance.]
```

### Allergy Mode
```
⚠️ ALLERGY ALERT

This product CONTAINS: Peanuts
Your profile includes: Peanut sensitivity

Also check "May contain traces of": Tree nuts

[Verify ingredients on actual packaging before consuming.]
```

---

## Disclaimer Text (Required)

Add to About screen and app footer:

```
DISCLAIMER

Good Steward provides nutritional information from public databases.
This app does NOT provide medical advice.

• Always read the actual product label
• Consult healthcare providers for dietary guidance
• Data accuracy depends on third-party sources
• User-set filters are personal preferences, not medical recommendations

Nutrition data: OpenFoodFacts.org
Nutriscore: Santé Publique France
```

---

## UI Changes

### Remove
- ❌ "Good Steward" / "Caution" badges
- ❌ Green checkmark / Red X icons for "safe/unsafe"
- ❌ "Safe to eat" / "Avoid" language
- ❌ Health scores (0-100 "safety score")

### Keep/Add
- ✅ Factual nutrition display
- ✅ Allergen list (from label)
- ✅ Official ratings (Nutriscore, NOVA)
- ✅ User-mode warnings with clear attribution
- ✅ "Based on your [Mode] settings" labels
- ✅ Disclaimer footer

---

## Code Changes Required

### 1. Update ScanResult Model
Remove `isSafe`, add structured nutrition/allergen data

### 2. Update MedicalSafetyService
Rename to `UserFilterService` - emphasize it's USER filters, not medical advice

### 3. Update ResultModal
- Show factual data prominently
- Warnings clearly labeled as "Your [Mode] flagged this"
- Add disclaimer text

### 4. Update AnalysisService
- Remove AI "health judgment" prompts
- Just extract and display facts

### 5. Add Disclaimer
- About screen
- Result modal footer
- Settings screen

---

## Example: Before & After

### BEFORE (Risky)
```
╔════════════════════════════════════╗
║  🍫 Chocolate Bar                  ║
║                                    ║
║  ❌ NOT SAFE                       ║
║                                    ║
║  This product is unhealthy.        ║
║  High sugar content is bad for     ║
║  diabetics. Avoid this product.    ║
╚════════════════════════════════════╝
```

### AFTER (Safe)
```
╔════════════════════════════════════╗
║  🍫 Chocolate Bar                  ║
║  Brand: Example Co.                ║
║                                    ║
║  NUTRITION (per 100g)              ║
║  Sugar: 52g | Carbs: 58g           ║
║  Fat: 31g  | Calories: 546         ║
║  Nutriscore: E | NOVA: 4           ║
║                                    ║
║  ALLERGENS                         ║
║  Contains: Milk, Soy               ║
║  May contain: Tree nuts            ║
║                                    ║
║  ─────────────────────────────────║
║  ⚠️ YOUR DIABETES MODE             ║
║  Sugar (52g) exceeds your          ║
║  threshold (10g)                   ║
║  ─────────────────────────────────║
║                                    ║
║  Data: OpenFoodFacts.org           ║
║  Not medical advice. Verify label. ║
╚════════════════════════════════════╝
```

---

## Summary

| Aspect | Old Approach | New Approach |
|--------|--------------|--------------|
| Judgment | App decides safe/unsafe | User sets filters |
| Language | "Good/Bad choice" | "Contains X amount" |
| Warnings | "Dangerous!" | "Flagged by YOUR mode" |
| Liability | App makes claims | App reports facts |
| Source | Implied authority | Cited (OpenFoodFacts) |

