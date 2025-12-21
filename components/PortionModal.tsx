import { MaterialIcons } from '@expo/vector-icons';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
    Keyboard,
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import {
    ScanResult,
    calculatePortionNutrition
} from '../models/ScanResult';

type Props = {
  visible: boolean;
  product: ScanResult | null;
  onClose: () => void;
  onConfirm: (portionGrams: number) => void;
};

/**
 * Modal for selecting portion size when marking a product as consumed
 */
export default function PortionModal({ visible, product, onClose, onConfirm }: Props) {
  const [customPortion, setCustomPortion] = useState('');
  const [selectedPortion, setSelectedPortion] = useState<number | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  // Get default serving size from product or use 100g
  const defaultServing = product?.nutrition?.serving_size_g || 100;
  const halfServing = Math.round(defaultServing / 2);

  // Portion options
  const portionOptions = [
    { label: `1 serving (${defaultServing}g)`, value: defaultServing },
    { label: `Half serving (${halfServing}g)`, value: halfServing },
    { label: 'Small taste (25g)', value: 25 },
  ];

  // Reset when modal opens
  useEffect(() => {
    if (visible) {
      setSelectedPortion(defaultServing);
      setCustomPortion('');
    }
  }, [visible, defaultServing]);

  // Calculate preview nutrition
  const previewNutrition = calculatePortionNutrition(
    product?.nutrition,
    selectedPortion || parseInt(customPortion) || 0
  );

  const handleConfirm = useCallback(() => {
    const portion = selectedPortion || parseInt(customPortion);
    if (portion && portion > 0) {
      onConfirm(portion);
    }
  }, [selectedPortion, customPortion, onConfirm]);

  const handleCustomChange = useCallback((text: string) => {
    // Only allow numbers
    const numericText = text.replace(/[^0-9]/g, '');
    setCustomPortion(numericText);
    if (numericText) {
      setSelectedPortion(null); // Clear preset selection when using custom
    }
  }, []);

  // Handle keyboard submit
  const handleSubmitEditing = useCallback(() => {
    Keyboard.dismiss();
    // Auto-scroll to show the confirm button
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, []);

  const handlePresetSelect = useCallback((value: number) => {
    setSelectedPortion(value);
    setCustomPortion(''); // Clear custom when using preset
  }, []);

  const currentPortion = selectedPortion || parseInt(customPortion) || 0;
  const isValid = currentPortion > 0;

  if (!product) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <Pressable style={styles.dismissArea} onPress={Keyboard.dismiss} />
        <View style={styles.modal}>
          {/* Header */}
          <View style={styles.header}>
            <MaterialIcons name="restaurant" size={28} color="#2E7D32" />
            <Text style={styles.headerTitle}>How much did you eat?</Text>
            <Pressable onPress={onClose} style={styles.closeButton}>
              <MaterialIcons name="close" size={24} color="#666" />
            </Pressable>
          </View>

          <ScrollView 
            ref={scrollViewRef}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.scrollContent}
          >
            {/* Product name */}
            <Text style={styles.productName}>{product.name}</Text>
            {product.brand && <Text style={styles.brandName}>{product.brand}</Text>}

            {/* Quick portion options */}
            <View style={styles.optionsContainer}>
              {portionOptions.map((option) => (
                <Pressable
                  key={option.value}
                  style={[
                    styles.optionButton,
                    selectedPortion === option.value && styles.optionButtonSelected,
                  ]}
                  onPress={() => handlePresetSelect(option.value)}
                >
                  <Text
                    style={[
                      styles.optionText,
                      selectedPortion === option.value && styles.optionTextSelected,
                    ]}
                  >
                    {option.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* Custom portion input */}
            <View style={styles.customContainer}>
              <Text style={styles.customLabel}>Or enter custom amount:</Text>
              <View style={styles.customInputRow}>
                <TextInput
                  style={styles.customInput}
                  keyboardType="numeric"
                  placeholder="Enter grams"
                  placeholderTextColor="#999"
                  value={customPortion}
                  onChangeText={handleCustomChange}
                  returnKeyType="done"
                  onSubmitEditing={handleSubmitEditing}
                />
                <Text style={styles.gramLabel}>grams</Text>
                {/* Quick add button when custom is entered */}
                {customPortion && parseInt(customPortion) > 0 && (
                  <Pressable 
                    style={styles.quickAddButton}
                    onPress={() => {
                      Keyboard.dismiss();
                      handleConfirm();
                    }}
                  >
                    <MaterialIcons name="add" size={20} color="#fff" />
                  </Pressable>
                )}
              </View>
            </View>

            {/* Nutrition preview */}
            {isValid && (
              <View style={styles.previewContainer}>
                <Text style={styles.previewTitle}>This portion contains:</Text>
                <View style={styles.previewGrid}>
                  {previewNutrition.calories !== undefined && (
                    <View style={styles.previewItem}>
                      <Text style={styles.previewEmoji}>🔥</Text>
                      <Text style={styles.previewValue}>{previewNutrition.calories}</Text>
                      <Text style={styles.previewLabel}>cal</Text>
                    </View>
                  )}
                  {previewNutrition.sugar !== undefined && (
                    <View style={styles.previewItem}>
                      <Text style={styles.previewEmoji}>🍬</Text>
                      <Text style={styles.previewValue}>{previewNutrition.sugar}g</Text>
                      <Text style={styles.previewLabel}>sugar</Text>
                    </View>
                  )}
                  {previewNutrition.protein !== undefined && (
                    <View style={styles.previewItem}>
                      <Text style={styles.previewEmoji}>💪</Text>
                      <Text style={styles.previewValue}>{previewNutrition.protein}g</Text>
                      <Text style={styles.previewLabel}>protein</Text>
                    </View>
                  )}
                  {previewNutrition.carbs !== undefined && (
                    <View style={styles.previewItem}>
                      <Text style={styles.previewEmoji}>🍞</Text>
                      <Text style={styles.previewValue}>{previewNutrition.carbs}g</Text>
                      <Text style={styles.previewLabel}>carbs</Text>
                    </View>
                  )}
                </View>
              </View>
            )}

            {/* Confirm button */}
            <Pressable
              style={[styles.confirmButton, !isValid && styles.confirmButtonDisabled]}
              onPress={handleConfirm}
              disabled={!isValid}
            >
              <MaterialIcons name="check" size={24} color="#fff" />
              <Text style={styles.confirmButtonText}>
                Add {currentPortion}g to Today's Log
              </Text>
            </Pressable>

            {/* Disclaimer */}
            <Text style={styles.disclaimer}>
              Nutrition values are estimates based on product data.
            </Text>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  dismissArea: {
    flex: 1,
  },
  modal: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 24,
    paddingTop: 24,
    gap: 12,
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
  },
  closeButton: {
    padding: 4,
  },
  productName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  brandName: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 20,
  },
  optionsContainer: {
    gap: 10,
    marginBottom: 20,
  },
  optionButton: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  optionButtonSelected: {
    backgroundColor: '#E8F5E9',
    borderColor: '#2E7D32',
  },
  optionText: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
  },
  optionTextSelected: {
    color: '#2E7D32',
    fontWeight: '600',
  },
  customContainer: {
    marginBottom: 20,
  },
  customLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  customInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  customInput: {
    flex: 1,
    height: 48,
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 18,
    color: '#333',
    backgroundColor: '#F8F8F8',
  },
  gramLabel: {
    fontSize: 16,
    color: '#666',
  },
  quickAddButton: {
    backgroundColor: '#2E7D32',
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewContainer: {
    backgroundColor: '#F0FFF4',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  previewTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2E7D32',
    marginBottom: 12,
    textAlign: 'center',
  },
  previewGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  previewItem: {
    alignItems: 'center',
    minWidth: 60,
  },
  previewEmoji: {
    fontSize: 20,
    marginBottom: 4,
  },
  previewValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  previewLabel: {
    fontSize: 12,
    color: '#666',
  },
  confirmButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2E7D32',
    borderRadius: 12,
    padding: 16,
    gap: 8,
    marginBottom: 12,
  },
  confirmButtonDisabled: {
    backgroundColor: '#CCC',
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  disclaimer: {
    fontSize: 11,
    color: '#999',
    textAlign: 'center',
  },
});

