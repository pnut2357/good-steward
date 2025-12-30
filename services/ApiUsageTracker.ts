/**
 * API Usage Tracker
 * 
 * Tracks API calls, latency, and usage limits for monitoring.
 * Use this to ensure you stay within free tier limits.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

export interface ApiCallRecord {
  api: string;
  timestamp: number;
  latencyMs: number;
  success: boolean;
  error?: string;
}

export interface DailyUsage {
  date: string;
  openFoodFacts: number;
  ocrSpace: number;
  usda: number;
  tflite: number;
  totalLatencyMs: number;
  callCount: number;
}

export interface UsageStats {
  today: DailyUsage;
  thisMonth: {
    openFoodFacts: number;
    ocrSpace: number;
    usda: number;
    tflite: number;
  };
  avgLatencyMs: number;
  slowestCall: ApiCallRecord | null;
}

// Rate limit thresholds
const LIMITS = {
  ocrSpace: {
    daily: 500,
    monthly: 25000,
    warnAt: 0.8, // Warn at 80% usage
  },
  openFoodFacts: {
    perMinute: 100,
    warnAt: 0.8,
  },
};

class ApiUsageTrackerClass {
  private static instance: ApiUsageTrackerClass;
  private today: DailyUsage;
  private recentCalls: ApiCallRecord[] = [];
  private monthlyUsage: Map<string, number> = new Map();

  private constructor() {
    this.today = this.createEmptyDay();
    this.loadFromStorage();
  }

  public static getInstance(): ApiUsageTrackerClass {
    if (!ApiUsageTrackerClass.instance) {
      ApiUsageTrackerClass.instance = new ApiUsageTrackerClass();
    }
    return ApiUsageTrackerClass.instance;
  }

  private createEmptyDay(): DailyUsage {
    return {
      date: new Date().toDateString(),
      openFoodFacts: 0,
      ocrSpace: 0,
      usda: 0,
      tflite: 0,
      totalLatencyMs: 0,
      callCount: 0,
    };
  }

  private async loadFromStorage() {
    try {
      const stored = await AsyncStorage.getItem('api_usage_today');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.date === new Date().toDateString()) {
          this.today = parsed;
        }
      }

      const monthlyStored = await AsyncStorage.getItem('api_usage_monthly');
      if (monthlyStored) {
        const parsed = JSON.parse(monthlyStored);
        const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
        if (parsed.month === currentMonth) {
          this.monthlyUsage = new Map(Object.entries(parsed.usage));
        }
      }
    } catch (error) {
      console.error('Failed to load API usage from storage:', error);
    }
  }

  private async saveToStorage() {
    try {
      await AsyncStorage.setItem('api_usage_today', JSON.stringify(this.today));
      
      const currentMonth = new Date().toISOString().slice(0, 7);
      await AsyncStorage.setItem('api_usage_monthly', JSON.stringify({
        month: currentMonth,
        usage: Object.fromEntries(this.monthlyUsage),
      }));
    } catch (error) {
      console.error('Failed to save API usage:', error);
    }
  }

  /**
   * Track an API call with timing
   */
  public async trackCall(
    api: 'openFoodFacts' | 'ocrSpace' | 'usda' | 'tflite',
    latencyMs: number,
    success: boolean = true,
    error?: string
  ): Promise<void> {
    // Check if day changed
    const todayStr = new Date().toDateString();
    if (this.today.date !== todayStr) {
      await this.rotateDay();
    }

    // Update daily counts
    this.today[api]++;
    this.today.totalLatencyMs += latencyMs;
    this.today.callCount++;

    // Update monthly counts
    const monthKey = `${new Date().toISOString().slice(0, 7)}_${api}`;
    this.monthlyUsage.set(monthKey, (this.monthlyUsage.get(monthKey) || 0) + 1);

    // Store recent calls for analysis
    const record: ApiCallRecord = {
      api,
      timestamp: Date.now(),
      latencyMs,
      success,
      error,
    };
    this.recentCalls.push(record);
    if (this.recentCalls.length > 100) {
      this.recentCalls.shift();
    }

    // Log with emoji for visibility
    const emoji = success ? '✅' : '❌';
    console.log(`${emoji} API: ${api} | ${latencyMs}ms | Today: ${this.today[api]}`);

    // Check limits and warn
    this.checkLimits(api);

    // Save periodically (every 10 calls)
    if (this.today.callCount % 10 === 0) {
      await this.saveToStorage();
    }
  }

  /**
   * Start timing an API call
   */
  public startTimer(): () => number {
    const start = Date.now();
    return () => Date.now() - start;
  }

  /**
   * Check if approaching limits and warn
   */
  private checkLimits(api: string): void {
    if (api === 'ocrSpace') {
      const monthKey = `${new Date().toISOString().slice(0, 7)}_ocrSpace`;
      const monthlyCount = this.monthlyUsage.get(monthKey) || 0;

      if (monthlyCount >= LIMITS.ocrSpace.monthly * LIMITS.ocrSpace.warnAt) {
        console.warn(`⚠️ OCR.space usage at ${Math.round(monthlyCount / LIMITS.ocrSpace.monthly * 100)}% of monthly limit!`);
      }

      if (this.today.ocrSpace >= LIMITS.ocrSpace.daily * LIMITS.ocrSpace.warnAt) {
        console.warn(`⚠️ OCR.space daily usage at ${Math.round(this.today.ocrSpace / LIMITS.ocrSpace.daily * 100)}%!`);
      }
    }
  }

  /**
   * Rotate to a new day
   */
  private async rotateDay(): Promise<void> {
    // Save history
    const history = await AsyncStorage.getItem('api_usage_history');
    const parsed = history ? JSON.parse(history) : [];
    parsed.push(this.today);
    await AsyncStorage.setItem('api_usage_history', JSON.stringify(parsed.slice(-30)));

    // Start new day
    this.today = this.createEmptyDay();
  }

  /**
   * Get current usage statistics
   */
  public getStats(): UsageStats {
    const currentMonth = new Date().toISOString().slice(0, 7);
    
    const monthlyOFF = this.monthlyUsage.get(`${currentMonth}_openFoodFacts`) || 0;
    const monthlyOCR = this.monthlyUsage.get(`${currentMonth}_ocrSpace`) || 0;
    const monthlyUSDA = this.monthlyUsage.get(`${currentMonth}_usda`) || 0;
    const monthlyTFLite = this.monthlyUsage.get(`${currentMonth}_tflite`) || 0;

    const avgLatency = this.today.callCount > 0 
      ? Math.round(this.today.totalLatencyMs / this.today.callCount)
      : 0;

    const slowestCall = this.recentCalls.length > 0
      ? this.recentCalls.reduce((max, call) => call.latencyMs > max.latencyMs ? call : max)
      : null;

    return {
      today: { ...this.today },
      thisMonth: {
        openFoodFacts: monthlyOFF,
        ocrSpace: monthlyOCR,
        usda: monthlyUSDA,
        tflite: monthlyTFLite,
      },
      avgLatencyMs: avgLatency,
      slowestCall,
    };
  }

  /**
   * Get formatted usage report for logging
   */
  public getReport(): string {
    const stats = this.getStats();
    return `
📊 API Usage Report
━━━━━━━━━━━━━━━━━━━━
Today (${stats.today.date}):
  OpenFoodFacts: ${stats.today.openFoodFacts} calls
  OCR.space: ${stats.today.ocrSpace} calls (${Math.round(stats.today.ocrSpace / LIMITS.ocrSpace.daily * 100)}% of daily limit)
  USDA: ${stats.today.usda} calls
  TFLite: ${stats.today.tflite} calls

This Month:
  OCR.space: ${stats.thisMonth.ocrSpace} / ${LIMITS.ocrSpace.monthly} (${Math.round(stats.thisMonth.ocrSpace / LIMITS.ocrSpace.monthly * 100)}%)

Performance:
  Avg Latency: ${stats.avgLatencyMs}ms
  Slowest: ${stats.slowestCall ? `${stats.slowestCall.api} @ ${stats.slowestCall.latencyMs}ms` : 'N/A'}
━━━━━━━━━━━━━━━━━━━━
    `.trim();
  }

  /**
   * Check if OCR is available (within limits)
   */
  public isOcrAvailable(): boolean {
    const monthKey = `${new Date().toISOString().slice(0, 7)}_ocrSpace`;
    const monthlyCount = this.monthlyUsage.get(monthKey) || 0;
    return monthlyCount < LIMITS.ocrSpace.monthly && this.today.ocrSpace < LIMITS.ocrSpace.daily;
  }
}

// Export singleton
export const apiUsageTracker = ApiUsageTrackerClass.getInstance();

