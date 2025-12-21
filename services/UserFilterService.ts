import { ScanResult } from '../models/ScanResult';
import { UserProfile, formatAllergenName } from '../models/UserProfile';
import { profileService } from './ProfileService';

/**
 * Warning levels
 */
export type WarningLevel = 'danger' | 'warning' | 'info';

/**
 * User-triggered warning
 * 
 * LEGAL: All warnings are attributed to the USER's settings,
 * not app recommendations.
 */
export interface UserWarning {
  /** Warning level */
  level: WarningLevel;
  
  /** Which filter mode triggered this */
  mode: 'sugar' | 'pregnancy' | 'allergy' | 'trace';
  
  /** The factual value found */
  fact: string;
  
  /** User's threshold that was exceeded */
  threshold: string;
  
  /** Display message */
  message: string;
  
  /** Emoji for display */
  emoji: string;
}

/**
 * Keywords that indicate pregnancy concerns
 */
const PREGNANCY_KEYWORDS = {
  alcohol: ['alcohol', 'wine', 'beer', 'spirits', 'liquor', 'vodka', 'whiskey', 'rum'],
  caffeine: ['caffeine', 'coffee', 'espresso', 'guarana', 'energy drink'],
  rawDairy: ['raw milk', 'unpasteurized', 'lait cru', 'raw cheese'],
};

/**
 * Pregnancy warning labels from OpenFoodFacts
 */
const PREGNANCY_WARNING_LABELS = [
  'en:not-recommended-for-pregnant-women',
  'en:contains-alcohol',
];

/**
 * Service for generating warnings based on user's profile
 * 
 * LEGAL: This service generates warnings based on USER-DEFINED settings,
 * not medical advice. All warnings clearly attribute to the user's filter.
 */
export class UserFilterService {
  private static instance: UserFilterService | null = null;

  private constructor() {}

  public static getInstance(): UserFilterService {
    if (!UserFilterService.instance) {
      UserFilterService.instance = new UserFilterService();
    }
    return UserFilterService.instance;
  }

  /**
   * Check a product against the user's profile and return warnings
   */
  public async checkProduct(product: ScanResult): Promise<UserWarning[]> {
    const profile = await profileService.loadProfile();
    const warnings: UserWarning[] = [];

    // Check sugar (diabetes mode)
    if (profile.diabetesMode) {
      const sugarWarnings = this.checkSugar(product, profile);
      warnings.push(...sugarWarnings);
    }

    // Check pregnancy concerns
    if (profile.pregnancyMode) {
      const pregnancyWarnings = this.checkPregnancy(product);
      warnings.push(...pregnancyWarnings);
    }

    // Check allergens
    if (profile.allergyMode && profile.allergens.length > 0) {
      const allergenWarnings = this.checkAllergens(product, profile);
      warnings.push(...allergenWarnings);
    }

    return warnings;
  }

  /**
   * Check sugar content against user's threshold
   */
  private checkSugar(product: ScanResult, profile: UserProfile): UserWarning[] {
    const warnings: UserWarning[] = [];
    const sugar = product.nutrition?.sugar_100g;

    if (sugar !== undefined && sugar > profile.sugarThreshold) {
      warnings.push({
        level: sugar > profile.sugarThreshold * 2 ? 'danger' : 'warning',
        mode: 'sugar',
        fact: `${sugar}g sugar per 100g`,
        threshold: `Your threshold: ${profile.sugarThreshold}g`,
        message: `Sugar content (${sugar}g) exceeds your threshold (${profile.sugarThreshold}g)`,
        emoji: '🩸',
      });
    }

    return warnings;
  }

  /**
   * Check for pregnancy concerns
   */
  private checkPregnancy(product: ScanResult): UserWarning[] {
    const warnings: UserWarning[] = [];
    const ingredients = (product.ingredients || '').toLowerCase();

    // Check for alcohol
    for (const keyword of PREGNANCY_KEYWORDS.alcohol) {
      if (ingredients.includes(keyword)) {
        warnings.push({
          level: 'danger',
          mode: 'pregnancy',
          fact: `Contains "${keyword}"`,
          threshold: 'Your pregnancy filter is active',
          message: `Ingredient list includes "${keyword}"`,
          emoji: '🤰',
        });
        break; // Only one alcohol warning
      }
    }

    // Check for caffeine
    for (const keyword of PREGNANCY_KEYWORDS.caffeine) {
      if (ingredients.includes(keyword)) {
        warnings.push({
          level: 'warning',
          mode: 'pregnancy',
          fact: `Contains "${keyword}"`,
          threshold: 'Your pregnancy filter is active',
          message: `Ingredient list includes "${keyword}"`,
          emoji: '☕',
        });
        break; // Only one caffeine warning
      }
    }

    // Check for raw dairy
    for (const keyword of PREGNANCY_KEYWORDS.rawDairy) {
      if (ingredients.includes(keyword)) {
        warnings.push({
          level: 'danger',
          mode: 'pregnancy',
          fact: `Contains "${keyword}"`,
          threshold: 'Your pregnancy filter is active',
          message: `May contain unpasteurized dairy`,
          emoji: '🥛',
        });
        break;
      }
    }

    return warnings;
  }

  /**
   * Check for allergens
   */
  private checkAllergens(product: ScanResult, profile: UserProfile): UserWarning[] {
    const warnings: UserWarning[] = [];
    const productAllergens = product.allergens || [];
    const productTraces = product.traces || [];

    // Check direct allergens
    for (const userAllergen of profile.allergens) {
      if (productAllergens.includes(userAllergen)) {
        const name = formatAllergenName(userAllergen);
        warnings.push({
          level: 'danger',
          mode: 'allergy',
          fact: `Contains ${name}`,
          threshold: `${name} is in your allergen list`,
          message: `CONTAINS: ${name.toUpperCase()}`,
          emoji: '⛔',
        });
      }
    }

    // Check traces (if enabled)
    if (profile.showTraces) {
      for (const userAllergen of profile.allergens) {
        if (productTraces.includes(userAllergen)) {
          const name = formatAllergenName(userAllergen);
          warnings.push({
            level: 'warning',
            mode: 'trace',
            fact: `May contain traces of ${name}`,
            threshold: `${name} is in your allergen list`,
            message: `May contain traces of: ${name}`,
            emoji: '⚠️',
          });
        }
      }
    }

    return warnings;
  }

  /**
   * Check product synchronously using cached profile
   */
  public checkProductSync(product: ScanResult): UserWarning[] {
    const profile = profileService.getCachedProfile();
    const warnings: UserWarning[] = [];

    console.log('🔍 User Filter Check:');
    console.log(`   Diabetes Mode: ${profile.diabetesMode} (threshold: ${profile.sugarThreshold}g)`);
    console.log(`   Pregnancy Mode: ${profile.pregnancyMode}`);
    console.log(`   Allergy Mode: ${profile.allergyMode} (${profile.allergens.length} allergens)`);

    if (profile.diabetesMode) {
      warnings.push(...this.checkSugar(product, profile));
    }

    if (profile.pregnancyMode) {
      warnings.push(...this.checkPregnancy(product));
    }

    if (profile.allergyMode && profile.allergens.length > 0) {
      warnings.push(...this.checkAllergens(product, profile));
    }

    return warnings;
  }

  /**
   * Get warning count for a product (quick check)
   */
  public getWarningCount(product: ScanResult): number {
    return this.checkProductSync(product).length;
  }

  /**
   * Check if product has any critical (danger) warnings
   */
  public hasCriticalWarnings(product: ScanResult): boolean {
    return this.checkProductSync(product).some(w => w.level === 'danger');
  }
}

export const userFilterService = UserFilterService.getInstance();

