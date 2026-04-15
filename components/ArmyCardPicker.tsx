import { useState, useMemo, useRef } from 'react';
import { Modal, View, StyleSheet, FlatList, Pressable, Text, TextInput, ScrollView, KeyboardAvoidingView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useWindowDimensions } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Ionicons from '@expo/vector-icons/Ionicons';
import data from '@/data/heroscape-cards.json';
import SelectableCard from '@/components/SelectableCard';
import ArmyCardDetail from '@/components/armyCardDetail';
import { CollectionEntry } from '@/types/army';

interface Props {
  isVisible: boolean;
  onClose: () => void;
  onSelectCard: (cardId: string) => void;
  onRemoveCard?: (cardId: string) => void;
  collection?: CollectionEntry[];
  contemporaryOnly?: boolean;
}

export default function ArmyCardPicker({
  isVisible,
  onClose,
  onSelectCard,
  onRemoveCard,
  collection = [],
  contemporaryOnly = false,
}: Props) {
  const { width } = useWindowDimensions();
  const [searchText, setSearchText] = useState('');
  const [selectedFactions, setSelectedFactions] = useState<string[]>([]);
  const [selectedCardTypes, setSelectedCardTypes] = useState<string[]>([]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [selectedSpecies, setSelectedSpecies] = useState<string[]>([]);
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);
  const [selectedPersonalities, setSelectedPersonalities] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [filterContemporaryOnly, setFilterContemporaryOnly] = useState(false);
  const [filterArmyCost, setFilterArmyCost] = useState('');
  const [filterArmyCostOperator, setFilterArmyCostOperator] = useState<string>('=');
  const [selectedCardData, setSelectedCardData] = useState<any | undefined>(undefined);
  const [openCardDetail, setOpenCardDetail] = useState<boolean>(false);
  const flatListRef = useRef<FlatList>(null);

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
  };

  const hasActiveFilters = selectedFactions.length > 0 || selectedCardTypes.length > 0 || 
    selectedSizes.length > 0 || selectedSpecies.length > 0 || selectedClasses.length > 0 ||
    selectedPersonalities.length > 0 || filterContemporaryOnly || filterArmyCost !== '';

  const clearFilters = () => {
    setSelectedFactions([]);
    setSelectedCardTypes([]);
    setSelectedSizes([]);
    setSelectedSpecies([]);
    setSelectedClasses([]);
    setSelectedPersonalities([]);
    setFilterContemporaryOnly(false);
    setFilterArmyCost('');
    setFilterArmyCostOperator('=');
  };

  const availableCards = useMemo(() => {
    let cards = data.cards as any[];

    if (contemporaryOnly || filterContemporaryOnly) {
      cards = cards.filter((c) => c.attributes.contemporaryLegal === true);
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

    if (selectedFactions.length > 0) {
      cards = cards.filter((c) => selectedFactions.includes(c.faction));
    }

    if (selectedCardTypes.length > 0) {
      cards = cards.filter((c) => selectedCardTypes.includes(c.type));
    }

    if (selectedSizes.length > 0) {
      cards = cards.filter((c) => selectedSizes.includes(c.attributes.size));
    }

    if (selectedSpecies.length > 0) {
      cards = cards.filter((c) => selectedSpecies.includes(c.attributes.species));
    }

    if (selectedClasses.length > 0) {
      const cardClasses = getClasses(c);
      cards = cards.filter((c) => selectedClasses.some(cls => cardClasses.includes(cls)));
    }

    if (selectedPersonalities.length > 0) {
      cards = cards.filter((c) => selectedPersonalities.includes(c.attributes.personality));
    }

    if (filterArmyCost !== '') {
      const cost = parseInt(filterArmyCost);
      cards = cards.filter((c) => {
        if (filterArmyCostOperator === '=' && c.armyCost !== cost) return false;
        if (filterArmyCostOperator === '>' && c.armyCost <= cost) return false;
        if (filterArmyCostOperator === '<' && c.armyCost >= cost) return false;
        return true;
      });
    }

    return cards;
  }, [searchText, selectedFactions, selectedCardTypes, selectedSizes, selectedSpecies, 
      selectedClasses, selectedPersonalities, filterContemporaryOnly, filterArmyCost, 
      filterArmyCostOperator, contemporaryOnly]);

  const collectionMap = useMemo(() => {
    const map: Record<string, number> = {};
    collection.forEach(entry => {
      map[entry.cardId] = entry.quantity;
    });
    return map;
  }, [collection]);

  const handleViewDetails = (card: any) => {
    setSelectedCardData(card);
    setOpenCardDetail(true);
  };

  const renderPickerCard = ({ item }: { item: any }) => {
    const quantity = collectionMap[item.id] || 0;
    
    const handleAdd = () => {
      onSelectCard(item.id);
    };
    
    const handleRemove = () => {
      if (onRemoveCard) {
        onRemoveCard(item.id);
      }
    };
    
    const handleViewDetails = () => {
      setSelectedCardData(item);
      setOpenCardDetail(true);
    };

    return (
      <View style={styles.pickerCardWrapper}>
        <SelectableCard
          imagePath={item.localImagePath}
          armyCost={item.armyCost}
          quantity={quantity}
          onAdd={handleAdd}
          onRemove={handleRemove}
          onViewDetails={handleViewDetails}
          disabled={false}
          showCost={false}
        />
      </View>
    );
  };

  return (
    <Modal visible={isVisible} animationType="slide" presentationStyle="pageSheet">
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaView style={styles.pickerContainer} edges={['bottom']}>
          <View style={styles.pickerHeader}>
            <Text style={styles.pickerTitle}>Select Card</Text>
            <Pressable onPress={onClose}>
              <Ionicons name="close" size={28} color="#fff" />
            </Pressable>
          </View>

          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              value={searchText}
              onChangeText={setSearchText}
              placeholder="Search cards..."
              placeholderTextColor="#666"
            />
            <Pressable onPress={() => setShowFilters(!showFilters)}>
              <Ionicons name="options" size={24} color={hasActiveFilters ? '#703095' : '#666'} />
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
              </ScrollView>
            </KeyboardAvoidingView>
          )}

          <View style={styles.pickerStatsRow}>
            <Text style={styles.pickerStatText}>
              {availableCards.length} card{availableCards.length !== 1 ? 's' : ''} available
            </Text>
          </View>

          <FlatList
            data={availableCards}
            renderItem={renderPickerCard}
            keyExtractor={(item) => item.id}
            numColumns={2}
            columnWrapperStyle={styles.pickerColumnWrapper}
            contentContainerStyle={styles.pickerList}
            ref={flatListRef}
            showsVerticalScrollIndicator={false}
          />
          
          {selectedCardData !== undefined && (
            <ArmyCardDetail 
              isVisible={openCardDetail} 
              onClose={() => setOpenCardDetail(false)} 
              data={selectedCardData} 
            />
          )}
        </SafeAreaView>
      </GestureHandlerRootView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  pickerContainer: {
    flex: 1,
    backgroundColor: '#25292e',
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#101010',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  pickerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginHorizontal: 16,
    marginVertical: 8,
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
  filtersContainer: {
    backgroundColor: '#1a1a1a',
    marginHorizontal: 16,
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#333',
    maxHeight: 400,
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
  pickerStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  pickerStatText: {
    color: '#888',
    fontSize: 14,
  },
  pickerColumnWrapper: {
    justifyContent: 'flex-start',
    paddingHorizontal: 8,
  },
  pickerList: {
    paddingHorizontal: 4,
    paddingBottom: 20,
  },
  pickerCardWrapper: {
    flex: 1,
    padding: 4,
  },
});