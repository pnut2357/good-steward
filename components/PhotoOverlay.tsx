import { MaterialIcons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

type Props = {
  onCapture: () => void;
  disabled?: boolean;
};

/**
 * Camera overlay for PHOTO mode
 * Shows capture button and guide text
 */
export default function PhotoOverlay({ onCapture, disabled }: Props) {
  return (
    <View style={styles.container}>
      {/* Top guide text */}
      <View style={styles.guideContainer}>
        <Text style={styles.guideText}>
          Center the food in frame
        </Text>
      </View>
      
      {/* Capture button at bottom */}
      <View style={styles.captureContainer}>
        <Pressable 
          style={({ pressed }) => [
            styles.captureButton,
            disabled && styles.disabled,
            pressed && styles.pressed
          ]}
          onPress={onCapture}
          disabled={disabled}
        >
          <View style={styles.captureInner}>
            <MaterialIcons name="camera" size={36} color="#fff" />
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
  guideContainer: {
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
    paddingBottom: 20,
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
  pressed: {
    transform: [{ scale: 0.95 }],
  },
  captureText: {
    color: '#fff',
    fontSize: 14,
    marginTop: 12,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 12,
  },
});

