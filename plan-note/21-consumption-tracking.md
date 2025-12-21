# Consumption Tracking Feature

> **Status**: Planned  
> **Priority**: High  
> **Complexity**: Medium

---

## 1. Overview

### Problem
Currently, the app tracks what users **scan** but not what they **consume**. Users need:
- Daily nutrition totals (calories, sugar, etc.)
- Portion-based consumption logging
- Personalized recommendations based on their filters

### Solution
Add consumption tracking **integrated into existing scan history** (not a separate screen) with:
- "Mark as Consumed" action
- Portion size input
- Daily nutrition summary
- Filter-aware recommendations

---

## 2. User Flow (Simplified)

```
User scans product
       ↓
┌─────────────────────────────┐
│  Result Modal               │
│  - Product info             │
│  - Nutrition facts          │
│  - YOUR FILTER WARNINGS     │  ← Already shows sugar/pregnancy/allergy alerts
│                             │
│  [Mark as Consumed]  [Close]│  ← NEW: Consumption action
└─────────────────────────────┘
       ↓ (if marked consumed)
┌─────────────────────────────┐
│  Portion Size               │
│                             │
│  How much did you consume?  │
│  ○ 1 serving (50g)          │
│  ○ Half serving (25g)       │
│  ○ Custom: [____] g         │
│                             │
│  [Add to Today's Log]       │
└─────────────────────────────┘
       ↓
┌─────────────────────────────┐
│  History Screen             │
│                             │
│  [All] [Consumed] ← Filter  │  ← Toggle between all/consumed
│                             │
│  TODAY'S SUMMARY            │
│  🔥 Calories: 450 / 2000    │
│  🍬 Sugar: 25g / 50g        │  ← Based on user's threshold
│  ⚠️ 1 filter warning        │
│                             │
│  ─────────────────────────  │
│  Peppermint Bark  [✓ eaten] │
│  25g consumed at 2:30 PM    │
│  Sugar: 13g (26g/100g)      │
│  ─────────────────────────  │
│  Walnut Pack     [scanned]  │
│  Not consumed               │
└─────────────────────────────┘
```

---

## 3. Data Model Changes

### Updated ScanResult (consumption fields)

```typescript
interface ScanResult {
  // Existing fields...
  barcode: string;
  name: string;
  nutrition?: NutritionData;
  // ...

  // NEW: Consumption tracking
  consumed?: boolean;
  consumedAt?: string;        // ISO timestamp
  portionGrams?: number;      // How much was consumed
  portionNutrition?: {        // Calculated nutrition for portion
    calories?: number;
    sugar?: number;
    salt?: number;
    // etc.
  };
}
```

### Daily Summary (computed, not stored)

```typescript
interface DailySummary {
  date: string;  // YYYY-MM-DD
  totalCalories: number;
  totalSugar: number;
  totalSalt: number;
  itemsConsumed: number;
  warnings: UserWarning[];  // Accumulated warnings for the day
}
```

---

## 4. Filter Mode Integration

### Current State ✅
The ResultModal already checks filters when displaying a product:

```typescript
// ResultModal.tsx (already implemented)
useEffect(() => {
  if (result && visible) {
    const userWarnings = userFilterService.checkProductSync(result);
    setWarnings(userWarnings);
  }
}, [result, visible]);
```

### What Each Mode Does:

| Mode | What It Checks | Warning Shown |
|------|----------------|---------------|
| **Sugar Monitoring** | `nutrition.sugar_100g > threshold` | "Sugar content (Xg) exceeds your threshold (Yg)" |
| **Pregnancy Mode** | Ingredients for alcohol/caffeine keywords | "Contains alcohol/caffeine" |
| **Allergy Mode** | `allergens` array matches user's allergens | "Contains [allergen]" |

### Enhanced for Consumption:

When user marks item as consumed, we should:
1. **Check if it triggers any filter warnings**
2. **Show portion-adjusted warnings** (e.g., "This portion contains 13g sugar")
3. **Track cumulative daily intake vs thresholds**

```typescript
// Example: Sugar monitoring with consumption
const portionSugar = (product.nutrition.sugar_100g / 100) * portionGrams;
const remainingBudget = profile.sugarThreshold - dailyTotal.sugar;

if (portionSugar > remainingBudget) {
  warnings.push({
    level: 'warning',
    mode: 'sugar',
    message: `This ${portionGrams}g portion has ${portionSugar}g sugar. 
              You have ${remainingBudget}g remaining today.`,
  });
}
```

---

## 5. UI Components

### A. Result Modal Enhancement

Add "Mark as Consumed" button:

```tsx
// ResultModal.tsx - Add after close button
<View style={styles.actionButtons}>
  <Pressable style={styles.consumeButton} onPress={handleMarkConsumed}>
    <MaterialIcons name="restaurant" size={20} color="#fff" />
    <Text style={styles.consumeButtonText}>I Ate This</Text>
  </Pressable>
  <Pressable style={styles.closeButton} onPress={onClose}>
    <Text style={styles.closeButtonText}>Close</Text>
  </Pressable>
</View>
```

### B. Portion Size Modal

Simple portion selector:

```tsx
// PortionModal.tsx
<Modal visible={visible}>
  <Text>How much did you eat?</Text>
  
  {/* Quick options based on product serving size */}
  <Pressable onPress={() => selectPortion(servingSize)}>
    <Text>1 serving ({servingSize}g)</Text>
  </Pressable>
  <Pressable onPress={() => selectPortion(servingSize / 2)}>
    <Text>Half serving ({servingSize / 2}g)</Text>
  </Pressable>
  
  {/* Custom input */}
  <TextInput 
    keyboardType="numeric"
    placeholder="Custom grams"
    onChangeText={setCustomPortion}
  />
  
  {/* Show what this portion contains */}
  <View style={styles.portionPreview}>
    <Text>This portion contains:</Text>
    <Text>🔥 {portionCalories} calories</Text>
    <Text>🍬 {portionSugar}g sugar</Text>
  </View>
  
  <Pressable onPress={confirmConsumption}>
    <Text>Add to Today's Log</Text>
  </Pressable>
</Modal>
```

### C. History Screen Enhancement

Add filter toggle and daily summary:

```tsx
// history.tsx - Enhanced
export default function HistoryScreen() {
  const [filter, setFilter] = useState<'all' | 'consumed'>('all');
  const [dailySummary, setDailySummary] = useState<DailySummary | null>(null);
  
  return (
    <View>
      {/* Filter Toggle */}
      <View style={styles.filterToggle}>
        <Pressable 
          style={[styles.filterButton, filter === 'all' && styles.filterActive]}
          onPress={() => setFilter('all')}
        >
          <Text>All Scans</Text>
        </Pressable>
        <Pressable 
          style={[styles.filterButton, filter === 'consumed' && styles.filterActive]}
          onPress={() => setFilter('consumed')}
        >
          <Text>Consumed</Text>
        </Pressable>
      </View>
      
      {/* Daily Summary (only when viewing consumed) */}
      {filter === 'consumed' && dailySummary && (
        <DailySummaryCard summary={dailySummary} />
      )}
      
      {/* Scan list */}
      <FlatList ... />
    </View>
  );
}
```

---

## 6. Implementation Phases

### Phase A: Data Model (1 hour)
- [ ] Add consumption fields to ScanResult interface
- [ ] Update DatabaseService to store/retrieve consumption data
- [ ] Create ConsumptionService for calculations

### Phase B: Mark as Consumed (2 hours)
- [ ] Add "I Ate This" button to ResultModal
- [ ] Create PortionModal component
- [ ] Implement portion-based nutrition calculation

### Phase C: History Enhancement (2 hours)
- [ ] Add filter toggle (All/Consumed) to History screen
- [ ] Create DailySummaryCard component
- [ ] Implement daily totals calculation

### Phase D: Smart Recommendations (1 hour)
- [ ] Add portion suggestions based on remaining daily budget
- [ ] Show warnings when consumption exceeds thresholds
- [ ] Integrate with existing filter modes

---

## 7. User-Friendly Design Principles

### DO ✅
- **Single history screen** with filter toggle (not separate screens)
- **Quick portion options** (1 serving, half, custom)
- **Clear daily summary** at top of consumed view
- **Contextual suggestions** ("You have Xg sugar budget remaining")

### DON'T ❌
- Don't create separate "Consumed" tab
- Don't require manual calorie entry
- Don't overwhelm with too many nutrition metrics
- Don't make consumption logging mandatory

---

## 8. Future Enhancements

- **Weekly/Monthly reports**: Trends over time
- **Export data**: CSV/PDF reports for healthcare providers
- **Goals**: Set daily calorie/sugar/etc. targets
- **Meal tagging**: Breakfast, lunch, dinner, snacks
- **Favorites**: Quick re-log frequently consumed items

---

## 9. Legal Considerations

**IMPORTANT**: All consumption tracking is for **informational purposes only**.

Display disclaimer:
> "Nutrition tracking is for personal reference only. Actual nutrition may vary. 
> Consult a healthcare professional for dietary advice."

Do NOT:
- Recommend specific calorie targets
- Diagnose nutritional deficiencies
- Prescribe portion sizes as medical advice

