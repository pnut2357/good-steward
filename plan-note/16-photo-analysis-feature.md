# 📸 Food Photo Analysis Feature

## 🎯 Goal
Enable users to analyze food by taking a photo - perfect for:
- Fresh produce (no barcode)
- Restaurant meals
- Homemade food
- Bulk items
- International foods without barcodes

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   INPUT METHODS                         │
│                                                         │
│  ┌─────────────┐        ┌─────────────┐                │
│  │  📷 Barcode │        │  🍕 Photo   │                │
│  │   Scanner   │        │   Capture   │                │
│  └──────┬──────┘        └──────┬──────┘                │
│         │                       │                       │
│         ▼                       ▼                       │
│  ┌─────────────┐        ┌─────────────┐                │
│  │OpenFoodFacts│        │ Groq Vision │                │
│  │   (text)    │        │   (image)   │                │
│  └──────┬──────┘        └──────┬──────┘                │
│         │                       │                       │
│         └───────────┬───────────┘                       │
│                     ▼                                   │
│              ┌─────────────┐                           │
│              │   Result    │                           │
│              │   Modal     │                           │
│              └─────────────┘                           │
└─────────────────────────────────────────────────────────┘
```

---

## 🤖 Groq Vision Model

Groq supports vision models that can analyze food photos:

| Model | Speed | Quality | Free Tier |
|-------|-------|---------|-----------|
| `llama-3.2-11b-vision-preview` | ⚡ Fast | Good | ✅ Yes |
| `llama-3.2-90b-vision-preview` | Medium | Better | ✅ Yes |

**Recommendation:** Use `llama-3.2-11b-vision-preview` for speed

---

## 📱 Updated UI Flow

### Scanner Screen with Dual Input

```typescript
// app/(tabs)/index.tsx
export default function ScannerScreen() {
  const [mode, setMode] = useState<'barcode' | 'photo'>('barcode');
  
  return (
    <View style={styles.container}>
      {/* Mode Toggle */}
      <View style={styles.modeToggle}>
        <Pressable 
          style={[styles.modeButton, mode === 'barcode' && styles.modeActive]}
          onPress={() => setMode('barcode')}
        >
          <MaterialIcons name="qr-code-scanner" size={24} />
          <Text>Barcode</Text>
        </Pressable>
        <Pressable 
          style={[styles.modeButton, mode === 'photo' && styles.modeActive]}
          onPress={() => setMode('photo')}
        >
          <MaterialIcons name="camera-alt" size={24} />
          <Text>Photo</Text>
        </Pressable>
      </View>
      
      {/* Camera View */}
      <CameraView
        style={styles.camera}
        facing="back"
        barcodeScannerSettings={mode === 'barcode' ? {
          barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e'],
        } : undefined}
        onBarcodeScanned={mode === 'barcode' ? handleBarCodeScanned : undefined}
      />
      
      {/* Overlay based on mode */}
      {mode === 'barcode' ? (
        <ScannerOverlay />
      ) : (
        <PhotoOverlay onCapture={handlePhotoCapture} />
      )}
      
      {/* ... rest of component */}
    </View>
  );
}
```

---

## 📸 Photo Capture Component

**File:** `components/PhotoOverlay.tsx`

```typescript
import { View, Pressable, Text, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

type Props = {
  onCapture: () => void;
  disabled?: boolean;
};

export default function PhotoOverlay({ onCapture, disabled }: Props) {
  return (
    <View style={styles.container}>
      {/* Frame guides */}
      <View style={styles.frameGuide}>
        <Text style={styles.guideText}>
          Center the food in frame
        </Text>
      </View>
      
      {/* Capture button */}
      <View style={styles.captureContainer}>
        <Pressable 
          style={[styles.captureButton, disabled && styles.disabled]}
          onPress={onCapture}
          disabled={disabled}
        >
          <View style={styles.captureInner}>
            <MaterialIcons name="camera" size={32} color="#fff" />
          </View>
        </Pressable>
        <Text style={styles.captureText}>Tap to analyze</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
    paddingVertical: 60,
  },
  frameGuide: {
    alignItems: 'center',
    paddingTop: 20,
  },
  guideText: {
    color: '#fff',
    fontSize: 16,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  captureContainer: {
    alignItems: 'center',
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#fff',
  },
  captureInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#2E7D32',
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabled: {
    opacity: 0.5,
  },
  captureText: {
    color: '#fff',
    fontSize: 14,
    marginTop: 12,
  },
});
```

---

## 🔧 Updated AnalysisService

**File:** `services/AnalysisService.ts`

```typescript
import Groq from 'groq-sdk';
import axios from 'axios';
import * as FileSystem from 'expo-file-system';
import { ScanResult } from '../models/ScanResult';

export class AnalysisService {
  private groq: Groq | null = null;
  private static instance: AnalysisService | null = null;

  // ... existing constructor and methods ...

  /**
   * Analyze food from a photo using Groq Vision
   * @param photoUri - Local URI of the captured photo
   */
  public async analyzePhoto(photoUri: string): Promise<ScanResult | null> {
    if (!this.groq) {
      console.log('Groq not available for photo analysis');
      return null;
    }

    try {
      // Step 1: Convert image to base64
      const base64Image = await FileSystem.readAsStringAsync(photoUri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Step 2: Send to Groq Vision model
      const response = await this.groq.chat.completions.create({
        model: 'llama-3.2-11b-vision-preview',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `You are a nutrition expert analyzing a food photo.

Identify the food and provide a health assessment.

Respond ONLY with valid JSON:
{
  "name": "Food name/description",
  "ingredients": "Likely ingredients or components",
  "summary": "1-2 sentence health assessment",
  "isSafe": true or false
}

Consider:
- Nutritional value
- Processing level
- Portion size visible
- Any health concerns

Set isSafe=false if the food appears unhealthy (fried, high sugar, processed, large portions).`
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/jpeg;base64,${base64Image}`
                }
              }
            ]
          }
        ],
        response_format: { type: 'json_object' },
        max_tokens: 300,
        temperature: 0.3,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) throw new Error('Empty vision response');

      const parsed = JSON.parse(content);

      // Generate a unique ID for photo-based scans
      const photoId = `photo_${Date.now()}`;

      return {
        barcode: photoId,
        name: parsed.name || 'Unknown Food',
        ingredients: parsed.ingredients || 'Unable to determine ingredients',
        summary: parsed.summary || 'Unable to analyze',
        isSafe: parsed.isSafe ?? true,
        timestamp: new Date().toISOString(),
      };

    } catch (error) {
      console.error('Photo analysis failed:', error);
      return null;
    }
  }

  /**
   * Check if vision analysis is available
   */
  public isVisionAvailable(): boolean {
    return this.groq !== null;
  }
}
```

---

## 📊 Updated Data Model

**File:** `models/ScanResult.ts`

```typescript
export interface ScanResult {
  /** 
   * Product barcode OR photo ID (photo_timestamp)
   * Photo IDs start with "photo_"
   */
  barcode: string;
  
  name: string;
  ingredients: string;
  summary: string;
  isSafe: boolean;
  timestamp: string;
  
  /**
   * Optional: Source of the scan
   */
  source?: 'barcode' | 'photo';
  
  /**
   * Optional: Photo URI for display
   */
  photoUri?: string;
}
```

---

## 🖼️ Photo Capture Handler

```typescript
// In ScannerScreen
const cameraRef = useRef<CameraView>(null);

const handlePhotoCapture = async () => {
  if (!cameraRef.current || loading) return;
  
  setLoading(true);
  setLoadingMessage('Taking photo...');
  
  try {
    // Capture photo
    const photo = await cameraRef.current.takePictureAsync({
      quality: 0.7, // Balance quality vs size
      base64: false,
    });
    
    if (!photo?.uri) {
      throw new Error('Failed to capture photo');
    }
    
    // Analyze with vision AI
    setLoadingMessage('Analyzing food...');
    const result = await analysisService.analyzePhoto(photo.uri);
    
    if (result) {
      // Add photo URI for display
      result.photoUri = photo.uri;
      result.source = 'photo';
      
      // Save to history
      dbService.saveScan(result);
      
      setResult(result);
      setModalVisible(true);
    } else {
      Alert.alert(
        'Analysis Failed',
        'Could not analyze the food. Please try again with a clearer photo.',
        [{ text: 'OK' }]
      );
    }
  } catch (error) {
    console.error('Photo capture error:', error);
    Alert.alert('Error', 'Failed to capture photo. Please try again.');
  } finally {
    setLoading(false);
  }
};
```

---

## 💰 Cost Impact

| Feature | API | Cost |
|---------|-----|------|
| Barcode scan | OpenFoodFacts + Groq Text | FREE |
| Photo scan | Groq Vision | FREE |

**Vision model uses same FREE Groq tier!**

---

## ⚡ Latency Expectations

| Operation | Expected Time |
|-----------|---------------|
| Photo capture | ~200ms |
| Base64 encoding | ~100ms |
| Groq Vision analysis | 1-3s |
| **Total** | **~2-4 seconds** |

**Still fast thanks to Groq's infrastructure!**

---

## 📱 Updated Tab Icon

Update the scanner tab to reflect dual functionality:

```typescript
// app/(tabs)/_layout.tsx
<Tabs.Screen
  name="index"
  options={{
    title: 'Scan',
    tabBarIcon: ({ color, size }) => (
      <MaterialIcons name="document-scanner" size={size} color={color} />
    ),
  }}
/>
```

---

## 🎨 UI Mockup

```
┌─────────────────────────────────────┐
│  ┌──────────────────────────────┐   │
│  │  [Barcode]  │  [📷 Photo]   │   │  ← Mode toggle
│  └──────────────────────────────┘   │
│                                     │
│  ┌──────────────────────────────┐   │
│  │                              │   │
│  │                              │   │
│  │      Camera Preview          │   │
│  │                              │   │
│  │                              │   │
│  └──────────────────────────────┘   │
│                                     │
│       "Center the food"             │
│                                     │
│           ┌────────┐                │
│           │   📷   │                │  ← Capture button
│           └────────┘                │
│         "Tap to analyze"            │
│                                     │
└─────────────────────────────────────┘
```

---

## ✅ Implementation Checklist

### New Components
- [ ] `components/PhotoOverlay.tsx` - Photo mode UI
- [ ] `components/ModeToggle.tsx` - Barcode/Photo switcher

### Service Updates
- [ ] Add `analyzePhoto()` to AnalysisService
- [ ] Add `expo-file-system` for base64 encoding
- [ ] Handle vision model responses

### Screen Updates
- [ ] Add mode toggle to Scanner screen
- [ ] Add camera ref for photo capture
- [ ] Handle photo capture flow
- [ ] Update loading messages

### Data Updates
- [ ] Add `source` and `photoUri` to ScanResult
- [ ] Update database schema (optional)

---

## 🔜 Phase Integration

Add this to **Phase 6 (Scanner Screen)** as an enhancement:

```
Phase 6: Scanner Screen
├── 6.1: Basic barcode scanning ✓
├── 6.2: Photo capture mode (NEW)
├── 6.3: Mode toggle UI (NEW)
└── 6.4: Vision analysis integration (NEW)
```

---

## 📦 Additional Dependencies

```bash
# For image handling (may already be installed)
npx expo install expo-file-system
```

---

*Photo Analysis Feature - December 2024*

