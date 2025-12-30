import { MaterialIcons } from '@expo/vector-icons';
import { useCallback, useState } from 'react';
import {
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { FoodNutrition, calculatePortionNutrition } from '../data/food101Nutrition';
import { FoodRecognitionResult } from '../services/FoodRecognitionService';

type Props = {
  visible: boolean;
  result: FoodRecognitionResult | null;
  photoUri?: string;
  onClose: () => void;
  onLog: (foodId: string, portionGrams: number) => void;
  onSelectAlternate?: (foodId: string) => void;
};

/**
 * Modal to display food recognition results
 */
export default function FoodResultModal({ 
  visible, 
  result, 
  photoUri,
  onClose, 
  onLog,
  onSelectAlternate 
}: Props) {
  const [selectedPortion, setSelectedPortion] = useState<number>(100);

  const handleLog = useCallback(() => {
    if (result) {
      onLog(result.foodId, selectedPortion);
    }
  }, [result, selectedPortion, onLog]);

  if (!result) return null;

  const nutrition = result.nutrition;
  const portionNutrition = nutrition 
    ? calculatePortionNutrition(nutrition, selectedPortion)
    : null;
  
  const servingSize = nutrition?.serving_g || 100;
  const portionOptions = [
    { label: '100g', value: 100 },
    { label: `1 serving (${servingSize}g)`, value: servingSize },
    { label: 'Half serving', value: Math.round(servingSize / 2) },
  ];

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
            <View style={styles.confidenceBadge}>
              <MaterialIcons name="check-circle" size={16} color="#2E7D32" />
              <Text style={styles.confidenceText}>{result.confidence}% match</Text>
            </View>
            <Pressable onPress={onClose} style={styles.closeButton}>
              <MaterialIcons name="close" size={24} color="#666" />
            </Pressable>
          </View>

          <ScrollView 
            style={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Photo preview */}
            {photoUri && (
              <View style={styles.photoContainer}>
                <Image 
                  source={{ uri: photoUri }} 
                  style={styles.photo}
                  resizeMode="cover"
                />
              </View>
            )}

            {/* Food name */}
            <View style={styles.foodHeader}>
              <Text style={styles.emoji}>🍽️</Text>
              <Text style={styles.foodName}>{result.displayName}</Text>
            </View>

            {/* AI Estimate warning */}
            <View style={styles.aiWarning}>
              <MaterialIcons name="smart-toy" size={16} color="#1976D2" />
              <Text style={styles.aiWarningText}>
                AI Estimate - actual nutrition may vary
              </Text>
            </View>

            {/* Nutrition section */}
            {portionNutrition && (
              <View style={styles.nutritionSection}>
                <Text style={styles.sectionTitle}>
                  Estimated Nutrition ({selectedPortion}g)
                </Text>
                <View style={styles.nutritionGrid}>
                  <View style={styles.nutritionItem}>
                    <Text style={styles.nutritionEmoji}>🔥</Text>
                    <Text style={styles.nutritionValue}>{portionNutrition.calories}</Text>
                    <Text style={styles.nutritionLabel}>kcal</Text>
                  </View>
                  <View style={styles.nutritionItem}>
                    <Text style={styles.nutritionEmoji}>💪</Text>
                    <Text style={styles.nutritionValue}>{portionNutrition.protein}g</Text>
                    <Text style={styles.nutritionLabel}>protein</Text>
                  </View>
                  <View style={styles.nutritionItem}>
                    <Text style={styles.nutritionEmoji}>🍞</Text>
                    <Text style={styles.nutritionValue}>{portionNutrition.carbs}g</Text>
                    <Text style={styles.nutritionLabel}>carbs</Text>
                  </View>
                  <View style={styles.nutritionItem}>
                    <Text style={styles.nutritionEmoji}>🧈</Text>
                    <Text style={styles.nutritionValue}>{portionNutrition.fat}g</Text>
                    <Text style={styles.nutritionLabel}>fat</Text>
                  </View>
                </View>
              </View>
            )}

            {/* Portion selector */}
            <View style={styles.portionSection}>
              <Text style={styles.sectionTitle}>How much did you eat?</Text>
              <View style={styles.portionOptions}>
                {portionOptions.map((option) => (
                  <Pressable
                    key={option.value}
                    style={[
                      styles.portionButton,
                      selectedPortion === option.value && styles.portionButtonActive,
                    ]}
                    onPress={() => setSelectedPortion(option.value)}
                  >
                    <Text style={[
                      styles.portionButtonText,
                      selectedPortion === option.value && styles.portionButtonTextActive,
                    ]}>
                      {option.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Alternates */}
            {result.alternates.length > 0 && (
              <View style={styles.alternatesSection}>
                <Text style={styles.alternatesTitle}>Not {result.displayName}?</Text>
                <View style={styles.alternatesList}>
                  {result.alternates.map((alt) => (
                    <Pressable
                      key={alt.foodId}
                      style={styles.alternateItem}
                      onPress={() => onSelectAlternate?.(alt.foodId)}
                    >
                      <Text style={styles.alternateName}>{alt.displayName}</Text>
                      <Text style={styles.alternateConfidence}>{alt.confidence}%</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}

            {/* Disclaimer */}
            <View style={styles.disclaimer}>
              <MaterialIcons name="info-outline" size={14} color="#999" />
              <Text style={styles.disclaimerText}>
                Nutrition values are estimates based on average data. 
                Actual values may vary significantly based on preparation and ingredients.
                For accurate tracking, use packaged products with nutrition labels.
              </Text>
            </View>
          </ScrollView>

          {/* Log button */}
          <Pressable style={styles.logButton} onPress={handleLog}>
            <MaterialIcons name="add" size={24} color="#fff" />
            <Text style={styles.logButtonText}>
              Add {selectedPortion}g to Log
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
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
    backgroundColor: '#E8F5E9',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    gap: 4,
  },
  confidenceText: {
    color: '#2E7D32',
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
    marginBottom: 12,
  },
  emoji: {
    fontSize: 32,
  },
  foodName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  aiWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E3F2FD',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    gap: 6,
    marginBottom: 20,
  },
  aiWarningText: {
    color: '#1976D2',
    fontSize: 13,
    fontWeight: '500',
  },
  nutritionSection: {
    backgroundColor: '#F8F8F8',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
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
  portionSection: {
    marginBottom: 20,
  },
  portionOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
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
  alternatesSection: {
    marginBottom: 20,
  },
  alternatesTitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  alternatesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  alternateItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F0F0',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 16,
    gap: 6,
  },
  alternateName: {
    fontSize: 14,
    color: '#333',
  },
  alternateConfidence: {
    fontSize: 12,
    color: '#999',
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
});




