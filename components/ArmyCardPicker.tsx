import { useState, useEffect, useMemo } from 'react';
import { Modal, View, StyleSheet, FlatList, Pressable, Text, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useWindowDimensions } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import data from '@/data/heroscape-cards.json';
import ArmyCard from '@/components/armyCard';

interface Props {
  isVisible: boolean;
  onClose: () => void;
  onSelectCard: (cardId: string) => void;
  contemporaryOnly?: boolean;
  excludeCardIds?: string[];
}

export default function ArmyCardPicker({
  isVisible,
  onClose,
  onSelectCard,
  contemporaryOnly = false,
  excludeCardIds = [],
}: Props) {
  const { width, height } = useWindowDimensions();
  const [searchText, setSearchText] = useState('');
  const [selectedAffiliations, setSelectedAffiliations] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  const availableCards = useMemo(() => {
    let cards = data.cards as any[];

    if (contemporaryOnly) {
      cards = cards.filter((c) => c.attributes.contemporaryLegal === true);
    }

    if (excludeCardIds.length > 0) {
      cards = cards.filter((c) => !excludeCardIds.includes(c.id));
    }

    if (searchText) {
      const search = searchText.toLowerCase();
      cards = cards.filter(
        (c) =>
          c.name.toLowerCase().includes(search) ||
          c.faction.toLowerCase().includes(search) ||
          c.type.toLowerCase().includes(search)
      );
    }

    if (selectedAffiliations.length > 0) {
      cards = cards.filter((c) => selectedAffiliations.includes(c.faction));
    }

    return cards;
  }, [searchText, selectedAffiliations, contemporaryOnly, excludeCardIds]);

  const affiliations = useMemo(() => {
    let cards = data.cards as any[];
    if (contemporaryOnly) {
      cards = cards.filter((c) => c.attributes.contemporaryLegal === true);
    }
    const uniqueAffiliations = [...new Set(cards.map((c) => c.faction))];
    return uniqueAffiliations.sort();
  }, [contemporaryOnly]);

  const toggleAffiliation = (faction: string) => {
    setSelectedAffiliations((prev) =>
      prev.includes(faction) ? prev.filter((f) => f !== faction) : [...prev, faction]
    );
  };

  const handleCardPress = (cardId: string) => {
    onSelectCard(cardId);
  };

  const renderCard = ({ item }: { item: any }) => (
    <Pressable
      style={{ width: (width - 48) / 3, height: (width - 48) / 3 + 30, padding: 4 }}
      onPress={() => handleCardPress(item.id)}
    >
      <ArmyCard imagePath={item.localImagePath} />
      <Text style={styles.cardCost}>{item.armyCost}</Text>
    </Pressable>
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.searchRow}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            value={searchText}
            onChangeText={setSearchText}
            placeholder="Search cards..."
            placeholderTextColor="#666"
          />
          {searchText.length > 0 && (
            <Pressable onPress={() => setSearchText('')}>
              <Ionicons name="close-circle" size={20} color="#666" />
            </Pressable>
          )}
        </View>
        <Pressable style={styles.filterButton} onPress={() => setShowFilters(!showFilters)}>
          <Ionicons
            name={showFilters ? 'filter' : 'filter-outline'}
            size={24}
            color={selectedAffiliations.length > 0 ? '#703095' : '#fff'}
          />
          {selectedAffiliations.length > 0 && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>{selectedAffiliations.length}</Text>
            </View>
          )}
        </Pressable>
      </View>

      {showFilters && (
        <View style={styles.filters}>
          <Text style={styles.filterLabel}>Filter by Faction:</Text>
          <View style={styles.affiliationGrid}>
            {affiliations.map((faction) => (
              <Pressable
                key={faction}
                style={[
                  styles.affiliationChip,
                  selectedAffiliations.includes(faction) && styles.affiliationChipSelected,
                ]}
                onPress={() => toggleAffiliation(faction)}
              >
                <Text
                  style={[
                    styles.affiliationChipText,
                    selectedAffiliations.includes(faction) && styles.affiliationChipTextSelected,
                  ]}
                >
                  {faction}
                </Text>
              </Pressable>
            ))}
          </View>
          {selectedAffiliations.length > 0 && (
            <Pressable style={styles.clearFilters} onPress={() => setSelectedAffiliations([])}>
              <Text style={styles.clearFiltersText}>Clear Filters</Text>
            </Pressable>
          )}
        </View>
      )}

      <Text style={styles.resultCount}>
        {availableCards.length} card{availableCards.length !== 1 ? 's' : ''} available
      </Text>
    </View>
  );

  return (
    <Modal visible={isVisible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.container}>
        <View style={styles.titleBar}>
          <Text style={styles.title}>Select Card</Text>
          <Pressable onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={28} color="#fff" />
          </Pressable>
        </View>

        <FlatList
          data={availableCards}
          renderItem={renderCard}
          keyExtractor={(item) => item.id}
          numColumns={3}
          columnWrapperStyle={styles.columnWrapper}
          ListHeaderComponent={renderHeader}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#25292e',
  },
  titleBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#101010',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  title: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 4,
  },
  header: {
    paddingHorizontal: 8,
    paddingBottom: 8,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    paddingVertical: 12,
  },
  filterButton: {
    padding: 12,
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#333',
  },
  filterBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#703095',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  filters: {
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#333',
  },
  filterLabel: {
    color: '#888',
    fontSize: 14,
    marginBottom: 8,
  },
  affiliationGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  affiliationChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: '#333',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#444',
  },
  affiliationChipSelected: {
    backgroundColor: '#703095',
    borderColor: '#703095',
  },
  affiliationChipText: {
    color: '#aaa',
    fontSize: 12,
  },
  affiliationChipTextSelected: {
    color: '#fff',
    fontWeight: 'bold',
  },
  clearFilters: {
    marginTop: 8,
    alignSelf: 'center',
  },
  clearFiltersText: {
    color: '#703095',
    fontSize: 14,
  },
  resultCount: {
    color: '#888',
    fontSize: 12,
    textAlign: 'center',
  },
  listContent: {
    paddingHorizontal: 4,
    paddingBottom: 20,
  },
  columnWrapper: {
    justifyContent: 'flex-start',
    paddingHorizontal: 4,
  },
  cardCost: {
    color: '#703095',
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 2,
  },
});
