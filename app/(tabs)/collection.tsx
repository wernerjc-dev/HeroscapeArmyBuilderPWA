import { View, StyleSheet, FlatList, Pressable, Text, TextInput, ScrollView, KeyboardAvoidingView } from 'react-native';
import { useState, useEffect, useMemo } from 'react';
import { useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';

import data from '@/data/heroscape-cards.json';
import ArmyCard from '@/components/armyCard';
import ArmyCardDetail from '@/components/armyCardDetail';
import ArmyCardPicker from '@/components/ArmyCardPicker';
import { getCollection } from '@/utils/collectionStorage';
import { CollectionEntry } from '@/types/army';

export default function CollectionScreen() {
  const { width } = useWindowDimensions();
  const [collection, setCollection] = useState<CollectionEntry[]>([]);
  const [selectedCardData, setSelectedCardData] = useState<any | undefined>(undefined);
  const [openCardDetail, setOpenCardDetail] = useState<boolean>(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showAddCard, setShowAddCard] = useState(false);
  const [selectedFactions, setSelectedFactions] = useState<string[]>([]);
  const [selectedCardTypes, setSelectedCardTypes] = useState<string[]>([]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [selectedSpecies, setSelectedSpecies] = useState<string[]>([]);
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);
  const [selectedPersonalities, setSelectedPersonalities] = useState<string[]>([]);
  const [selectedHomeworlds, setSelectedHomeworlds] = useState<string[]>([]);
  const [selectedSets, setSelectedSets] = useState<string[]>([]);
  const [filterContemporaryOnly, setFilterContemporaryOnly] = useState(false);
  const [filterCollectionOnly, setFilterCollectionOnly] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [filterArmyCost, setFilterArmyCost] = useState('');
  const [filterArmyCostOperator, setFilterArmyCostOperator] = useState<string>('=');
  const [cardNameFilter, setCardNameFilter] = useState('');

  useEffect(() => {
    loadCollection();
  }, []);

  const loadCollection = async () => {
    try {
      const collectionData = await getCollection();
      setCollection(collectionData.cards);
    } catch (error) {
      console.error('Error loading collection:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const collectionMap = useMemo(() => {
    const map: Record<string, number> = {};
    collection.forEach(entry => {
      map[entry.cardId] = entry.quantity;
    });
    return map;
  }, [collection]);

  const handleAddCard = async (cardId: string) => {
    const existingIndex = collection.findIndex(c => c.cardId === cardId);
    if (existingIndex >= 0) {
      const updated = [...collection];
      updated[existingIndex] = { ...updated[existingIndex], quantity: updated[existingIndex].quantity + 1 };
      setCollection(updated);
    } else {
      setCollection([...collection, { cardId, quantity: 1 }]);
    }
    setShowAddCard(false);
  };

  const getClasses = (card: any) => {
    if (!card || !card.attributes) return [];
    const cls = card.attributes.class;
    if (Array.isArray(cls)) return cls;
    return cls ? [cls] : [];
  };

  const filterOptions = {
      factions: [...new Set(data.cards.map((c: any) => c.faction))].sort(),
      cardTypes: [...new Set(data.cards.map((c: any) => c.type))].sort(),
      sizes: [...new Set(data.cards.map((c: any) => c.attributes.size))].sort(),
      species: [...new Set(data.cards.map((c: any) => c.attributes.species))].sort(),
      classes: [...new Set(data.cards.flatMap((c: any) => getClasses(c)))].sort(),
      personalities: [...new Set(data.cards.map((c: any) => c.attributes.personality))].sort(),
      homeworlds: [...new Set(data.cards.map((c: any) => c.homeworld))].sort(),
      sets: [...new Set(data.cards.map((c: any) => c.set))].sort(),
    };

    const hasActiveFilters = selectedFactions.length > 0 || selectedCardTypes.length > 0 ||
      selectedSizes.length > 0 || selectedSpecies.length > 0 || selectedClasses.length > 0 ||
      selectedPersonalities.length > 0 || selectedHomeworlds.length > 0 || selectedSets.length > 0 ||
      filterContemporaryOnly || filterArmyCost !== '' || cardNameFilter !== '';

    const clearFilters = () => {
      setSelectedFactions([]);
      setSelectedCardTypes([]);
      setSelectedSizes([]);
      setSelectedSpecies([]);
      setSelectedClasses([]);
      setSelectedPersonalities([]);
      setSelectedHomeworlds([]);
      setSelectedSets([]);
      setFilterContemporaryOnly(false);
      setFilterArmyCost('');
      setFilterArmyCostOperator('=');
      setCardNameFilter('');
    };

    const filteredCards = data.cards.filter((c: any) => {
      if (cardNameFilter) {
        const search = cardNameFilter.toLowerCase();
        if (!c.name.toLowerCase().includes(search)) {
          return false;
        }
      }
      if (selectedFactions.length > 0 && !selectedFactions.includes(c.faction)) {
        return false;
      }
      if (selectedCardTypes.length > 0 && !selectedCardTypes.includes(c.type)) {
        return false;
      }
      if (selectedSizes.length > 0 && !selectedSizes.includes(c.attributes.size)) {
        return false;
      }
      if (selectedSpecies.length > 0 && !selectedSpecies.includes(c.attributes.species)) {
        return false;
      }
      if (selectedClasses.length > 0) {
        const cardClasses = getClasses(c);
        if (!selectedClasses.some(cls => cardClasses.includes(cls))) {
          return false;
        }
      }
      if (selectedPersonalities.length > 0 && !selectedPersonalities.includes(c.attributes.personality)) {
        return false;
      }
      if (selectedHomeworlds.length > 0 && !selectedHomeworlds.includes(c.homeworld)) {
        return false;
      }
      if (selectedSets.length > 0 && !selectedSets.includes(c.set)) {
        return false;
      }
      if (filterContemporaryOnly && !c.attributes.contemporaryLegal) {
        return false;
      }
      if (filterCollectionOnly && !collectionMap[c.id]) {
        return false;
      }
      if (filterArmyCost !== '') {
        const cost = parseInt(filterArmyCost);
        if (filterArmyCostOperator === '=' && c.armyCost !== cost) return false;
        if (filterArmyCostOperator === '>' && c.armyCost <= cost) return false;
        if (filterArmyCostOperator === '<' && c.armyCost >= cost) return false;
      }
      return true;
    });

    const onCardPress = (cardData: any) => {
      setSelectedCardData(cardData);
      setOpenCardDetail(true);
    };

    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.searchRow}>
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              value={cardNameFilter}
              onChangeText={setCardNameFilter}
              placeholder="Search cards..."
              placeholderTextColor="#666"
            />
            <Pressable onPress={() => setShowFilters(!showFilters)}>
              <Ionicons name="options" size={24} color={hasActiveFilters ? '#703095' : '#666'} />
            </Pressable>
          </View>
          <Pressable style={styles.addButton} onPress={() => setShowAddCard(true)}>
            <Ionicons name="add" size={24} color="#fff" />
          </Pressable>
        </View>

        {showFilters && (
          <KeyboardAvoidingView behavior="padding" style={{ maxHeight: 400 }}>
            <ScrollView
              style={styles.filtersContainer}
              nestedScrollEnabled
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.filterSection}>
                <View style={styles.filterHeader}>
                  <Text style={styles.filterLabel}>Faction</Text>
                  {hasActiveFilters && (
                    <Pressable onPress={clearFilters}>
                      <Text style={styles.clearFiltersText}>Clear All</Text>
                    </Pressable>
                  )}
                </View>
                <View style={styles.chipContainer}>
                  {filterOptions.factions.map((faction: string) => (
                    <Pressable
                      key={faction}
                      style={[
                        styles.filterChip,
                        selectedFactions.includes(faction) && styles.filterChipSelected,
                      ]}
                      onPress={() => {
                        setSelectedFactions((prev) =>
                          prev.includes(faction) ? prev.filter((f) => f !== faction) : [...prev, faction]
                        );
                      }}
                    >
                      <Text
                        style={[
                          styles.filterChipText,
                          selectedFactions.includes(faction) && styles.filterChipTextSelected,
                        ]}
                      >
                        {faction}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              <View style={styles.filterSection}>
                <Text style={styles.filterLabel}>Point Cost</Text>
                <View style={styles.costFilterRow}>
                  <View style={styles.costOperatorContainer}>
                    {['<', '=', '>'].map((op) => (
                      <Pressable
                        key={op}
                        style={[
                          styles.costOperatorButton,
                          filterArmyCostOperator === op && styles.costOperatorButtonSelected,
                        ]}
                        onPress={() => setFilterArmyCostOperator(op)}
                      >
                        <Text style={[
                          styles.costOperatorText,
                          filterArmyCostOperator === op && styles.costOperatorTextSelected,
                        ]}>
                          {op}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                  <TextInput
                    style={styles.costInput}
                    value={filterArmyCost}
                    onChangeText={setFilterArmyCost}
                    placeholder="Cost"
                    placeholderTextColor="#666"
                    keyboardType="number-pad"
                  />
                </View>
              </View>

              <View style={styles.filterSection}>
                <Pressable
                  style={styles.checkboxRow}
                  onPress={() => setFilterContemporaryOnly(!filterContemporaryOnly)}
                >
                  <View style={[
                    styles.checkbox,
                    filterContemporaryOnly && styles.checkboxChecked
                  ]}>
                    {filterContemporaryOnly && (
                      <Ionicons name="checkmark" size={14} color="#fff" />
                    )}
                  </View>
                  <Text style={styles.checkboxLabel}>Contemporary Legal Only</Text>
                </Pressable>
              </View>

              <View style={styles.filterSection}>
                <Pressable 
                  style={styles.checkboxRow}
                  onPress={() => setFilterCollectionOnly(!filterCollectionOnly)}
                >
                  <View style={[
                    styles.checkbox,
                    filterCollectionOnly && styles.checkboxChecked
                  ]}>
                    {filterCollectionOnly && (
                      <Ionicons name="checkmark" size={14} color="#fff" />
                    )}
                  </View>
                  <Text style={styles.checkboxLabel}>Collection Only</Text>
                </Pressable>
              </View>

              <View style={styles.filterSection}>
                <Text style={styles.filterLabel}>Card Type</Text>
                <View style={styles.chipContainer}>
                  {filterOptions.cardTypes.map((type: string) => (
                    <Pressable
                      key={type}
                      style={[
                        styles.filterChip,
                        selectedCardTypes.includes(type) && styles.filterChipSelected,
                      ]}
                      onPress={() => {
                        setSelectedCardTypes((prev) =>
                          prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
                        );
                      }}
                    >
                      <Text
                        style={[
                          styles.filterChipText,
                          selectedCardTypes.includes(type) && styles.filterChipTextSelected,
                        ]}
                      >
                        {type}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              <View style={styles.filterSection}>
                <Text style={styles.filterLabel}>Size</Text>
                <View style={styles.chipContainer}>
                  {filterOptions.sizes.map((size: string) => (
                    <Pressable
                      key={size}
                      style={[
                        styles.filterChip,
                        selectedSizes.includes(size) && styles.filterChipSelected,
                      ]}
                      onPress={() => {
                        setSelectedSizes((prev) =>
                          prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size]
                        );
                      }}
                    >
                      <Text
                        style={[
                          styles.filterChipText,
                          selectedSizes.includes(size) && styles.filterChipTextSelected,
                        ]}
                      >
                        {size}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              <View style={styles.filterSection}>
                <Text style={styles.filterLabel}>Species</Text>
                <View style={styles.chipContainer}>
                  {filterOptions.species.map((species: string) => (
                    <Pressable
                      key={species}
                      style={[
                        styles.filterChip,
                        selectedSpecies.includes(species) && styles.filterChipSelected,
                      ]}
                      onPress={() => {
                        setSelectedSpecies((prev) =>
                          prev.includes(species) ? prev.filter((s) => s !== species) : [...prev, species]
                        );
                      }}
                    >
                      <Text
                        style={[
                          styles.filterChipText,
                          selectedSpecies.includes(species) && styles.filterChipTextSelected,
                        ]}
                      >
                        {species}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              <View style={styles.filterSection}>
                <Text style={styles.filterLabel}>Class</Text>
                <View style={styles.chipContainer}>
                  {filterOptions.classes.map((cls: string) => (
                    <Pressable
                      key={cls}
                      style={[
                        styles.filterChip,
                        selectedClasses.includes(cls) && styles.filterChipSelected,
                      ]}
                      onPress={() => {
                        setSelectedClasses((prev) =>
                          prev.includes(cls) ? prev.filter((c) => c !== cls) : [...prev, cls]
                        );
                      }}
                    >
                      <Text
                        style={[
                          styles.filterChipText,
                          selectedClasses.includes(cls) && styles.filterChipTextSelected,
                        ]}
                      >
                        {cls}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              <View style={styles.filterSection}>
                <Text style={styles.filterLabel}>Personality</Text>
                <View style={styles.chipContainer}>
                  {filterOptions.personalities.map((personality: string) => (
                    <Pressable
                      key={personality}
                      style={[
                        styles.filterChip,
                        selectedPersonalities.includes(personality) && styles.filterChipSelected,
                      ]}
                      onPress={() => {
                        setSelectedPersonalities((prev) =>
                          prev.includes(personality) ? prev.filter((p) => p !== personality) : [...prev, personality]
                        );
                      }}
                    >
                      <Text
                        style={[
                          styles.filterChipText,
                          selectedPersonalities.includes(personality) && styles.filterChipTextSelected,
                        ]}
                      >
                        {personality}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              <View style={styles.filterSection}>
                <Text style={styles.filterLabel}>Homeworld</Text>
                <View style={styles.chipContainer}>
                  {filterOptions.homeworlds.map((homeworld: string) => (
                    <Pressable
                      key={homeworld}
                      style={[
                        styles.filterChip,
                        selectedHomeworlds.includes(homeworld) && styles.filterChipSelected,
                      ]}
                      onPress={() => {
                        setSelectedHomeworlds((prev) =>
                          prev.includes(homeworld) ? prev.filter((h) => h !== homeworld) : [...prev, homeworld]
                        );
                      }}
                    >
                      <Text
                        style={[
                          styles.filterChipText,
                          selectedHomeworlds.includes(homeworld) && styles.filterChipTextSelected,
                        ]}
                      >
                        {homeworld}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              <View style={styles.filterSection}>
                <Text style={styles.filterLabel}>Set</Text>
                <View style={styles.chipContainer}>
                  {filterOptions.sets.map((set: string) => (
                    <Pressable
                      key={set}
                      style={[
                        styles.filterChip,
                        selectedSets.includes(set) && styles.filterChipSelected,
                      ]}
                      onPress={() => {
                        setSelectedSets((prev) =>
                          prev.includes(set) ? prev.filter((s) => s !== set) : [...prev, set]
                        );
                      }}
                    >
                      <Text
                        style={[
                          styles.filterChipText,
                          selectedSets.includes(set) && styles.filterChipTextSelected,
                        ]}
                      >
                        {set}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        )}

        <FlatList
          data={filteredCards}
          renderItem={({ item }) => {
            const quantity = collectionMap[item.id] || 0;
            const isOwned = quantity > 0;
            return (
              <View style={{ width: width / 2, height: width / 2, padding: 5 }}>
                <ArmyCard 
                  imagePath={item.localImagePath} 
                  onPress={() => onCardPress(item)}
                  disabled={!isOwned}
                />
                {isOwned && (
                  <View style={styles.quantityBadge}>
                    <Text style={styles.quantityText}>{quantity}</Text>
                  </View>
                )}
              </View>
            );
          }}
          keyExtractor={item => item.id}
          horizontal={false}
          numColumns="2"
          columnWrapperStyle={styles.columnWrapper}
        />
        {selectedCardData !== undefined && (
          <ArmyCardDetail isVisible={openCardDetail} onClose={() => setOpenCardDetail(false)} data={selectedCardData} />
        )}
        
        <ArmyCardPicker
          isVisible={showAddCard}
          onClose={() => setShowAddCard(false)}
          onSelectCard={handleAddCard}
          excludeCardIds={collection.map(c => c.cardId)}
        />
      </SafeAreaView>
    );
  }

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#25292e',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
  },
  columnWrapper: {
    justifyContent: 'space-evenly',
  },
  cardWrapper: {
    position: 'relative',
  },
  cardDisabled: {
    opacity: 0.4,
  },
  quantityBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#00aa00',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  quantityText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginVertical: 8,
    gap: 8,
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
    paddingVertical: 10,
  },
  addButton: {
    backgroundColor: '#703095',
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filtersContainer: {
    backgroundColor: '#1a1a1a',
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 8,
    padding: 12,
    paddingBottom: 20,
    borderWidth: 1,
    borderColor: '#333',
    maxHeight: 600,
  },
  filterSection: {
    marginBottom: 12,
  },
  filterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  filterLabel: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  clearFiltersText: {
    color: '#703095',
    fontSize: 14,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  filterChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: '#333',
    borderRadius: 12,
  },
  filterChipSelected: {
    backgroundColor: '#703095',
  },
  filterChipText: {
    color: '#aaa',
    fontSize: 11,
  },
  filterChipTextSelected: {
    color: '#fff',
    fontWeight: 'bold',
  },
  costFilterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  costOperatorContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  costOperatorButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  costOperatorButtonSelected: {
    backgroundColor: '#703095',
  },
  costOperatorText: {
    color: '#888',
    fontSize: 16,
    fontWeight: 'bold',
  },
  costOperatorTextSelected: {
    color: '#fff',
  },
  costInput: {
    flex: 1,
    backgroundColor: '#333',
    color: '#fff',
    borderRadius: 8,
    padding: 8,
    fontSize: 16,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#666',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#703095',
    borderColor: '#703095',
  },
  checkboxLabel: {
    color: '#fff',
    fontSize: 14,
  },
});