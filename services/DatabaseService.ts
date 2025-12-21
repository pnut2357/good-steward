import { Platform } from 'react-native';
import {
  ConsumptionRecord,
  NutritionData,
  ScanResult,
  calculatePortionNutrition
} from '../models/ScanResult';

/**
 * Singleton class for database operations
 * 
 * Implements the OFFLINE-FIRST strategy:
 * - Native (iOS/Android): Uses SQLite for persistent storage
 * - Web: Uses in-memory storage (for development only)
 */
export class DatabaseService {
  private db: any = null;
  private static instance: DatabaseService | null = null;
  
  // In-memory fallback for web
  private memoryStore: Map<string, ScanResult> = new Map();
  private isWeb: boolean;
  private initialized: boolean = false;

  private constructor() {
    this.isWeb = Platform.OS === 'web';
    
    if (this.isWeb) {
      console.log('⚠️ Running on web - using in-memory storage');
      this.initialized = true;
    }
    // SQLite initialization is deferred to first use on native
  }

  /**
   * Lazily initialize SQLite (native only)
   * Updated schema includes new nutrition fields
   */
  private ensureInitialized(): void {
    if (this.initialized) return;
    
    if (!this.isWeb) {
      try {
        // Dynamic require to prevent bundling on web
        const SQLite = require('expo-sqlite');
        this.db = SQLite.openDatabaseSync('goodSteward.db');
        
        // Create table with all fields (new and old)
        this.db.execSync(`
          CREATE TABLE IF NOT EXISTS scans (
            barcode TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            brand TEXT,
            ingredients TEXT,
            summary TEXT,
            isSafe INTEGER NOT NULL DEFAULT 1,
            timestamp TEXT NOT NULL,
            source TEXT,
            photoUri TEXT,
            dataSource TEXT,
            nutrition TEXT,
            allergens TEXT,
            traces TEXT,
            consumed INTEGER DEFAULT 0,
            consumptions TEXT
          );
        `);
        
        // Migrate old tables - add new columns if they don't exist
        this.migrateSchema();
        
        console.log('✅ SQLite database initialized');
      } catch (error) {
        console.error('❌ SQLite init failed:', error);
        // Fall back to memory store
        this.isWeb = true;
      }
    }
    this.initialized = true;
  }

  /**
   * Add new columns to existing tables (migration)
   */
  private migrateSchema(): void {
    const textColumns = ['brand', 'dataSource', 'nutrition', 'allergens', 'traces', 'consumptions'];
    const intColumns = ['consumed'];
    
    for (const column of textColumns) {
      try {
        this.db.execSync(`ALTER TABLE scans ADD COLUMN ${column} TEXT;`);
        console.log(`✅ Added column: ${column}`);
      } catch (e) {
        // Column already exists - that's fine
      }
    }
    
    for (const column of intColumns) {
      try {
        this.db.execSync(`ALTER TABLE scans ADD COLUMN ${column} INTEGER DEFAULT 0;`);
        console.log(`✅ Added column: ${column}`);
      } catch (e) {
        // Column already exists - that's fine
      }
    }
  }

  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  public saveScan(scan: ScanResult): void {
    this.ensureInitialized();
    
    if (this.isWeb || !this.db) {
      this.memoryStore.set(scan.barcode, scan);
      console.log(`✅ Saved (memory): ${scan.name}`);
      return;
    }
    
    // Serialize JSON fields
    const nutritionJson = scan.nutrition ? JSON.stringify(scan.nutrition) : null;
    const allergensJson = scan.allergens ? JSON.stringify(scan.allergens) : null;
    const tracesJson = scan.traces ? JSON.stringify(scan.traces) : null;
    const consumptionsJson = scan.consumptions ? JSON.stringify(scan.consumptions) : null;
    
    this.db.runSync(
      `INSERT OR REPLACE INTO scans 
       (barcode, name, brand, ingredients, summary, isSafe, timestamp, source, photoUri, dataSource, nutrition, allergens, traces, consumed, consumptions)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        scan.barcode, 
        scan.name, 
        scan.brand || null,
        scan.ingredients, 
        scan.summary,
        scan.isSafe ? 1 : 0, 
        scan.timestamp, 
        scan.source || 'barcode', 
        scan.photoUri || null,
        scan.dataSource || null,
        nutritionJson,
        allergensJson,
        tracesJson,
        scan.consumed ? 1 : 0,
        consumptionsJson
      ]
    );
    console.log(`✅ Saved: ${scan.name}`);
  }

  public getHistory(): ScanResult[] {
    this.ensureInitialized();
    
    if (this.isWeb || !this.db) {
      return Array.from(this.memoryStore.values())
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }
    
    const rows = this.db.getAllSync('SELECT * FROM scans ORDER BY timestamp DESC');
    return rows.map((row: any) => this.rowToScanResult(row));
  }

  public getScan(barcode: string): ScanResult | null {
    this.ensureInitialized();
    
    if (this.isWeb || !this.db) {
      return this.memoryStore.get(barcode) || null;
    }
    
    const row: any = this.db.getFirstSync('SELECT * FROM scans WHERE barcode = ?', [barcode]);
    return row ? this.rowToScanResult(row) : null;
  }

  public deleteScan(barcode: string): void {
    this.ensureInitialized();
    
    if (this.isWeb || !this.db) {
      this.memoryStore.delete(barcode);
      return;
    }
    
    this.db.runSync('DELETE FROM scans WHERE barcode = ?', [barcode]);
  }

  /**
   * Update nutrition data for a scan (user-entered values)
   */
  public updateNutrition(barcode: string, nutrition: NutritionData): void {
    this.ensureInitialized();
    
    const scan = this.getScan(barcode);
    if (!scan) {
      console.warn(`⚠️ Cannot update nutrition - scan not found: ${barcode}`);
      return;
    }
    
    // Merge new nutrition with existing (preserve any values not being updated)
    scan.nutrition = { ...scan.nutrition, ...nutrition };
    this.saveScan(scan);
    console.log(`✅ Updated nutrition for: ${scan.name}`);
  }

  public clearHistory(): void {
    this.ensureInitialized();
    
    if (this.isWeb || !this.db) {
      this.memoryStore.clear();
      return;
    }
    
    this.db.runSync('DELETE FROM scans');
  }

  public getCount(): number {
    this.ensureInitialized();
    
    if (this.isWeb || !this.db) {
      return this.memoryStore.size;
    }
    
    const result: any = this.db.getFirstSync('SELECT COUNT(*) as count FROM scans');
    return result?.count ?? 0;
  }

  /**
   * Convert database row to ScanResult
   * Handles JSON parsing for nutrition, allergens, traces, consumptions
   */
  private rowToScanResult(row: any): ScanResult {
    // Parse JSON fields safely
    let nutrition: NutritionData | undefined;
    let allergens: string[] | undefined;
    let traces: string[] | undefined;
    let consumptions: ConsumptionRecord[] | undefined;
    
    try {
      if (row.nutrition) {
        nutrition = JSON.parse(row.nutrition);
      }
    } catch (e) { /* ignore parse errors */ }
    
    try {
      if (row.allergens) {
        allergens = JSON.parse(row.allergens);
      }
    } catch (e) { /* ignore parse errors */ }
    
    try {
      if (row.traces) {
        traces = JSON.parse(row.traces);
      }
    } catch (e) { /* ignore parse errors */ }
    
    try {
      if (row.consumptions) {
        consumptions = JSON.parse(row.consumptions);
      }
    } catch (e) { /* ignore parse errors */ }
    
    return {
      barcode: row.barcode,
      name: row.name,
      brand: row.brand || undefined,
      ingredients: row.ingredients || '',
      summary: row.summary || '',
      isSafe: row.isSafe === 1,
      timestamp: row.timestamp,
      source: row.source || 'barcode',
      photoUri: row.photoUri || undefined,
      dataSource: row.dataSource || undefined,
      nutrition,
      allergens,
      traces,
      consumed: row.consumed === 1,
      consumptions,
    };
  }

  // ============ CONSUMPTION METHODS ============

  /**
   * Mark a product as consumed with portion size
   */
  public addConsumption(barcode: string, portionGrams: number): void {
    this.ensureInitialized();
    
    const scan = this.getScan(barcode);
    if (!scan) {
      console.warn(`⚠️ Cannot add consumption - scan not found: ${barcode}`);
      return;
    }
    
    // Calculate nutrition for this portion
    const portionNutrition = calculatePortionNutrition(scan.nutrition, portionGrams);
    
    // Create consumption record
    const consumption: ConsumptionRecord = {
      consumedAt: new Date().toISOString(),
      portionGrams,
      portionNutrition,
    };
    
    // Add to existing consumptions
    const consumptions = scan.consumptions || [];
    consumptions.unshift(consumption); // Most recent first
    
    // Update scan
    scan.consumed = true;
    scan.consumptions = consumptions;
    
    this.saveScan(scan);
    console.log(`✅ Added consumption: ${portionGrams}g of ${scan.name}`);
  }

  /**
   * Get all consumed items for a specific date
   */
  public getConsumedForDate(date: Date): ScanResult[] {
    const dateStr = date.toDateString();
    
    return this.getHistory().filter(scan => {
      if (!scan.consumptions) return false;
      return scan.consumptions.some(c => 
        new Date(c.consumedAt).toDateString() === dateStr
      );
    });
  }

  /**
   * Get daily nutrition totals
   */
  public getDailyTotals(date: Date): {
    calories: number;
    sugar: number;
    salt: number;
    protein: number;
    carbs: number;
    itemCount: number;
  } {
    const dateStr = date.toDateString();
    const consumed = this.getConsumedForDate(date);
    
    let calories = 0;
    let sugar = 0;
    let salt = 0;
    let protein = 0;
    let carbs = 0;
    let itemCount = 0;
    
    for (const scan of consumed) {
      if (!scan.consumptions) continue;
      
      for (const consumption of scan.consumptions) {
        if (new Date(consumption.consumedAt).toDateString() !== dateStr) continue;
        
        itemCount++;
        calories += consumption.portionNutrition.calories || 0;
        sugar += consumption.portionNutrition.sugar || 0;
        salt += consumption.portionNutrition.salt || 0;
        protein += consumption.portionNutrition.protein || 0;
        carbs += consumption.portionNutrition.carbs || 0;
      }
    }
    
    return {
      calories: Math.round(calories),
      sugar: Math.round(sugar * 10) / 10,
      salt: Math.round(salt * 10) / 10,
      protein: Math.round(protein * 10) / 10,
      carbs: Math.round(carbs * 10) / 10,
      itemCount,
    };
  }

  /**
   * Get history filtered by consumption status
   */
  public getHistoryFiltered(filter: 'all' | 'consumed' | 'today'): ScanResult[] {
    const history = this.getHistory();
    
    switch (filter) {
      case 'consumed':
        return history.filter(s => s.consumed);
      case 'today':
        const today = new Date().toDateString();
        return history.filter(s => 
          s.consumptions?.some(c => new Date(c.consumedAt).toDateString() === today)
        );
      default:
        return history;
    }
  }

  /**
   * Get consumption statistics for a period
   * @param days Number of days to calculate (7, 30, 90)
   * @param offsetDays Start from this many days ago (for prior period comparison)
   */
  public getPeriodStats(days: number, offsetDays: number = 0): {
    avgCalories: number;
    avgSugar: number;
    avgProtein: number;
    avgCarbs: number;
    daysTracked: number;
    totalItems: number;
  } {
    const history = this.getHistory();
    
    // Calculate date range
    const endDate = new Date();
    endDate.setDate(endDate.getDate() - offsetDays);
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - days);
    
    // Track daily totals
    const dailyTotals: Map<string, {
      calories: number;
      sugar: number;
      protein: number;
      carbs: number;
      items: number;
    }> = new Map();
    
    // Process all consumptions within the date range
    for (const scan of history) {
      if (!scan.consumptions) continue;
      
      for (const consumption of scan.consumptions) {
        const consumedDate = new Date(consumption.consumedAt);
        
        // Check if within date range
        if (consumedDate < startDate || consumedDate > endDate) continue;
        
        const dateKey = consumedDate.toDateString();
        const existing = dailyTotals.get(dateKey) || {
          calories: 0,
          sugar: 0,
          protein: 0,
          carbs: 0,
          items: 0,
        };
        
        existing.calories += consumption.portionNutrition.calories || 0;
        existing.sugar += consumption.portionNutrition.sugar || 0;
        existing.protein += consumption.portionNutrition.protein || 0;
        existing.carbs += consumption.portionNutrition.carbs || 0;
        existing.items += 1;
        
        dailyTotals.set(dateKey, existing);
      }
    }
    
    // Calculate averages
    const daysTracked = dailyTotals.size;
    let totalCalories = 0;
    let totalSugar = 0;
    let totalProtein = 0;
    let totalCarbs = 0;
    let totalItems = 0;
    
    dailyTotals.forEach((day) => {
      totalCalories += day.calories;
      totalSugar += day.sugar;
      totalProtein += day.protein;
      totalCarbs += day.carbs;
      totalItems += day.items;
    });
    
    // Average per day tracked (avoid divide by zero)
    const avgDivisor = daysTracked || 1;
    
    return {
      avgCalories: Math.round(totalCalories / avgDivisor),
      avgSugar: Math.round((totalSugar / avgDivisor) * 10) / 10,
      avgProtein: Math.round((totalProtein / avgDivisor) * 10) / 10,
      avgCarbs: Math.round((totalCarbs / avgDivisor) * 10) / 10,
      daysTracked,
      totalItems,
    };
  }
}

export const dbService = DatabaseService.getInstance();
