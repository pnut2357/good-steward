# 18. Medical Safety Features

## Overview

Add health-conscious features for users with specific medical needs:
- **Diabetes** - Monitor sugar and carbohydrates
- **Pregnancy** - Avoid alcohol, caffeine, certain ingredients
- **Food Allergies** - Alert on allergens and traces

All checks use **existing OpenFoodFacts data** - no additional API needed!

---

## OpenFoodFacts Medical Fields

### Nutrition Fields (for Diabetes)
```json
{
  "nutriments": {
    "sugars_100g": 12.5,
    "carbohydrates_100g": 45.2,
    "energy-kcal_100g": 250,
    "fat_100g": 8.0,
    "saturated-fat_100g": 2.5,
    "sodium_100g": 0.5,
    "fiber_100g": 3.0,
    "proteins_100g": 6.0
  },
  "nutriscore_grade": "c"
}
```

### Allergen Fields (for Allergies)
```json
{
  "allergens": "en:gluten, en:milk, en:eggs",
  "allergens_tags": ["en:gluten", "en:milk", "en:eggs"],
  "traces": "en:peanuts, en:tree-nuts",
  "traces_tags": ["en:peanuts", "en:tree-nuts"]
}
```

### Label Fields (for Pregnancy)
```json
{
  "labels_tags": [
    "en:organic",
    "en:not-recommended-for-pregnant-women",
    "en:contains-alcohol"
  ],
  "ingredients_text": "Water, Sugar, Alcohol (12%), Caffeine..."
}
```

---

## Medical Thresholds

### Diabetes Thresholds
| Metric | Low | Medium | High |
|--------|-----|--------|------|
| Sugar (per 100g) | < 5g | 5-15g | > 15g |
| Carbs (per 100g) | < 20g | 20-50g | > 50g |
| Nutriscore | A-B | C | D-E |

### Pregnancy Risk Keywords
```typescript
const PREGNANCY_RISKS = {
  ingredients: ['alcohol', 'wine', 'beer', 'caffeine', 'raw milk', 'unpasteurized'],
  labels: ['en:not-recommended-for-pregnant-women', 'en:contains-alcohol']
};
```

### Common Allergens (Standardized)
```typescript
const ALLERGENS = [
  { code: 'en:gluten', name: 'Gluten', emoji: '🌾' },
  { code: 'en:milk', name: 'Milk/Dairy', emoji: '🥛' },
  { code: 'en:eggs', name: 'Eggs', emoji: '🥚' },
  { code: 'en:peanuts', name: 'Peanuts', emoji: '🥜' },
  { code: 'en:nuts', name: 'Tree Nuts', emoji: '🌰' },
  { code: 'en:soybeans', name: 'Soy', emoji: '🫘' },
  { code: 'en:fish', name: 'Fish', emoji: '🐟' },
  { code: 'en:crustaceans', name: 'Shellfish', emoji: '🦐' },
  { code: 'en:sesame-seeds', name: 'Sesame', emoji: '🌱' },
  { code: 'en:celery', name: 'Celery', emoji: '🥬' },
  { code: 'en:mustard', name: 'Mustard', emoji: '🟡' },
  { code: 'en:sulphur-dioxide', name: 'Sulphites', emoji: '⚗️' },
];
```

---

## User Profile Model

### models/UserProfile.ts
```typescript
export interface UserProfile {
  // Medical conditions
  isDiabetic: boolean;
  isPregnant: boolean;
  
  // Allergies (array of allergen codes)
  allergies: string[];  // e.g., ['en:peanuts', 'en:gluten']
  
  // Preferences
  showTraces: boolean;  // Show "may contain" warnings
  strictMode: boolean;  // Extra cautious warnings
}

export const DEFAULT_PROFILE: UserProfile = {
  isDiabetic: false,
  isPregnant: false,
  allergies: [],
  showTraces: true,
  strictMode: false,
};
```

---

## Medical Safety Service

### services/MedicalSafetyService.ts
```typescript
import { UserProfile } from '../models/UserProfile';

export interface MedicalWarning {
  type: 'danger' | 'warning' | 'info';
  category: 'diabetes' | 'pregnancy' | 'allergy' | 'recall';
  message: string;
  details?: string;
}

/**
 * Check product for medical risks based on user profile
 * Uses OpenFoodFacts data - no additional API calls!
 */
export function checkMedicalSafety(
  product: any, 
  profile: UserProfile
): MedicalWarning[] {
  const warnings: MedicalWarning[] = [];

  // ========================================
  // 1. DIABETES CHECKS
  // ========================================
  if (profile.isDiabetic) {
    const sugar = product.nutriments?.sugars_100g;
    const carbs = product.nutriments?.carbohydrates_100g;
    const nutriscore = product.nutriscore_grade?.toLowerCase();

    // High sugar warning
    if (sugar !== undefined) {
      if (sugar > 15) {
        warnings.push({
          type: 'danger',
          category: 'diabetes',
          message: `⚠️ Very High Sugar: ${sugar}g per 100g`,
          details: 'This product has very high sugar content. Consider alternatives.'
        });
      } else if (sugar > 10) {
        warnings.push({
          type: 'warning',
          category: 'diabetes',
          message: `⚠️ High Sugar: ${sugar}g per 100g`,
          details: 'Moderate your portion size.'
        });
      }
    }

    // High carb warning
    if (carbs !== undefined && carbs > 50) {
      warnings.push({
        type: 'warning',
        category: 'diabetes',
        message: `🍞 High Carbs: ${carbs}g per 100g`,
        details: 'Count this towards your daily carb intake.'
      });
    }

    // Poor nutriscore
    if (nutriscore === 'd' || nutriscore === 'e') {
      warnings.push({
        type: 'info',
        category: 'diabetes',
        message: `Nutriscore ${nutriscore.toUpperCase()} - Poor nutritional quality`
      });
    }
  }

  // ========================================
  // 2. PREGNANCY CHECKS
  // ========================================
  if (profile.isPregnant) {
    const ingredients = (product.ingredients_text || '').toLowerCase();
    const labels = product.labels_tags || [];

    // Check for alcohol
    if (
      ingredients.includes('alcohol') ||
      ingredients.includes('wine') ||
      ingredients.includes('beer') ||
      ingredients.includes('spirits') ||
      labels.includes('en:contains-alcohol')
    ) {
      warnings.push({
        type: 'danger',
        category: 'pregnancy',
        message: '⛔ Contains Alcohol - NOT SAFE during pregnancy',
        details: 'No amount of alcohol is considered safe during pregnancy.'
      });
    }

    // Check for caffeine
    if (ingredients.includes('caffeine') || ingredients.includes('coffee')) {
      warnings.push({
        type: 'warning',
        category: 'pregnancy',
        message: '☕ Contains Caffeine - Limit consumption',
        details: 'Recommended limit: 200mg caffeine per day during pregnancy.'
      });
    }

    // Check for unpasteurized/raw dairy
    if (
      ingredients.includes('raw milk') ||
      ingredients.includes('unpasteurized') ||
      ingredients.includes('lait cru')
    ) {
      warnings.push({
        type: 'danger',
        category: 'pregnancy',
        message: '⛔ Contains Raw/Unpasteurized Dairy',
        details: 'Risk of Listeria infection. Avoid during pregnancy.'
      });
    }

    // Check pregnancy warning labels
    if (labels.includes('en:not-recommended-for-pregnant-women')) {
      warnings.push({
        type: 'danger',
        category: 'pregnancy',
        message: '⛔ Labeled NOT recommended for pregnant women'
      });
    }
  }

  // ========================================
  // 3. ALLERGY CHECKS
  // ========================================
  if (profile.allergies.length > 0) {
    const allergens = product.allergens_tags || [];
    const traces = product.traces_tags || [];

    for (const userAllergy of profile.allergies) {
      // Direct allergen match
      if (allergens.includes(userAllergy)) {
        const allergenName = userAllergy.replace('en:', '').replace(/-/g, ' ');
        warnings.push({
          type: 'danger',
          category: 'allergy',
          message: `⛔ CONTAINS: ${allergenName.toUpperCase()}`,
          details: 'This product contains an allergen you are allergic to.'
        });
      }

      // Trace warning (may contain)
      if (profile.showTraces && traces.includes(userAllergy)) {
        const allergenName = userAllergy.replace('en:', '').replace(/-/g, ' ');
        warnings.push({
          type: 'warning',
          category: 'allergy',
          message: `⚠️ May contain traces of: ${allergenName}`,
          details: 'Cross-contamination possible during manufacturing.'
        });
      }
    }
  }

  return warnings;
}

/**
 * Get a safety score based on warnings
 * Returns 0-100 (100 = safest)
 */
export function calculateSafetyScore(warnings: MedicalWarning[]): number {
  let score = 100;
  
  for (const warning of warnings) {
    switch (warning.type) {
      case 'danger':
        score -= 40;
        break;
      case 'warning':
        score -= 15;
        break;
      case 'info':
        score -= 5;
        break;
    }
  }
  
  return Math.max(0, score);
}
```

---

## OpenFDA Food Recalls Integration

### API Endpoint
```
GET https://api.fda.gov/food/enforcement.json
```

### Query by Brand
```typescript
const brandName = product.brands || '';
const searchQuery = encodeURIComponent(brandName);
const url = `https://api.fda.gov/food/enforcement.json?search=recalling_firm:"${searchQuery}"&limit=5`;
```

### Response Structure
```json
{
  "results": [
    {
      "recall_number": "F-1234-2024",
      "reason_for_recall": "Potential Salmonella contamination",
      "status": "Ongoing",
      "distribution_pattern": "Nationwide",
      "recall_initiation_date": "2024-01-15",
      "product_description": "Peanut Butter, 16oz jars"
    }
  ]
}
```

### Code Example
```typescript
// services/RecallService.ts
import axios from 'axios';

interface RecallAlert {
  recallNumber: string;
  reason: string;
  status: string;
  date: string;
  product: string;
}

export async function checkRecalls(brandName: string): Promise<RecallAlert[]> {
  if (!brandName) return [];
  
  try {
    const searchQuery = encodeURIComponent(brandName);
    const url = `https://api.fda.gov/food/enforcement.json?search=recalling_firm:"${searchQuery}"&limit=5`;
    
    const response = await axios.get(url, { timeout: 3000 });
    
    return (response.data.results || []).map((r: any) => ({
      recallNumber: r.recall_number,
      reason: r.reason_for_recall,
      status: r.status,
      date: r.recall_initiation_date,
      product: r.product_description
    }));
  } catch (error) {
    // No recalls found or API error - not critical
    return [];
  }
}
```

---

## UI Components for Medical Warnings

### WarningBadge Component
```tsx
// components/WarningBadge.tsx
import { View, Text, StyleSheet } from 'react-native';
import { MedicalWarning } from '../services/MedicalSafetyService';

const BADGE_COLORS = {
  danger: { bg: '#FFEBEE', border: '#D32F2F', text: '#B71C1C' },
  warning: { bg: '#FFF3E0', border: '#F57C00', text: '#E65100' },
  info: { bg: '#E3F2FD', border: '#1976D2', text: '#0D47A1' },
};

export function WarningBadge({ warning }: { warning: MedicalWarning }) {
  const colors = BADGE_COLORS[warning.type];
  
  return (
    <View style={[styles.badge, { backgroundColor: colors.bg, borderColor: colors.border }]}>
      <Text style={[styles.message, { color: colors.text }]}>{warning.message}</Text>
      {warning.details && (
        <Text style={[styles.details, { color: colors.text }]}>{warning.details}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginVertical: 4,
  },
  message: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  details: {
    fontSize: 14,
    marginTop: 4,
    opacity: 0.8,
  },
});
```

---

## Implementation Order

1. **Phase 1**: Create `UserProfile` model and storage (AsyncStorage)
2. **Phase 2**: Create `MedicalSafetyService` with all check functions
3. **Phase 3**: Update `ResultModal` to show warnings
4. **Phase 4**: Create Settings screen for user to set profile
5. **Phase 5**: (Optional) Add OpenFDA recall checking

---

## Storage for User Profile

```typescript
// services/ProfileService.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserProfile, DEFAULT_PROFILE } from '../models/UserProfile';

const PROFILE_KEY = '@good_steward_profile';

export async function saveProfile(profile: UserProfile): Promise<void> {
  await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}

export async function loadProfile(): Promise<UserProfile> {
  try {
    const json = await AsyncStorage.getItem(PROFILE_KEY);
    return json ? JSON.parse(json) : DEFAULT_PROFILE;
  } catch {
    return DEFAULT_PROFILE;
  }
}
```

---

## Dependencies Needed

```bash
# For user profile storage
npx expo install @react-native-async-storage/async-storage
```

---

## Summary

| Feature | Data Source | Cost |
|---------|-------------|------|
| Diabetes checks | OpenFoodFacts nutriments | FREE |
| Pregnancy warnings | OpenFoodFacts ingredients + labels | FREE |
| Allergy alerts | OpenFoodFacts allergens + traces | FREE |
| Food recalls | OpenFDA API | FREE |
| Profile storage | AsyncStorage (local) | FREE |

**Total API cost: $0**

