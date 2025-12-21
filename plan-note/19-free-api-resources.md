# 19. Free API Resources Summary

## The "Golden Stack" - 100% FREE APIs

| Category | Service | Purpose | Limits |
|----------|---------|---------|--------|
| **Nutrition DB** | OpenFoodFacts | Product info, nutrition, allergens | Unlimited |
| **Food Recalls** | OpenFDA | Safety alerts, recalls | Unlimited (no key for low volume) |
| **Vision/OCR** | Google ML Kit | Read text from photos (OFFLINE!) | Unlimited |
| **Search** | OFF Search API | Find product by name | Unlimited |
| **Text AI** | Groq | Analyze ingredients | 30 req/min free |

---

## 1. OpenFoodFacts (Already Integrated ✅)

### Barcode Lookup
```
GET https://world.openfoodfacts.org/api/v2/product/{barcode}.json
```

### Search by Name (NEW)
```
GET https://world.openfoodfacts.org/cgi/search.pl?search_terms={query}&json=1&page_size=10
```

### Key Fields for Medical Features
```json
{
  "nutriments": {
    "sugars_100g": 12.5,
    "carbohydrates_100g": 45.2
  },
  "allergens_tags": ["en:peanuts", "en:milk"],
  "traces_tags": ["en:tree-nuts"],
  "labels_tags": ["en:organic", "en:not-recommended-for-pregnant-women"],
  "ingredients_text": "Full ingredient list..."
}
```

---

## 2. OpenFDA Food Recalls (NEW)

### Endpoint
```
GET https://api.fda.gov/food/enforcement.json
```

### Search by Brand
```
?search=recalling_firm:"Jif"&limit=5
```

### Search by Product
```
?search=product_description:"peanut+butter"&limit=5
```

### Response
```json
{
  "results": [
    {
      "recall_number": "F-1234-2024",
      "reason_for_recall": "Potential Salmonella contamination",
      "status": "Ongoing",
      "product_description": "Peanut Butter 16oz",
      "recall_initiation_date": "2024-01-15"
    }
  ]
}
```

### No API Key Required!
- Low volume (< 1000/day): No authentication needed
- High volume: Free API key available

---

## 3. Google ML Kit (NEW - On-Device!)

### Library
```bash
npx expo install @react-native-ml-kit/text-recognition
```

### Usage
```typescript
import TextRecognition from '@react-native-ml-kit/text-recognition';

const result = await TextRecognition.recognize(imageUri);
const text = result.blocks.map(b => b.text).join(' ');
```

### Benefits
- ✅ **100% FREE** - no API calls
- ✅ **OFFLINE** - works without internet
- ✅ **FAST** - < 500ms
- ✅ **PRIVATE** - image never leaves device

### Requirements
- Needs Expo Development Build (not Expo Go)
- `npx expo run:ios` or `npx expo run:android`

---

## 4. Groq AI (Already Integrated ✅)

### Current Use
- Text analysis of ingredients
- Health summary generation

### Limits
- 30 requests/minute (free tier)
- Using `llama-3.1-8b-instant` for speed

### Cost Protection
- Nutriscore fallback when AI unavailable
- Short prompts (< 100 tokens)
- Aggressive timeout (8s)

---

## 5. Alternative Vision APIs (If Needed)

### Google Cloud Vision (Free Tier)
- 1,000 images/month free
- Good for label detection
- Requires API key

### Cloudinary AI (Free Tier)
- 25 credits/month
- Background removal, tagging
- Good for image processing

### Replicate (Pay-per-use)
- Many open-source models
- ~$0.0001 per prediction
- BLIP, CLIP, etc.

---

## API Decision Matrix

| Need | Best Choice | Why |
|------|-------------|-----|
| Read barcode | expo-camera | Built-in, fast |
| Get product info | OpenFoodFacts | Free, comprehensive |
| Read ingredient text | ML Kit OCR | Offline, free |
| Find product by name | OFF Search | Free, accurate |
| Check recalls | OpenFDA | Official, free |
| Analyze health | Groq (free) + Code | Fast, cheap |
| User profile | AsyncStorage | Local, free |

---

## Total Monthly Cost

| Service | Cost |
|---------|------|
| OpenFoodFacts | $0 |
| OpenFDA | $0 |
| ML Kit (on-device) | $0 |
| Groq (30 req/min) | $0 |
| AsyncStorage | $0 |
| **TOTAL** | **$0** |

---

## Implementation Priority

### Must Have (Free & Reliable)
1. ✅ OpenFoodFacts barcode lookup
2. ✅ Groq text analysis
3. 🆕 ML Kit OCR for photos
4. 🆕 OFF Search API
5. 🆕 Medical safety checks

### Nice to Have (Free Tier)
6. OpenFDA recalls
7. User profile storage
8. Settings screen

### Future (May Cost)
9. Premium AI features
10. Cloud sync
11. Social features

---

## Quick Start Code

### OFF Search
```typescript
async function searchProducts(query: string) {
  const url = `https://world.openfoodfacts.org/cgi/search.pl?` +
    `search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page_size=5`;
  const { data } = await axios.get(url);
  return data.products || [];
}
```

### FDA Recalls
```typescript
async function checkRecalls(brand: string) {
  const url = `https://api.fda.gov/food/enforcement.json?` +
    `search=recalling_firm:"${encodeURIComponent(brand)}"&limit=3`;
  const { data } = await axios.get(url, { timeout: 3000 });
  return data.results || [];
}
```

### ML Kit OCR
```typescript
import TextRecognition from '@react-native-ml-kit/text-recognition';

async function readText(imageUri: string) {
  const result = await TextRecognition.recognize(imageUri);
  return result.blocks.map(b => b.text).join('\n');
}
```

---

## Notes

1. **ML Kit requires dev build** - Can't use in Expo Go
2. **OpenFDA is US-focused** - May not have international recalls
3. **Groq has rate limits** - Use Nutriscore fallback
4. **Always cache results** - Reduces API calls, improves speed

