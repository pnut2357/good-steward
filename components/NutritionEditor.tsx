import { MaterialIcons } from '@expo/vector-icons';
import { useCallback, useEffect, useState } from 'react';
import {
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
import { NutritionData } from '../models/ScanResult';

type Props = {
  visible: boolean;
  productName: string;
  initialNutrition?: NutritionData;
  onSave: (nutrition: NutritionData) => void;
  onClose: () => void;
};

type NutritionField = {
  key: keyof NutritionData;
  label: string;
  unit: string;
  emoji: string;
  placeholder: string;
};

const NUTRITION_FIELDS: NutritionField[] = [
  { key: 'calories_100g', label: 'Calories', unit: 'kcal', emoji: '🔥', placeholder: 'e.g. 250' },
  { key: 'sugar_100g', label: 'Sugar', unit: 'g', emoji: '🍬', placeholder: 'e.g. 12' },
  { key: 'protein_100g', label: 'Protein', unit: 'g', emoji: '💪', placeholder: 'e.g. 8' },
  { key: 'carbs_100g', label: 'Carbs', unit: 'g', emoji: '🍞', placeholder: 'e.g. 30' },
  { key: 'saturated_fat_100g', label: 'Saturated Fat', unit: 'g', emoji: '🧈', placeholder: 'e.g. 5' },
  { key: 'salt_100g', label: 'Salt', unit: 'g', emoji: '🧂', placeholder: 'e.g. 0.5' },
];

/**
 * Modal for manually entering/editing nutrition data
 * All values are per 100g
 */
export default function NutritionEditor({ 
  visible, 
  productName, 
  initialNutrition, 
  onSave, 
  onClose 
}: Props) {
  const [values, setValues] = useState<Record<string, string>>({});

  // Initialize values when modal opens
  useEffect(() => {
    if (visible) {
      const initial: Record<string, string> = {};
      NUTRITION_FIELDS.forEach(field => {
        const value = initialNutrition?.[field.key];
        initial[field.key] = value !== undefined ? String(value) : '';
      });
      setValues(initial);
    }
  }, [visible, initialNutrition]);

  const handleValueChange = useCallback((key: string, text: string) => {
    // Only allow numbers and decimal point
    const cleaned = text.replace(/[^0-9.]/g, '');
    // Prevent multiple decimal points
    const parts = cleaned.split('.');
    const formatted = parts.length > 2 
      ? parts[0] + '.' + parts.slice(1).join('')
      : cleaned;
    setValues(prev => ({ ...prev, [key]: formatted }));
  }, []);

  const handleSave = useCallback(() => {
    const nutrition: NutritionData = {};
    
    NUTRITION_FIELDS.forEach(field => {
      const value = values[field.key];
      if (value && value.trim() !== '') {
        const num = parseFloat(value);
        if (!isNaN(num) && num >= 0) {
          (nutrition as any)[field.key] = num;
        }
      }
    });

    // Check if at least calories is provided
    if (nutrition.calories_100g === undefined) {
      // Allow save anyway - user might not know calories
    }

    onSave(nutrition);
  }, [values, onSave]);

  // Check if any value is entered
  const hasAnyValue = Object.values(values).some(v => v.trim() !== '');

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
        <View style={styles.modal}>
          {/* Header */}
          <View style={styles.header}>
            <MaterialIcons name="edit" size={24} color="#2E7D32" />
            <Text style={styles.headerTitle}>Add Nutrition</Text>
            <Pressable onPress={onClose} style={styles.closeButton}>
              <MaterialIcons name="close" size={24} color="#666" />
            </Pressable>
          </View>

          {/* Product name */}
          <Text style={styles.productName} numberOfLines={2}>{productName}</Text>
          
          {/* Instructions */}
          <View style={styles.instructionBox}>
            <MaterialIcons name="info-outline" size={16} color="#1976D2" />
            <Text style={styles.instructionText}>
              Enter values per 100g (check the product label). Only fill in what you know.
            </Text>
          </View>

          {/* Nutrition fields */}
          <ScrollView 
            style={styles.fieldsContainer}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {NUTRITION_FIELDS.map(field => (
              <View key={field.key} style={styles.fieldRow}>
                <Text style={styles.fieldEmoji}>{field.emoji}</Text>
                <Text style={styles.fieldLabel}>{field.label}</Text>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.input}
                    keyboardType="decimal-pad"
                    placeholder={field.placeholder}
                    placeholderTextColor="#999"
                    value={values[field.key] || ''}
                    onChangeText={(text) => handleValueChange(field.key, text)}
                  />
                  <Text style={styles.unitLabel}>{field.unit}</Text>
                </View>
              </View>
            ))}
            
            {/* Spacer for keyboard */}
            <View style={{ height: 20 }} />
          </ScrollView>

          {/* Save button */}
          <View style={styles.buttonContainer}>
            <Pressable 
              style={[styles.saveButton, !hasAnyValue && styles.saveButtonDisabled]}
              onPress={handleSave}
              disabled={!hasAnyValue}
            >
              <MaterialIcons name="check" size={20} color="#fff" />
              <Text style={styles.saveButtonText}>Save Nutrition Data</Text>
            </Pressable>
            
            <Text style={styles.disclaimer}>
              Your entries are saved locally and used for tracking.
            </Text>
          </View>
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
  modal: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
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
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    paddingHorizontal: 20,
    marginTop: 12,
  },
  instructionBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#E3F2FD',
    padding: 12,
    marginHorizontal: 20,
    marginTop: 12,
    borderRadius: 8,
    gap: 8,
  },
  instructionText: {
    flex: 1,
    fontSize: 13,
    color: '#1565C0',
    lineHeight: 18,
  },
  fieldsContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    maxHeight: 350,
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  fieldEmoji: {
    fontSize: 20,
    width: 28,
    textAlign: 'center',
  },
  fieldLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: '#333',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  input: {
    width: 80,
    height: 44,
    paddingHorizontal: 12,
    fontSize: 16,
    color: '#333',
    textAlign: 'right',
  },
  unitLabel: {
    fontSize: 14,
    color: '#666',
    paddingRight: 12,
    minWidth: 40,
  },
  buttonContainer: {
    padding: 20,
    paddingBottom: 40,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2E7D32',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  saveButtonDisabled: {
    backgroundColor: '#CCC',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
  },
  disclaimer: {
    fontSize: 11,
    color: '#999',
    textAlign: 'center',
    marginTop: 12,
  },
});

