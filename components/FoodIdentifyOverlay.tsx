import { MaterialIcons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

type Props = {
  onCapture: () => void;
  disabled: boolean;
  isAvailable: boolean;
};

/**
 * Overlay for Food Identify mode
 * Shows instructions and capture button
 */
export default function FoodIdentifyOverlay({ onCapture, disabled, isAvailable }: Props) {
  return (
    <View style={styles.container}>
      {/* Instructions */}
      <View style={styles.instructions}>
        <MaterialIcons name="restaurant" size={32} color="#fff" />
        <Text style={styles.title}>Identify Food</Text>
        <Text style={styles.subtitle}>
          Point camera at your food to identify it
        </Text>
        {!isAvailable && (
          <View style={styles.warningBox}>
            <MaterialIcons name="warning" size={16} color="#FFA000" />
            <Text style={styles.warningText}>
              Requires development build (not Expo Go)
            </Text>
          </View>
        )}
      </View>

      {/* Capture button */}
      <Pressable
        style={({ pressed }) => [
          styles.captureButton,
          { opacity: pressed || disabled || !isAvailable ? 0.6 : 1 }
        ]}
        onPress={onCapture}
        disabled={disabled || !isAvailable}
      >
        <MaterialIcons name="restaurant" size={40} color="#fff" />
        <Text style={styles.captureText}>
          {isAvailable ? 'Identify' : 'Unavailable'}
        </Text>
      </Pressable>

      {/* Info footer */}
      <View style={styles.footer}>
        <MaterialIcons name="info-outline" size={14} color="rgba(255,255,255,0.7)" />
        <Text style={styles.footerText}>
          AI identifies 101 food types with nutrition estimates
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 60,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  instructions: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingVertical: 20,
    paddingHorizontal: 30,
    borderRadius: 16,
    gap: 8,
  },
  title: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
  },
  subtitle: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    textAlign: 'center',
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,160,0,0.2)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginTop: 8,
    gap: 6,
  },
  warningText: {
    color: '#FFA000',
    fontSize: 12,
    fontWeight: '500',
  },
  captureButton: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#E65100',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  captureText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 2,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  footerText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
  },
});




