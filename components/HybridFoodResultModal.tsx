/**
 * Hybrid Food Result Modal
 * 
 * Displays food recognition results from Vision LLM or TFLite.
 * Supports mixed plates (multiple food items).
 */

import { MaterialIcons } from '@expo/vector-icons';
import { useCallback, useEffect, useState } from 'react';
import {
  Image,
  Keyboard,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { HybridFoodResult, getMethodDisplayName } from '../services/HybridFoodService';
import { FoodItem } from '../services/VisionFoodService';

type Props = {
  visible: boolean;
  result: HybridFoodResult | null;
  photoUri?: string;
  onClose: () => void;
  onLog: (result: HybridFoodResult, portionMultiplier: number) => void;
  onSearch?: () => void;  // Fallback: Search for food
  onManualEntry?: (calories: number, name?: string) => void;  // Fallback: Manual calorie entry
};

/**
 * Modal to display hybrid food recognition results
 */
export default function HybridFoodResultModal({ 
  visible, 
  result, 
  photoUri,
  onClose, 
  onLog,
  onSearch,
  onManualEntry,
}: Props) {
  const [portionMultiplier, setPortionMultiplier] = useState<number>(1);
  const [customWeight, setCustomWeight] = useState<string>('');
  const [weightUnit, setWeightUnit] = useState<'g' | 'oz'>('g');
  const [useCustomWeight, setUseCustomWeight] = useState(false);
  
  // Manual entry state (fallback when recognition fails)
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [manualCalories, setManualCalories] = useState<string>('');
  const [manualFoodName, setManualFoodName] = useState<string>('');

  // Get estimated portion weight from AI result
  const estimatedPortionG = result?.items?.[0]?.portion_g || 100;

  // Calculate multiplier from custom weight
  useEffect(() => {
    if (useCustomWeight && customWeight) {
      const weightValue = parseFloat(customWeight);
      if (!isNaN(weightValue) && weightValue > 0) {
        // Convert oz to grams if needed (1 oz = 28.35g)
        const weightInGrams = weightUnit === 'oz' ? weightValue * 28.35 : weightValue;
        const multiplier = weightInGrams / estimatedPortionG;
        setPortionMultiplier(multiplier);
      }
    }
  }, [customWeight, weightUnit, useCustomWeight, estimatedPortionG]);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (visible) {
      setPortionMultiplier(1);
      setCustomWeight('');
      setUseCustomWeight(false);
      setShowManualEntry(false);
      setManualCalories('');
      setManualFoodName('');
    }
  }, [visible]);

  // Handle manual calorie submission
  const handleManualSubmit = useCallback(() => {
    Keyboard.dismiss();
    const calories = parseInt(manualCalories, 10);
    if (!isNaN(calories) && calories > 0 && onManualEntry) {
      onManualEntry(calories, manualFoodName || 'Unknown Food');
    }
  }, [manualCalories, manualFoodName, onManualEntry]);

  const handleLog = useCallback(() => {
    Keyboard.dismiss();
    if (result) {
      onLog(result, portionMultiplier);
    }
  }, [result, portionMultiplier, onLog]);

  if (!result) return null;

  // Calculate adjusted nutrition
  const adjustedCalories = Math.round((result.calories || 0) * portionMultiplier);
  const adjustedProtein = Math.round((result.protein || 0) * portionMultiplier * 10) / 10;
  const adjustedCarbs = Math.round((result.carbs || 0) * portionMultiplier * 10) / 10;
  const adjustedFat = Math.round((result.fat || 0) * portionMultiplier * 10) / 10;

  const portionOptions = [
    { label: 'Half', value: 0.5 },
    { label: 'Full portion', value: 1 },
    { label: '1.5x', value: 1.5 },
    { label: '2x', value: 2 },
  ];

  const confidenceColor = result.confidence === 'high' ? '#2E7D32' 
    : result.confidence === 'medium' ? '#F57C00' 
    : '#D32F2F';

  const confidenceIcon = result.confidence === 'high' ? 'check-circle'
    : result.confidence === 'medium' ? 'help'
    : 'error';

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.handleBar} />

          {/* Header */}
          <View style={styles.header}>
            <View style={[styles.confidenceBadge, { backgroundColor: `${confidenceColor}15` }]}>
              <MaterialIcons name={confidenceIcon as any} size={16} color={confidenceColor} />
              <Text style={[styles.confidenceText, { color: confidenceColor }]}>
                {result.confidence} confidence
              </Text>
            </View>
            <Pressable onPress={onClose} style={styles.closeButton}>
              <MaterialIcons name="close" size={24} color="#666" />
            </Pressable>
          </View>

          <ScrollView 
            style={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Photo preview - only show when recognition succeeded */}
            {photoUri && result.success && (
              <View style={styles.photoContainer}>
                <Image 
                  source={{ uri: photoUri }} 
                  style={styles.photo}
                  resizeMode="cover"
                />
              </View>
            )}

            {/* Food name - only show when recognition succeeded */}
            {result.success && (
              <View style={styles.foodHeader}>
                <Text style={styles.emoji}>
                  {result.isMultipleItems ? '🍽️' : '🍴'}
                </Text>
                <Text style={styles.foodName} numberOfLines={2}>
                  {result.productName}
                </Text>
              </View>
            )}

            {/* Method badge - only show when recognition succeeded */}
            {result.success && (
              <View style={styles.methodBadge}>
                <MaterialIcons 
                  name={result.method === 'vision_llm' ? 'cloud' : 'phone-android'} 
                  size={14} 
                  color="#666" 
                />
                <Text style={styles.methodText}>
                  Identified by {getMethodDisplayName(result.method)}
                </Text>
              </View>
            )}

            {/* Multiple items breakdown */}
            {result.success && result.isMultipleItems && result.items && (
              <View style={styles.itemsSection}>
                <Text style={styles.sectionTitle}>Items Detected</Text>
                {result.items.map((item, index) => (
                  <FoodItemRow key={index} item={item} />
                ))}
              </View>
            )}

            {/* Nutrition section - only show when recognition succeeded */}
            {result.success && (
              <View style={styles.nutritionSection}>
              <Text style={styles.sectionTitle}>
                Estimated Nutrition {portionMultiplier !== 1 ? `(${portionMultiplier}x)` : ''}
              </Text>
              <View style={styles.nutritionGrid}>
                <View style={styles.nutritionItem}>
                  <Text style={styles.nutritionEmoji}>🔥</Text>
                  <Text style={styles.nutritionValue}>{adjustedCalories}</Text>
                  <Text style={styles.nutritionLabel}>kcal</Text>
                </View>
                <View style={styles.nutritionItem}>
                  <Text style={styles.nutritionEmoji}>💪</Text>
                  <Text style={styles.nutritionValue}>{adjustedProtein}g</Text>
                  <Text style={styles.nutritionLabel}>protein</Text>
                </View>
                <View style={styles.nutritionItem}>
                  <Text style={styles.nutritionEmoji}>🍞</Text>
                  <Text style={styles.nutritionValue}>{adjustedCarbs}g</Text>
                  <Text style={styles.nutritionLabel}>carbs</Text>
                </View>
                <View style={styles.nutritionItem}>
                  <Text style={styles.nutritionEmoji}>🧈</Text>
                  <Text style={styles.nutritionValue}>{adjustedFat}g</Text>
                  <Text style={styles.nutritionLabel}>fat</Text>
                </View>
              </View>
              {result.servingSize && (
                <Text style={styles.servingInfo}>
                  Based on: {result.servingSize}
                </Text>
              )}
              </View>
            )}

            {/* Portion selector - only show when recognition succeeded */}
            {result.success && (
              <View style={styles.portionSection}>
              <Text style={styles.sectionTitle}>How much did you eat?</Text>
              
              {/* Quick options */}
              <View style={styles.portionOptions}>
                {portionOptions.map((option) => (
                  <Pressable
                    key={option.value}
                    style={[
                      styles.portionButton,
                      !useCustomWeight && portionMultiplier === option.value && styles.portionButtonActive,
                    ]}
                    onPress={() => {
                      setUseCustomWeight(false);
                      setCustomWeight('');
                      setPortionMultiplier(option.value);
                    }}
                  >
                    <Text style={[
                      styles.portionButtonText,
                      !useCustomWeight && portionMultiplier === option.value && styles.portionButtonTextActive,
                    ]}>
                      {option.label}
                    </Text>
                  </Pressable>
                ))}
              </View>

              {/* Custom weight input */}
              <View style={styles.customWeightSection}>
                <Text style={styles.orText}>— or enter exact weight —</Text>
                <View style={styles.customWeightRow}>
                  <TextInput
                    style={[
                      styles.weightInput,
                      useCustomWeight && styles.weightInputActive,
                    ]}
                    placeholder={`e.g. ${weightUnit === 'g' ? '150' : '5'}`}
                    keyboardType="decimal-pad"
                    value={customWeight}
                    onChangeText={(text) => {
                      setCustomWeight(text);
                      if (text) {
                        setUseCustomWeight(true);
                      } else {
                        setUseCustomWeight(false);
                        setPortionMultiplier(1);
                      }
                    }}
                    onFocus={() => setUseCustomWeight(true)}
                  />
                  
                  {/* Unit toggle */}
                  <View style={styles.unitToggle}>
                    <Pressable
                      style={[
                        styles.unitButton,
                        weightUnit === 'g' && styles.unitButtonActive,
                      ]}
                      onPress={() => setWeightUnit('g')}
                    >
                      <Text style={[
                        styles.unitButtonText,
                        weightUnit === 'g' && styles.unitButtonTextActive,
                      ]}>g</Text>
                    </Pressable>
                    <Pressable
                      style={[
                        styles.unitButton,
                        weightUnit === 'oz' && styles.unitButtonActive,
                      ]}
                      onPress={() => setWeightUnit('oz')}
                    >
                      <Text style={[
                        styles.unitButtonText,
                        weightUnit === 'oz' && styles.unitButtonTextActive,
                      ]}>oz</Text>
                    </Pressable>
                  </View>
                </View>
                
                {/* Show estimated weight */}
                <Text style={styles.estimatedWeight}>
                  AI estimated: ~{estimatedPortionG}g per serving
                </Text>
              </View>
              </View>
            )}

            {/* AI Warning - only show when recognition succeeded */}
            {result.success && (
              <View style={styles.aiWarning}>
              <MaterialIcons name="smart-toy" size={16} color="#1976D2" />
              <Text style={styles.aiWarningText}>
                AI Estimate - actual nutrition may vary based on preparation, ingredients, and portion size
              </Text>
            </View>
            )}

            {/* Disclaimer - only show when recognition succeeded */}
            {result.success && (
              <View style={styles.disclaimer}>
                <MaterialIcons name="info-outline" size={14} color="#999" />
                <Text style={styles.disclaimerText}>
                  For accurate tracking, use packaged products with nutrition labels when possible.
                </Text>
              </View>
            )}
          </ScrollView>

          {/* Log button */}
          {result.success && (
            <Pressable style={styles.logButton} onPress={handleLog}>
              <MaterialIcons name="add" size={24} color="#fff" />
              <Text style={styles.logButtonText}>
                Add to Log ({adjustedCalories} kcal)
              </Text>
            </Pressable>
          )}

          {/* Error state with fallback options */}
          {!result.success && (
            <View style={styles.errorContainer}>
              {/* Photo preview for failed recognition */}
              {photoUri && (
                <View style={styles.failedPhotoContainer}>
                  <Image 
                    source={{ uri: photoUri }} 
                    style={styles.failedPhoto}
                    resizeMode="cover"
                  />
                </View>
              )}
              
              <MaterialIcons name="help-outline" size={48} color="#F57C00" style={{ marginBottom: 12 }} />
              <Text style={styles.errorTitle}>Couldn't identify this food</Text>
              <Text style={styles.errorText}>{result.error}</Text>
              
              {!showManualEntry ? (
                <View style={styles.fallbackOptions}>
                  {/* Search option */}
                  {onSearch && (
                    <Pressable style={styles.searchButton} onPress={() => {
                      onClose();
                      onSearch();
                    }}>
                      <MaterialIcons name="restaurant-menu" size={20} color="#fff" />
                      <Text style={styles.searchButtonText}>Find Similar Food</Text>
                    </Pressable>
                  )}
                  
                  {/* Manual entry option */}
                  {onManualEntry && (
                    <Pressable 
                      style={styles.manualEntryButton} 
                      onPress={() => setShowManualEntry(true)}
                    >
                      <MaterialIcons name="edit" size={18} color="#1976D2" />
                      <Text style={styles.manualEntryButtonText}>Enter Calories Manually</Text>
                    </Pressable>
                  )}
                  
                  {/* Retry button */}
                  <Pressable style={styles.retryButton} onPress={onClose}>
                    <MaterialIcons name="camera-alt" size={18} color="#666" />
                    <Text style={styles.retryButtonText}>Take Another Photo</Text>
                  </Pressable>
                </View>
              ) : (
                /* Manual calorie entry form */
                <View style={styles.manualEntryForm}>
                  <Text style={styles.manualEntryTitle}>Enter Food Details</Text>
                  
                  <Text style={styles.inputLabel}>Food name (optional)</Text>
                  <TextInput
                    style={styles.manualInput}
                    placeholder="e.g., Grilled chicken salad"
                    value={manualFoodName}
                    onChangeText={setManualFoodName}
                    autoCapitalize="words"
                  />
                  
                  <Text style={styles.inputLabel}>Calories *</Text>
                  <TextInput
                    style={styles.manualInput}
                    placeholder="e.g., 350"
                    keyboardType="number-pad"
                    value={manualCalories}
                    onChangeText={setManualCalories}
                    autoFocus
                  />
                  
                  <View style={styles.manualEntryActions}>
                    <Pressable 
                      style={styles.cancelButton} 
                      onPress={() => setShowManualEntry(false)}
                    >
                      <Text style={styles.cancelButtonText}>Back</Text>
                    </Pressable>
                    
                    <Pressable 
                      style={[
                        styles.submitButton, 
                        !manualCalories && styles.submitButtonDisabled
                      ]} 
                      onPress={handleManualSubmit}
                      disabled={!manualCalories}
                    >
                      <MaterialIcons name="add" size={20} color="#fff" />
                      <Text style={styles.submitButtonText}>
                        Add {manualCalories ? `(${manualCalories} kcal)` : ''}
                      </Text>
                    </Pressable>
                  </View>
                </View>
              )}
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

/**
 * Individual food item row for mixed plates
 */
function FoodItemRow({ item }: { item: FoodItem }) {
  return (
    <View style={styles.itemRow}>
      <View style={styles.itemInfo}>
        <Text style={styles.itemName}>{item.name}</Text>
        <Text style={styles.itemPortion}>
          {item.portion_description || `${item.portion_g}g`}
        </Text>
      </View>
      <View style={styles.itemNutrition}>
        <Text style={styles.itemCalories}>{item.calories} kcal</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    paddingBottom: 40,
  },
  handleBar: {
    width: 40,
    height: 4,
    backgroundColor: '#DDD',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  confidenceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    gap: 4,
  },
  confidenceText: {
    fontSize: 14,
    fontWeight: '600',
  },
  closeButton: {
    padding: 4,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  photoContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  photo: {
    width: 200,
    height: 150,
    borderRadius: 12,
    backgroundColor: '#f0f0f0',
  },
  foodHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 8,
  },
  emoji: {
    fontSize: 32,
  },
  foodName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    flexShrink: 1,
    textAlign: 'center',
  },
  methodBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginBottom: 16,
  },
  methodText: {
    fontSize: 12,
    color: '#666',
  },
  itemsSection: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  itemPortion: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  itemNutrition: {
    alignItems: 'flex-end',
  },
  itemCalories: {
    fontSize: 14,
    fontWeight: '600',
    color: '#E65100',
  },
  nutritionSection: {
    backgroundColor: '#F8F8F8',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
    textAlign: 'center',
  },
  nutritionGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  nutritionItem: {
    alignItems: 'center',
    minWidth: 60,
  },
  nutritionEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  nutritionValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  nutritionLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  servingInfo: {
    textAlign: 'center',
    fontSize: 12,
    color: '#888',
    marginTop: 12,
  },
  portionSection: {
    marginBottom: 16,
  },
  portionOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
  },
  portionButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  portionButtonActive: {
    backgroundColor: '#E8F5E9',
    borderColor: '#2E7D32',
  },
  portionButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  portionButtonTextActive: {
    color: '#2E7D32',
    fontWeight: '600',
  },
  customWeightSection: {
    marginTop: 16,
    alignItems: 'center',
  },
  orText: {
    fontSize: 12,
    color: '#999',
    marginBottom: 12,
  },
  customWeightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  weightInput: {
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 18,
    fontWeight: '600',
    width: 100,
    textAlign: 'center',
    backgroundColor: '#FAFAFA',
    color: '#333',
  },
  weightInputActive: {
    borderColor: '#2E7D32',
    backgroundColor: '#E8F5E9',
  },
  unitToggle: {
    flexDirection: 'row',
    backgroundColor: '#F0F0F0',
    borderRadius: 8,
    overflow: 'hidden',
  },
  unitButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  unitButtonActive: {
    backgroundColor: '#2E7D32',
  },
  unitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  unitButtonTextActive: {
    color: '#fff',
  },
  estimatedWeight: {
    fontSize: 11,
    color: '#999',
    marginTop: 8,
    fontStyle: 'italic',
  },
  aiWarning: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#E3F2FD',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    gap: 8,
    marginBottom: 12,
  },
  aiWarningText: {
    flex: 1,
    color: '#1976D2',
    fontSize: 12,
    lineHeight: 18,
  },
  disclaimer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFF8E1',
    padding: 12,
    borderRadius: 12,
    gap: 8,
    marginBottom: 20,
  },
  disclaimerText: {
    flex: 1,
    fontSize: 11,
    color: '#666',
    lineHeight: 16,
  },
  logButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E65100',
    marginHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  logButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  errorContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    alignItems: 'center',
  },
  failedPhotoContainer: {
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#F57C00',
  },
  failedPhoto: {
    width: 150,
    height: 120,
    backgroundColor: '#f0f0f0',
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  fallbackOptions: {
    width: '100%',
    gap: 12,
  },
  searchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2E7D32',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
  },
  searchButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  manualEntryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E3F2FD',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: '#1976D2',
  },
  manualEntryButtonText: {
    color: '#1976D2',
    fontSize: 16,
    fontWeight: '500',
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F5F5',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
  },
  retryButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  manualEntryForm: {
    width: '100%',
    backgroundColor: '#F8F8F8',
    borderRadius: 16,
    padding: 20,
  },
  manualEntryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#555',
    marginBottom: 6,
    marginTop: 8,
  },
  manualInput: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    fontSize: 16,
    color: '#333',
  },
  manualEntryActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  cancelButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0F0F0',
    paddingVertical: 14,
    borderRadius: 10,
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  submitButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E65100',
    paddingVertical: 14,
    borderRadius: 10,
    gap: 6,
  },
  submitButtonDisabled: {
    backgroundColor: '#BDBDBD',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

