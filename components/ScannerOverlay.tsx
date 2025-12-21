import { Dimensions, StyleSheet, View } from 'react-native';

const { width } = Dimensions.get('window');
const FRAME_SIZE = width * 0.7;
const CORNER_SIZE = 40;
const CORNER_WIDTH = 4;
const CORNER_COLOR = '#2E7D32';

/**
 * Scanner overlay component for BARCODE mode
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
          <View style={[styles.corner, styles.topLeft]} />
          <View style={[styles.corner, styles.topRight]} />
          <View style={[styles.corner, styles.bottomLeft]} />
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
  frame: {
    width: FRAME_SIZE,
    height: FRAME_SIZE,
    position: 'relative',
  },
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

