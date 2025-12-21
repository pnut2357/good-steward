import { MaterialIcons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

type Mode = 'barcode' | 'photo';

type Props = {
  mode: Mode;
  onModeChange: (mode: Mode) => void;
};

/**
 * Toggle between Barcode and Photo scanning modes
 */
export default function ModeToggle({ mode, onModeChange }: Props) {
  return (
    <View style={styles.container}>
      <Pressable 
        style={[styles.button, mode === 'barcode' && styles.active]}
        onPress={() => onModeChange('barcode')}
      >
        <MaterialIcons 
          name="qr-code-scanner" 
          size={20} 
          color={mode === 'barcode' ? '#fff' : '#666'} 
        />
        <Text style={[styles.text, mode === 'barcode' && styles.activeText]}>
          Barcode
        </Text>
      </Pressable>
      
      <Pressable 
        style={[styles.button, mode === 'photo' && styles.active]}
        onPress={() => onModeChange('photo')}
      >
        <MaterialIcons 
          name="camera-alt" 
          size={20} 
          color={mode === 'photo' ? '#fff' : '#666'} 
        />
        <Text style={[styles.text, mode === 'photo' && styles.activeText]}>
          Photo
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 25,
    padding: 4,
    marginHorizontal: 60,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 21,
    gap: 6,
  },
  active: {
    backgroundColor: '#2E7D32',
  },
  text: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  activeText: {
    color: '#fff',
  },
});

