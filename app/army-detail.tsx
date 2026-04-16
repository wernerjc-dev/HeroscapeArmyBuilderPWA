import { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  Pressable,
  Text,
  TextInput,
  Alert,
  Modal,
  ScrollView,
  KeyboardAvoidingView,
  useWindowDimensions,
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import data from '@/data/heroscape-cards.json';
import { Army, ArmyCardEntry } from '@/types/army';
import { getArmies, updateArmy, updateCardQuantity, removeCardFromArmy, addCardToArmy, decrementCardInArmy } from '@/utils/armyStorage';
import { getCollection } from '@/utils/collectionStorage';
import ArmyCard from '@/components/armyCard';
import SelectableCard from '@/components/SelectableCard';
import ArmyCardDetail from '@/components/armyCardDetail';

function getCardById(cardId: string) {
  return data.cards.find((c: any) => c.id === cardId);
}

export default function ArmyDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const [army, setArmy] = useState<Army | null>(null);
  const [collection, setCollection] = useState<CollectionEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCardPicker, setShowCardPicker] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [name, setName] = useState('');
  const [pointTotal, setPointTotal] = useState('500');
  const [contemporaryOnly, setContemporaryOnly] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [selectedFactions, setSelectedFactions] = useState<string[]>([]);
  const [selectedCardTypes, setSelectedCardTypes] = useState<string[]>([]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [selectedSpecies, setSelectedSpecies] = useState<string[]>([]);
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);
  const [selectedPersonalities, setSelectedPersonalities] = useState<string[]>([]);
  const [filterContemporaryOnly, setFilterContemporaryOnly] = useState(false);
  const [filterCollectionOnly, setFilterCollectionOnly] = useState(false);
  const [filterArmyCost, setFilterArmyCost] = useState('');
  const [filterArmyCostOperator, setFilterArmyCostOperator] = useState<string>('=');
  const [fitsInArmy, setFitsInArmy] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCardData, setSelectedCardData] = useState<any | undefined>(undefined);
  const [openCardDetail, setOpenCardDetail] = useState(false);
  
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
    selectedPersonalities.length > 0 || filterContemporaryOnly || filterCollectionOnly || filterArmyCost !== '' || fitsInArmy;
  
  const clearFilters = () => {
    setSelectedFactions([]);
    setSelectedCardTypes([]);
    setSelectedSizes([]);
    setSelectedSpecies([]);
    setSelectedClasses([]);
    setSelectedPersonalities([]);
    setFilterContemporaryOnly(false);
    setFilterCollectionOnly(false);
    setFilterArmyCost('');
    setFilterArmyCostOperator('=');
    setFitsInArmy(false);
  };

  const loadArmy = useCallback(async () => {
    const armies = await getArmies();
    const found = armies.find((a) => a.id === id);
    if (found) {
      setArmy(found);
      setName(found.name);
      setPointTotal(found.pointTotal.toString());
      setContemporaryOnly(found.contemporaryOnly);
    }
    
    const collectionData = await getCollection();
    setCollection(collectionData.cards);
    
    setLoading(false);
  }, [id]);

  useEffect(() => {
    loadArmy();
  }, [loadArmy]);

  const totalPoints = army?.cards.reduce((sum, entry) => {
    const card = getCardById(entry.cardId);
    return sum + (card?.armyCost || 0) * entry.quantity;
  }, 0) || 0;

  const isOverLimit = totalPoints > (army?.pointTotal || 0);

  const handleAddCard = async (cardId: string) => {
    if (!army) return;
    const card = getCardById(cardId);
    const isUnique = card?.type?.includes('Unique');
    const existingCard = army.cards.find((c) => c.cardId === cardId);
    
    if (isUnique && existingCard && existingCard.quantity >= 1) return;
    
    let updatedCards;
    if (existingCard) {
      updatedCards = army.cards.map((c) =>
        c.cardId === cardId ? { ...c, quantity: c.quantity + 1 } : c
      );
    } else {
      updatedCards = [...army.cards, { cardId, quantity: 1 }];
    }
    setArmy({ ...army, cards: updatedCards });
    await addCardToArmy(army.id, cardId, 1);
  };

  const handleRemoveCard = async (cardId: string) => {
    if (!army) return;
    await removeCardFromArmy(army.id, cardId);
    await loadArmy();
  };

  const handleDecrementCard = async (cardId: string) => {
    if (!army) return;
    const existingEntry = army.cards.find((c) => c.cardId === cardId);
    if (!existingEntry) return;
    await decrementCardInArmy(army.id, cardId);
    await loadArmy();
  };

  const handleQuantityChange = async (cardId: string, delta: number) => {
    if (!army) return;
    const entry = army.cards.find((c) => c.cardId === cardId);
    if (!entry) return;

    const newQuantity = entry.quantity + delta;
    if (newQuantity <= 0) {
      const updatedCards = army.cards.filter((c) => c.cardId !== cardId);
      setArmy({ ...army, cards: updatedCards });
      await removeCardFromArmy(army.id, cardId);
      return;
    }

    const updatedCards = army.cards.map((c) =>
      c.cardId === cardId ? { ...c, quantity: newQuantity } : c
    );
    setArmy({ ...army, cards: updatedCards });
    await updateCardQuantity(army.id, cardId, newQuantity);
  };

  const handleSaveSettings = async () => {
    if (!army) return;

    const updatedArmy: Army = {
      ...army,
      name: name.trim() || 'New Army',
      pointTotal: parseInt(pointTotal) || 500,
      contemporaryOnly,
    };

    await updateArmy(updatedArmy);
    setArmy(updatedArmy);
    setShowSettings(false);
  };

  const availableCards = data.cards.filter((c: any) => {
    if (searchText) {
      const search = searchText.toLowerCase();
      if (!c.name.toLowerCase().includes(search) &&
          !c.faction.toLowerCase().includes(search) &&
          !c.type.toLowerCase().includes(search)) {
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
    if (filterContemporaryOnly && !c.attributes.contemporaryLegal) {
      return false;
    }
    if (filterCollectionOnly) {
      const collectionCard = collection.find(entry => entry.cardId === c.id);
      if (!collectionCard) {
        return false;
      }
    }
    if (filterArmyCost !== '') {
      const cost = parseInt(filterArmyCost);
      if (filterArmyCostOperator === '=' && c.armyCost !== cost) return false;
      if (filterArmyCostOperator === '>' && c.armyCost <= cost) return false;
      if (filterArmyCostOperator === '<' && c.armyCost >= cost) return false;
    }
    if (fitsInArmy) {
      const remainingPoints = (army?.pointTotal || 0) - totalPoints;
      if (c.armyCost > remainingPoints) return false;
    }
    return true;
  });

  const renderArmyCard = ({ item }: { item: ArmyCardEntry }) => {
    const card = getCardById(item.cardId);
    if (!card) return null;

    const cardTotal = card.armyCost * item.quantity;
    const isUnique = card.type?.includes('Unique');
    const canAdd = !isUnique || item.quantity === 0;

    const handleDecrement = async (e: any) => {
      e.stopPropagation();
      if (item.quantity > 0) {
        await handleQuantityChange(item.cardId, -1);
      }
    };

    const handleIncrement = async (e: any) => {
      e.stopPropagation();
      if (canAdd) {
        await handleQuantityChange(item.cardId, 1);
      }
    };

    const handleViewDetails = () => {
      setSelectedCardData(card);
      setOpenCardDetail(true);
    };

    return (
      <Pressable style={styles.armyCard} onPress={handleViewDetails}>
        <View style={styles.cardImageWrapper}>
          <ArmyCard imagePath={card.localImagePath} style={styles.cardImage} onPress={handleViewDetails} />
          <View style={styles.costBadge}>
            <Text style={styles.costBadgeText}>{card.armyCost}</Text>
          </View>
        </View>
        <View style={styles.cardInfo}>
          <Text style={styles.cardName} numberOfLines={1}>
            {card.name}
          </Text>
          <Text style={styles.cardType}>{card.type}</Text>
          <Text style={styles.cardFaction}>{card.faction}</Text>
        </View>
        <View style={styles.cardActions}>
          <View style={styles.quantityControl}>
            <Pressable
              style={styles.quantityButton}
              onPress={handleDecrement}
            >
              <Ionicons name="remove" size={20} color="#fff" />
            </Pressable>
            <Text style={styles.quantity}>{item.quantity}</Text>
            <Pressable
              style={[styles.quantityButton, !canAdd && styles.quantityButtonDisabled]}
              onPress={handleIncrement}
            >
              <Ionicons name="add" size={20} color={canAdd ? '#fff' : '#666'} />
            </Pressable>
          </View>
          <Text style={styles.cardPoints}>{cardTotal} pts</Text>
        </View>
      </Pressable>
    );
  };

  const renderPickerCard = ({ item }: { item: any }) => {
    const armyCard = army?.cards.find((c) => c.cardId === item.id);
    const isUnique = item.type?.includes('Unique');
    const isMaxed = isUnique && armyCard && armyCard.quantity >= 1;
    
    const handleViewDetails = () => {
      setSelectedCardData(item);
      setOpenCardDetail(true);
    };
    
    return (
      <View style={styles.pickerCardWrapper}>
        <SelectableCard
          imagePath={item.localImagePath}
          armyCost={item.armyCost}
          quantity={armyCard?.quantity || 0}
          onAdd={() => !isMaxed && handleAddCard(item.id)}
          onRemove={() => handleDecrementCard(item.id)}
          onViewDetails={handleViewDetails}
          disabled={isMaxed}
        />
      </View>
    );
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{army?.cards.length || 0}</Text>
          <Text style={styles.statLabel}>Cards</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={[styles.statValue, isOverLimit && styles.overLimit]}>
            {totalPoints}
          </Text>
          <Text style={styles.statLabel}>/ {army?.pointTotal} pts</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>
            {army?.pointTotal ? Math.round((totalPoints / army.pointTotal) * 100) : 0}%
          </Text>
          <Text style={styles.statLabel}>Used</Text>
        </View>
      </View>

      <View style={styles.progressBar}>
        <View
          style={[
            styles.progressFill,
            { width: `${Math.min((totalPoints / (army?.pointTotal || 1)) * 100, 100)}%` },
            isOverLimit && styles.progressOverLimit,
          ]}
        />
      </View>

      <View style={styles.actionButtons}>
        <Pressable style={styles.actionButton} onPress={() => {
            setFilterContemporaryOnly(contemporaryOnly);
            setShowCardPicker(true);
          }}>
          <Ionicons name="add-circle-outline" size={20} color="#fff" />
          <Text style={styles.actionButtonText}>Add Card</Text>
        </Pressable>
        <Pressable style={styles.actionButton} onPress={() => setShowSettings(true)}>
          <Ionicons name="settings-outline" size={20} color="#fff" />
          <Text style={styles.actionButtonText}>Settings</Text>
        </Pressable>
      </View>

      <Text style={styles.sectionTitle}>Army Cards</Text>
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyState}>
      <Ionicons name="folder-open-outline" size={64} color="#555" />
      <Text style={styles.emptyText}>No cards in army</Text>
      <Text style={styles.emptySubtext}>Tap "Add Card" to start building</Text>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loading}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!army) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loading}>
          <Text style={styles.loadingText}>Army not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.navHeader}>
        <Pressable onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </Pressable>
        <Text style={styles.navTitle} numberOfLines={1}>{army.name}</Text>
        <View style={{ width: 24 }} />
      </View>

      <FlatList
        data={army.cards}
        renderItem={renderArmyCard}
        keyExtractor={(item) => item.cardId}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={styles.listContent}
      />

      <Modal visible={showCardPicker} animationType="slide" presentationStyle="pageSheet">
        <GestureHandlerRootView style={{ flex: 1 }}>
          <SafeAreaView style={styles.pickerContainer} edges={['top', 'bottom']}>
            <View style={styles.pickerHeader}>
            <Text style={styles.pickerTitle}>Select Card</Text>
            <Pressable onPress={() => setShowCardPicker(false)}>
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
                  onPress={() => setFitsInArmy(!fitsInArmy)}
                >
                  <View style={[
                    styles.checkbox,
                    fitsInArmy && styles.checkboxChecked
                  ]}>
                    {fitsInArmy && (
                      <Ionicons name="checkmark" size={14} color="#fff" />
                    )}
                  </View>
                  <Text style={styles.checkboxLabel}>Points Remaining: {(army?.pointTotal || 0) - totalPoints}</Text>
                </Pressable>
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
              </ScrollView>
            </KeyboardAvoidingView>
          )}

          <View style={styles.pickerStatsRow}>
            <Text style={styles.pickerStatText}>
              {army?.cards.length || 0} cards in army
            </Text>
            <Text style={[styles.pickerStatText, isOverLimit && styles.overLimit]}>
              {totalPoints} / {army?.pointTotal || 500} pts
            </Text>
          </View>

          <FlatList
            data={availableCards}
            renderItem={renderPickerCard}
            keyExtractor={(item) => item.id}
            numColumns="2"
            columnWrapperStyle={styles.pickerColumnWrapper}
            contentContainerStyle={styles.pickerList}
          />
        </SafeAreaView>
        </GestureHandlerRootView>
      </Modal>

      <Modal visible={showSettings} animationType="slide" transparent>
        <KeyboardAvoidingView behavior="padding" style={styles.modalOverlay} keyboardVerticalOffset={90}>
          <SafeAreaView style={styles.modalContent} edges={['bottom']}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Army Settings</Text>
              <Pressable onPress={() => setShowSettings(false)}>
                <Ionicons name="close" size={24} color="#fff" />
              </Pressable>
            </View>

            <View style={styles.modalBody}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Army Name</Text>
                <TextInput
                  style={styles.input}
                  value={name}
                  onChangeText={setName}
                  placeholder="Enter army name"
                  placeholderTextColor="#666"
                  maxLength={50}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Point Total</Text>
                <TextInput
                  style={styles.input}
                  value={pointTotal}
                  onChangeText={(text) => setPointTotal(text.replace(/[^0-9]/g, ''))}
                  placeholder="500"
                  placeholderTextColor="#666"
                  keyboardType="number-pad"
                  maxLength={5}
                />
              </View>

              <View style={styles.switchRow}>
                <Text style={styles.switchDescription}>Contemporary Only</Text>
                <Switch
                  value={contemporaryOnly}
                  onValueChange={setContemporaryOnly}
                  trackColor={{ false: '#555', true: '#703095' }}
                  thumbColor={contemporaryOnly ? '#fff' : '#ccc'}
                />
              </View>
            </View>

            <Pressable style={styles.saveButton} onPress={handleSaveSettings}>
              <Text style={styles.saveButtonText}>Save Changes</Text>
            </Pressable>
          </SafeAreaView>
        </KeyboardAvoidingView>
      </Modal>

      <ArmyCardDetail 
        isVisible={openCardDetail} 
        onClose={() => setOpenCardDetail(false)} 
        data={selectedCardData} 
      />
    </SafeAreaView>
  );
}

const Switch = require('react-native').Switch;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#25292e',
  },
  navHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#101010',
  },
  navTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 16,
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  header: {
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  statBox: {
    alignItems: 'center',
  },
  statValue: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  statLabel: {
    color: '#888',
    fontSize: 12,
    marginTop: 4,
  },
  overLimit: {
    color: '#ff4444',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#333',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 16,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#703095',
    borderRadius: 4,
  },
  progressOverLimit: {
    backgroundColor: '#ff4444',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#703095',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#703095',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  armyCard: {
    flexDirection: 'row',
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    padding: 8,
    marginBottom: 8,
    alignItems: 'center',
  },
  cardImageWrapper: {
    width: 60,
    height: 84,
    position: 'relative',
  },
  cardImage: {
    width: 60,
    height: 84,
    borderRadius: 4,
  },
  costBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    backgroundColor: '#703095',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  costBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  cardImageContainer: {
    width: 60,
    height: 84,
  },
  cardInfo: {
    flex: 1,
    marginLeft: 12,
  },
  cardName: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  cardType: {
    color: '#888',
    fontSize: 12,
    marginTop: 2,
  },
  cardFaction: {
    color: '#703095',
    fontSize: 12,
    marginTop: 2,
  },
  cardActions: {
    alignItems: 'flex-end',
  },
  quantityControl: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  quantityButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityButtonDisabled: {
    backgroundColor: '#222',
  },
  quantity: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    minWidth: 24,
    textAlign: 'center',
  },
  cardPoints: {
    color: '#703095',
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 4,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
  },
  emptySubtext: {
    color: '#888',
    fontSize: 14,
    marginTop: 8,
  },
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
    marginBottom: 8,
    marginTop: 8,
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
  filtersContainer: {
    backgroundColor: '#1a1a1a',
    marginHorizontal: 16,
    marginBottom: 2,
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
  activeFiltersBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#1a1a1a',
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 8,
  },
  activeFiltersText: {
    color: '#888',
    fontSize: 12,
  },
  pickerStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 0,
    marginHorizontal: 4,
  },
  pickerStatText: {
    color: '#aaa',
    fontSize: 14,
  },
  resultCount: {
    color: '#888',
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 8,
  },
  pickerList: {
    paddingHorizontal: 12,
  },
  pickerColumnWrapper: {
    paddingHorizontal: 4,
  },
  pickerCardWrapper: {
    width: '50%',
    height: 175,
    padding: 4,
  },
  pickerCardInner: {
    flex: 1,
    position: 'relative',
  },
  pickerCardCostBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: '#703095',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: 'hidden',
  },
  pickerCardCostText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  pickerCardQuantityBadge: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    backgroundColor: '#28a745',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickerCardQuantityText: {
    color: '#fff',
    fontSize: 12,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#25292e',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  modalTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  modalBody: {
    padding: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#1a1a1a',
    color: '#fff',
    borderRadius: 8,
    padding: 14,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    padding: 14,
    borderWidth: 1,
    borderColor: '#333',
  },
  switchDescription: {
    color: '#888',
    fontSize: 14,
  },
  saveButton: {
    backgroundColor: '#703095',
    margin: 16,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
