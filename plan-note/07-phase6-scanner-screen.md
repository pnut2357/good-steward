# Phase 6: Scanner Screen (Refined)

## 🎯 Goal
Build the main scanner screen with camera, barcode detection, and AI analysis.

---

## expo-camera API Reference (SDK 54)

### Key Components & Hooks

```typescript
import { 
  CameraView,              // Camera component
  useCameraPermissions,    // Permission hook
  BarcodeScanningResult    // Type for barcode data
} from 'expo-camera';
```

### CameraView Props

| Prop | Type | Description |
|------|------|-------------|
| `facing` | `'front' \| 'back'` | Which camera to use |
| `barcodeScannerSettings` | `{ barcodeTypes: string[] }` | Barcode types to scan |
| `onBarcodeScanned` | `(result: BarcodeScanningResult) => void` | Callback when barcode detected |
| `style` | `ViewStyle` | Standard React Native style |

### BarcodeScanningResult Type

```typescript
interface BarcodeScanningResult {
  type: string;           // Barcode type (e.g., 'ean13')
  data: string;           // Barcode value
  cornerPoints: Point[];  // Barcode corners
  bounds: {               // Bounding box
    origin: { x: number; y: number };
    size: { width: number; height: number };
  };
}
```

---

## File: `app/(tabs)/index.tsx`

```typescript
import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { CameraView, useCameraPermissions, BarcodeScanningResult } from 'expo-camera';
import ScannerOverlay from '@/components/ScannerOverlay';
import ResultModal from '@/components/ResultModal';
import { dbService } from '@/services/DatabaseService';
import { analysisService } from '@/services/AnalysisService';
import { ScanResult } from '@/models/ScanResult';

// Supported barcode types for food products
const BARCODE_TYPES = ['ean13', 'ean8', 'upc_a', 'upc_e'] as const;

export default function ScannerScreen() {
  // Camera permission state
  const [permission, requestPermission] = useCameraPermissions();
  
  // Scanning state
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Checking...');
  
  // Result state
  const [result, setResult] = useState<ScanResult | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  // Request permission on mount
  useEffect(() => {
    if (permission && !permission.granted && permission.canAskAgain) {
      requestPermission();
    }
  }, [permission]);

  /**
   * Handle barcode detection
   * Implements OFFLINE-FIRST strategy:
   * 1. Check local database first
   * 2. If not found, call API + AI
   * 3. Save to database
   * 4. Show result
   */
  const handleBarCodeScanned = useCallback(async ({ data: barcode, type }: BarcodeScanningResult) => {
    // Prevent multiple scans
    if (scanned || loading) return;
    
    console.log(`Scanned barcode: ${barcode} (type: ${type})`);
    
    setScanned(true);
    setLoading(true);
    setLoadingMessage('Checking...');

    try {
      // STEP 1: Check local database first (INSTANT - ~5ms)
      let scanResult = dbService.getScan(barcode);

      if (scanResult) {
        console.log('✓ Found in local database (cached) - INSTANT!');
      } else {
        // STEP 2: Not in DB, fetch from API + AI analysis
        setLoadingMessage('Getting product info...');
        console.log('→ Not in cache, fetching from API...');
        
        scanResult = await analysisService.analyzeProduct(barcode);

        if (scanResult) {
          // STEP 3: Save to local database for future offline access
          dbService.saveScan(scanResult);
          console.log('✓ Saved to local database');
        }
      }

      // STEP 4: Show result or handle not found
      if (scanResult) {
        setResult(scanResult);
        setModalVisible(true);
      } else {
        Alert.alert(
          'Product Not Found',
          'This product is not in the OpenFoodFacts database. Try scanning another product.',
          [{ text: 'OK', onPress: () => setScanned(false) }]
        );
      }
    } catch (error) {
      console.error('Scan error:', error);
      Alert.alert(
        'Error',
        'An error occurred while analyzing the product. Please try again.',
        [{ text: 'OK', onPress: () => setScanned(false) }]
      );
    } finally {
      setLoading(false);
    }
  }, [scanned, loading]);

  /**
   * Close modal and reset scanner state
   */
  const handleCloseModal = useCallback(() => {
    setModalVisible(false);
    setResult(null);
    // Small delay before allowing new scan
    setTimeout(() => setScanned(false), 300);
  }, []);

  // Permission not determined yet
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
            Good Steward needs camera access to scan product barcodes.
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
      {/* Camera View */}
      <CameraView
        style={styles.camera}
        facing="back"
        barcodeScannerSettings={{
          barcodeTypes: [...BARCODE_TYPES],
        }}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
      />

      {/* Scan Overlay (green corner brackets) */}
      <ScannerOverlay />

      {/* Loading Indicator with Progressive Messages */}
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

      {/* Instructions */}
      {!loading && (
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
  
  // Permission screen
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
  
  // Loading overlay
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
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
  },
  
  // Instructions
  instructions: {
    position: 'absolute',
    bottom: 100,
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
```

---

## Flow Diagram

```
┌─────────────────────────────────────────┐
│          User opens Scanner tab          │
└─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────┐
│        Check camera permission           │
│                                         │
│  ┌───────────────┬───────────────────┐  │
│  │   Granted     │    Not Granted    │  │
│  └───────┬───────┴─────────┬─────────┘  │
│          │                  │           │
│          ▼                  ▼           │
│    Show camera        Show permission   │
│       view               request        │
└─────────────────────────────────────────┘
                    │
         (if granted)
                    │
                    ▼
┌─────────────────────────────────────────┐
│          Camera detects barcode          │
│          (onBarcodeScanned)              │
└─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────┐
│   Set scanned=true (prevent re-scan)     │
│   Set loading=true (show spinner)        │
└─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────┐
│      dbService.getScan(barcode)          │
│      (Check local SQLite first!)         │
│                                         │
│  ┌───────────────┬───────────────────┐  │
│  │    Found      │     Not Found     │  │
│  │   (cached)    │                   │  │
│  └───────┬───────┴─────────┬─────────┘  │
│          │                  │           │
│          │                  ▼           │
│          │    analysisService.analyze() │
│          │           │                  │
│          │           ▼                  │
│          │    dbService.saveScan()      │
│          │           │                  │
│          └───────────┴───────────┐      │
│                                  │      │
└──────────────────────────────────│──────┘
                                   │
                                   ▼
┌─────────────────────────────────────────┐
│         Set loading=false                │
│         Show ResultModal                 │
└─────────────────────────────────────────┘
                    │
          (User taps Done)
                    │
                    ▼
┌─────────────────────────────────────────┐
│      Close modal, reset scanned=false    │
│      Ready for next scan                 │
└─────────────────────────────────────────┘
```

---

## Supported Barcode Types

| Type | Format | Common Use |
|------|--------|------------|
| `ean13` | 13 digits | Most food products (worldwide) |
| `ean8` | 8 digits | Small packages |
| `upc_a` | 12 digits | US/Canada products |
| `upc_e` | 6-8 digits | Small US packages |

All these types are compatible with OpenFoodFacts.

---

## Error Handling

| Scenario | User Feedback |
|----------|---------------|
| Product not in OpenFoodFacts | Alert: "Product Not Found" |
| Network error during API call | Alert: "Error" with retry option |
| AI analysis fails | Falls back to basic analysis |
| Camera permission denied | Permission request screen |

---

## Performance Optimizations

1. **useCallback:** Memoize handlers to prevent re-renders
2. **scanned state:** Prevents multiple simultaneous scans
3. **setTimeout on reset:** Prevents immediate re-scan of same barcode
4. **Conditional onBarcodeScanned:** Pass undefined when already scanned

---

## ✅ Checklist

- [ ] Camera permission handling with clear UI
- [ ] `CameraView` with barcode scanning configured
- [ ] `ScannerOverlay` displayed over camera
- [ ] Offline-first: check DB before API
- [ ] Loading state with descriptive spinner
- [ ] `ResultModal` shows AI analysis
- [ ] Error handling with user-friendly alerts
- [ ] Reset state properly after modal close
- [ ] Performance optimized with useCallback

---

## 🔜 Next: Phase 7 - History Screen
