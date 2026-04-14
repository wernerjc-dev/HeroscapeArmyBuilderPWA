import { useState, useEffect, useCallback, useMemo } from 'react';
import { View, StyleSheet, FlatList, Pressable, Text, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { ArmyWithStats } from '@/types/army';
import { getArmies, deleteArmy } from '@/utils/armyStorage';
import data from '@/data/heroscape-cards.json';

type SortMode = 'date' | 'name';

function getCardById(cardId: string) {
  return data.cards.find((c: any) => c.id === cardId);
}

function calculateArmyStats(army: any): ArmyWithStats {
  let totalPoints = 0;
  let cardCount = 0;

  if (army.cards && army.cards.length > 0) {
    army.cards.forEach((entry: any) => {
      const card = getCardById(entry.cardId);
      if (card) {
        totalPoints += card.armyCost * entry.quantity;
        cardCount += entry.quantity;
      }
    });
  }

  return { ...army, totalPoints, cardCount };
}

export default function ArmiesListScreen() {
  const router = useRouter();
  const [armies, setArmies] = useState<ArmyWithStats[]>([]);
  const [sortMode, setSortMode] = useState<SortMode>('date');
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');

  const loadArmies = useCallback(async () => {
    setLoading(true);
    try {
      const loadedArmies = await getArmies();
      const armiesWithStats = loadedArmies.map(calculateArmyStats);
      setArmies(armiesWithStats);
    } catch (error) {
      console.error('Error loading armies:', error);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadArmies();
  }, [loadArmies]);

  useFocusEffect(
    useCallback(() => {
      loadArmies();
    }, [loadArmies])
  );

  const toggleSortMode = () => {
    setSortMode((prev) => (prev === 'date' ? 'name' : 'date'));
  };

  const handleDeleteArmy = (armyId: string, armyName: string) => {
    Alert.alert(
      'Delete Army',
      `Are you sure you want to delete "${armyName}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteArmy(armyId);
            loadArmies();
          },
        },
      ]
    );
  };

  const filteredAndSortedArmies = useMemo(() => {
    let result = [...armies];
    
    if (searchText) {
      const search = searchText.toLowerCase();
      result = result.filter((army) =>
        army.name.toLowerCase().includes(search)
      );
    }
    
    result.sort((a, b) => {
      if (sortMode === 'name') {
        return a.name.localeCompare(b.name);
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
    
    return result;
  }, [armies, sortMode, searchText]);

  const renderArmyItem = ({ item }: { item: ArmyWithStats }) => {
    const pointPercentage = Math.min((item.totalPoints / item.pointTotal) * 100, 100);
    const isOverLimit = item.totalPoints > item.pointTotal;

    return (
      <Pressable
        style={styles.armyItem}
        onPress={() => router.push({ pathname: '/army-detail', params: { id: item.id } })}
        onLongPress={() => handleDeleteArmy(item.id, item.name)}
      >
        <View style={styles.armyHeader}>
          <Text style={styles.armyName} numberOfLines={1}>
            {item.name}
          </Text>
          <View style={styles.armyActions}>
            <Pressable onPress={() => router.push({ pathname: '/army-detail', params: { id: item.id } })}>
              <Ionicons name="create-outline" size={20} color="#703095" />
            </Pressable>
            <Pressable onPress={() => handleDeleteArmy(item.id, item.name)} style={styles.deleteButton}>
              <Ionicons name="trash-outline" size={20} color="#ff4444" />
            </Pressable>
          </View>
        </View>

        <View style={styles.armyInfo}>
          <Text style={styles.armyText}>
            {item.cardCount} card{item.cardCount !== 1 ? 's' : ''}
          </Text>
          <Text style={[styles.armyText, isOverLimit && styles.overLimit]}>
            {item.totalPoints}/{item.pointTotal} pts
          </Text>
          {item.contemporaryOnly && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>Contemp.</Text>
            </View>
          )}
        </View>

        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              { width: `${pointPercentage}%` },
              isOverLimit && styles.progressOverLimit,
            ]}
          />
        </View>
      </Pressable>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="folder-open-outline" size={64} color="#555" />
      <Text style={styles.emptyText}>No armies yet</Text>
      <Text style={styles.emptySubtext}>Tap the + button to create your first army</Text>
    </View>
  );

  const renderNoResultsState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="search-outline" size={64} color="#555" />
      <Text style={styles.emptyText}>No armies found</Text>
      <Text style={styles.emptySubtext}>Try a different search term</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          value={searchText}
          onChangeText={setSearchText}
          placeholder="Search armies..."
          placeholderTextColor="#666"
        />
        <Pressable onPress={toggleSortMode} style={styles.sortButton}>
          <Ionicons
            name={sortMode === 'date' ? 'calendar-outline' : 'text-outline'}
            size={24}
            color="#703095"
          />
        </Pressable>
      </View>

      <FlatList
        data={filteredAndSortedArmies}
        renderItem={renderArmyItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={filteredAndSortedArmies.length === 0 ? styles.emptyContainer : styles.listContainer}
        ListEmptyComponent={searchText ? renderNoResultsState : renderEmptyState}
        refreshing={loading}
        onRefresh={loadArmies}
      />

      <Pressable style={styles.fab} onPress={() => router.push('/create-army')}>
        <Ionicons name="add" size={28} color="#fff" />
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#25292e',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginHorizontal: 16,
    marginBottom: 8,
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
    paddingVertical: 0,
  },
  sortButton: {
    padding: 8,
  },
  listContainer: {
    padding: 16,
    paddingBottom: 80,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
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
    textAlign: 'center',
  },
  armyItem: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  armyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  armyName: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
  },
  armyActions: {
    flexDirection: 'row',
    gap: 12,
  },
  deleteButton: {
    marginLeft: 8,
  },
  armyInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  armyText: {
    color: '#aaa',
    fontSize: 14,
  },
  overLimit: {
    color: '#ff4444',
  },
  badge: {
    backgroundColor: '#703095',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  progressBar: {
    height: 6,
    backgroundColor: '#333',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#703095',
    borderRadius: 3,
  },
  progressOverLimit: {
    backgroundColor: '#ff4444',
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#703095',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
});
