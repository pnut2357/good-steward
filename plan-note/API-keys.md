# API Keys & Resources

> ⚠️ **NEVER commit actual API keys to this file!**  
> Store real keys in `.env` (which is gitignored)

---

## 🎯 Cost-Free Strategy

All vision providers in this app are **100% FREE** - no payment required!

---

## API Resources

| Service | Console | Purpose | Cost | Commercial |
|---------|---------|---------|------|------------|
| **OpenRouter** ⭐ | https://openrouter.ai | AI Vision (Gemini/Llama) | **FREE tier** | ✅ Yes |
| **USDA FoodData** ⭐ | https://api.nal.usda.gov | Food nutrition search | **FREE** | ✅ Yes (Public Domain) |
| **OpenFoodFacts** | https://openfoodfacts.github.io/openfoodfacts-server/api/ | Product barcodes | **FREE** | ✅ Yes (ODbL License) |
| **OCR.space** | https://ocr.space/ocrapi | Cloud OCR | **FREE** (25K/mo) | ✅ Yes |

---

## Vision LLM (Food Recognition) ⭐

The app uses **OpenRouter (Free Tier)** for reliable food recognition.

### Option 1: OpenRouter (Recommended)
- ✅ **FREE Tier** (Generous, no credit card required)
- ✅ High Accuracy (Llama 3.2 Vision)
- ✅ Works in Expo Go

**Get Your Key:**
1. Go to https://openrouter.ai
2. Sign up
3. Go to **Keys**
4. Create a key
5. Add to `.env`:
   ```bash
   EXPO_PUBLIC_OPENROUTER_API_KEY=sk-or-xxxxxxxxxxxxx
   ```

### Option 2: TFLite (Offline Fallback)
- ✅ **FREE**
- ✅ Works offline
- ⚠️ Requires dev build (not Expo Go)

### ⚠️ Deprecated / Unreliable
- **Hugging Face Serverless**: Returning 404/410 errors for Vision models on free tier. Removed.
- **Groq Vision**: Decommissioned.

---

## Priority Order

```
1. OpenRouter (Free Tier)
2. TFLite (Offline fallback)
```

---

## Vision Features

With OpenRouter enabled:
- ✅ Identifies **any food** (not limited to 101 categories)
- ✅ Handles **mixed plates** (burger + fries + salad)
- ✅ Estimates **portions** and nutrition
- ✅ Works in **Expo Go** (no native modules needed!)
- ✅ **$0 cost** - Using free models

---

## Documentation

| Resource | Link |
|----------|------|
| OpenRouter Docs | https://openrouter.ai/docs |
| Expo Camera | https://docs.expo.dev/versions/latest/sdk/camera/ |
| Expo SQLite | https://docs.expo.dev/versions/latest/sdk/sqlite/ |

---

## USDA FoodData Central (Food Search) ⭐

Search 300,000+ generic foods (rice, steak, pho, bibimbap, etc.)

- ✅ **FREE** (No limits)
- ✅ **Commercial Use** (Public Domain - US Gov data)
- ✅ Authoritative nutrition data

**Get Your Key:**
1. Go to https://api.nal.usda.gov
2. Click "API Key Sign-Up"
3. Enter email → Get key instantly
4. Add to `.env`:
   ```bash
   EXPO_PUBLIC_USDA_API_KEY=your-key-here
   ```

---

## Legal Requirements

**OpenFoodFacts** requires attribution. Add to your About screen:
> "Food product data provided by Open Food Facts under the Open Database License"

---

## Your Keys

Store your API keys in `.env`:

```bash
# .env (gitignored - safe!)

# Vision - OpenRouter (FREE, reliable)
EXPO_PUBLIC_OPENROUTER_API_KEY=sk-or-your-key-here

# Food Search - USDA (FREE, 300K+ foods)
EXPO_PUBLIC_USDA_API_KEY=your-usda-key-here

# Text AI (optional)
# EXPO_PUBLIC_GROQ_API_KEY=gsk_xxxxx
```
