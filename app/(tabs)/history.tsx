import ConsumptionStats from '@/components/ConsumptionStats';
import DailySummaryCard from '@/components/DailySummaryCard';
import HistoryItem from '@/components/HistoryItem';
import PortionModal from '@/components/PortionModal';
import ResultModal from '@/components/ResultModal';
import { NutritionData, ScanResult } from '@/models/ScanResult';
import { dbService } from '@/services/DatabaseService';
import { profileService } from '@/services/ProfileService';
import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View
} from 'react-native';

type FilterMode = 'all' | 'consumed' | 'today';

export default function HistoryScreen() {
  const [history, setHistory] = useState<ScanResult[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ScanResult | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [portionModalVisible, setPortionModalVisible] = useState(false);
  const [productToConsume, setProductToConsume] = useState<ScanResult | null>(null);
  const [filterMode, setFilterMode] = useState<FilterMode>('all');
  const [dailyTotals, setDailyTotals] = useState({
    calories: 0,
    sugar: 0,
    salt: 0,
    protein: 0,
    carbs: 0,
    itemCount: 0,
  });

  /**
   * Load history from database based on filter
   */
  const loadHistory = useCallback(() => {
    // Ensure profile is loaded for daily summary calculations
    profileService.loadProfile();
    
    const data = dbService.getHistoryFiltered(filterMode);
    setHistory(data);
    
    // Always load today's totals for summary card
    const totals = dbService.getDailyTotals(new Date());
    setDailyTotals(totals);
  }, [filterMode]);

  /**
   * Refresh when screen comes into focus
   */
  useFocusEffect(
    useCallback(() => {
      loadHistory();
    }, [loadHistory])
  );

  /**
   * Pull-to-refresh handler
   */
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadHistory();
    setRefreshing(false);
  }, [loadHistory]);

  /**
   * Handle item press - show details
   */
  const handleItemPress = (item: ScanResult) => {
    setSelectedItem(item);
    setModalVisible(true);
  };

  /**
   * Close result modal
   */
  const handleCloseModal = () => {
    setModalVisible(false);
    setSelectedItem(null);
  };

  /**
   * Handle "I Ate This" button press
   */
  const handleConsumePress = (product: ScanResult) => {
    setModalVisible(false);
    setProductToConsume(product);
    setPortionModalVisible(true);
  };

  /**
   * Close portion modal
   */
  const handleClosePortionModal = () => {
    setPortionModalVisible(false);
    setProductToConsume(null);
  };

  /**
   * Confirm consumption with portion size
   */
  const handleConfirmConsumption = (portionGrams: number) => {
    if (!productToConsume) return;
    
    dbService.addConsumption(productToConsume.barcode, portionGrams);
    
    // Show confirmation
    Alert.alert(
      '✅ Added to Log',
      `${portionGrams}g of ${productToConsume.name} added to today's intake.`,
      [{ text: 'OK' }]
    );
    
    handleClosePortionModal();
    loadHistory(); // Refresh to show updated data
  };

  /**
   * Handle nutrition edit from ResultModal
   */
  const handleEditNutrition = useCallback((barcode: string, nutrition: NutritionData) => {
    dbService.updateNutrition(barcode, nutrition);
    
    // Update selected item if it's the same product
    if (selectedItem && selectedItem.barcode === barcode) {
      setSelectedItem({ ...selectedItem, nutrition: { ...selectedItem.nutrition, ...nutrition } });
    }
    
    Alert.alert(
      '✅ Nutrition Updated',
      'Your nutrition values have been saved for accurate tracking.',
      [{ text: 'OK' }]
    );
    
    loadHistory(); // Refresh to show updated data
  }, [selectedItem, loadHistory]);

  /**
   * Filter button component
   */
  const FilterButton = ({ mode, label, icon }: { mode: FilterMode; label: string; icon: keyof typeof MaterialIcons.glyphMap }) => (
    <Pressable
      style={[
        styles.filterButton,
        filterMode === mode && styles.filterButtonActive,
      ]}
      onPress={() => setFilterMode(mode)}
    >
      <MaterialIcons 
        name={icon} 
        size={16} 
        color={filterMode === mode ? '#fff' : '#666'} 
      />
      <Text style={[
        styles.filterButtonText,
        filterMode === mode && styles.filterButtonTextActive,
      ]}>
        {label}
      </Text>
    </Pressable>
  );

  /**
   * Empty state
   */
  const EmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>
        {filterMode === 'all' ? '📷' : filterMode === 'consumed' ? '🍽️' : '📅'}
      </Text>
      <Text style={styles.emptyTitle}>
        {filterMode === 'all' 
          ? 'No Scans Yet'
          : filterMode === 'consumed'
          ? 'Nothing Consumed Yet'
          : 'Nothing Consumed Today'}
      </Text>
      <Text style={styles.emptyText}>
        {filterMode === 'all'
          ? 'Scan a product barcode or take a photo of your food to see your history here.'
          : 'Scan products and tap "I Ate This" to track your intake.'}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>History</Text>
        <Text style={styles.headerSubtitle}>
          {history.length} {history.length === 1 ? 'item' : 'items'}
        </Text>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <FilterButton mode="all" label="All Scans" icon="history" />
        <FilterButton mode="today" label="Today" icon="today" />
        <FilterButton mode="consumed" label="Consumed" icon="restaurant" />
      </View>

      {/* Consumption Stats (shown for "Consumed" view with 7/30/90 day period selector) */}
      {filterMode === 'consumed' && (
        <ConsumptionStats />
      )}

      {/* Daily Summary (shown for "Today" view only) */}
      {filterMode === 'today' && (
        <DailySummaryCard totals={dailyTotals} />
      )}

      {/* History List */}
      <FlatList
        data={history}
        keyExtractor={(item) => item.barcode}
        renderItem={({ item }) => (
          <HistoryItem 
            item={item} 
            onPress={() => handleItemPress(item)}
            showConsumedBadge={filterMode === 'all'}
          />
        )}
        contentContainerStyle={
          history.length === 0 ? styles.emptyList : styles.list
        }
        ListEmptyComponent={EmptyState}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#2E7D32']}
            tintColor="#2E7D32"
          />
        }
      />

      {/* Detail Modal */}
      <ResultModal
        visible={modalVisible}
        result={selectedItem}
        onClose={handleCloseModal}
        onConsume={handleConsumePress}
        onEditNutrition={handleEditNutrition}
      />

      {/* Portion Selection Modal */}
      <PortionModal
        visible={portionModalVisible}
        product={productToConsume}
        onClose={handleClosePortionModal}
        onConfirm={handleConfirmConsumption}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    backgroundColor: '#fff',
    paddingTop: 60,
    paddingBottom: 16,
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  filterContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    gap: 8,
  },
  filterButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
    gap: 6,
  },
  filterButtonActive: {
    backgroundColor: '#2E7D32',
  },
  filterButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
  },
  filterButtonTextActive: {
    color: '#fff',
  },
  list: {
    paddingVertical: 12,
  },
  emptyList: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
});
