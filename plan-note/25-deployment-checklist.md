# Deployment & Testing Checklist

> **Last Updated**: December 21, 2024  
> **Strategy**: Google Play first → Apple App Store later

---

## 📋 Table of Contents

1. [Pre-Deployment Testing](#1-pre-deployment-testing)
2. [API Rate Limits & Monitoring](#2-api-rate-limits--monitoring)
3. [Performance Testing](#3-performance-testing)
4. [Google Play Deployment](#4-google-play-deployment)
5. [Apple App Store (Later)](#5-apple-app-store-later)
6. [Cost Summary](#6-cost-summary)

---

## 1. Pre-Deployment Testing

### Functional Testing Checklist

| Feature | Test Case | Status |
|---------|-----------|--------|
| **Barcode Scanning** | Scan 10+ different barcodes | ☐ |
| **Barcode Not Found** | Test search modal fallback | ☐ |
| **Photo Label OCR** | Scan 5+ nutrition labels | ☐ |
| **Food Identification** | Test 10+ food types | ☐ |
| **Offline Mode** | Test with airplane mode (cached items) | ☐ |
| **User Filters** | Set diabetes/pregnancy/allergy filters | ☐ |
| **Filter Warnings** | Verify warnings appear correctly | ☐ |
| **Consumption Logging** | Add items to daily log | ☐ |
| **History Screen** | View all/today/consumed filters | ☐ |
| **Nutrition Editor** | Manually edit nutrition values | ☐ |
| **Daily Summary** | Check calorie/sugar totals | ☐ |
| **Consumption Stats** | View 7/30/90 day stats | ☐ |

### Device Testing

| Device Type | Priority | Status |
|-------------|----------|--------|
| Android Phone (mid-range) | HIGH | ☐ |
| Android Phone (budget) | HIGH | ☐ |
| Android Tablet | MEDIUM | ☐ |
| iOS iPhone (if testing) | LOW (for now) | ☐ |

### Edge Cases to Test

- [ ] Barcode with no product data
- [ ] Very long ingredient lists
- [ ] Products with missing nutrition data
- [ ] Extremely high/low nutrition values
- [ ] Multiple rapid scans
- [ ] App backgrounded during scan
- [ ] Low memory situations
- [ ] Slow network conditions

---

## 2. API Rate Limits & Monitoring

### Current API Usage

| API | Free Tier | Rate Limit | Your Usage |
|-----|-----------|------------|------------|
| **OpenFoodFacts** | Unlimited | Fair use (~100 req/min) | Barcode lookup |
| **OCR.space** | 25,000/month | 500/day | Label scanning |
| **TFLite (on-device)** | Unlimited | N/A | Food recognition |
| **USDA FoodData** | Unlimited | 1000/hour | Backup lookup |

### How to Monitor API Usage

#### Option A: Simple In-App Logging
Add to your services to track usage:

```typescript
// services/ApiUsageTracker.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

interface DailyUsage {
  date: string;
  openFoodFacts: number;
  ocrSpace: number;
  usda: number;
}

class ApiUsageTracker {
  private usage: DailyUsage = {
    date: new Date().toDateString(),
    openFoodFacts: 0,
    ocrSpace: 0,
    usda: 0,
  };

  async trackCall(api: 'openFoodFacts' | 'ocrSpace' | 'usda') {
    const today = new Date().toDateString();
    if (this.usage.date !== today) {
      await this.saveAndReset();
    }
    this.usage[api]++;
    console.log(`📊 API Usage: ${api} = ${this.usage[api]}`);
  }

  async getUsage(): Promise<DailyUsage> {
    return this.usage;
  }

  private async saveAndReset() {
    // Save previous day's usage
    const history = await AsyncStorage.getItem('api_usage_history');
    const parsed = history ? JSON.parse(history) : [];
    parsed.push(this.usage);
    await AsyncStorage.setItem('api_usage_history', JSON.stringify(parsed.slice(-30)));
    
    // Reset for new day
    this.usage = {
      date: new Date().toDateString(),
      openFoodFacts: 0,
      ocrSpace: 0,
      usda: 0,
    };
  }
}

export const apiUsageTracker = new ApiUsageTracker();
```

#### Option B: Firebase Analytics (Recommended for Production)
```bash
npx expo install @react-native-firebase/app @react-native-firebase/analytics
```

Track custom events for each API call.

### Warning Thresholds

| API | Warning At | Action |
|-----|------------|--------|
| OCR.space | 20,000/month | Show "limit approaching" in logs |
| OCR.space | 24,000/month | Disable OCR, show manual entry only |
| OpenFoodFacts | 50 req/min | Add 1s delay between requests |

---

## 3. Performance Testing

### Latency Benchmarks

| Operation | Target | Acceptable | Measure |
|-----------|--------|------------|---------|
| **Barcode Scan (cached)** | <50ms | <100ms | DB lookup |
| **Barcode Scan (API)** | <500ms | <2s | Network + parse |
| **OCR Label Scan** | <3s | <5s | Photo + OCR API |
| **Food Recognition** | <200ms | <500ms | TFLite inference |
| **App Launch** | <2s | <3s | Cold start |
| **Screen Transitions** | <100ms | <300ms | Navigation |

### How to Measure Latency

Add timing to your services:

```typescript
// In AnalysisService.ts
async analyzeBarcode(barcode: string): Promise<ScanResult | null> {
  const startTime = Date.now();
  
  try {
    const result = await this.fetchFromOpenFoodFacts(barcode);
    
    const latency = Date.now() - startTime;
    console.log(`⏱️ Barcode lookup: ${latency}ms`);
    
    // Track for analytics
    if (latency > 2000) {
      console.warn('⚠️ Slow API response:', latency);
    }
    
    return result;
  } catch (error) {
    console.error('Barcode lookup failed after', Date.now() - startTime, 'ms');
    throw error;
  }
}
```

### Load Testing (Before Launch)

1. **Manual stress test**: Scan 50+ items rapidly
2. **Check memory**: Monitor RAM usage during session
3. **Database performance**: Test with 500+ cached items

---

## 4. Google Play Deployment

### Cost Breakdown

| Item | Cost | Frequency |
|------|------|-----------|
| Developer Account | $25 | One-time |
| App Hosting | $0 | Free (no backend) |
| API Costs | $0 | All free tiers |
| **Total** | **$25** | **One-time** |

### Preparation Checklist

#### App Store Listing Assets

| Asset | Requirement | Status |
|-------|-------------|--------|
| App Icon | 512x512 PNG | ☐ |
| Feature Graphic | 1024x500 PNG | ☐ |
| Screenshots (phone) | Min 2, recommended 8 | ☐ |
| Screenshots (tablet) | Optional but recommended | ☐ |
| Short Description | Max 80 characters | ☐ |
| Full Description | Max 4000 characters | ☐ |
| Privacy Policy URL | Required | ☐ |

#### Required Before Submission

- [ ] Remove all console.log statements (or use production flag)
- [ ] Update version number in `app.json`
- [ ] Create signing key (once)
- [ ] Build release APK/AAB
- [ ] Test release build on real device
- [ ] Write Privacy Policy
- [ ] Prepare content rating questionnaire answers

#### Build Commands

```bash
# For Google Play (AAB format required)
eas build --platform android --profile production

# Or local build
cd android && ./gradlew bundleRelease
```

### Privacy Policy Requirements

Since your app:
- Uses camera (for scanning)
- Stores health-related data locally
- Calls external APIs

Your privacy policy must mention:
1. Camera usage (barcode/photo scanning only)
2. Data stored locally on device
3. No personal data sent to servers (except product lookups)
4. OpenFoodFacts/OCR.space API usage
5. No account required
6. Data can be deleted by uninstalling app

### Google Play Store Timeline

| Step | Time |
|------|------|
| Create account | 1 day |
| Prepare assets | 1-2 days |
| Build & test release | 1 day |
| Submit for review | 1 day |
| Review process | 1-7 days |
| **Total** | **~1-2 weeks** |

---

## 5. Apple App Store (Later)

### Cost Breakdown

| Item | Cost | Frequency |
|------|------|-----------|
| Developer Account | $99 | **Annual** |
| App Hosting | $0 | Free |
| **Total** | **$99/year** | **Recurring** |

### Why Wait?

1. **Validate on Android first** - Free to iterate
2. **Fix bugs discovered** - Android users are your beta testers
3. **Build user base** - Prove demand before $99/year commitment
4. **Gather feedback** - Improve before iOS launch

### When to Launch iOS

Consider iOS when:
- [ ] 1,000+ Android downloads
- [ ] 4+ star rating maintained
- [ ] Major bugs fixed
- [ ] Feature set stable

---

## 6. Cost Summary

### Year 1 Costs (Android Only)

| Item | Cost |
|------|------|
| Google Play Account | $25 |
| OpenFoodFacts API | $0 |
| OCR.space API | $0 |
| TFLite Model | $0 |
| Hosting | $0 |
| **Total Year 1** | **$25** |

### Scaling Costs

| Monthly Users | API Calls | Cost |
|---------------|-----------|------|
| 0-500 | <25,000 OCR | $0 |
| 500-2,000 | <100,000 OCR | OCR upgrade ~$10/mo |
| 2,000+ | High volume | Consider self-hosted OCR |

### If You Add iOS

| Year | Android | iOS | Total |
|------|---------|-----|-------|
| 1 | $25 | $99 | $124 |
| 2+ | $0 | $99 | $99/year |

---

## 7. Monitoring Dashboard (Simple)

Add a hidden developer screen to see stats:

```typescript
// components/DevStats.tsx (accessible via long-press on About screen)
export default function DevStats() {
  const [stats, setStats] = useState({
    totalScans: 0,
    cachedItems: 0,
    apiCalls: { off: 0, ocr: 0 },
    avgLatency: 0,
  });

  useEffect(() => {
    // Load from DatabaseService
    const scans = dbService.getAllScans();
    setStats({
      totalScans: scans.length,
      cachedItems: scans.length,
      // ... load from ApiUsageTracker
    });
  }, []);

  return (
    <View>
      <Text>Total Scans: {stats.totalScans}</Text>
      <Text>Cached Items: {stats.cachedItems}</Text>
      <Text>API Calls Today: {stats.apiCalls.off + stats.apiCalls.ocr}</Text>
    </View>
  );
}
```

---

## Quick Start Commands

```bash
# 1. Build for Android
eas build --platform android --profile production

# 2. Test APK on device
adb install build-xxx.apk

# 3. Submit to Google Play
eas submit --platform android
```

---

## Next Steps

1. ☐ Complete functional testing checklist
2. ☐ Add API usage tracking
3. ☐ Create Play Store assets
4. ☐ Write Privacy Policy
5. ☐ Build release APK
6. ☐ Test on 2-3 different Android devices
7. ☐ Submit to Google Play

