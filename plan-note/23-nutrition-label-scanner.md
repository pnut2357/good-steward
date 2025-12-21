# Nutrition Label Scanner

> **Created**: December 21, 2024  
> **Status**: ✅ Complete  
> **Files**: `NutritionLabelScanner.tsx`, `OCRService.ts`, `nutritionLabelParser.ts`

---

## Overview

When a product is found in the database but has **missing nutrition data**, users can:
1. **Scan the nutrition label** with their camera
2. **OCR extracts text** from the photo
3. **Parser identifies** nutrition values
4. **User reviews/edits** the values
5. **Save** updates the product in the database

---

## User Flow

```
┌──────────────────────────────────────────────────────────────┐
│  Product Found: "Banana Rum Pecans"                          │
│                                                              │
│  ⚠️ Nutrition Data Missing                                   │
│  Add nutrition info for accurate tracking.                   │
│                                                              │
│  [📷 Scan Label]        [✏️ Enter Manually]                 │
└──────────────────────────────────────────────────────────────┘
         │                         │
         ▼                         ▼
┌─────────────────────┐   ┌─────────────────────┐
│  CAMERA MODE        │   │  MANUAL ENTRY       │
│                     │   │                     │
│  Position label in  │   │  🔥 Calories: ___   │
│  the guide frame    │   │  🍬 Sugar: ___      │
│                     │   │  💪 Protein: ___    │
│  [📸 Capture]       │   │  🍞 Carbs: ___      │
└─────────────────────┘   │  🧈 Sat. Fat: ___   │
         │                │  🧂 Salt: ___       │
         ▼                │                     │
┌─────────────────────┐   │  [Save]             │
│  PROCESSING...      │   └─────────────────────┘
│                     │
│  Reading with       │
│  Cloud OCR...       │
│                     │
│  Using OCR.space    │
│  to extract text    │
└─────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│  REVIEW VALUES                                              │
│                                                             │
│  ☁️ Cloud OCR          Medium (67%)                         │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Extracted Values (per 100g)                        │   │
│  │                                                     │   │
│  │  🔥 Calories    🍬 Sugar    💪 Protein    🍞 Carbs  │   │
│  │     180            12g         4g           25g     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  [Edit Values]                    [Save & Use]              │
│                                                             │
│  [🔄 Retake Photo]                                          │
└─────────────────────────────────────────────────────────────┘
```

---

## Technical Implementation

### Files Structure

```
components/
├── NutritionLabelScanner.tsx  # Main modal component
├── NutritionEditor.tsx        # Manual entry form
├── ResultModal.tsx            # Shows "Scan Label" button

services/
├── OCRService.ts              # ML Kit + OCR.space fallback

utils/
├── nutritionLabelParser.ts    # Parse OCR text to nutrition values
```

### OCR Strategy

```
┌─────────────────────────────────────────────────────────────┐
│  Photo Captured                                             │
│         │                                                   │
│         ▼                                                   │
│  ┌─────────────────────┐                                   │
│  │ Try ML Kit OCR      │ ← On-device (fast, free)          │
│  │ (development build) │   Requires: npx expo run:ios      │
│  └──────────┬──────────┘                                   │
│             │                                               │
│     [Not available in Expo Go]                             │
│             │                                               │
│             ▼                                               │
│  ┌─────────────────────┐                                   │
│  │ OCR.space API       │ ← Cloud fallback                  │
│  │ (free tier)         │   25,000 requests/month           │
│  └──────────┬──────────┘   Engine 2 (optimized for labels) │
│             │                                               │
│             ▼                                               │
│  ┌─────────────────────┐                                   │
│  │ Parse Nutrition     │ ← nutritionLabelParser.ts         │
│  │ Values from Text    │                                   │
│  └─────────────────────┘                                   │
└─────────────────────────────────────────────────────────────┘
```

### OCR.space API

```typescript
// services/OCRService.ts

const formData = new FormData();
formData.append('base64Image', `data:image/jpeg;base64,${base64}`);
formData.append('language', 'eng');
formData.append('OCREngine', '2');  // Better for labels/receipts
formData.append('detectOrientation', 'true');
formData.append('scale', 'true');

const response = await fetch('https://api.ocr.space/parse/image', {
  method: 'POST',
  headers: {
    'apikey': 'K85858573088957',  // Free demo key
  },
  body: formData,
});

const data = await response.json();
const extractedText = data.ParsedResults[0].ParsedText;
```

### Nutrition Parser

Extracts values from OCR text using regex patterns:

```typescript
// utils/nutritionLabelParser.ts

const PATTERNS = {
  calories: [
    /calories[:\s*]*(\d+(?:\.\d+)?)/i,
    /energy[:\s*]*(\d+(?:\.\d+)?)\s*(?:kcal|cal)/i,
  ],
  sugar: [
    /sugars?[:\s*]*(\d+(?:\.\d+)?)\s*g/i,
    /of which sugars?[:\s*]*(\d+(?:\.\d+)?)\s*g/i,
  ],
  protein: [
    /protein[:\s*]*(\d+(?:\.\d+)?)\s*g/i,
  ],
  // ... more patterns
};

export function parseNutritionLabel(ocrText: string): Partial<NutritionData> {
  const result: Partial<NutritionData> = {};
  
  // Extract each nutrition value
  const calories = extractValue(ocrText, PATTERNS.calories);
  if (calories !== undefined) {
    result.calories_100g = calories;
  }
  // ... extract other values
  
  return result;
}
```

### Expo SDK 54 File API

```typescript
// Reading image as base64 (new API)
import { File } from 'expo-file-system';

const file = new File(imageUri);
const base64 = await file.base64();
```

---

## Component: NutritionLabelScanner

### Props
```typescript
type Props = {
  visible: boolean;
  productName: string;
  onSave: (nutrition: NutritionData) => void;
  onClose: () => void;
};
```

### States
```typescript
const [step, setStep] = useState<'camera' | 'processing' | 'review' | 'edit'>('camera');
const [photoUri, setPhotoUri] = useState<string | null>(null);
const [ocrText, setOcrText] = useState('');
const [parsedNutrition, setParsedNutrition] = useState<Partial<NutritionData>>({});
const [confidence, setConfidence] = useState(0);
const [ocrSource, setOcrSource] = useState<'mlkit' | 'groq-vision' | 'none'>('none');
```

### Flow
1. **Camera**: User positions label, taps capture
2. **Processing**: Shows spinner, calls OCR service
3. **Review**: Shows extracted values, confidence score
4. **Edit**: Manual input form (optional)

---

## Component: NutritionEditor

Simple form for manual nutrition entry:

```typescript
type Props = {
  visible: boolean;
  productName: string;
  initialNutrition?: NutritionData;
  onSave: (nutrition: NutritionData) => void;
  onClose: () => void;
};
```

Fields:
- 🔥 Calories (kcal/100g)
- 🍬 Sugar (g/100g)
- 💪 Protein (g/100g)
- 🍞 Carbs (g/100g)
- 🧈 Saturated Fat (g/100g)
- 🧂 Salt (g/100g)

---

## Integration Points

### ResultModal
Shows "Scan Label" / "Enter Manually" buttons when nutrition is missing:

```tsx
{!hasCalories && canAddNutrition && (
  <View style={styles.missingNutritionContainer}>
    <Text>⚠️ Nutrition Data Missing</Text>
    <View style={styles.missingNutritionActions}>
      <Pressable onPress={() => setLabelScannerVisible(true)}>
        <Text>📷 Scan Label</Text>
      </Pressable>
      <Pressable onPress={() => setNutritionEditorVisible(true)}>
        <Text>✏️ Enter Manually</Text>
      </Pressable>
    </View>
  </View>
)}

<NutritionLabelScanner
  visible={labelScannerVisible}
  productName={result.name}
  onSave={handleNutritionSave}
  onClose={() => setLabelScannerVisible(false)}
/>
```

### DatabaseService
Updates nutrition for a product:

```typescript
public updateNutrition(barcode: string, nutrition: NutritionData): void {
  const scan = this.cache.get(barcode);
  if (scan) {
    scan.nutrition = { ...scan.nutrition, ...nutrition };
    this.cache.set(barcode, scan);
    this.saveToPersistence();
  }
}
```

---

## API Limits & Costs

| Service | Cost | Limit |
|---------|------|-------|
| **OCR.space** | FREE | 25,000 requests/month |
| **ML Kit** | FREE | Unlimited (on-device) |

### OCR.space Free Tier
- Demo API key: `K85858573088957`
- 25,000 requests/month
- Max file size: 1MB
- Engine 2 recommended for labels

### Getting Your Own Key
For higher limits, get a free key at: https://ocr.space/ocrapi

---

## Troubleshooting

### "Could Not Read Label"
- Ensure good lighting
- Position label flat, not angled
- Try again or enter manually

### Low Confidence Score
- Review/edit values before saving
- Check that label is in English
- Ensure text is not blurry

### OCR Not Working in Expo Go
- This is expected - ML Kit requires a development build
- The app automatically falls back to OCR.space
- For best results: `npx expo run:ios`

