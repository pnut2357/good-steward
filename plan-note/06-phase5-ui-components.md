# Phase 5: UI Components (Refined)

## 🎯 Goal
Create reusable UI components for the scanner experience, inspired by Yuka app design patterns.

---

## Component 5.1: ScannerOverlay

**File:** `components/ScannerOverlay.tsx`

Visual overlay with green corner brackets for the scan frame. This is a common pattern in barcode scanner apps like Yuka.

```typescript
import { View, StyleSheet, Dimensions, Text } from 'react-native';

const { width } = Dimensions.get('window');
const FRAME_SIZE = width * 0.7; // 70% of screen width
const CORNER_SIZE = 40;
const CORNER_WIDTH = 4;
const CORNER_COLOR = '#2E7D32'; // Emerald Green

/**
 * Scanner overlay component
 * Displays green corner brackets to guide barcode placement
 */
export default function ScannerOverlay() {
  return (
    <View style={styles.container}>
      {/* Dark overlay outside the scan area */}
      <View style={styles.topOverlay} />
      
      <View style={styles.middleRow}>
        <View style={styles.sideOverlay} />
        
        {/* Scan frame with corners */}
        <View style={styles.frame}>
          {/* Top Left Corner */}
          <View style={[styles.corner, styles.topLeft]} />
          {/* Top Right Corner */}
          <View style={[styles.corner, styles.topRight]} />
          {/* Bottom Left Corner */}
          <View style={[styles.corner, styles.bottomLeft]} />
          {/* Bottom Right Corner */}
          <View style={[styles.corner, styles.bottomRight]} />
        </View>
        
        <View style={styles.sideOverlay} />
      </View>
      
      <View style={styles.bottomOverlay} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
  },
  
  // Dark overlays
  topOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  middleRow: {
    flexDirection: 'row',
  },
  sideOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  bottomOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  
  // Scan frame
  frame: {
    width: FRAME_SIZE,
    height: FRAME_SIZE,
    position: 'relative',
  },
  
  // Corners
  corner: {
    position: 'absolute',
    width: CORNER_SIZE,
    height: CORNER_SIZE,
    borderColor: CORNER_COLOR,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderLeftWidth: CORNER_WIDTH,
    borderTopWidth: CORNER_WIDTH,
    borderTopLeftRadius: 8,
  },
  topRight: {
    top: 0,
    right: 0,
    borderRightWidth: CORNER_WIDTH,
    borderTopWidth: CORNER_WIDTH,
    borderTopRightRadius: 8,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderLeftWidth: CORNER_WIDTH,
    borderBottomWidth: CORNER_WIDTH,
    borderBottomLeftRadius: 8,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderRightWidth: CORNER_WIDTH,
    borderBottomWidth: CORNER_WIDTH,
    borderBottomRightRadius: 8,
  },
});
```

### Design Rationale
- **70% frame size:** Provides enough space for various barcode sizes
- **Corner brackets:** Industry-standard scanner UI pattern
- **Dark overlay:** Focuses attention on the scan area
- **Rounded corners:** Softer, more modern appearance

---

## Component 5.2: ResultModal

**File:** `components/ResultModal.tsx`

Popup showing the AI analysis result. Slides up from bottom with clear safety indicator.

```typescript
import { 
  Modal, 
  View, 
  Text, 
  Pressable, 
  StyleSheet, 
  ScrollView,
  SafeAreaView 
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { ScanResult } from '../models/ScanResult';

type Props = {
  visible: boolean;
  result: ScanResult | null;
  onClose: () => void;
};

const SAFE_COLOR = '#2E7D32';    // Emerald Green
const CAUTION_COLOR = '#F57C00'; // Orange

export default function ResultModal({ visible, result, onClose }: Props) {
  if (!result) return null;

  const statusColor = result.isSafe ? SAFE_COLOR : CAUTION_COLOR;
  const statusIcon = result.isSafe ? 'check-circle' : 'warning';
  const statusText = result.isSafe ? 'Good Choice!' : 'Use Caution';

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <SafeAreaView>
            {/* Handle bar */}
            <View style={styles.handleBar} />
            
            {/* Header with status */}
            <View style={styles.header}>
              <MaterialIcons
                name={statusIcon}
                size={56}
                color={statusColor}
              />
              <Text style={[styles.statusText, { color: statusColor }]}>
                {statusText}
              </Text>
            </View>

            {/* Product name */}
            <Text style={styles.productName}>{result.name}</Text>
            
            {/* Barcode */}
            <Text style={styles.barcode}>{result.barcode}</Text>

            {/* AI Summary */}
            <View style={styles.summaryBox}>
              <View style={styles.summaryHeader}>
                <MaterialIcons name="psychology" size={20} color="#666" />
                <Text style={styles.summaryTitle}>AI Analysis</Text>
              </View>
              <Text style={styles.summaryText}>{result.summary}</Text>
            </View>

            {/* Ingredients (scrollable) */}
            <View style={styles.ingredientsContainer}>
              <View style={styles.ingredientsHeader}>
                <MaterialIcons name="list" size={20} color="#666" />
                <Text style={styles.ingredientsTitle}>Ingredients</Text>
              </View>
              <ScrollView style={styles.ingredientsScroll}>
                <Text style={styles.ingredientsText}>
                  {result.ingredients || 'No ingredients listed'}
                </Text>
              </ScrollView>
            </View>

            {/* Close Button */}
            <Pressable 
              style={[styles.closeButton, { backgroundColor: statusColor }]} 
              onPress={onClose}
            >
              <Text style={styles.closeButtonText}>Done</Text>
            </Pressable>
          </SafeAreaView>
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
    paddingHorizontal: 24,
    paddingBottom: 24,
    maxHeight: '85%',
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
    alignItems: 'center',
    paddingVertical: 16,
  },
  statusText: {
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 8,
  },
  productName: {
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
    color: '#333',
    marginBottom: 4,
  },
  barcode: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginBottom: 20,
  },
  summaryBox: {
    backgroundColor: '#F8F8F8',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginLeft: 8,
  },
  summaryText: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
  },
  ingredientsContainer: {
    marginBottom: 20,
  },
  ingredientsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  ingredientsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginLeft: 8,
  },
  ingredientsScroll: {
    maxHeight: 100,
    backgroundColor: '#F8F8F8',
    padding: 12,
    borderRadius: 8,
  },
  ingredientsText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  closeButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});
```

### Design Features
- **Slide animation:** Feels natural on mobile
- **Handle bar:** Visual affordance for drag-to-close
- **Large status icon:** Immediately clear if safe or not
- **AI section:** Prominent placement for the analysis
- **Scrollable ingredients:** Handles long ingredient lists
- **Color-coded button:** Matches status for visual consistency

---

## Component 5.3: HistoryItem

**File:** `components/HistoryItem.tsx`

Single row in the history list with visual safety indicator.

```typescript
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { ScanResult } from '../models/ScanResult';

type Props = {
  item: ScanResult;
  onPress: () => void;
};

const SAFE_COLOR = '#2E7D32';
const CAUTION_COLOR = '#F57C00';

export default function HistoryItem({ item, onPress }: Props) {
  // Format date nicely
  const date = new Date(item.timestamp);
  const formattedDate = date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
  const formattedTime = date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit'
  });

  const statusColor = item.isSafe ? SAFE_COLOR : CAUTION_COLOR;
  const statusIcon = item.isSafe ? 'check-circle' : 'warning';

  return (
    <Pressable 
      style={({ pressed }) => [
        styles.container,
        pressed && styles.pressed
      ]} 
      onPress={onPress}
    >
      {/* Color indicator bar */}
      <View style={[styles.indicator, { backgroundColor: statusColor }]} />
      
      {/* Product info */}
      <View style={styles.content}>
        <Text style={styles.name} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={styles.date}>
          {formattedDate} at {formattedTime}
        </Text>
      </View>

      {/* Status icon */}
      <MaterialIcons
        name={statusIcon}
        size={24}
        color={statusColor}
      />

      {/* Chevron */}
      <MaterialIcons 
        name="chevron-right" 
        size={24} 
        color="#CCC" 
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 12,
    // Shadow for iOS
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    // Elevation for Android
    elevation: 2,
  },
  pressed: {
    backgroundColor: '#F5F5F5',
    opacity: 0.9,
  },
  indicator: {
    width: 4,
    height: 44,
    borderRadius: 2,
    marginRight: 12,
  },
  content: {
    flex: 1,
    marginRight: 12,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  date: {
    fontSize: 12,
    color: '#999',
  },
});
```

### Design Features
- **Color bar:** Quick visual indicator of safety
- **Press feedback:** Slight opacity change on press
- **Truncation:** Long product names don't break layout
- **Formatted date:** Human-readable timestamp
- **Card style:** Shadow/elevation for depth

---

## Color Constants

Consider creating a shared colors file for consistency:

**File:** `constants/colors.ts` (optional)

```typescript
export const Colors = {
  primary: '#2E7D32',     // Emerald Green (safe)
  secondary: '#F57C00',   // Orange (caution)
  danger: '#D32F2F',      // Red (avoid)
  background: '#FFFFFF',
  surface: '#F5F5F5',
  textPrimary: '#212121',
  textSecondary: '#757575',
  border: '#E0E0E0',
};
```

---

## ✅ Checklist

- [ ] Created `components/ScannerOverlay.tsx`
  - [ ] Corner brackets styled
  - [ ] Dark overlay outside frame
  - [ ] Responsive to screen width
- [ ] Created `components/ResultModal.tsx`
  - [ ] Slide animation
  - [ ] Status icon and text
  - [ ] AI summary section
  - [ ] Scrollable ingredients
  - [ ] Close button
- [ ] Created `components/HistoryItem.tsx`
  - [ ] Color indicator bar
  - [ ] Product name (truncated)
  - [ ] Formatted date/time
  - [ ] Press feedback
- [ ] All components use consistent colors

---

## 🔜 Next: Phase 6 - Scanner Screen
