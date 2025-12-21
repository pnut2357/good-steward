import { MaterialIcons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { UserWarning, WarningLevel } from '../services/UserFilterService';

type Props = {
  warning: UserWarning;
};

/**
 * Warning colors by level
 */
const COLORS: Record<WarningLevel, { bg: string; border: string; text: string; icon: string }> = {
  danger: {
    bg: '#FFEBEE',
    border: '#EF5350',
    text: '#C62828',
    icon: '#D32F2F',
  },
  warning: {
    bg: '#FFF3E0',
    border: '#FFB74D',
    text: '#E65100',
    icon: '#F57C00',
  },
  info: {
    bg: '#E3F2FD',
    border: '#64B5F6',
    text: '#1565C0',
    icon: '#1976D2',
  },
};

/**
 * Icons by level
 */
const ICONS: Record<WarningLevel, keyof typeof MaterialIcons.glyphMap> = {
  danger: 'error',
  warning: 'warning',
  info: 'info',
};

/**
 * Displays a user-triggered warning
 * 
 * LEGAL: Clearly shows this is based on USER's settings
 */
export default function WarningCard({ warning }: Props) {
  const colors = COLORS[warning.level];
  const icon = ICONS[warning.level];

  return (
    <View style={[styles.container, { backgroundColor: colors.bg, borderColor: colors.border }]}>
      <View style={styles.header}>
        <Text style={styles.emoji}>{warning.emoji}</Text>
        <View style={styles.titleContainer}>
          <Text style={[styles.title, { color: colors.text }]}>
            YOUR FILTER FLAGGED THIS
          </Text>
          <Text style={[styles.mode, { color: colors.text }]}>
            {getModeLabel(warning.mode)}
          </Text>
        </View>
        <MaterialIcons name={icon} size={24} color={colors.icon} />
      </View>
      
      <Text style={[styles.message, { color: colors.text }]}>
        {warning.message}
      </Text>
      
      <View style={styles.details}>
        <Text style={styles.fact}>
          <Text style={styles.factLabel}>Found: </Text>
          {warning.fact}
        </Text>
        <Text style={styles.threshold}>
          <Text style={styles.thresholdLabel}>Setting: </Text>
          {warning.threshold}
        </Text>
      </View>
    </View>
  );
}

/**
 * Get human-readable label for warning mode
 */
function getModeLabel(mode: string): string {
  const labels: Record<string, string> = {
    sugar: 'Sugar Filter',
    pregnancy: 'Pregnancy Filter',
    allergy: 'Allergen Alert',
    trace: 'Trace Alert',
  };
  return labels[mode] || mode;
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  emoji: {
    fontSize: 20,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  mode: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 2,
  },
  message: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 10,
    lineHeight: 20,
  },
  details: {
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 8,
    padding: 10,
  },
  fact: {
    fontSize: 13,
    color: '#444',
    marginBottom: 4,
  },
  factLabel: {
    fontWeight: '600',
  },
  threshold: {
    fontSize: 12,
    color: '#666',
  },
  thresholdLabel: {
    fontWeight: '600',
  },
});

