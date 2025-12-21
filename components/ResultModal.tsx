import { MaterialIcons } from '@expo/vector-icons';
import { useCallback, useEffect, useState } from 'react';
import {
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View
} from 'react-native';
import { NutritionData, ScanResult, formatAllergen, formatNova, formatNutriscore, isPhotoScan } from '../models/ScanResult';
import { UserWarning, userFilterService } from '../services/UserFilterService';
import NutritionEditor from './NutritionEditor';
import NutritionLabelScanner from './NutritionLabelScanner';
import WarningCard from './WarningCard';

type Props = {
  visible: boolean;
  result: ScanResult | null;
  onClose: () => void;
  onConsume?: (product: ScanResult) => void;
  onEditNutrition?: (barcode: string, nutrition: NutritionData) => void;
};

/**
 * Modal showing product information (facts only, no health judgments)
 * 
 * LEGAL: This displays factual data from databases.
 * User warnings are based on USER-DEFINED filters, not app recommendations.
 */
export default function ResultModal({ visible, result, onClose, onConsume, onEditNutrition }: Props) {
  const [warnings, setWarnings] = useState<UserWarning[]>([]);
  const [nutritionEditorVisible, setNutritionEditorVisible] = useState(false);
  const [labelScannerVisible, setLabelScannerVisible] = useState(false);
  const [currentNutrition, setCurrentNutrition] = useState<NutritionData | undefined>();

  // Check for user warnings when result changes
  useEffect(() => {
    if (result && visible) {
      console.log('🔍 Checking product against user filters...');
      console.log(`   Product: ${result.name}`);
      console.log(`   Sugar: ${result.nutrition?.sugar_100g ?? 'N/A'}g/100g`);
      console.log(`   Allergens: ${result.allergens?.join(', ') || 'None'}`);
      
      const userWarnings = userFilterService.checkProductSync(result);
      console.log(`   Warnings found: ${userWarnings.length}`);
      
      if (userWarnings.length > 0) {
        userWarnings.forEach((w, i) => {
          console.log(`   ⚠️ Warning ${i + 1}: ${w.message}`);
        });
      }
      
      setWarnings(userWarnings);
      setCurrentNutrition(result.nutrition);
    } else {
      setWarnings([]);
      setCurrentNutrition(undefined);
    }
  }, [result, visible]);

  // Handle nutrition save from editor
  const handleNutritionSave = useCallback((nutrition: NutritionData) => {
    setCurrentNutrition(nutrition);
    if (result && onEditNutrition) {
      onEditNutrition(result.barcode, nutrition);
    }
    setNutritionEditorVisible(false);
  }, [result, onEditNutrition]);

  if (!result) return null;

  const isPhoto = isPhotoScan(result);
  const nutrition = currentNutrition || result.nutrition;
  const hasCalories = nutrition?.calories_100g !== undefined && nutrition.calories_100g > 0;
  const hasNutrition = nutrition && (nutrition.nutriscore || nutrition.nova || nutrition.sugar_100g !== undefined || hasCalories);
  const hasAllergens = result.allergens && result.allergens.length > 0;
  const hasTraces = result.traces && result.traces.length > 0;
  const hasWarnings = warnings.length > 0;
  const canAddNutrition = onEditNutrition !== undefined;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          {/* Handle bar */}
          <View style={styles.handleBar} />
          
          {/* Header */}
          <View style={styles.header}>
            <MaterialIcons name="info" size={32} color="#1976D2" />
            <Text style={styles.headerTitle}>Product Information</Text>
          </View>

          <ScrollView 
            style={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* USER WARNINGS SECTION - Shows at top if filters are triggered */}
            {hasWarnings && (
              <View style={styles.warningsSection}>
                <View style={styles.warningsHeader}>
                  <MaterialIcons name="notifications-active" size={20} color="#D32F2F" />
                  <Text style={styles.warningsTitle}>Your Filters Flagged This Product</Text>
                </View>
                {warnings.map((warning, index) => (
                  <WarningCard key={index} warning={warning} />
                ))}
              </View>
            )}

            {/* Photo preview (if photo scan) */}
            {isPhoto && result.photoUri && (
              <View style={styles.photoContainer}>
                <Image 
                  source={{ uri: result.photoUri }} 
                  style={styles.photo}
                  resizeMode="cover"
                />
              </View>
            )}

            {/* Product name */}
            <Text style={styles.productName}>{result.name}</Text>
            {result.brand && (
              <Text style={styles.brandName}>{result.brand}</Text>
            )}
            
            {/* Source badge */}
            <View style={styles.sourceBadge}>
              <MaterialIcons 
                name={isPhoto ? 'camera-alt' : 'qr-code'} 
                size={14} 
                color="#666" 
              />
              <Text style={styles.sourceText}>
                {isPhoto ? 'Photo Analysis' : `Barcode: ${result.barcode}`}
              </Text>
            </View>

            {/* Missing nutrition banner - show when calories not available */}
            {!hasCalories && canAddNutrition && (
              <View style={styles.missingNutritionContainer}>
                <View style={styles.missingNutritionHeader}>
                  <MaterialIcons name="warning" size={20} color="#E65100" />
                  <Text style={styles.missingNutritionTitle}>Nutrition Data Missing</Text>
                </View>
                <Text style={styles.missingNutritionText}>
                  Add nutrition info for accurate tracking. You can:
                </Text>
                <View style={styles.missingNutritionActions}>
                  {/* Scan Label Button */}
                  <Pressable 
                    style={styles.scanLabelButton}
                    onPress={() => setLabelScannerVisible(true)}
                  >
                    <MaterialIcons name="photo-camera" size={24} color="#fff" />
                    <Text style={styles.scanLabelButtonText}>Scan Label</Text>
                  </Pressable>
                  
                  {/* Manual Entry Button */}
                  <Pressable 
                    style={styles.manualEntryButton}
                    onPress={() => setNutritionEditorVisible(true)}
                  >
                    <MaterialIcons name="edit" size={24} color="#1976D2" />
                    <Text style={styles.manualEntryButtonText}>Enter Manually</Text>
                  </Pressable>
                </View>
              </View>
            )}

            {/* Nutrition Facts Section */}
            {hasNutrition && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <MaterialIcons name="restaurant" size={20} color="#333" />
                  <Text style={styles.sectionTitle}>Nutrition Facts</Text>
                </View>
                
                <View style={styles.nutritionGrid}>
                  {nutrition.nutriscore && (
                    <View style={styles.nutritionItem}>
                      <Text style={styles.nutritionLabel}>Nutriscore</Text>
                      <Text style={[
                        styles.nutriscoreGrade,
                        { backgroundColor: getNutriscoreColor(nutrition.nutriscore) }
                      ]}>
                        {formatNutriscore(nutrition.nutriscore)}
                      </Text>
                    </View>
                  )}
                  
                  {nutrition.nova && (
                    <View style={styles.nutritionItem}>
                      <Text style={styles.nutritionLabel}>NOVA Group</Text>
                      <Text style={styles.nutritionValue}>{formatNova(nutrition.nova)}</Text>
                    </View>
                  )}
                  
                  {nutrition.sugar_100g !== undefined && (
                    <View style={styles.nutritionItem}>
                      <Text style={styles.nutritionLabel}>Sugar</Text>
                      <Text style={styles.nutritionValue}>{nutrition.sugar_100g}g / 100g</Text>
                    </View>
                  )}
                  
                  {nutrition.salt_100g !== undefined && (
                    <View style={styles.nutritionItem}>
                      <Text style={styles.nutritionLabel}>Salt</Text>
                      <Text style={styles.nutritionValue}>{nutrition.salt_100g}g / 100g</Text>
                    </View>
                  )}
                  
                  {nutrition.calories_100g !== undefined && (
                    <View style={styles.nutritionItem}>
                      <Text style={styles.nutritionLabel}>Calories</Text>
                      <Text style={styles.nutritionValue}>{nutrition.calories_100g} kcal / 100g</Text>
                    </View>
                  )}
                  
                  {nutrition.saturated_fat_100g !== undefined && (
                    <View style={styles.nutritionItem}>
                      <Text style={styles.nutritionLabel}>Saturated Fat</Text>
                      <Text style={styles.nutritionValue}>{nutrition.saturated_fat_100g}g / 100g</Text>
                    </View>
                  )}
                </View>
              </View>
            )}

            {/* Allergens Section */}
            {hasAllergens && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <MaterialIcons name="warning" size={20} color="#E65100" />
                  <Text style={styles.sectionTitle}>Contains</Text>
                </View>
                <View style={styles.allergenList}>
                  {result.allergens!.map((allergen, index) => (
                    <View key={index} style={styles.allergenBadge}>
                      <Text style={styles.allergenText}>
                        {formatAllergen(allergen)}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Traces Section */}
            {hasTraces && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <MaterialIcons name="info-outline" size={20} color="#666" />
                  <Text style={styles.sectionTitle}>May Contain Traces Of</Text>
                </View>
                <View style={styles.allergenList}>
                  {result.traces!.map((trace, index) => (
                    <View key={index} style={[styles.allergenBadge, styles.traceBadge]}>
                      <Text style={[styles.allergenText, styles.traceText]}>
                        {formatAllergen(trace)}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Summary / Description */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <MaterialIcons name="description" size={20} color="#333" />
                <Text style={styles.sectionTitle}>Description</Text>
              </View>
              <Text style={styles.summaryText}>{result.summary}</Text>
            </View>

            {/* Ingredients */}
            {result.ingredients && result.ingredients !== 'No ingredients listed' && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <MaterialIcons name="list" size={20} color="#333" />
                  <Text style={styles.sectionTitle}>Ingredients</Text>
                </View>
                <Text style={styles.ingredientsText}>
                  {result.ingredients}
                </Text>
              </View>
            )}

            {/* Legal Disclaimer */}
            <View style={styles.disclaimer}>
              <MaterialIcons name="info-outline" size={16} color="#999" />
              <Text style={styles.disclaimerText}>
                Data from {result.dataSource || 'OpenFoodFacts.org'}. 
                {hasWarnings ? ' Warnings are based on YOUR filter settings. ' : ' '}
                This is informational only, not medical advice. 
                Always verify on the actual product label.
              </Text>
            </View>
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.buttonRow}>
            {onConsume && (
              <Pressable 
                style={styles.consumeButton} 
                onPress={() => onConsume(result)}
              >
                <MaterialIcons name="restaurant" size={20} color="#fff" />
                <Text style={styles.consumeButtonText}>I Ate This</Text>
              </Pressable>
            )}
            <Pressable 
              style={[styles.closeButton, onConsume && styles.closeButtonSmall]} 
              onPress={onClose}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </Pressable>
          </View>
        </View>
      </View>

      {/* Nutrition Editor Modal */}
      <NutritionEditor
        visible={nutritionEditorVisible}
        productName={result.name}
        initialNutrition={currentNutrition}
        onSave={handleNutritionSave}
        onClose={() => setNutritionEditorVisible(false)}
      />

      {/* Nutrition Label Scanner Modal */}
      <NutritionLabelScanner
        visible={labelScannerVisible}
        productName={result.name}
        onSave={handleNutritionSave}
        onClose={() => setLabelScannerVisible(false)}
      />
    </Modal>
  );
}

/**
 * Get color for Nutriscore badge
 */
function getNutriscoreColor(grade?: string): string {
  const colors: Record<string, string> = {
    'a': '#038141',
    'b': '#85BB2F',
    'c': '#FECB02',
    'd': '#EE8100',
    'e': '#E63E11',
  };
  return colors[grade?.toLowerCase() || ''] || '#999';
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
    justifyContent: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    gap: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  scrollContent: {
    paddingHorizontal: 24,
    maxHeight: 500,
  },
  warningsSection: {
    marginTop: 16,
    marginBottom: 8,
  },
  warningsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  warningsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#D32F2F',
  },
  photoContainer: {
    alignItems: 'center',
    marginVertical: 16,
  },
  photo: {
    width: 120,
    height: 120,
    borderRadius: 12,
    backgroundColor: '#f0f0f0',
  },
  productName: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    color: '#333',
    marginTop: 16,
  },
  brandName: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 4,
  },
  sourceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F5F5F5',
    gap: 6,
    marginTop: 12,
    marginBottom: 20,
  },
  sourceText: {
    fontSize: 12,
    color: '#666',
  },
  missingNutritionContainer: {
    backgroundColor: '#FFF3E0',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FFB74D',
  },
  missingNutritionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  missingNutritionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#E65100',
  },
  missingNutritionText: {
    fontSize: 13,
    color: '#F57C00',
    marginBottom: 12,
  },
  missingNutritionActions: {
    flexDirection: 'row',
    gap: 10,
  },
  scanLabelButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2E7D32',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
  },
  scanLabelButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  manualEntryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E3F2FD',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
  },
  manualEntryButtonText: {
    color: '#1976D2',
    fontSize: 14,
    fontWeight: '600',
  },
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  nutritionGrid: {
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    padding: 16,
  },
  nutritionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
  },
  nutritionLabel: {
    fontSize: 14,
    color: '#666',
  },
  nutritionValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  nutriscoreGrade: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 6,
    overflow: 'hidden',
  },
  allergenList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  allergenBadge: {
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FFB74D',
  },
  allergenText: {
    fontSize: 14,
    color: '#E65100',
    fontWeight: '500',
  },
  traceBadge: {
    backgroundColor: '#F5F5F5',
    borderColor: '#BDBDBD',
  },
  traceText: {
    color: '#666',
  },
  summaryText: {
    fontSize: 15,
    color: '#444',
    lineHeight: 22,
    backgroundColor: '#F8F8F8',
    padding: 16,
    borderRadius: 12,
  },
  ingredientsText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    backgroundColor: '#F8F8F8',
    padding: 16,
    borderRadius: 12,
  },
  disclaimer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FAFAFA',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
    gap: 8,
  },
  disclaimerText: {
    flex: 1,
    fontSize: 11,
    color: '#999',
    lineHeight: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  consumeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2E7D32',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  consumeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  closeButton: {
    flex: 1,
    backgroundColor: '#1976D2',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  closeButtonSmall: {
    flex: 0.6,
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
