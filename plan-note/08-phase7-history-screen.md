# Phase 7: History Screen

## 🎯 Goal
Build a screen to display all past scans with pull-to-refresh.

---

## File: `app/(tabs)/history.tsx`

```typescript
import { useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  StyleSheet, 
  RefreshControl 
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import HistoryItem from '@/components/HistoryItem';
import ResultModal from '@/components/ResultModal';
import { dbService } from '@/services/DatabaseService';
import { ScanResult } from '@/models/ScanResult';

export default function HistoryScreen() {
  const [history, setHistory] = useState<ScanResult[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ScanResult | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  /**
   * Load history from database
   */
  const loadHistory = useCallback(() => {
    const data = dbService.getHistory();
    setHistory(data);
  }, []);

  /**
   * Refresh when screen comes into focus
   * (e.g., after scanning a new item)
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
   * Close detail modal
   */
  const handleCloseModal = () => {
    setModalVisible(false);
    setSelectedItem(null);
  };

  /**
   * Empty state component
   */
  const EmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>📷</Text>
      <Text style={styles.emptyTitle}>No Scans Yet</Text>
      <Text style={styles.emptyText}>
        Scan a product barcode to see your history here.
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Scan History</Text>
        <Text style={styles.headerSubtitle}>
          {history.length} {history.length === 1 ? 'item' : 'items'}
        </Text>
      </View>

      {/* History List */}
      <FlatList
        data={history}
        keyExtractor={(item) => item.barcode}
        renderItem={({ item }) => (
          <HistoryItem 
            item={item} 
            onPress={() => handleItemPress(item)} 
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
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
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
```

---

## Features

| Feature | Implementation |
|---------|----------------|
| Pull-to-refresh | `RefreshControl` component |
| Auto-refresh | `useFocusEffect` on screen focus |
| Empty state | Custom component when no items |
| Item details | Tap to show `ResultModal` |
| Item count | Shows in header subtitle |

---

## ✅ Checklist

- [ ] Created `app/(tabs)/history.tsx`
- [ ] `FlatList` with `HistoryItem` components
- [ ] Pull-to-refresh with `RefreshControl`
- [ ] Auto-refresh on screen focus
- [ ] Empty state when no history
- [ ] Tap item to view details in modal

---

## 🔜 Next: Phase 8 - About Screen

