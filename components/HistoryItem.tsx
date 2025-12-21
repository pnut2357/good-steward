import { MaterialIcons } from '@expo/vector-icons';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { ScanResult, formatNutriscore, isPhotoScan, wasConsumedToday } from '../models/ScanResult';

type Props = {
  item: ScanResult;
  onPress: () => void;
  showConsumedBadge?: boolean;
};

/**
 * Single item in the scan history list
 * Shows factual data only - no health judgments
 */
export default function HistoryItem({ item, onPress, showConsumedBadge = false }: Props) {
  const date = new Date(item.timestamp);
  const formattedDate = date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
  const formattedTime = date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });

  const isPhoto = isPhotoScan(item);
  const nutriscore = item.nutrition?.nutriscore;
  const consumedToday = wasConsumedToday(item);
  
  // Get most recent consumption info
  const lastConsumption = item.consumptions?.[0];
  const consumedInfo = lastConsumption 
    ? `${lastConsumption.portionGrams}g • ${lastConsumption.portionNutrition.calories || 0} cal`
    : null;

  return (
    <Pressable 
      style={({ pressed }) => [
        styles.container,
        pressed && styles.pressed
      ]} 
      onPress={onPress}
    >
      {/* Photo thumbnail or icon */}
      {isPhoto && item.photoUri ? (
        <Image 
          source={{ uri: item.photoUri }} 
          style={styles.thumbnail}
        />
      ) : (
        <View style={styles.iconContainer}>
          <MaterialIcons name="fastfood" size={24} color="#666" />
        </View>
      )}
      
      {/* Product info */}
      <View style={styles.content}>
        <View style={styles.nameRow}>
          <Text style={styles.name} numberOfLines={1}>
            {item.name}
          </Text>
          {/* Consumed today badge */}
          {showConsumedBadge && consumedToday && (
            <View style={styles.consumedBadge}>
              <MaterialIcons name="check" size={12} color="#2E7D32" />
            </View>
          )}
        </View>
        
        {/* Show consumption info if consumed, otherwise show scan date */}
        {consumedInfo ? (
          <View style={styles.metaRow}>
            <MaterialIcons name="restaurant" size={12} color="#2E7D32" />
            <Text style={styles.consumedText}>{consumedInfo}</Text>
          </View>
        ) : (
          <View style={styles.metaRow}>
            <MaterialIcons 
              name={isPhoto ? 'camera-alt' : 'qr-code'} 
              size={12} 
              color="#999" 
            />
            <Text style={styles.date}>
              {formattedDate} at {formattedTime}
            </Text>
          </View>
        )}
      </View>

      {/* Nutriscore badge (factual, official rating) */}
      {nutriscore && (
        <View style={[
          styles.nutriscoreBadge,
          { backgroundColor: getNutriscoreColor(nutriscore) }
        ]}>
          <Text style={styles.nutriscoreText}>
            {formatNutriscore(nutriscore)}
          </Text>
        </View>
      )}

      {/* Chevron */}
      <MaterialIcons 
        name="chevron-right" 
        size={24} 
        color="#CCC" 
      />
    </Pressable>
  );
}

/**
 * Get color for Nutriscore badge
 */
function getNutriscoreColor(grade?: string): string {
  const colors: Record<string, string> = {
    'a': '#038141',
    'b': '#85BB2F',
    'c': '#FECB02',
    'd': '#EE8100',
    'e': '#E63E11',
  };
  return colors[grade?.toLowerCase() || ''] || '#999';
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  pressed: {
    backgroundColor: '#F5F5F5',
    opacity: 0.9,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  thumbnail: {
    width: 44,
    height: 44,
    borderRadius: 8,
    marginRight: 12,
    backgroundColor: '#f0f0f0',
  },
  content: {
    flex: 1,
    marginRight: 12,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
    flex: 1,
  },
  consumedBadge: {
    backgroundColor: '#E8F5E9',
    borderRadius: 10,
    padding: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  date: {
    fontSize: 12,
    color: '#999',
  },
  consumedText: {
    fontSize: 12,
    color: '#2E7D32',
    fontWeight: '500',
  },
  nutriscoreBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: 8,
  },
  nutriscoreText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
  },
});
