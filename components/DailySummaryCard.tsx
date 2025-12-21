import { MaterialIcons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { profileService } from '../services/ProfileService';

type DailyTotals = {
  calories: number;
  sugar: number;
  salt: number;
  protein: number;
  carbs: number;
  itemCount: number;
};

type Props = {
  totals: DailyTotals;
  date?: Date;
};

/**
 * Card showing daily nutrition summary
 * Only shows relevant metrics based on user's filter settings
 */
export default function DailySummaryCard({ totals, date = new Date() }: Props) {
  const profile = profileService.getCachedProfile();
  
  // Format date
  const isToday = date.toDateString() === new Date().toDateString();
  const dateLabel = isToday ? "Today's Intake" : date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  // Check if sugar is over threshold
  const sugarOverThreshold = profile.diabetesMode && totals.sugar > profile.sugarThreshold;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <MaterialIcons name="today" size={20} color="#2E7D32" />
        <Text style={styles.headerTitle}>{dateLabel}</Text>
        <Text style={styles.itemCount}>{totals.itemCount} items</Text>
      </View>

      {/* Main metrics grid */}
      <View style={styles.metricsGrid}>
        {/* Calories - always shown */}
        <View style={styles.metricItem}>
          <Text style={styles.metricEmoji}>🔥</Text>
          <Text style={styles.metricValue}>{totals.calories}</Text>
          <Text style={styles.metricLabel}>calories</Text>
        </View>

        {/* Sugar - highlighted if diabetes mode is on */}
        <View style={[
          styles.metricItem,
          sugarOverThreshold && styles.metricItemWarning
        ]}>
          <Text style={styles.metricEmoji}>🍬</Text>
          <View style={styles.metricValueRow}>
            <Text style={[
              styles.metricValue,
              sugarOverThreshold && styles.metricValueWarning
            ]}>
              {totals.sugar}g
            </Text>
            {profile.diabetesMode && (
              <Text style={[
                styles.metricThreshold,
                sugarOverThreshold && styles.metricThresholdWarning
              ]}>
                / {profile.sugarThreshold}g
              </Text>
            )}
          </View>
          <Text style={styles.metricLabel}>sugar</Text>
          {sugarOverThreshold && (
            <View style={styles.warningBadge}>
              <MaterialIcons name="warning" size={12} color="#D32F2F" />
              <Text style={styles.warningText}>Over limit</Text>
            </View>
          )}
        </View>

        {/* Protein */}
        <View style={styles.metricItem}>
          <Text style={styles.metricEmoji}>💪</Text>
          <Text style={styles.metricValue}>{totals.protein}g</Text>
          <Text style={styles.metricLabel}>protein</Text>
        </View>

        {/* Carbs */}
        <View style={styles.metricItem}>
          <Text style={styles.metricEmoji}>🍞</Text>
          <Text style={styles.metricValue}>{totals.carbs}g</Text>
          <Text style={styles.metricLabel}>carbs</Text>
        </View>
      </View>

      {/* Footer note */}
      {totals.itemCount === 0 && (
        <Text style={styles.emptyNote}>
          Scan products and tap "I Ate This" to track your intake
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F0FFF4',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#2E7D32',
  },
  itemCount: {
    fontSize: 12,
    color: '#666',
    backgroundColor: '#fff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  metricsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metricItem: {
    alignItems: 'center',
    flex: 1,
    padding: 8,
    borderRadius: 12,
  },
  metricItemWarning: {
    backgroundColor: '#FFEBEE',
  },
  metricEmoji: {
    fontSize: 20,
    marginBottom: 4,
  },
  metricValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  metricValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  metricValueWarning: {
    color: '#D32F2F',
  },
  metricThreshold: {
    fontSize: 12,
    color: '#666',
    marginLeft: 2,
  },
  metricThresholdWarning: {
    color: '#D32F2F',
  },
  metricLabel: {
    fontSize: 11,
    color: '#666',
    marginTop: 2,
  },
  warningBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 2,
  },
  warningText: {
    fontSize: 10,
    color: '#D32F2F',
    fontWeight: '600',
  },
  emptyNote: {
    fontSize: 13,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
  },
});

