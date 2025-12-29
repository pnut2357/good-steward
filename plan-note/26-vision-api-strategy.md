# Vision API Strategy (FREE)

> **Last Updated**: December 29, 2024  
> **Status**: ✅ IMPLEMENTED  
> **Cost**: $0 (All providers are free)

---

## 📋 Table of Contents

1. [Overview](#1-overview)
2. [Provider Priority](#2-provider-priority)
3. [HuggingFace BLIP](#3-huggingface-blip)
4. [OpenRouter](#4-openrouter)
5. [TFLite Offline](#5-tflite-offline)
6. [Model Comparison](#6-model-comparison)
7. [Implementation](#7-implementation)
8. [Cost Analysis](#8-cost-analysis)

---

## 1. Overview

### Problem
- Hugging Face Serverless Inference (Free Tier) has become unreliable for Vision models (404/410 errors).
- Large Vision LLMs are no longer hosted on the free router.

### Solution
Use **OpenRouter's Free Tier** as the primary and only provider.

```
┌─────────────────────────────────────────────────────────────────┐
│                 VISION FOOD RECOGNITION (FREE)                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  📸 User takes photo                                             │
│         │                                                        │
│         ▼                                                        │
│  ┌──────────────────┐                                           │
│  │  Check Provider  │                                           │
│  └────────┬─────────┘                                           │
│           │                                                      │
│           ▼                                                      │
│      OpenRouter                                                 │
│     (FREE tier)                                                 │
│     Llama 3.2 Vision                                            │
│           │                                                      │
│           ▼                                                      │
│     🍕 Pizza + Fries                                            │
│     ~600 kcal                                                   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Provider Priority

| Priority | Provider | Cost | Accuracy | Offline | Expo Go |
|----------|----------|------|----------|---------|---------|
| 1️⃣ | **OpenRouter** | FREE tier | High | ❌ | ✅ |
| 2️⃣ | **TFLite** | FREE | Limited | ✅ | ❌ |

---

## 3. OpenRouter (Primary)

### How It Works

```typescript
// OpenRouter API - FREE tier
POST https://openrouter.ai/api/v1/chat/completions
Model: meta-llama/llama-3.2-11b-vision-instruct:free

// Request: OpenAI-compatible format with image
// Response: Structured JSON with nutrition
```

### Pros
- ✅ **FREE tier** available (no credit card for free models)
- ✅ Reliable access to Llama 3.2 Vision
- ✅ Returns structured JSON
- ✅ Works in Expo Go

---

## 4. Implementation

### Environment Variables

```bash
# .env

# Primary (FREE)
EXPO_PUBLIC_OPENROUTER_API_KEY=sk-or-xxxxx
```

---

## 5. Cost Analysis

| Provider | Free Tier | Cost |
|----------|-----------|------|
| OpenRouter | Yes (Free models) | **$0** |
| TFLite | N/A | **$0** |
| **Total** | | **$0/month** |

---

## Summary

✅ **100% FREE** - Using OpenRouter free models
✅ **Works in Expo Go** - No native build needed
✅ **High Accuracy** - Llama 3.2 Vision is state-of-the-art
✅ **Reliable** - No more random 404s from Hugging Face

### Get Started

1. Get FREE OpenRouter Key: https://openrouter.ai
2. Add to `.env`: `EXPO_PUBLIC_OPENROUTER_API_KEY=sk-or-xxxxx`
3. Run: `npx expo start --clear`


