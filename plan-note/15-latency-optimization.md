# ⚡ Latency Optimization Guide

## 🎯 Goal
Ensure the app feels **instant** to users. Target: < 2 seconds for scan results.

---

## 📊 Latency Breakdown

| Step | Typical Time | Optimized Time |
|------|--------------|----------------|
| Barcode scan detection | ~100ms | ~100ms (camera-native) |
| SQLite cache lookup | ~5ms | ~5ms (instant) |
| OpenFoodFacts API | 200-800ms | 200-500ms (timeout) |
| Groq AI analysis | 300-1500ms | 300-800ms (fast model) |
| **Total (cached)** | **~105ms** | **~105ms** ✅ |
| **Total (new product)** | **~2300ms** | **~1300ms** ✅ |

---

## 🚀 Optimization Strategies

### Strategy 1: Offline-First Cache (Instant Results)

```typescript
// In ScannerScreen
const handleBarCodeScanned = async ({ data: barcode }) => {
  // INSTANT: Check local cache first (5ms)
  const cached = dbService.getScan(barcode);
  
  if (cached) {
    // Show result immediately!
    setResult(cached);
    setModalVisible(true);
    return; // Done in ~100ms total
  }
  
  // Only hit network if not cached
  // ...
};
```

**Impact:** 80%+ of scans will be instant (users re-scan same products)

---

### Strategy 2: Fast AI Model Selection

Groq is specifically chosen for **speed**. Their inference is 10-100x faster than competitors.

| Model | Speed | Quality | Recommended |
|-------|-------|---------|-------------|
| `llama-3.1-8b-instant` | ⚡ Fastest | Good | ✅ **Use this** |
| `llama-3.1-70b-versatile` | Fast | Better | For complex cases |
| `llama3-8b-8192` | Fast | Good | Legacy option |

```typescript
// In AnalysisService
const response = await this.groq.chat.completions.create({
  model: 'llama-3.1-8b-instant', // Fastest model
  max_tokens: 150, // Short response = faster
  temperature: 0.2, // Deterministic = faster
  // ...
});
```

**Why Groq?** 
- 10x faster than OpenAI
- Specialized inference hardware
- Free tier with no speed throttling

---

### Strategy 3: Aggressive Timeouts

Don't let slow networks block the UI:

```typescript
// OpenFoodFacts with timeout
const { data } = await axios.get(url, {
  timeout: 5000, // 5 second max
  headers: { 'User-Agent': 'GoodSteward/1.0' }
});

// Groq with timeout (built into SDK)
const response = await this.groq.chat.completions.create({
  // ...
  timeout: 8000, // 8 second max
});
```

---

### Strategy 4: Optimized UI Feedback

Make the app **feel** fast with proper loading states:

```typescript
// Show loading IMMEDIATELY on scan
const handleBarCodeScanned = async ({ data: barcode }) => {
  setLoading(true); // Instant feedback
  
  // ... processing ...
};
```

**Loading UI Best Practices:**
```typescript
{loading && (
  <View style={styles.loadingOverlay}>
    <ActivityIndicator size="large" color="#2E7D32" />
    <Text style={styles.loadingText}>
      {loadingStage === 'cache' ? 'Checking...' :
       loadingStage === 'fetch' ? 'Fetching product...' :
       'Analyzing ingredients...'}
    </Text>
  </View>
)}
```

---

### Strategy 5: Optimized AI Prompt

Shorter prompts = faster responses:

```typescript
// ❌ SLOW: Long, verbose prompt
const slowPrompt = `You are a highly experienced nutrition expert 
with decades of experience analyzing food products. Please carefully 
examine the following product information and provide a comprehensive 
analysis of its health implications, considering all potential 
allergens, additives, processing methods, nutritional content...`; // 500+ tokens

// ✅ FAST: Concise prompt
const fastPrompt = `Nutrition analysis. Product: ${name}
Nutriscore: ${nutriscore}, NOVA: ${nova}
Ingredients: ${ingredients}
Reply JSON: {"summary": "1-2 sentences", "isSafe": bool}`;  // ~100 tokens
```

**Token savings:** 80% fewer input tokens = faster response

---

### Strategy 6: Parallel Execution (Future Enhancement)

For even faster results, fetch data in parallel:

```typescript
// Future optimization: Parallel fetch + analyze
const analyzeProductFast = async (barcode: string): Promise<ScanResult | null> => {
  // Start both operations simultaneously
  const [product, existingAnalysis] = await Promise.all([
    this.fetchProduct(barcode),
    this.checkExistingAnalysis(barcode) // Optional: cloud cache
  ]);
  
  if (!product) return null;
  if (existingAnalysis) return existingAnalysis;
  
  // Only then do AI analysis
  const analysis = await this.analyzeWithAI(product);
  return this.buildResult(barcode, product, analysis);
};
```

---

### Strategy 7: Preload Common Products (Optional)

Bundle top 100 most-scanned products in app:

```typescript
// constants/commonProducts.ts
export const COMMON_PRODUCTS: ScanResult[] = [
  {
    barcode: '5449000000996',
    name: 'Coca-Cola',
    summary: 'High sugar content. Use caution.',
    isSafe: false,
    // ...
  },
  // ... top 100 products
];

// On app start, seed database
useEffect(() => {
  COMMON_PRODUCTS.forEach(product => {
    if (!dbService.getScan(product.barcode)) {
      dbService.saveScan(product);
    }
  });
}, []);
```

**Impact:** First-time users get instant results for popular products

---

## 📱 Perceived Performance

Even with network delays, the app should **feel** instant:

### 1. Immediate Visual Feedback
```typescript
// As soon as barcode detected
setScanned(true);      // Disable scanner immediately
setLoading(true);      // Show spinner immediately
playHapticFeedback();  // Optional: vibration feedback
```

### 2. Progressive Loading States
```typescript
const [loadingStage, setLoadingStage] = useState<
  'scanning' | 'checking' | 'fetching' | 'analyzing' | null
>(null);

// Update as we progress
setLoadingStage('checking');   // "Checking local cache..."
setLoadingStage('fetching');   // "Getting product info..."
setLoadingStage('analyzing');  // "AI analyzing..."
```

### 3. Skeleton Loading (Alternative)
Show a placeholder result card while loading:
```typescript
{loading && (
  <View style={styles.skeletonCard}>
    <View style={styles.skeletonIcon} />
    <View style={styles.skeletonText} />
    <View style={styles.skeletonText} />
  </View>
)}
```

---

## ⏱️ Performance Targets

| Scenario | Target | Maximum |
|----------|--------|---------|
| Cached product | < 200ms | 500ms |
| New product (good network) | < 2s | 3s |
| New product (slow network) | < 4s | 8s (then timeout) |
| Fallback (no AI) | < 1s | 2s |

---

## 🔧 Implementation Updates

### Updated AnalysisService with Timeouts

```typescript
export class AnalysisService {
  // Timeouts
  private readonly FETCH_TIMEOUT = 5000;  // 5s for OpenFoodFacts
  private readonly AI_TIMEOUT = 8000;     // 8s for Groq
  
  private async fetchProduct(barcode: string): Promise<OFFProduct | null> {
    try {
      const { data } = await axios.get(url, {
        timeout: this.FETCH_TIMEOUT,
        headers: { 'User-Agent': 'GoodSteward/1.0' }
      });
      // ...
    } catch (error) {
      if (axios.isAxiosError(error) && error.code === 'ECONNABORTED') {
        console.log('OpenFoodFacts timeout - using fallback');
      }
      return null;
    }
  }
  
  private async analyzeWithAI(product: OFFProduct): Promise<AIAnalysis> {
    // ... 
    const response = await this.groq.chat.completions.create({
      model: 'llama-3.1-8b-instant', // Fastest
      max_tokens: 150,               // Short response
      temperature: 0.2,              // Deterministic
      // timeout handled by Groq SDK
    });
    // ...
  }
}
```

### Updated Scanner with Progressive Feedback

```typescript
// In ScannerScreen
const [loadingMessage, setLoadingMessage] = useState('');

const handleBarCodeScanned = async ({ data: barcode }) => {
  setScanned(true);
  setLoading(true);
  
  // Step 1: Check cache (instant)
  setLoadingMessage('Checking...');
  const cached = dbService.getScan(barcode);
  if (cached) {
    setLoading(false);
    setResult(cached);
    setModalVisible(true);
    return;
  }
  
  // Step 2: Fetch product
  setLoadingMessage('Getting product info...');
  const result = await analysisService.analyzeProduct(barcode);
  
  // Step 3: Show result
  setLoading(false);
  if (result) {
    dbService.saveScan(result);
    setResult(result);
    setModalVisible(true);
  } else {
    Alert.alert('Not Found', 'Product not in database.');
    setScanned(false);
  }
};
```

---

## ✅ Latency Checklist

- [ ] Use `llama-3.1-8b-instant` model (fastest)
- [ ] Set 5s timeout on OpenFoodFacts
- [ ] Set 8s timeout on Groq
- [ ] Check SQLite cache FIRST (instant)
- [ ] Keep AI prompts short (<150 input tokens)
- [ ] Request short responses (max_tokens: 150)
- [ ] Show loading state immediately on scan
- [ ] Progressive loading messages
- [ ] Fallback to Nutriscore if AI times out

---

## 📈 Expected User Experience

```
User scans barcode
        │
        ▼ (instant)
┌─────────────────────┐
│  Loading spinner    │
│  "Checking..."      │
└─────────────────────┘
        │
        ▼ (~100ms if cached)
┌─────────────────────┐
│  ✅ Result Modal    │  ← INSTANT for repeat scans!
│  "Good Choice!"     │
└─────────────────────┘

        OR (if new product)
        │
        ▼ (~1-2 seconds)
┌─────────────────────┐
│  Loading spinner    │
│  "Analyzing..."     │
└─────────────────────┘
        │
        ▼
┌─────────────────────┐
│  ✅ Result Modal    │
│  "Use Caution"      │
└─────────────────────┘
```

---

*Latency Optimization Guide - December 2024*

