import { MaterialIcons } from '@expo/vector-icons';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { dbService } from '../services/DatabaseService';

type Period = 7 | 30 | 90;

type PeriodStats = {
  avgCalories: number;
  avgSugar: number;
  avgProtein: number;
  avgCarbs: number;
  daysTracked: number;
  totalItems: number;
  // Trend vs prior period (percentage change)
  caloriesTrend: number | null;
  sugarTrend: number | null;
  proteinTrend: number | null;
  carbsTrend: number | null;
};

type Props = {
  onPeriodChange?: (period: Period) => void;
};

/**
 * Displays consumption statistics for selected period
 */
export default function ConsumptionStats({ onPeriodChange }: Props) {
  const [period, setPeriod] = useState<Period>(30);
  const [stats, setStats] = useState<PeriodStats | null>(null);
  const [loading, setLoading] = useState(true);

  // Calculate stats when period changes
  useEffect(() => {
    calculateStats(period);
  }, [period]);

  const calculateStats = useCallback((days: Period) => {
    setLoading(true);
    
    const currentStats = dbService.getPeriodStats(days);
    const priorStats = dbService.getPeriodStats(days, days); // Prior period for comparison
    
    // Calculate trends (percentage change)
    const calcTrend = (current: number, prior: number): number | null => {
      if (prior === 0) return null;
      return Math.round(((current - prior) / prior) * 100);
    };
    
    setStats({
      ...currentStats,
      caloriesTrend: calcTrend(currentStats.avgCalories, priorStats.avgCalories),
      sugarTrend: calcTrend(currentStats.avgSugar, priorStats.avgSugar),
      proteinTrend: calcTrend(currentStats.avgProtein, priorStats.avgProtein),
      carbsTrend: calcTrend(currentStats.avgCarbs, priorStats.avgCarbs),
    });
    
    setLoading(false);
  }, []);

  const handlePeriodChange = useCallback((newPeriod: Period) => {
    setPeriod(newPeriod);
    onPeriodChange?.(newPeriod);
  }, [onPeriodChange]);

  // Trend indicator component
  const TrendIndicator = ({ value }: { value: number | null }) => {
    if (value === null || value === 0) {
      return <Text style={styles.trendNeutral}>→ stable</Text>;
    }
    if (value > 0) {
      return <Text style={styles.trendUp}>↑ {value}%</Text>;
    }
    return <Text style={styles.trendDown}>↓ {Math.abs(value)}%</Text>;
  };

  if (loading || !stats) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Calculating stats...</Text>
      </View>
    );
  }

  const hasData = stats.daysTracked > 0;

  return (
    <View style={styles.container}>
      {/* Period Selector */}
      <View style={styles.periodSelector}>
        {([7, 30, 90] as Period[]).map((p) => (
          <Pressable
            key={p}
            style={[
              styles.periodButton,
              period === p && styles.periodButtonActive,
            ]}
            onPress={() => handlePeriodChange(p)}
          >
            <Text
              style={[
                styles.periodButtonText,
                period === p && styles.periodButtonTextActive,
              ]}
            >
              {p} Days
            </Text>
          </Pressable>
        ))}
      </View>

      {!hasData ? (
        <View style={styles.noDataContainer}>
          <MaterialIcons name="insert-chart" size={48} color="#CCC" />
          <Text style={styles.noDataText}>No consumption data for this period</Text>
          <Text style={styles.noDataSubtext}>
            Scan products and tap "I Ate This" to start tracking
          </Text>
        </View>
      ) : (
        <>
          {/* Header */}
          <View style={styles.header}>
            <MaterialIcons name="insights" size={20} color="#2E7D32" />
            <Text style={styles.headerTitle}>Your {period}-Day Averages</Text>
          </View>

          {/* Stats Grid */}
          <View style={styles.statsGrid}>
            {/* Calories */}
            <View style={styles.statCard}>
              <Text style={styles.statEmoji}>🔥</Text>
              <Text style={styles.statLabel}>Daily Calories</Text>
              <Text style={styles.statValue}>{stats.avgCalories}</Text>
              <TrendIndicator value={stats.caloriesTrend} />
            </View>

            {/* Sugar */}
            <View style={styles.statCard}>
              <Text style={styles.statEmoji}>🍬</Text>
              <Text style={styles.statLabel}>Daily Sugar</Text>
              <Text style={styles.statValue}>{stats.avgSugar}g</Text>
              <TrendIndicator value={stats.sugarTrend} />
            </View>

            {/* Protein */}
            <View style={styles.statCard}>
              <Text style={styles.statEmoji}>💪</Text>
              <Text style={styles.statLabel}>Daily Protein</Text>
              <Text style={styles.statValue}>{stats.avgProtein}g</Text>
              <TrendIndicator value={stats.proteinTrend} />
            </View>

            {/* Carbs */}
            <View style={styles.statCard}>
              <Text style={styles.statEmoji}>🍞</Text>
              <Text style={styles.statLabel}>Daily Carbs</Text>
              <Text style={styles.statValue}>{stats.avgCarbs}g</Text>
              <TrendIndicator value={stats.carbsTrend} />
            </View>
          </View>

          {/* Activity Summary */}
          <View style={styles.activityRow}>
            <View style={styles.activityItem}>
              <MaterialIcons name="event-available" size={16} color="#666" />
              <Text style={styles.activityText}>
                {stats.daysTracked}/{period} days tracked
              </Text>
            </View>
            <View style={styles.activityItem}>
              <MaterialIcons name="restaurant" size={16} color="#666" />
              <Text style={styles.activityText}>
                {stats.totalItems} items logged
              </Text>
            </View>
          </View>

          {/* Comparison note */}
          <Text style={styles.comparisonNote}>
            Trends compared to prior {period} days
          </Text>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  loadingText: {
    textAlign: 'center',
    color: '#666',
    padding: 20,
  },
  periodSelector: {
    flexDirection: 'row',
    backgroundColor: '#F0F0F0',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  periodButtonActive: {
    backgroundColor: '#2E7D32',
  },
  periodButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  periodButtonTextActive: {
    color: '#fff',
  },
  noDataContainer: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  noDataText: {
    fontSize: 16,
    color: '#666',
    marginTop: 12,
    fontWeight: '500',
  },
  noDataSubtext: {
    fontSize: 13,
    color: '#999',
    marginTop: 4,
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2E7D32',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    width: '47%',
    backgroundColor: '#F8FFF8',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E8F5E9',
  },
  statEmoji: {
    fontSize: 24,
    marginBottom: 6,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  trendUp: {
    fontSize: 12,
    color: '#E65100',
    fontWeight: '500',
  },
  trendDown: {
    fontSize: 12,
    color: '#2E7D32',
    fontWeight: '500',
  },
  trendNeutral: {
    fontSize: 12,
    color: '#999',
    fontWeight: '500',
  },
  activityRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  activityText: {
    fontSize: 13,
    color: '#666',
  },
  comparisonNote: {
    fontSize: 11,
    color: '#999',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

