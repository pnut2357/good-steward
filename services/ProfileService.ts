import AsyncStorage from '@react-native-async-storage/async-storage';
import { DEFAULT_PROFILE, UserProfile } from '../models/UserProfile';

const PROFILE_KEY = '@good_steward_profile';

/**
 * Singleton service for managing user profile
 * Uses AsyncStorage for persistent local storage
 */
export class ProfileService {
  private static instance: ProfileService | null = null;
  private cachedProfile: UserProfile | null = null;

  private constructor() {}

  public static getInstance(): ProfileService {
    if (!ProfileService.instance) {
      ProfileService.instance = new ProfileService();
    }
    return ProfileService.instance;
  }

  /**
   * Load user profile from storage
   * Returns default profile if none exists
   */
  public async loadProfile(): Promise<UserProfile> {
    // Return cached if available
    if (this.cachedProfile) {
      return this.cachedProfile;
    }

    try {
      const json = await AsyncStorage.getItem(PROFILE_KEY);
      
      if (json) {
        const stored = JSON.parse(json);
        // Merge with defaults to handle new fields
        this.cachedProfile = { ...DEFAULT_PROFILE, ...stored };
        console.log('✅ Profile loaded');
      } else {
        this.cachedProfile = { ...DEFAULT_PROFILE };
        console.log('ℹ️ Using default profile');
      }
      
      return this.cachedProfile;
    } catch (error) {
      console.error('❌ Failed to load profile:', error);
      this.cachedProfile = { ...DEFAULT_PROFILE };
      return this.cachedProfile;
    }
  }

  /**
   * Save user profile to storage
   */
  public async saveProfile(profile: UserProfile): Promise<void> {
    try {
      await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
      this.cachedProfile = profile;
      console.log('✅ Profile saved');
    } catch (error) {
      console.error('❌ Failed to save profile:', error);
      throw error;
    }
  }

  /**
   * Update specific fields in the profile
   */
  public async updateProfile(updates: Partial<UserProfile>): Promise<UserProfile> {
    const current = await this.loadProfile();
    const updated = { ...current, ...updates };
    await this.saveProfile(updated);
    return updated;
  }

  /**
   * Reset profile to defaults
   */
  public async resetProfile(): Promise<void> {
    try {
      await AsyncStorage.removeItem(PROFILE_KEY);
      this.cachedProfile = { ...DEFAULT_PROFILE };
      console.log('✅ Profile reset to defaults');
    } catch (error) {
      console.error('❌ Failed to reset profile:', error);
      throw error;
    }
  }

  /**
   * Get cached profile (sync) - must call loadProfile first
   */
  public getCachedProfile(): UserProfile {
    return this.cachedProfile || DEFAULT_PROFILE;
  }

  /**
   * Check if any filter modes are active
   */
  public hasActiveFilters(): boolean {
    const profile = this.getCachedProfile();
    return profile.diabetesMode || profile.pregnancyMode || profile.allergyMode;
  }

  /**
   * Add an allergen to the profile
   */
  public async addAllergen(allergenCode: string): Promise<void> {
    const profile = await this.loadProfile();
    if (!profile.allergens.includes(allergenCode)) {
      profile.allergens.push(allergenCode);
      await this.saveProfile(profile);
    }
  }

  /**
   * Remove an allergen from the profile
   */
  public async removeAllergen(allergenCode: string): Promise<void> {
    const profile = await this.loadProfile();
    profile.allergens = profile.allergens.filter(a => a !== allergenCode);
    await this.saveProfile(profile);
  }

  /**
   * Toggle an allergen (add if not present, remove if present)
   */
  public async toggleAllergen(allergenCode: string): Promise<boolean> {
    const profile = await this.loadProfile();
    const index = profile.allergens.indexOf(allergenCode);
    
    if (index === -1) {
      profile.allergens.push(allergenCode);
    } else {
      profile.allergens.splice(index, 1);
    }
    
    await this.saveProfile(profile);
    return index === -1; // Returns true if allergen was added
  }
}

export const profileService = ProfileService.getInstance();

