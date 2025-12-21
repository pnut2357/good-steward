import ModeToggle from '@/components/ModeToggle';
import PhotoOverlay from '@/components/PhotoOverlay';
import PortionModal from '@/components/PortionModal';
import ResultModal from '@/components/ResultModal';
import ScannerOverlay from '@/components/ScannerOverlay';
import SearchModal from '@/components/SearchModal';
import { NutritionData, ScanResult } from '@/models/ScanResult';
import { analysisService } from '@/services/AnalysisService';
import { dbService } from '@/services/DatabaseService';
import { profileService } from '@/services/ProfileService';
import { BarcodeScanningResult, CameraView, useCameraPermissions } from 'expo-camera';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, View } from 'react-native';

type ScanMode = 'barcode' | 'photo';

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
  
  // Result state
  const [result, setResult] = useState<ScanResult | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  
  // Consumption state
  const [portionModalVisible, setPortionModalVisible] = useState(false);
  const [productToConsume, setProductToConsume] = useState<ScanResult | null>(null);

  // Request permission and load profile on mount
  useEffect(() => {
    // Request camera permission
    if (permission && !permission.granted && permission.canAskAgain) {
      requestPermission();
    }
    
    // Load user profile so filters work
    profileService.loadProfile().then(() => {
      console.log('✅ User profile loaded for filters');
    });
  }, [permission]);

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
   * Handle photo capture
   * 
   * Flow:
   * 1. Take photo
   * 2. Try OCR analysis
   * 3. If OCR works → search → show result
   * 4. If OCR fails → show search modal with photo reference
   */
  const handlePhotoCapture = useCallback(async () => {
    if (!cameraRef.current || loading) return;
    
    console.log('📸 Capturing photo...');
    
    setLoading(true);
    setLoadingMessage('Taking photo...');

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.5,  // Lower quality = faster processing
        skipProcessing: true,  // Skip post-processing for speed
      });
      
      if (!photo?.uri) {
        throw new Error('Failed to capture photo');
      }

      // Save photo URI for search modal reference
      setCapturedPhotoUri(photo.uri);

      setLoadingMessage('Analyzing label...');
      const scanResult = await analysisService.analyzePhoto(photo.uri);
      
      if (scanResult) {
        // OCR worked and found a match!
        dbService.saveScan(scanResult);
        setResult(scanResult);
        setModalVisible(true);
      } else {
        // OCR not available or no text found
        // Show search modal so user can type what they see
        console.log('📱 OCR unavailable - showing manual search');
        setFailedBarcode(undefined); // Clear any barcode
        setSearchModalVisible(true);
      }
    } catch (error: any) {
      console.error('Photo capture error:', error);
      // Still show search modal on error - user can manually search
      setSearchModalVisible(true);
    } finally {
      setLoading(false);
    }
  }, [loading]);

  /**
   * Close modal and reset
   */
  const handleCloseModal = useCallback(() => {
    setModalVisible(false);
    setResult(null);
    setTimeout(() => setScanned(false), 300);
  }, []);

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
    
    // Update the current result if it's the same product
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
      // Try to fetch the selected product
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
      {mode === 'barcode' ? (
        <ScannerOverlay />
      ) : (
        <PhotoOverlay onCapture={handlePhotoCapture} disabled={loading} />
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
              Results are cached for instant future access
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

      {/* Result Modal */}
      <ResultModal
        visible={modalVisible}
        result={result}
        onClose={handleCloseModal}
        onConsume={handleConsumePress}
        onEditNutrition={handleEditNutrition}
      />

      {/* Portion Selection Modal */}
      <PortionModal
        visible={portionModalVisible}
        product={productToConsume}
        onClose={handleClosePortionModal}
        onConfirm={handleConfirmConsumption}
      />

      {/* Search Modal (when barcode not found or photo OCR fails) */}
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
