import { MaterialIcons } from '@expo/vector-icons';
import { useCallback, useEffect, useState } from 'react';
import {
    Alert,
    Pressable,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    View,
} from 'react-native';
import { ALLERGEN_OPTIONS, DEFAULT_PROFILE, UserProfile } from '../../models/UserProfile';
import { profileService } from '../../services/ProfileService';

/**
 * Settings Screen
 * 
 * Allows users to configure their personal health filters.
 * LEGAL: These are USER-DEFINED preferences, not medical recommendations.
 */
export default function SettingsScreen() {
  const [profile, setProfile] = useState<UserProfile>(DEFAULT_PROFILE);
  const [loading, setLoading] = useState(true);

  // Load profile on mount
  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const loaded = await profileService.loadProfile();
      setProfile(loaded);
    } catch (error) {
      console.error('Failed to load profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = useCallback(async (updates: Partial<UserProfile>) => {
    try {
      const updated = await profileService.updateProfile(updates);
      setProfile(updated);
    } catch (error) {
      Alert.alert('Error', 'Failed to save settings');
    }
  }, []);

  const toggleAllergen = useCallback(async (code: string) => {
    const newAllergens = profile.allergens.includes(code)
      ? profile.allergens.filter(a => a !== code)
      : [...profile.allergens, code];
    
    await updateProfile({ allergens: newAllergens });
  }, [profile.allergens, updateProfile]);

  const resetToDefaults = useCallback(() => {
    Alert.alert(
      'Reset Settings',
      'Are you sure you want to reset all settings to defaults?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            await profileService.resetProfile();
            setProfile(DEFAULT_PROFILE);
          },
        },
      ]
    );
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading settings...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <MaterialIcons name="settings" size={32} color="#1976D2" />
        <Text style={styles.headerTitle}>My Filters</Text>
        <Text style={styles.headerSubtitle}>
          Set your personal preferences to flag products
        </Text>
      </View>

      {/* Disclaimer */}
      <View style={styles.disclaimer}>
        <MaterialIcons name="info-outline" size={16} color="#666" />
        <Text style={styles.disclaimerText}>
          These are YOUR personal filters. The app will flag products based on 
          your settings, not provide medical advice.
        </Text>
      </View>

      {/* Diabetes Mode */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionEmoji}>🩸</Text>
          <Text style={styles.sectionTitle}>Sugar Monitoring</Text>
        </View>
        
        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Enable Sugar Filter</Text>
            <Text style={styles.settingDesc}>
              Flag products exceeding your sugar threshold
            </Text>
          </View>
          <Switch
            value={profile.diabetesMode}
            onValueChange={(value) => updateProfile({ diabetesMode: value })}
            trackColor={{ false: '#E0E0E0', true: '#81C784' }}
            thumbColor={profile.diabetesMode ? '#2E7D32' : '#f4f3f4'}
          />
        </View>

        {profile.diabetesMode && (
          <View style={styles.thresholdContainer}>
            <Text style={styles.thresholdLabel}>
              Sugar threshold: <Text style={styles.thresholdValue}>{profile.sugarThreshold}g</Text> per 100g
            </Text>
            <View style={styles.thresholdButtons}>
              <Pressable
                style={styles.thresholdButton}
                onPress={() => updateProfile({ 
                  sugarThreshold: Math.max(1, profile.sugarThreshold - 1) 
                })}
              >
                <MaterialIcons name="remove" size={20} color="#666" />
              </Pressable>
              <Text style={styles.thresholdDisplay}>{profile.sugarThreshold}g</Text>
              <Pressable
                style={styles.thresholdButton}
                onPress={() => updateProfile({ 
                  sugarThreshold: Math.min(50, profile.sugarThreshold + 1) 
                })}
              >
                <MaterialIcons name="add" size={20} color="#666" />
              </Pressable>
            </View>
          </View>
        )}
      </View>

      {/* Pregnancy Mode */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionEmoji}>🤰</Text>
          <Text style={styles.sectionTitle}>Pregnancy Mode</Text>
        </View>
        
        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Enable Pregnancy Filter</Text>
            <Text style={styles.settingDesc}>
              Flag products containing alcohol, caffeine, or marked unsafe for pregnancy
            </Text>
          </View>
          <Switch
            value={profile.pregnancyMode}
            onValueChange={(value) => updateProfile({ pregnancyMode: value })}
            trackColor={{ false: '#E0E0E0', true: '#81C784' }}
            thumbColor={profile.pregnancyMode ? '#2E7D32' : '#f4f3f4'}
          />
        </View>
      </View>

      {/* Allergy Mode */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionEmoji}>🥜</Text>
          <Text style={styles.sectionTitle}>Allergen Alerts</Text>
        </View>
        
        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Enable Allergen Filter</Text>
            <Text style={styles.settingDesc}>
              Flag products containing your selected allergens
            </Text>
          </View>
          <Switch
            value={profile.allergyMode}
            onValueChange={(value) => updateProfile({ allergyMode: value })}
            trackColor={{ false: '#E0E0E0', true: '#81C784' }}
            thumbColor={profile.allergyMode ? '#2E7D32' : '#f4f3f4'}
          />
        </View>

        {profile.allergyMode && (
          <>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Include "May Contain" Traces</Text>
                <Text style={styles.settingDesc}>
                  Also flag products that may contain traces
                </Text>
              </View>
              <Switch
                value={profile.showTraces}
                onValueChange={(value) => updateProfile({ showTraces: value })}
                trackColor={{ false: '#E0E0E0', true: '#81C784' }}
                thumbColor={profile.showTraces ? '#2E7D32' : '#f4f3f4'}
              />
            </View>

            <Text style={styles.allergenSectionTitle}>Select Your Allergens:</Text>
            <View style={styles.allergenGrid}>
              {ALLERGEN_OPTIONS.map((allergen) => {
                const isSelected = profile.allergens.includes(allergen.code);
                return (
                  <Pressable
                    key={allergen.code}
                    style={[
                      styles.allergenChip,
                      isSelected && styles.allergenChipSelected,
                    ]}
                    onPress={() => toggleAllergen(allergen.code)}
                  >
                    <Text style={styles.allergenEmoji}>{allergen.emoji}</Text>
                    <Text
                      style={[
                        styles.allergenName,
                        isSelected && styles.allergenNameSelected,
                      ]}
                    >
                      {allergen.name}
                    </Text>
                    {isSelected && (
                      <MaterialIcons name="check" size={16} color="#fff" />
                    )}
                  </Pressable>
                );
              })}
            </View>
          </>
        )}
      </View>

      {/* Active Filters Summary */}
      {(profile.diabetesMode || profile.pregnancyMode || profile.allergyMode) && (
        <View style={styles.summarySection}>
          <Text style={styles.summaryTitle}>Active Filters:</Text>
          <View style={styles.summaryList}>
            {profile.diabetesMode && (
              <View style={styles.summaryItem}>
                <Text style={styles.summaryEmoji}>🩸</Text>
                <Text style={styles.summaryText}>Sugar &gt; {profile.sugarThreshold}g/100g</Text>
              </View>
            )}
            {profile.pregnancyMode && (
              <View style={styles.summaryItem}>
                <Text style={styles.summaryEmoji}>🤰</Text>
                <Text style={styles.summaryText}>Alcohol, Caffeine, Raw Dairy</Text>
              </View>
            )}
            {profile.allergyMode && profile.allergens.length > 0 && (
              <View style={styles.summaryItem}>
                <Text style={styles.summaryEmoji}>🥜</Text>
                <Text style={styles.summaryText}>
                  {profile.allergens.length} allergen(s)
                  {profile.showTraces ? ' + traces' : ''}
                </Text>
              </View>
            )}
          </View>
        </View>
      )}

      {/* Reset Button */}
      <Pressable style={styles.resetButton} onPress={resetToDefaults}>
        <MaterialIcons name="refresh" size={20} color="#D32F2F" />
        <Text style={styles.resetButtonText}>Reset to Defaults</Text>
      </Pressable>

      {/* Legal Note */}
      <View style={styles.legalNote}>
        <Text style={styles.legalText}>
          These filters help you identify products based on YOUR preferences. 
          Always read product labels and consult healthcare providers for 
          medical dietary guidance.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    backgroundColor: '#fff',
    padding: 24,
    paddingTop: 60,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 8,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
  },
  disclaimer: {
    flexDirection: 'row',
    backgroundColor: '#E3F2FD',
    padding: 12,
    margin: 16,
    borderRadius: 8,
    gap: 8,
    alignItems: 'flex-start',
  },
  disclaimerText: {
    flex: 1,
    fontSize: 12,
    color: '#1565C0',
    lineHeight: 18,
  },
  section: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  sectionEmoji: {
    fontSize: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  settingInfo: {
    flex: 1,
    marginRight: 12,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  settingDesc: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  thresholdContainer: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#F8F8F8',
    borderRadius: 8,
  },
  thresholdLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  thresholdValue: {
    fontWeight: 'bold',
    color: '#333',
  },
  thresholdButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  thresholdButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  thresholdDisplay: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1976D2',
    minWidth: 60,
    textAlign: 'center',
  },
  allergenSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
    marginBottom: 12,
  },
  allergenGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  allergenChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    gap: 6,
  },
  allergenChipSelected: {
    backgroundColor: '#E65100',
    borderColor: '#E65100',
  },
  allergenEmoji: {
    fontSize: 16,
  },
  allergenName: {
    fontSize: 13,
    color: '#333',
  },
  allergenNameSelected: {
    color: '#fff',
    fontWeight: '500',
  },
  summarySection: {
    backgroundColor: '#E8F5E9',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2E7D32',
    marginBottom: 8,
  },
  summaryList: {
    gap: 8,
  },
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  summaryEmoji: {
    fontSize: 16,
  },
  summaryText: {
    fontSize: 14,
    color: '#333',
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FFCDD2',
    backgroundColor: '#fff',
    gap: 8,
  },
  resetButtonText: {
    fontSize: 14,
    color: '#D32F2F',
    fontWeight: '500',
  },
  legalNote: {
    margin: 16,
    marginBottom: 40,
    padding: 12,
    backgroundColor: '#FFF8E1',
    borderRadius: 8,
  },
  legalText: {
    fontSize: 11,
    color: '#666',
    lineHeight: 16,
    textAlign: 'center',
  },
});

