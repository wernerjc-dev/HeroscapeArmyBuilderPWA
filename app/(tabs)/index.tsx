import { View, StyleSheet, FlatList, Button } from 'react-native';
import { useState } from 'react';
import { Image } from 'expo-image';
import { useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import data from '@/data/heroscape-cards.json';
import ArmyCard from '@/components/armyCard.tsx';
import ArmyCardDetail from '@/components/armyCardDetail.tsx';
import SearchModal from '@/components/searchModal.tsx';


export default function SearchScreen() {
  const {height, width} = useWindowDimensions();
  const [selectedCardData, setSelectedCardData] = useState<any | undefined>(undefined);
  const [openCardDetail, setOpenCardDetail] = useState<boolean>(false);
  const [openSearch, setOpenSearch] = useState<boolean>(false);
  const [searchFilters, setSearchFilters] = useState<any | undefined>(undefined);

  const onCardPress = (cardData: any) => {
    setSelectedCardData(cardData);
    setOpenCardDetail(true);
  }

  const onSearchApply = (filters: any) => {
    setSearchFilters(filters);
    setOpenSearch(false);
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Button
            style={styles.searchButton}
            color='#703095'
            title='Search'
            onPress={() => setOpenSearch(true)}
        />
      </View>
      <FlatList
        data={data.cards}
        renderItem={({item}) => <View style={{width: width/2, height: width/2, padding: 5}}>
            <ArmyCard imagePath={item.localImagePath} onPress={() => onCardPress(item)}/>
          </View>
        }
        keyExtractor={item => item.id}
        horizontal={false}
        numColumns="2"
        columnWrapperStyle={styles.columnWrapper}
      />
      {selectedCardData !== undefined &&
          <ArmyCardDetail isVisible={openCardDetail} onClose={() => setOpenCardDetail(false)} data={selectedCardData}/>
      }
      {openSearch === true &&
          <SearchModal isVisible={openSearch} onClose={() => setOpenSearch(false)} onApply={onSearchApply} filters={searchFilters}/>
      }
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#25292e',
    justifyContent: 'center',
    alignItems: 'center',
  },
  columnWrapper: {
    justifyContent: 'space-evenly',
  },
  header: {
    backgroundColor: '#101010',
    width: '100%',
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'center',
    padding: 8
  },
  searchButton: {

  },
  text: {
    color: '#fff',
  },
});
