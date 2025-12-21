import { MaterialIcons } from '@expo/vector-icons';
import { useCallback, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Image,
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';

export interface SearchResult {
  barcode: string;
  name: string;
  brand?: string;
  image?: string;
}

type Props = {
  visible: boolean;
  onClose: () => void;
  onSelect: (barcode: string) => void;
  onSearch: (query: string) => Promise<SearchResult[]>;
  initialBarcode?: string;
  photoUri?: string;  // Photo captured for reference
};

/**
 * Modal for searching products by name when barcode isn't found
 * or when photo OCR fails
 */
export default function SearchModal({ 
  visible, 
  onClose, 
  onSelect, 
  onSearch,
  initialBarcode,
  photoUri,
}: Props) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = useCallback(async () => {
    if (!query.trim() || query.length < 2) return;
    
    setLoading(true);
    setSearched(true);
    
    try {
      const searchResults = await onSearch(query.trim());
      setResults(searchResults);
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [query, onSearch]);

  const handleClose = useCallback(() => {
    setQuery('');
    setResults([]);
    setSearched(false);
    onClose();
  }, [onClose]);

  const handleSelect = useCallback((barcode: string) => {
    handleClose();
    onSelect(barcode);
  }, [handleClose, onSelect]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView 
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <View style={styles.modal}>
          {/* Header with photo thumbnail (compact when photo exists) */}
          <View style={styles.header}>
            {/* Small photo thumbnail on the left */}
            {photoUri && (
              <Image 
                source={{ uri: photoUri }} 
                style={styles.photoThumbnail}
                resizeMode="cover"
              />
            )}
            <View style={styles.headerText}>
              <Text style={styles.title}>
                {photoUri ? 'What product is this?' : 'Search Product'}
              </Text>
              {photoUri && (
                <Text style={styles.subtitle}>Type the name from the label</Text>
              )}
            </View>
            <Pressable onPress={handleClose} style={styles.closeButton}>
              <MaterialIcons name="close" size={24} color="#666" />
            </Pressable>
          </View>

          {/* Info about failed barcode (only if no photo) */}
          {initialBarcode && !photoUri && (
            <View style={styles.barcodeInfo}>
              <MaterialIcons name="info-outline" size={16} color="#666" />
              <Text style={styles.barcodeText}>
                Barcode {initialBarcode} not found. Search by product name:
              </Text>
            </View>
          )}

          {/* Search Input - Always visible */}
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="e.g., Member's Mark Peppermint Bark"
              placeholderTextColor="#999"
              value={query}
              onChangeText={setQuery}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
              autoFocus
              autoCapitalize="words"
            />
            <Pressable 
              style={[styles.searchButton, !query.trim() && styles.searchButtonDisabled]}
              onPress={handleSearch}
              disabled={!query.trim() || loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <MaterialIcons name="search" size={24} color="#fff" />
              )}
            </Pressable>
          </View>

          {/* Results */}
          {searched && !loading && results.length === 0 && (
            <View style={styles.emptyContainer}>
              <MaterialIcons name="search-off" size={48} color="#CCC" />
              <Text style={styles.emptyText}>No products found for "{query}"</Text>
              <Text style={styles.emptySubtext}>Try a different search term</Text>
            </View>
          )}

          {/* Tip - only show when not searching */}
          {!searched && results.length === 0 && (
            <View style={styles.tip}>
              <MaterialIcons name="lightbulb-outline" size={16} color="#666" />
              <Text style={styles.tipText}>
                Type the brand + product name from the label
              </Text>
            </View>
          )}

          {/* Results count header */}
          {results.length > 0 && (
            <View style={styles.resultsHeader}>
              <Text style={styles.resultsCount}>
                {results.length} product{results.length > 1 ? 's' : ''} found
              </Text>
              <Text style={styles.resultsHint}>
                {photoUri ? 'Tap the one that matches your photo' : 'Select the correct product'}
              </Text>
            </View>
          )}

          {/* Results list */}
          {results.length > 0 && (
            <FlatList
              data={results}
              keyExtractor={(item) => item.barcode}
              style={styles.resultsList}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => (
                <Pressable 
                  style={({ pressed }) => [
                    styles.resultItem,
                    pressed && styles.resultItemPressed
                  ]}
                  onPress={() => handleSelect(item.barcode)}
                >
                  <View style={styles.resultInfo}>
                    <Text style={styles.resultName} numberOfLines={2}>
                      {item.name}
                    </Text>
                    {item.brand && (
                      <Text style={styles.resultBrand}>{item.brand}</Text>
                    )}
                    <Text style={styles.resultBarcode}>
                      Barcode: {item.barcode}
                    </Text>
                  </View>
                  <MaterialIcons name="chevron-right" size={24} color="#2E7D32" />
                </Pressable>
              )}
            />
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    minHeight: 300,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    gap: 12,
  },
  headerText: {
    flex: 1,
  },
  photoThumbnail: {
    width: 50,
    height: 50,
    borderRadius: 8,
    backgroundColor: '#E0E0E0',
  },
  subtitle: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
  },
  closeButton: {
    padding: 4,
  },
  barcodeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF8E1',
    padding: 12,
    marginHorizontal: 20,
    marginTop: 12,
    borderRadius: 8,
    gap: 8,
  },
  barcodeText: {
    flex: 1,
    fontSize: 13,
    color: '#666',
  },
  photoSection: {
    marginHorizontal: 20,
    marginTop: 12,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#F0F4F8',
  },
  photoPreview: {
    width: '100%',
    height: 120,
    backgroundColor: '#E0E0E0',
  },
  photoInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 8,
  },
  photoInfoText: {
    flex: 1,
    fontSize: 14,
    color: '#2E7D32',
    fontWeight: '500',
  },
  searchContainer: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    height: 48,
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#333',
    backgroundColor: '#F8F8F8',
  },
  searchButton: {
    width: 48,
    height: 48,
    backgroundColor: '#2E7D32',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchButtonDisabled: {
    backgroundColor: '#CCC',
  },
  resultsList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F8F8',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  resultItemPressed: {
    backgroundColor: '#E8E8E8',
  },
  resultInfo: {
    flex: 1,
  },
  resultName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  resultBrand: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  resultBarcode: {
    fontSize: 12,
    color: '#999',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 4,
  },
  tip: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F5F5F5',
    padding: 12,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 8,
    gap: 8,
  },
  tipText: {
    flex: 1,
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
  resultsHeader: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#E8F5E9',
    borderBottomWidth: 1,
    borderBottomColor: '#C8E6C9',
  },
  resultsCount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2E7D32',
  },
  resultsHint: {
    fontSize: 12,
    color: '#558B2F',
    marginTop: 2,
  },
});

