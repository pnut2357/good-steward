# Phase 3: Database Service (Refined)

## 🎯 Goal
Create a Singleton class to manage SQLite database operations.

---

## expo-sqlite API Reference (SDK 54)

### Synchronous API (Recommended)

Expo SDK 51+ introduced a synchronous SQLite API that's faster and easier to use:

```typescript
import * as SQLite from 'expo-sqlite';

// Open database (creates if doesn't exist)
const db = SQLite.openDatabaseSync('myapp.db');

// Execute SQL (no return value)
db.execSync('CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY)');

// Run parameterized query (returns RunResult with changes/lastInsertRowId)
const result = db.runSync('INSERT INTO users (name) VALUES (?)', ['John']);

// Get all rows
const rows = db.getAllSync('SELECT * FROM users');

// Get first row (or null)
const row = db.getFirstSync('SELECT * FROM users WHERE id = ?', [1]);
```

### Key Methods

| Method | Returns | Use Case |
|--------|---------|----------|
| `openDatabaseSync(name)` | `SQLiteDatabase` | Open/create database |
| `execSync(sql)` | `void` | CREATE TABLE, etc. |
| `runSync(sql, params)` | `RunResult` | INSERT, UPDATE, DELETE |
| `getAllSync(sql, params)` | `any[]` | SELECT multiple rows |
| `getFirstSync(sql, params)` | `any \| null` | SELECT single row |

---

## Step 3.1: Create DatabaseService

**File:** `services/DatabaseService.ts`

```typescript
import * as SQLite from 'expo-sqlite';
import { ScanResult } from '../models/ScanResult';

/**
 * Singleton class for SQLite database operations
 * 
 * Implements the OFFLINE-FIRST strategy:
 * - Check local DB before making API calls
 * - Cache API results for future offline access
 * 
 * Database: goodSteward.db
 * Table: scans
 */
export class DatabaseService {
  private db: SQLite.SQLiteDatabase;
  private static instance: DatabaseService | null = null;

  private constructor() {
    // Open database synchronously (Expo SDK 54 API)
    this.db = SQLite.openDatabaseSync('goodSteward.db');
    this.init();
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  /**
   * Initialize database table
   * Called once on first instantiation
   */
  private init(): void {
    this.db.execSync(`
      CREATE TABLE IF NOT EXISTS scans (
        barcode TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        ingredients TEXT,
        summary TEXT,
        isSafe INTEGER NOT NULL DEFAULT 1,
        timestamp TEXT NOT NULL
      );
    `);
    console.log('Database initialized');
  }

  /**
   * Save or update a scan result
   * Uses INSERT OR REPLACE for upsert behavior
   * 
   * @param scan - The scan result to save
   */
  public saveScan(scan: ScanResult): void {
    this.db.runSync(
      `INSERT OR REPLACE INTO scans 
       (barcode, name, ingredients, summary, isSafe, timestamp)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        scan.barcode,
        scan.name,
        scan.ingredients,
        scan.summary,
        scan.isSafe ? 1 : 0,  // Convert boolean to integer
        scan.timestamp
      ]
    );
    console.log(`Saved scan: ${scan.barcode}`);
  }

  /**
   * Get all scans ordered by newest first
   * Used for the History screen
   * 
   * @returns Array of ScanResult, newest first
   */
  public getHistory(): ScanResult[] {
    const rows = this.db.getAllSync(
      'SELECT * FROM scans ORDER BY timestamp DESC'
    );
    
    return rows.map((row: any) => this.rowToScanResult(row));
  }

  /**
   * Get a specific scan by barcode
   * This is the OFFLINE-FIRST check!
   * 
   * @param barcode - The barcode to look up
   * @returns ScanResult if found, null if not cached
   */
  public getScan(barcode: string): ScanResult | null {
    const row: any = this.db.getFirstSync(
      'SELECT * FROM scans WHERE barcode = ?',
      [barcode]
    );
    
    return row ? this.rowToScanResult(row) : null;
  }

  /**
   * Delete a scan by barcode
   * 
   * @param barcode - The barcode to delete
   */
  public deleteScan(barcode: string): void {
    this.db.runSync(
      'DELETE FROM scans WHERE barcode = ?',
      [barcode]
    );
    console.log(`Deleted scan: ${barcode}`);
  }

  /**
   * Clear all scan history
   * Use with caution!
   */
  public clearHistory(): void {
    this.db.runSync('DELETE FROM scans');
    console.log('History cleared');
  }

  /**
   * Get count of cached scans
   * 
   * @returns Number of scans in database
   */
  public getCount(): number {
    const result: any = this.db.getFirstSync(
      'SELECT COUNT(*) as count FROM scans'
    );
    return result?.count ?? 0;
  }

  /**
   * Convert SQLite row to ScanResult
   * Handles integer-to-boolean conversion for isSafe
   */
  private rowToScanResult(row: any): ScanResult {
    return {
      barcode: row.barcode,
      name: row.name,
      ingredients: row.ingredients || '',
      summary: row.summary || '',
      isSafe: row.isSafe === 1,  // Convert integer to boolean
      timestamp: row.timestamp
    };
  }
}

// Export singleton instance
export const dbService = DatabaseService.getInstance();
```

---

## Key Methods

| Method | Purpose | Returns |
|--------|---------|---------|
| `getInstance()` | Get singleton instance | `DatabaseService` |
| `saveScan(scan)` | Insert or update scan result | `void` |
| `getHistory()` | Get all scans for History screen | `ScanResult[]` |
| `getScan(barcode)` | **OFFLINE-FIRST CHECK** - find cached | `ScanResult \| null` |
| `deleteScan(barcode)` | Remove single scan | `void` |
| `clearHistory()` | Delete all scans | `void` |
| `getCount()` | Count cached scans | `number` |

---

## SQLite Notes

### Boolean Handling
SQLite has no boolean type, so we use INTEGER:
- `true` → `1`
- `false` → `0`

```typescript
// Save: Convert boolean to integer
scan.isSafe ? 1 : 0

// Load: Convert integer to boolean
row.isSafe === 1
```

### Upsert Behavior
`INSERT OR REPLACE` ensures:
- New barcodes are inserted
- Existing barcodes are updated (e.g., if we re-scan)

### Database Location
Expo stores SQLite databases in the app's private document directory:
- iOS: `~/Library/Application Support/Expo/<app-id>/SQLite/`
- Android: `/data/data/<package>/databases/`

---

## Singleton Pattern Benefits

1. **Single Connection:** Only one database connection throughout app lifecycle
2. **Consistent State:** All components see the same data
3. **Easy Access:** Import `dbService` anywhere, no need to pass around
4. **Initialization Once:** Database table created only on first use

---

## Usage Example

```typescript
import { dbService } from '@/services/DatabaseService';

// Check if product is cached (OFFLINE-FIRST)
const cached = dbService.getScan('5449000000996');

if (cached) {
  // Found in local DB - use cached result
  showResult(cached);
} else {
  // Not cached - fetch from API
  const fresh = await analysisService.analyzeProduct('5449000000996');
  
  if (fresh) {
    // Save for future offline access
    dbService.saveScan(fresh);
    showResult(fresh);
  }
}

// Get history for list
const history = dbService.getHistory();
```

---

## ✅ Checklist

- [ ] Created `services/DatabaseService.ts`
- [ ] Implemented singleton pattern with `getInstance()`
- [ ] Implemented `init()` with CREATE TABLE
- [ ] Implemented `saveScan()` with boolean conversion
- [ ] Implemented `getHistory()` with timestamp sorting
- [ ] Implemented `getScan()` for offline-first lookup
- [ ] Implemented `deleteScan()` and `clearHistory()`
- [ ] Implemented `rowToScanResult()` helper
- [ ] Exported singleton `dbService`

---

## 🔜 Next: Phase 4 - Analysis Service
