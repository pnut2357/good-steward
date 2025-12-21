# 💰 Cost Analysis & Free Tier Strategy

## 🎯 Goal
Ensure Good Steward runs at **ZERO COST** during development and initial launch, with optional paid tiers later.

---

## 📊 Service Cost Breakdown

### 1. OpenFoodFacts API ✅ FREE

| Aspect | Details |
|--------|---------|
| **Cost** | 100% Free (open-source) |
| **API Key** | Not required |
| **Rate Limit** | No hard limit (be respectful) |
| **Data** | 3+ million products |
| **Recommendation** | Add User-Agent header with contact info |

**Verdict:** ✅ No cost concerns

---

### 2. Groq AI API 💚 FREE TIER

| Aspect | Details |
|--------|---------|
| **Free Tier** | Yes |
| **Requests/Minute** | ~30 (varies by model) |
| **Requests/Day** | ~14,400 |
| **Tokens/Minute** | ~6,000 |
| **Credit Card** | Not required for free tier |

**Calculations for Free Tier:**
- Average scan: ~500 tokens (input + output)
- Daily capacity: ~14,400 scans/day
- Monthly capacity: ~430,000 scans/month

**Verdict:** ✅ Generous free tier - sufficient for thousands of users

---

### 3. Local Storage (expo-sqlite) ✅ FREE

| Aspect | Details |
|--------|---------|
| **Cost** | $0 (on-device storage) |
| **Limit** | Device storage only |
| **Server** | None needed |

**Verdict:** ✅ No cost

---

### 4. Expo/React Native ✅ FREE

| Aspect | Details |
|--------|---------|
| **Development** | Free |
| **Expo Go** | Free |
| **EAS Build** | Free tier (30 builds/month) |

**Verdict:** ✅ Free for development

---

## 🛡️ Cost Protection Strategies

### Strategy 1: Offline-First Caching (Already Implemented)

```
First scan  → API call → Cache locally
Repeat scan → Use cache → NO API call
```

**Impact:** Dramatically reduces API calls. Most users scan the same products repeatedly.

### Strategy 2: No-AI Fallback Mode

If Groq limits are reached, fall back to Nutriscore-based analysis:

```typescript
// In AnalysisService.ts
private async analyzeWithFallback(product: OFFProduct): Promise<AIAnalysis> {
  try {
    // Try Groq AI first
    return await this.analyzeWithAI(product);
  } catch (error) {
    // Fallback to Nutriscore-based analysis
    return this.analyzeWithNutriscore(product);
  }
}

private analyzeWithNutriscore(product: OFFProduct): AIAnalysis {
  const nutriscore = product.nutriscore_grade?.toLowerCase();
  const nova = product.nova_group;
  
  let summary = '';
  let isSafe = true;
  const concerns: string[] = [];
  
  // Nutriscore analysis
  if (nutriscore === 'd' || nutriscore === 'e') {
    isSafe = false;
    concerns.push(`Nutriscore ${nutriscore.toUpperCase()} indicates poor nutritional quality`);
  }
  
  // NOVA analysis
  if (nova === 4) {
    isSafe = false;
    concerns.push('Ultra-processed food (NOVA 4)');
  }
  
  // Build summary
  if (concerns.length > 0) {
    summary = `Caution: ${concerns.join('. ')}.`;
  } else if (nutriscore) {
    summary = `Nutriscore ${nutriscore.toUpperCase()}: Generally acceptable nutritional profile.`;
  } else {
    summary = 'Limited nutritional data available. Review ingredients manually.';
  }
  
  return { summary, isSafe, concerns };
}
```

**Impact:** App works 100% even if AI quota exhausted

### Strategy 3: Rate Limiting in App

```typescript
// Simple rate limiter
class RateLimiter {
  private requests: number[] = [];
  private maxPerMinute = 25; // Stay under 30 limit
  
  canMakeRequest(): boolean {
    const now = Date.now();
    this.requests = this.requests.filter(t => now - t < 60000);
    return this.requests.length < this.maxPerMinute;
  }
  
  recordRequest(): void {
    this.requests.push(Date.now());
  }
}
```

---

## 🆓 100% Free Alternative Stack

If you want to avoid Groq entirely:

### Option A: Nutriscore-Only Analysis

Use OpenFoodFacts data without AI:

| Data | Interpretation |
|------|----------------|
| Nutriscore A-B | ✅ Good choice |
| Nutriscore C | ⚠️ Moderate |
| Nutriscore D-E | ⚠️ Use caution |
| NOVA 1-2 | ✅ Minimally processed |
| NOVA 3-4 | ⚠️ Processed |

**Pros:** Zero external API calls (after OpenFoodFacts)
**Cons:** Less personalized analysis

### Option B: Cloudflare Workers AI (Alternative)

| Aspect | Details |
|--------|---------|
| **Free Tier** | 10,000 neurons/day |
| **Models** | Llama 2, Mistral |
| **Complexity** | Requires Workers setup |

### Option C: Together AI

| Aspect | Details |
|--------|---------|
| **Free Credits** | $25 free credits on signup |
| **Models** | Llama 3, Mistral, Mixtral |

---

## 📈 Scaling Cost Projection

### When FREE Tier is Sufficient

| Users (DAU) | Scans/User/Day | Daily Scans | Monthly Scans | Status |
|-------------|----------------|-------------|---------------|--------|
| 100 | 5 | 500 | 15,000 | ✅ Free |
| 500 | 5 | 2,500 | 75,000 | ✅ Free |
| 1,000 | 5 | 5,000 | 150,000 | ✅ Free |
| 5,000 | 5 | 25,000 | 750,000 | ⚠️ Near limit |

**Note:** With caching, actual API calls are much lower (users re-scan same products)

### When to Consider Paid

Only when you have:
- 10,000+ daily active users
- Users frequently scanning NEW products
- Revenue from subscriptions/ads

---

## 💡 Recommended Implementation

### Phase 1: Development (Current)
```
✅ OpenFoodFacts (Free)
✅ Groq Free Tier (Free)
✅ Local SQLite (Free)
✅ Expo Development (Free)
Total: $0/month
```

### Phase 2: Initial Launch
```
Same as Phase 1 + monitoring
Add fallback to Nutriscore if limits hit
Total: $0/month
```

### Phase 3: Growth (Future)
```
IF daily users > 5,000:
  - Consider Groq paid tier (~$0.05/1M tokens)
  - OR implement user limits (free: 10 scans/day)
  - OR show ads for unlimited scans
```

---

## 🔧 Code Changes for Cost Protection

### 1. Add Fallback to AnalysisService

Update `services/AnalysisService.ts` to include Nutriscore fallback:

```typescript
public async analyzeProduct(barcode: string): Promise<ScanResult | null> {
  try {
    // ... existing code ...
    
    // Try AI analysis
    let analysis: AIAnalysis;
    try {
      analysis = await this.analyzeWithAI(product);
    } catch (aiError) {
      console.log('AI unavailable, using Nutriscore fallback');
      analysis = this.analyzeWithNutriscore(product);
    }
    
    // ... rest of code ...
  } catch (error) {
    // ...
  }
}
```

### 2. Monitor Usage (Optional)

```typescript
// Simple usage counter
const DAILY_LIMIT = 14000;
let dailyCount = 0;
let lastReset = new Date().toDateString();

function canUseAI(): boolean {
  const today = new Date().toDateString();
  if (today !== lastReset) {
    dailyCount = 0;
    lastReset = today;
  }
  return dailyCount < DAILY_LIMIT;
}
```

---

## ✅ Checklist for Zero-Cost Operation

- [ ] Use Groq FREE tier (no credit card)
- [ ] Implement Nutriscore fallback
- [ ] Enable offline caching (already planned)
- [ ] Add User-Agent to OpenFoodFacts requests
- [ ] Monitor Groq usage in console
- [ ] Set up alerts if approaching limits

---

## 🎯 Summary

| Component | Cost | Notes |
|-----------|------|-------|
| OpenFoodFacts | **$0** | Always free |
| Groq AI | **$0** | Free tier: 14K/day |
| SQLite | **$0** | On-device |
| Expo Dev | **$0** | Free tier |
| **TOTAL** | **$0/month** | Sufficient for ~5K daily users |

**You can build, launch, and serve thousands of users at ZERO COST.**

---

*Cost Analysis - December 2024*

