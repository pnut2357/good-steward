# Phase 2: Data Model (Refined)

## 🎯 Goal
Define the TypeScript interface that acts as a contract between Database, Services, and UI.

---

## Step 2.1: Create ScanResult Interface

**File:** `models/ScanResult.ts`

```typescript
/**
 * Represents a scanned product with AI analysis
 * 
 * This interface is the "contract" between:
 * - DatabaseService (storage)
 * - AnalysisService (AI processing)  
 * - UI Components (display)
 * 
 * All layers must use this exact structure.
 */
export interface ScanResult {
  /** 
   * Product barcode (unique identifier)
   * EAN-13, EAN-8, UPC-A, or UPC-E format
   */
  barcode: string;
  
  /** 
   * Product name from OpenFoodFacts
   * Falls back to "Unknown Product" if not available
   */
  name: string;
  
  /** 
   * Raw ingredients list
   * As provided by OpenFoodFacts (comma-separated)
   */
  ingredients: string;
  
  /** 
   * AI-generated health summary
   * 2-3 sentences explaining the product's health profile
   */
  summary: string;
  
  /** 
   * Safety indicator
   * true = generally healthy/safe
   * false = caution needed (high sugar, processed, etc.)
   */
  isSafe: boolean;
  
  /** 
   * ISO 8601 timestamp of when scan occurred
   * Used for sorting history (newest first)
   */
  timestamp: string;
}
```

---

## Why This Structure?

| Field | Type | Purpose |
|-------|------|---------|
| `barcode` | `string` | Primary key for DB, prevents duplicate scans |
| `name` | `string` | Display in UI, from OpenFoodFacts |
| `ingredients` | `string` | Raw data for AI analysis and user display |
| `summary` | `string` | AI-generated advice for user |
| `isSafe` | `boolean` | Simple boolean for UI color coding (green/orange) |
| `timestamp` | `string` | ISO format for sorting and display |

---

## Extended Model (Optional)

For more detailed analysis, you can extend the base model:

```typescript
/**
 * Extended scan result with additional nutritional data
 * Use this if you want to display more details in the UI
 */
export interface ScanResultExtended extends ScanResult {
  // Brand information
  brand?: string;
  
  // Product image URL from OpenFoodFacts
  imageUrl?: string;
  
  // Nutriscore grade (A-E, A=best)
  nutriscore?: 'a' | 'b' | 'c' | 'd' | 'e';
  
  // NOVA processing level (1-4, 1=unprocessed)
  novaGroup?: 1 | 2 | 3 | 4;
  
  // Specific health concerns identified by AI
  concerns?: string[];
  
  // Nutritional values per 100g
  nutrition?: {
    calories?: number;
    sugars?: number;
    salt?: number;
    saturatedFat?: number;
    fiber?: number;
    protein?: number;
  };
}
```

> **Note:** For Phase 1 implementation, we'll use the basic `ScanResult` interface. You can extend to `ScanResultExtended` later for additional features.

---

## SQLite Mapping

Since SQLite doesn't have a boolean type, we convert:

| TypeScript | SQLite | Notes |
|------------|--------|-------|
| `string` | `TEXT` | Direct mapping |
| `boolean` | `INTEGER` | 0 = false, 1 = true |

```sql
CREATE TABLE scans (
  barcode TEXT PRIMARY KEY,
  name TEXT,
  ingredients TEXT,
  summary TEXT,
  isSafe INTEGER,        -- 0 or 1
  timestamp TEXT         -- ISO 8601 string
);
```

---

## Usage Examples

### Creating a ScanResult

```typescript
const result: ScanResult = {
  barcode: '5449000000996',
  name: 'Coca-Cola',
  ingredients: 'Carbonated Water, Sugar, Caramel Color...',
  summary: 'High sugar content (10.6g per 100ml). Consider limiting consumption.',
  isSafe: false,
  timestamp: new Date().toISOString()
};
```

### Reading from Database

```typescript
// Raw SQLite row
const row = { 
  barcode: '5449000000996', 
  name: 'Coca-Cola', 
  ingredients: '...',
  summary: '...',
  isSafe: 0,  // SQLite returns 0 or 1
  timestamp: '2024-12-20T...'
};

// Convert to ScanResult
const result: ScanResult = {
  ...row,
  isSafe: row.isSafe === 1  // Convert to boolean
};
```

---

## ✅ Checklist

- [ ] Created `models/ScanResult.ts`
- [ ] Exported `ScanResult` interface
- [ ] All 6 fields defined with correct types
- [ ] JSDoc comments added for documentation
- [ ] Understand SQLite boolean mapping

---

## 🔜 Next: Phase 3 - Database Service
