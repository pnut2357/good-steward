import { MaterialIcons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useCallback, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
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
import { ocrService } from '../services/OCRService';
import {
    calculateConfidence,
    hasUsefulNutrition,
    parseNutritionLabel,
} from '../utils/nutritionLabelParser';

type Props = {
  visible: boolean;
  productName: string;
  onSave: (nutrition: NutritionData) => void;
  onClose: () => void;
};

type ScanStep = 'camera' | 'processing' | 'review' | 'edit';

/**
 * Modal for scanning nutrition label with camera and OCR
 */
export default function NutritionLabelScanner({
  visible,
  productName,
  onSave,
  onClose,
}: Props) {
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [step, setStep] = useState<ScanStep>('camera');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [ocrText, setOcrText] = useState<string>('');
  const [parsedNutrition, setParsedNutrition] = useState<Partial<NutritionData>>({});
  const [confidence, setConfidence] = useState(0);
  
  // Editable fields
  const [calories, setCalories] = useState('');
  const [sugar, setSugar] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [saturatedFat, setSaturatedFat] = useState('');
  const [salt, setSalt] = useState('');
  const [ocrSource, setOcrSource] = useState<'mlkit' | 'groq-vision' | 'none'>('none');
  const [processingMessage, setProcessingMessage] = useState('Reading nutrition label...');

  /**
   * Take photo of nutrition label
   */
  const handleCapture = useCallback(async () => {
    if (!cameraRef.current) return;

    try {
      setStep('processing');
      setProcessingMessage('Taking photo...');
      
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        skipProcessing: false,
      });

      if (!photo?.uri) {
        throw new Error('Failed to capture photo');
      }

      setPhotoUri(photo.uri);

      // Check if ML Kit is available, otherwise show cloud message
      const mlKitAvailable = await ocrService.checkAvailability();
      if (mlKitAvailable) {
        setProcessingMessage('Reading nutrition label...');
      } else {
        setProcessingMessage('Reading with Cloud OCR...');
      }

      // Run OCR on the photo
      console.log('📸 Running OCR on nutrition label...');
      const ocrResult = await ocrService.recognizeText(photo.uri);
      
      // Track which OCR source was used
      setOcrSource(ocrResult.source || 'none');
      
      // Get the full text from OCR result (it returns an object, not a string)
      const text = ocrResult?.fullText || '';
      
      if (!text || text.trim().length === 0) {
        Alert.alert(
          'Could Not Read Label',
          'The text on the label could not be recognized. Please try again with better lighting or enter values manually.',
          [
            { text: 'Try Again', onPress: () => setStep('camera') },
            { text: 'Enter Manually', onPress: () => goToEdit({}) },
          ]
        );
        return;
      }

      setOcrText(text);
      console.log('📝 OCR Text:', text.substring(0, 200) + '...');

      // Parse nutrition from OCR text
      const parsed = parseNutritionLabel(text);
      setParsedNutrition(parsed);
      
      const conf = calculateConfidence(parsed);
      setConfidence(conf);

      if (hasUsefulNutrition(parsed)) {
        // Pre-fill edit fields
        populateFields(parsed);
        setStep('review');
      } else {
        Alert.alert(
          'Limited Data Found',
          'Could not extract nutrition values from the label. You can review what was found and add missing values manually.',
          [
            { text: 'Try Again', onPress: () => setStep('camera') },
            { text: 'Review & Edit', onPress: () => goToEdit(parsed) },
          ]
        );
      }
    } catch (error: any) {
      console.error('Label scan error:', error);
      Alert.alert(
        'Scan Failed',
        error.message || 'Failed to scan nutrition label. Please try again.',
        [{ text: 'OK', onPress: () => setStep('camera') }]
      );
    }
  }, []);

  /**
   * Populate edit fields from parsed nutrition
   */
  const populateFields = useCallback((nutrition: Partial<NutritionData>) => {
    setCalories(nutrition.calories_100g?.toString() || '');
    setSugar(nutrition.sugar_100g?.toString() || '');
    setProtein(nutrition.protein_100g?.toString() || '');
    setCarbs(nutrition.carbs_100g?.toString() || '');
    setSaturatedFat(nutrition.saturated_fat_100g?.toString() || '');
    setSalt(nutrition.salt_100g?.toString() || '');
  }, []);

  /**
   * Go to edit step with optional pre-fill
   */
  const goToEdit = useCallback((nutrition: Partial<NutritionData>) => {
    populateFields(nutrition);
    setStep('edit');
  }, [populateFields]);

  /**
   * Save nutrition data
   */
  const handleSave = useCallback(() => {
    const nutrition: NutritionData = {
      calories_100g: parseFloat(calories) || undefined,
      sugar_100g: parseFloat(sugar) || undefined,
      protein_100g: parseFloat(protein) || undefined,
      carbs_100g: parseFloat(carbs) || undefined,
      saturated_fat_100g: parseFloat(saturatedFat) || undefined,
      salt_100g: parseFloat(salt) || undefined,
      isUserEdited: true,
    };

    // Require at least calories
    if (!nutrition.calories_100g || nutrition.calories_100g <= 0) {
      Alert.alert('Missing Calories', 'Please enter at least the calorie value.');
      return;
    }

    onSave(nutrition);
    handleClose();
  }, [calories, sugar, protein, carbs, saturatedFat, salt, onSave]);

  /**
   * Close and reset state
   */
  const handleClose = useCallback(() => {
    setStep('camera');
    setPhotoUri(null);
    setOcrText('');
    setParsedNutrition({});
    setConfidence(0);
    setCalories('');
    setSugar('');
    setProtein('');
    setCarbs('');
    setSaturatedFat('');
    setSalt('');
    onClose();
  }, [onClose]);

  /**
   * Render camera step
   */
  const renderCamera = () => {
    if (!permission?.granted) {
      return (
        <View style={styles.permissionContainer}>
          <MaterialIcons name="camera-alt" size={64} color="#CCC" />
          <Text style={styles.permissionText}>Camera permission required</Text>
          <Pressable style={styles.permissionButton} onPress={requestPermission}>
            <Text style={styles.permissionButtonText}>Grant Permission</Text>
          </Pressable>
        </View>
      );
    }

    return (
      <View style={styles.cameraContainer}>
        <CameraView
          ref={cameraRef}
          style={styles.camera}
          facing="back"
        />
        
        {/* Overlay with guide */}
        <View style={styles.cameraOverlay}>
          <View style={styles.guideBorder}>
            <Text style={styles.guideText}>
              Position the nutrition label inside the frame
            </Text>
          </View>
        </View>

        {/* Capture button */}
        <View style={styles.captureContainer}>
          <Pressable style={styles.captureButton} onPress={handleCapture}>
            <MaterialIcons name="camera" size={40} color="#fff" />
          </Pressable>
          <Text style={styles.captureHint}>Tap to capture</Text>
        </View>
      </View>
    );
  };

  /**
   * Render processing step
   */
  const renderProcessing = () => (
    <View style={styles.processingContainer}>
      <ActivityIndicator size="large" color="#2E7D32" />
      <Text style={styles.processingText}>{processingMessage}</Text>
      <Text style={styles.processingSubtext}>
        {processingMessage.includes('Cloud') 
          ? 'Using OCR.space to extract text'
          : 'Extracting nutrition values from the photo'}
      </Text>
    </View>
  );

  /**
   * Render review step (shows parsed results)
   */
  const renderReview = () => (
    <ScrollView style={styles.reviewContainer} contentContainerStyle={styles.reviewContent}>
      {/* Photo preview */}
      {photoUri && (
        <Image source={{ uri: photoUri }} style={styles.photoPreview} resizeMode="contain" />
      )}

      {/* Source & Confidence indicator */}
      <View style={styles.sourceContainer}>
        <View style={styles.sourceBadge}>
          <MaterialIcons 
            name={ocrSource === 'groq-vision' ? 'cloud' : 'smartphone'} 
            size={14} 
            color="#666" 
          />
          <Text style={styles.sourceText}>
            {ocrSource === 'groq-vision' ? 'Cloud OCR' : 'On-device OCR'}
          </Text>
        </View>
        <View style={styles.confidenceContainer}>
          <MaterialIcons 
            name={confidence >= 50 ? 'check-circle' : 'warning'} 
            size={16} 
            color={confidence >= 50 ? '#2E7D32' : '#F57C00'} 
          />
          <Text style={styles.confidenceText}>
            {confidence >= 75 ? 'High' : confidence >= 50 ? 'Medium' : 'Low'} ({confidence}%)
          </Text>
        </View>
      </View>

      {/* Parsed values */}
      <View style={styles.parsedSection}>
        <Text style={styles.parsedTitle}>Extracted Values (per 100g)</Text>
        
        <View style={styles.parsedGrid}>
          {parsedNutrition.calories_100g !== undefined && (
            <View style={styles.parsedItem}>
              <Text style={styles.parsedEmoji}>🔥</Text>
              <Text style={styles.parsedLabel}>Calories</Text>
              <Text style={styles.parsedValue}>{parsedNutrition.calories_100g}</Text>
            </View>
          )}
          {parsedNutrition.sugar_100g !== undefined && (
            <View style={styles.parsedItem}>
              <Text style={styles.parsedEmoji}>🍬</Text>
              <Text style={styles.parsedLabel}>Sugar</Text>
              <Text style={styles.parsedValue}>{parsedNutrition.sugar_100g}g</Text>
            </View>
          )}
          {parsedNutrition.protein_100g !== undefined && (
            <View style={styles.parsedItem}>
              <Text style={styles.parsedEmoji}>💪</Text>
              <Text style={styles.parsedLabel}>Protein</Text>
              <Text style={styles.parsedValue}>{parsedNutrition.protein_100g}g</Text>
            </View>
          )}
          {parsedNutrition.carbs_100g !== undefined && (
            <View style={styles.parsedItem}>
              <Text style={styles.parsedEmoji}>🍞</Text>
              <Text style={styles.parsedLabel}>Carbs</Text>
              <Text style={styles.parsedValue}>{parsedNutrition.carbs_100g}g</Text>
            </View>
          )}
        </View>
      </View>

      {/* Action buttons */}
      <View style={styles.reviewActions}>
        <Pressable 
          style={styles.editButton} 
          onPress={() => goToEdit(parsedNutrition)}
        >
          <MaterialIcons name="edit" size={20} color="#1976D2" />
          <Text style={styles.editButtonText}>Edit Values</Text>
        </Pressable>
        
        <Pressable style={styles.confirmButton} onPress={handleSave}>
          <MaterialIcons name="check" size={20} color="#fff" />
          <Text style={styles.confirmButtonText}>Save & Use</Text>
        </Pressable>
      </View>

      <Pressable style={styles.retakeButton} onPress={() => setStep('camera')}>
        <MaterialIcons name="refresh" size={18} color="#666" />
        <Text style={styles.retakeButtonText}>Retake Photo</Text>
      </Pressable>
    </ScrollView>
  );

  /**
   * Render edit step (manual input form)
   */
  const renderEdit = () => {
    const createNumericHandler = (setter: (v: string) => void) => (text: string) => {
      setter(text.replace(/[^0-9.]/g, ''));
    };

    return (
      <ScrollView style={styles.editContainer} contentContainerStyle={styles.editContent}>
        <View style={styles.editInfo}>
          <MaterialIcons name="info-outline" size={16} color="#1976D2" />
          <Text style={styles.editInfoText}>
            Enter values per 100g as shown on the label
          </Text>
        </View>

        <View style={styles.inputGroup}>
          <View style={styles.inputRow}>
            <Text style={styles.inputLabel}>🔥 Calories</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={calories}
              onChangeText={createNumericHandler(setCalories)}
              placeholder="kcal"
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.inputRow}>
            <Text style={styles.inputLabel}>🍬 Sugar</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={sugar}
              onChangeText={createNumericHandler(setSugar)}
              placeholder="g"
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.inputRow}>
            <Text style={styles.inputLabel}>💪 Protein</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={protein}
              onChangeText={createNumericHandler(setProtein)}
              placeholder="g"
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.inputRow}>
            <Text style={styles.inputLabel}>🍞 Carbs</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={carbs}
              onChangeText={createNumericHandler(setCarbs)}
              placeholder="g"
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.inputRow}>
            <Text style={styles.inputLabel}>🧈 Saturated Fat</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={saturatedFat}
              onChangeText={createNumericHandler(setSaturatedFat)}
              placeholder="g"
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.inputRow}>
            <Text style={styles.inputLabel}>🧂 Salt</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={salt}
              onChangeText={createNumericHandler(setSalt)}
              placeholder="g"
              placeholderTextColor="#999"
            />
          </View>
        </View>

        <Pressable style={styles.saveButton} onPress={handleSave}>
          <MaterialIcons name="save" size={24} color="#fff" />
          <Text style={styles.saveButtonText}>Save Nutrition Data</Text>
        </Pressable>
      </ScrollView>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>
            {step === 'camera' ? 'Scan Nutrition Label' : 
             step === 'processing' ? 'Processing...' :
             step === 'review' ? 'Review Values' : 'Edit Values'}
          </Text>
          <Pressable onPress={handleClose} style={styles.closeButton}>
            <MaterialIcons name="close" size={24} color="#666" />
          </Pressable>
        </View>

        {/* Product name */}
        <Text style={styles.productName}>{productName}</Text>

        {/* Content based on step */}
        {step === 'camera' && renderCamera()}
        {step === 'processing' && renderProcessing()}
        {step === 'review' && renderReview()}
        {step === 'edit' && renderEdit()}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
  },
  closeButton: {
    padding: 4,
  },
  productName: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    paddingVertical: 12,
    backgroundColor: '#F8F8F8',
  },
  // Permission
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  permissionText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
    marginBottom: 20,
  },
  permissionButton: {
    backgroundColor: '#2E7D32',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  permissionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  // Camera
  cameraContainer: {
    flex: 1,
    position: 'relative',
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  guideBorder: {
    width: '85%',
    aspectRatio: 1.5,
    borderWidth: 3,
    borderColor: '#B6FFBB',
    borderRadius: 12,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 16,
  },
  guideText: {
    color: '#fff',
    fontSize: 14,
    textAlign: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  captureContainer: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#2E7D32',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#fff',
  },
  captureHint: {
    color: '#fff',
    fontSize: 14,
    marginTop: 12,
  },
  // Processing
  processingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  processingText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 20,
  },
  processingSubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
  },
  // Review
  reviewContainer: {
    flex: 1,
  },
  reviewContent: {
    padding: 20,
  },
  photoPreview: {
    width: '100%',
    height: 150,
    borderRadius: 12,
    backgroundColor: '#F0F0F0',
    marginBottom: 16,
  },
  sourceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  sourceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
  },
  sourceText: {
    fontSize: 12,
    color: '#666',
  },
  confidenceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  confidenceText: {
    fontSize: 12,
    color: '#666',
  },
  parsedSection: {
    backgroundColor: '#F8FFF8',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  parsedTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2E7D32',
    marginBottom: 16,
    textAlign: 'center',
  },
  parsedGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    gap: 16,
  },
  parsedItem: {
    alignItems: 'center',
    minWidth: 70,
  },
  parsedEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  parsedLabel: {
    fontSize: 12,
    color: '#666',
  },
  parsedValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  reviewActions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  editButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#E3F2FD',
    gap: 8,
  },
  editButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1976D2',
  },
  confirmButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#2E7D32',
    gap: 8,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  retakeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 8,
  },
  retakeButtonText: {
    fontSize: 14,
    color: '#666',
  },
  // Edit
  editContainer: {
    flex: 1,
  },
  editContent: {
    padding: 20,
  },
  editInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#E3F2FD',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
    gap: 8,
  },
  editInfoText: {
    flex: 1,
    fontSize: 13,
    color: '#1565C0',
    lineHeight: 18,
  },
  inputGroup: {
    gap: 16,
    marginBottom: 24,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  inputLabel: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  input: {
    width: 120,
    height: 44,
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    color: '#333',
    textAlign: 'right',
    backgroundColor: '#F8F8F8',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2E7D32',
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});

