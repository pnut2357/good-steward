import FoodIdentifyOverlay from '@/components/FoodIdentifyOverlay';
import FoodSearchModal, { FoodSearchResult } from '@/components/FoodSearchModal';
import HybridFoodResultModal from '@/components/HybridFoodResultModal';
import ModeToggle, { ScanMode } from '@/components/ModeToggle';
import PhotoOverlay from '@/components/PhotoOverlay';
import PortionModal from '@/components/PortionModal';
import ResultModal from '@/components/ResultModal';
import ScannerOverlay from '@/components/ScannerOverlay';
import SearchModal from '@/components/SearchModal';
import { NutritionData, ScanResult } from '@/models/ScanResult';
import { analysisService } from '@/services/AnalysisService';
import { dbService } from '@/services/DatabaseService';
import {
  HybridFoodResult,
  checkAvailableMethods,
  recognizeFood
} from '@/services/HybridFoodService';
import { profileService } from '@/services/ProfileService';
import { BarcodeScanningResult, CameraView, useCameraPermissions } from 'expo-camera';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, View } from 'react-native';

const BARCODE_TYPES = ['ean13', 'ean8', 'upc_a', 'upc_e'] as const;

export default function ScannerScreen() {
  // Camera ref for photo capture
  const cameraRef = useRef<CameraView>(null);
  
  // Mode state
  const [mode, setMode] = useState<ScanMode>('barcode');
  
  // Camera permission
  const [permission, requestPermission] = useCameraPermissions();
  
  // Scanning state
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Checking...');
  
  // Search modal state (for when barcode not found or photo OCR fails)
  const [searchModalVisible, setSearchModalVisible] = useState(false);
  const [failedBarcode, setFailedBarcode] = useState<string | undefined>();
  const [capturedPhotoUri, setCapturedPhotoUri] = useState<string | undefined>();
  
  // Result state (for barcode/photo modes)
  const [result, setResult] = useState<ScanResult | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  
  // Food recognition state (for identify mode)
  const [hybridResult, setHybridResult] = useState<HybridFoodResult | null>(null);
  const [foodModalVisible, setFoodModalVisible] = useState(false);
  const [identifyPhotoUri, setIdentifyPhotoUri] = useState<string | undefined>();
  const [foodRecognitionAvailable, setFoodRecognitionAvailable] = useState(false);
  const [availableMethods, setAvailableMethods] = useState<{
    visionLLM: boolean;
    tflite: boolean;
    isOnline: boolean;
  }>({ visionLLM: false, tflite: false, isOnline: false });
  
  // Food search modal state (fallback when AI recognition fails)
  const [foodSearchModalVisible, setFoodSearchModalVisible] = useState(false);
  
  // Consumption state
  const [portionModalVisible, setPortionModalVisible] = useState(false);
  const [productToConsume, setProductToConsume] = useState<ScanResult | null>(null);

  // Load profile and check food recognition on mount (runs once)
  useEffect(() => {
    // Load user profile so filters work
    profileService.loadProfile().then(() => {
      console.log('✅ User profile loaded for filters');
    });
    
    // Check what food recognition methods are available
    checkAvailableMethods().then(methods => {
      setAvailableMethods(methods);
      // Food recognition is available if either Vision LLM or TFLite works
      const available = methods.visionLLM || methods.tflite;
      setFoodRecognitionAvailable(available);
      console.log(`🍽️ Food recognition available: ${available}`);
      console.log(`   - Vision LLM: ${methods.visionLLM ? '✅' : '❌'}`);
      console.log(`   - TFLite: ${methods.tflite ? '✅' : '❌'}`);
      console.log(`   - Online: ${methods.isOnline ? '✅' : '❌'}`);
    });
  }, []); // Empty deps - run once on mount
  
  // Request camera permission (separate effect to avoid infinite loop)
  useEffect(() => {
    if (permission && !permission.granted && permission.canAskAgain) {
      requestPermission();
    }
  }, [permission?.granted, permission?.canAskAgain]); // Only re-run when these specific values change

  /**
   * Handle barcode scan
   */
  const handleBarCodeScanned = useCallback(async ({ data: barcode }: BarcodeScanningResult) => {
    if (scanned || loading || mode !== 'barcode') return;
    
    console.log(`📊 Scanned barcode: ${barcode}`);
    
    setScanned(true);
    setLoading(true);
    setLoadingMessage('Checking...');

    try {
      // Check cache first (INSTANT)
      let scanResult = dbService.getScan(barcode);

      if (scanResult) {
        console.log('✅ Found in cache - instant result!');
      } else {
        setLoadingMessage('Getting product info...');
        scanResult = await analysisService.analyzeBarcode(barcode);

        if (scanResult) {
          dbService.saveScan(scanResult);
        }
      }

      if (scanResult) {
        setResult(scanResult);
        setModalVisible(true);
      } else {
        // Show search modal so user can search by product name
        setFailedBarcode(barcode);
        setSearchModalVisible(true);
      }
    } catch (error) {
      console.error('Scan error:', error);
      Alert.alert(
        'Error',
        'An error occurred. Please try again.',
        [{ text: 'OK', onPress: () => setScanned(false) }]
      );
    } finally {
      setLoading(false);
    }
  }, [scanned, loading, mode]);

  /**
   * Handle photo capture (for label scanning)
   */
  const handlePhotoCapture = useCallback(async () => {
    if (!cameraRef.current || loading) return;
    
    console.log('📸 Capturing photo for label...');
    
    setLoading(true);
    setLoadingMessage('Taking photo...');

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.5,
        skipProcessing: true,
      });
      
      if (!photo?.uri) {
        throw new Error('Failed to capture photo');
      }

      setCapturedPhotoUri(photo.uri);

      setLoadingMessage('Analyzing label...');
      const scanResult = await analysisService.analyzePhoto(photo.uri);
      
      if (scanResult) {
        dbService.saveScan(scanResult);
        setResult(scanResult);
        setModalVisible(true);
      } else {
        console.log('📱 OCR unavailable - showing manual search');
        setFailedBarcode(undefined);
        setSearchModalVisible(true);
      }
    } catch (error: any) {
      console.error('Photo capture error:', error);
      setSearchModalVisible(true);
    } finally {
      setLoading(false);
    }
  }, [loading]);

  /**
   * Handle food identification capture
   */
  const handleIdentifyCapture = useCallback(async () => {
    if (!cameraRef.current || loading) return;
    
    console.log('🍽️ Capturing photo for food identification...');
    
    setLoading(true);
    setLoadingMessage('Taking photo...');

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.7,
        skipProcessing: false,
      });
      
      if (!photo?.uri) {
        throw new Error('Failed to capture photo');
      }

      setIdentifyPhotoUri(photo.uri);
      
      // Use hybrid service - tries Vision LLM first, falls back to TFLite
      const loadingMsg = availableMethods.visionLLM 
        ? 'AI is analyzing your food...' 
        : 'Identifying food...';
      setLoadingMessage(loadingMsg);

      const recognitionResult = await recognizeFood(photo.uri);
      
      setHybridResult(recognitionResult);
      setFoodModalVisible(true);
      
      if (!recognitionResult.success) {
        // Result will show error in modal, but also offer manual search
        console.log('⚠️ Recognition failed:', recognitionResult.error);
      }
    } catch (error: any) {
      console.error('Identify capture error:', error);
      Alert.alert(
        'Error',
        error.message || 'Failed to identify food. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  }, [loading, availableMethods.visionLLM]);

  /**
   * Close modal and reset
   */
  const handleCloseModal = useCallback(() => {
    setModalVisible(false);
    setResult(null);
    setTimeout(() => setScanned(false), 300);
  }, []);

  /**
   * Close food result modal
   */
  const handleCloseFoodModal = useCallback(() => {
    setFoodModalVisible(false);
    setHybridResult(null);
    setIdentifyPhotoUri(undefined);
  }, []);

  /**
   * Handle search fallback when food recognition fails
   * Opens food name search (not barcode product search)
   */
  const handleFoodSearchFallback = useCallback(() => {
    setFoodModalVisible(false);
    setFoodSearchModalVisible(true);
  }, []);

  /**
   * Handle food selection from food search modal
   */
  const handleFoodSearchSelect = useCallback((food: FoodSearchResult, servings: number) => {
    const timestamp = new Date().toISOString();
    const barcode = `food_${food.id}_${Date.now()}`;
    
    // Calculate nutrition for the servings
    const multiplier = (food.servingG / 100) * servings;
    const calories = Math.round(food.calories * multiplier);
    const protein = Math.round(food.protein * multiplier * 10) / 10;
    const carbs = Math.round(food.carbs * multiplier * 10) / 10;
    const fat = Math.round(food.fat * multiplier * 10) / 10;
    
    const foodResult: ScanResult = {
      barcode,
      name: food.name,
      ingredients: '',
      summary: `${servings} serving${servings !== 1 ? 's' : ''} (${Math.round(food.servingG * servings)}g)`,
      isSafe: true,
      nutrition: {
        calories_100g: food.calories,
        protein_100g: food.protein,
        carbs_100g: food.carbs,
        fat_100g: food.fat,
        serving_size_g: food.servingG,
      },
      dataSource: 'food_search',
      source: 'photo',
      photoUri: identifyPhotoUri,
      consumed: true,
      timestamp,
    };
    
    try {
      // Save to database
      dbService.saveScan(foodResult);
      // Add consumption for the specified serving size
      dbService.addConsumption(barcode, Math.round(food.servingG * servings));
      
      console.log(`✅ Saved food search: ${food.name} (${servings} servings = ${calories} kcal)`);
      
      // Close modals
      setFoodSearchModalVisible(false);
      setHybridResult(null);
      setIdentifyPhotoUri(undefined);
      
      // Show confirmation
      Alert.alert(
        'Added to Log',
        `${food.name} (${calories} kcal) has been added to your consumption log.`,
        [{ text: 'OK' }]
      );
    } catch (error: any) {
      console.error('Failed to save food search selection:', error);
      Alert.alert('Error', 'Failed to save. Please try again.');
    }
  }, [identifyPhotoUri]);

  /**
   * Handle manual calorie entry when food recognition fails
   */
  const handleManualCalorieEntry = useCallback((calories: number, name?: string) => {
    const timestamp = new Date().toISOString();
    const barcode = `manual_${Date.now()}`;
    
    const manualResult: ScanResult = {
      barcode,
      name: name || 'Unknown Food',
      ingredients: '', // Manual entry has no ingredients
      summary: `Manually entered: ${calories} kcal`,
      isSafe: true, // Deprecated but required
      nutrition: {
        calories_100g: calories, // Store as per-serving since we don't know weight
      },
      dataSource: 'manual',
      source: 'photo',
      photoUri: identifyPhotoUri,
      consumed: true,
      timestamp,
    };
    
    try {
      // Save to database
      dbService.saveScan(manualResult);
      // Also add consumption record for today
      dbService.addConsumption(barcode, 100); // 100g = full serving
      
      console.log('✅ Saved manual entry:', manualResult.name, calories, 'kcal');
      
      // Close modal
      setFoodModalVisible(false);
      setHybridResult(null);
      setIdentifyPhotoUri(undefined);
      
      // Show confirmation
      Alert.alert(
        'Added to Log',
        `${manualResult.name} (${calories} kcal) has been added to your consumption log.`,
        [{ text: 'OK' }]
      );
    } catch (error: any) {
      console.error('Failed to save manual entry:', error);
      Alert.alert('Error', 'Failed to save. Please try again.');
    }
  }, [identifyPhotoUri]);

  /**
   * Handle logging identified food from hybrid result
   */
  const handleLogHybridFood = useCallback((result: HybridFoodResult, portionMultiplier: number) => {
    if (!result.success) return;

    // Create a ScanResult-like object for the identified food
    const timestamp = new Date().toISOString();
    const barcode = `ai_${result.method}_${Date.now()}`;
    
    // Calculate adjusted nutrition
    const adjustedCalories = Math.round((result.calories || 0) * portionMultiplier);
    const adjustedProtein = Math.round((result.protein || 0) * portionMultiplier * 10) / 10;
    const adjustedCarbs = Math.round((result.carbs || 0) * portionMultiplier * 10) / 10;
    const adjustedFat = Math.round((result.fat || 0) * portionMultiplier * 10) / 10;
    const adjustedSugar = result.sugar ? Math.round(result.sugar * portionMultiplier * 10) / 10 : undefined;
    const portionGrams = Math.round((result.servingGrams || 100) * portionMultiplier);
    
    // Save as consumed directly
    const scanResult: ScanResult = {
      barcode,
      name: result.productName,
      ingredients: result.isMultipleItems 
        ? `Mixed plate: ${result.items?.map(i => i.name).join(', ')}`
        : 'AI-identified food',
      isSafe: true, // deprecated but required
      timestamp,
      summary: `AI-identified: ${result.productName}`,
      nutrition: {
        calories_100g: result.servingGrams && result.servingGrams > 0 
          ? Math.round((result.calories || 0) * 100 / result.servingGrams)
          : result.calories,
        protein_100g: result.servingGrams && result.servingGrams > 0
          ? Math.round((result.protein || 0) * 100 / result.servingGrams * 10) / 10
          : result.protein,
        carbs_100g: result.servingGrams && result.servingGrams > 0
          ? Math.round((result.carbs || 0) * 100 / result.servingGrams * 10) / 10
          : result.carbs,
        fat_100g: result.servingGrams && result.servingGrams > 0
          ? Math.round((result.fat || 0) * 100 / result.servingGrams * 10) / 10
          : result.fat,
        sugar_100g: result.sugar,
        serving_size_g: result.servingGrams,
      },
      dataSource: result.method === 'vision_llm' ? 'AI Vision (Llama 3.2)' : 'Food-101 AI',
      source: 'photo',
      consumed: true,
    };

    dbService.saveScan(scanResult);
    dbService.addConsumption(barcode, portionGrams);

    Alert.alert(
      '✅ Added to Log',
      `${result.productName} (${adjustedCalories} kcal) added to today's intake.`,
      [{ text: 'OK' }]
    );

    handleCloseFoodModal();
  }, [handleCloseFoodModal]);

  /**
   * Handle "I Ate This" button from result modal
   */
  const handleConsumePress = useCallback((product: ScanResult) => {
    setModalVisible(false);
    setProductToConsume(product);
    setPortionModalVisible(true);
  }, []);

  /**
   * Close portion modal
   */
  const handleClosePortionModal = useCallback(() => {
    setPortionModalVisible(false);
    setProductToConsume(null);
    setTimeout(() => setScanned(false), 300);
  }, []);

  /**
   * Confirm consumption with portion size
   */
  const handleConfirmConsumption = useCallback((portionGrams: number) => {
    if (!productToConsume) return;
    
    dbService.addConsumption(productToConsume.barcode, portionGrams);
    
    Alert.alert(
      '✅ Added to Log',
      `${portionGrams}g of ${productToConsume.name} added to today's intake.`,
      [{ text: 'OK' }]
    );
    
    handleClosePortionModal();
  }, [productToConsume, handleClosePortionModal]);

  /**
   * Handle nutrition edit from ResultModal
   */
  const handleEditNutrition = useCallback((barcode: string, nutrition: NutritionData) => {
    dbService.updateNutrition(barcode, nutrition);
    
    if (result && result.barcode === barcode) {
      setResult({ ...result, nutrition: { ...result.nutrition, ...nutrition } });
    }
    
    Alert.alert(
      '✅ Nutrition Updated',
      'Your nutrition values have been saved for accurate tracking.',
      [{ text: 'OK' }]
    );
  }, [result]);

  /**
   * Handle mode change
   */
  const handleModeChange = useCallback((newMode: ScanMode) => {
    setMode(newMode);
    setScanned(false);
  }, []);

  /**
   * Handle text search (when barcode not found)
   */
  const handleTextSearch = useCallback(async (query: string) => {
    return await analysisService.searchByText(query);
  }, []);

  /**
   * Handle search result selection
   */
  const handleSearchSelect = useCallback(async (barcode: string) => {
    setSearchModalVisible(false);
    setLoading(true);
    setLoadingMessage('Getting product info...');

    try {
      const scanResult = await analysisService.analyzeBarcode(barcode);
      
      if (scanResult) {
        dbService.saveScan(scanResult);
        setResult(scanResult);
        setModalVisible(true);
      } else {
        Alert.alert('Error', 'Could not load product details. Please try again.');
        setScanned(false);
      }
    } catch (error) {
      console.error('Search select error:', error);
      Alert.alert('Error', 'Failed to load product. Please try again.');
      setScanned(false);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Handle search modal close
   */
  const handleSearchClose = useCallback(() => {
    setSearchModalVisible(false);
    setFailedBarcode(undefined);
    setCapturedPhotoUri(undefined);
    setScanned(false);
  }, []);

  // Permission loading
  if (!permission) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#2E7D32" />
      </View>
    );
  }

  // Permission denied
  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <View style={styles.permissionContainer}>
          <Text style={styles.permissionTitle}>Camera Permission Required</Text>
          <Text style={styles.permissionText}>
            Good Steward needs camera access to scan barcodes and analyze food photos.
          </Text>
          {permission.canAskAgain && (
            <Text 
              style={styles.permissionButton}
              onPress={requestPermission}
            >
              Grant Permission
            </Text>
          )}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Camera */}
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing="back"
        barcodeScannerSettings={mode === 'barcode' ? {
          barcodeTypes: [...BARCODE_TYPES],
        } : undefined}
        onBarcodeScanned={mode === 'barcode' && !scanned ? handleBarCodeScanned : undefined}
      />

      {/* Mode-specific overlay */}
      {mode === 'barcode' && <ScannerOverlay />}
      {mode === 'photo' && <PhotoOverlay onCapture={handlePhotoCapture} disabled={loading} />}
      {mode === 'identify' && (
        <FoodIdentifyOverlay 
          onCapture={handleIdentifyCapture} 
          disabled={loading}
          isAvailable={foodRecognitionAvailable}
          isOnline={availableMethods.isOnline}
          hasVisionLLM={availableMethods.visionLLM}
        />
      )}

      {/* Mode toggle (top) */}
      <View style={styles.toggleContainer}>
        <ModeToggle mode={mode} onModeChange={handleModeChange} />
      </View>

      {/* Loading overlay */}
      {loading && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#2E7D32" />
            <Text style={styles.loadingText}>{loadingMessage}</Text>
            <Text style={styles.loadingSubtext}>
              {mode === 'identify' 
                ? 'AI is analyzing your food...'
                : 'Results are cached for instant future access'}
            </Text>
          </View>
        </View>
      )}

      {/* Instructions (barcode mode only) */}
      {mode === 'barcode' && !loading && (
        <View style={styles.instructions}>
          <Text style={styles.instructionText}>
            Point camera at a barcode
          </Text>
        </View>
      )}

      {/* Result Modal (for barcode/photo) */}
      <ResultModal
        visible={modalVisible}
        result={result}
        onClose={handleCloseModal}
        onConsume={handleConsumePress}
        onEditNutrition={handleEditNutrition}
      />

      {/* Food Result Modal (for identify) */}
      <HybridFoodResultModal
        visible={foodModalVisible}
        result={hybridResult}
        photoUri={identifyPhotoUri}
        onClose={handleCloseFoodModal}
        onLog={handleLogHybridFood}
        onSearch={handleFoodSearchFallback}
        onManualEntry={handleManualCalorieEntry}
      />

      {/* Food Search Modal (fallback when AI fails) */}
      <FoodSearchModal
        visible={foodSearchModalVisible}
        photoUri={identifyPhotoUri}
        onClose={() => {
          setFoodSearchModalVisible(false);
          setIdentifyPhotoUri(undefined);
        }}
        onSelect={handleFoodSearchSelect}
      />

      {/* Portion Selection Modal */}
      <PortionModal
        visible={portionModalVisible}
        product={productToConsume}
        onClose={handleClosePortionModal}
        onConfirm={handleConfirmConsumption}
      />

      {/* Search Modal */}
      <SearchModal
        visible={searchModalVisible}
        onClose={handleSearchClose}
        onSelect={handleSearchSelect}
        onSearch={handleTextSearch}
        initialBarcode={failedBarcode}
        photoUri={capturedPhotoUri}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
  },
  camera: {
    flex: 1,
  },
  toggleContainer: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  permissionContainer: {
    padding: 32,
    alignItems: 'center',
  },
  permissionTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 12,
  },
  permissionText: {
    color: '#ccc',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  permissionButton: {
    color: '#2E7D32',
    fontSize: 18,
    fontWeight: '600',
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: '#fff',
    borderRadius: 8,
    overflow: 'hidden',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 20,
  },
  loadingBox: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    padding: 32,
    borderRadius: 16,
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
  loadingSubtext: {
    color: '#aaa',
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  instructions: {
    position: 'absolute',
    bottom: 120,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  instructionText: {
    color: '#fff',
    fontSize: 16,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
});
