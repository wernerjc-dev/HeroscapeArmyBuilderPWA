import { View, StyleSheet, FlatList, Button } from 'react-native';
import { useState, useEffect } from 'react';
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
  const [filteredCards, setFilteredCards] = useState<any>(data.cards);
  const [filterOptions, setFilterOptions] = useState<any>({});

  useEffect(() => {
      const affiliationOptions = data.cards.reduce((accumulator, currentItem) => {
        const value = currentItem.faction;
        if (!accumulator.includes(value)) {
            accumulator.push(value);
        }
        return accumulator;
      }, []);

      const cardTypeOptions = data.cards.reduce((accumulator, currentItem) => {
          const value = currentItem.type;
          if (!accumulator.includes(value)) {
              accumulator.push(value);
          }
          return accumulator;
      }, []);

      const sizeOptions = data.cards.reduce((accumulator, currentItem) => {
          const value = currentItem.attributes.size;
          if (!accumulator.includes(value)) {
              accumulator.push(value);
          }
        return accumulator;
      }, []);

      const speciesOptions = data.cards.reduce((accumulator, currentItem) => {
          const value = currentItem.attributes.species;
          if (!accumulator.includes(value)) {
              accumulator.push(value);
          }
          return accumulator;
      }, []);

      const classOptions = data.cards.reduce((accumulator, currentItem) => {
          const value = currentItem.attributes.class;
          if (!accumulator.includes(value)) {
              accumulator.push(value);
          }
          return accumulator;
      }, []);

      const personalityOptions = data.cards.reduce((accumulator, currentItem) => {
          const value = currentItem.attributes.personality;
          if (!accumulator.includes(value)) {
              accumulator.push(value);
          }
          return accumulator;
      }, []);

      const homeworldOptions = data.cards.reduce((accumulator, currentItem) => {
          const value = currentItem.homeworld;
          if (!accumulator.includes(value)) {
              accumulator.push(value);
          }
          return accumulator;
      }, []);

      const setOptions = data.cards.reduce((accumulator, currentItem) => {
          const value = currentItem.set;
          if (!accumulator.includes(value)) {
              accumulator.push(value);
          }
          return accumulator;
      }, []);

      setFilterOptions({
         affiliationOptions: affiliationOptions.sort(),
         armyCostOperatorOptions: ['<','=','>'],
         cardTypeOptions: cardTypeOptions.sort(),
         sizeOptions: sizeOptions.sort(),
         speciesOptions: speciesOptions.sort(),
         classOptions: classOptions.sort(),
         personalityOptions: personalityOptions.sort(),
         homeworldOptions: homeworldOptions.sort(),
         setOptions: setOptions.sort()
      });
  },[]);

  const onCardPress = (cardData: any) => {
    setSelectedCardData(cardData);
    setOpenCardDetail(true);
  }

  const onSearchApply = (filters: any) => {
    setSearchFilters(filters);
    setOpenSearch(false);

    var filteredList = data.cards;
    if(filters.affiliations?.length > 0) filteredList = filteredList.filter((c:any) => filters.affiliations.includes(c.faction));
    if(filters.armyCost && filters.armyCost !== '') {
        if(filters.armyCostOperators.length === 0){
            filteredList = filteredList.filter((c:any) => c.armyCost === parseInt(filters.armyCost));
        }
        else{
            filteredList = filteredList.filter((c:any) =>
                (filters.armyCostOperators.includes('=') && c.armyCost === parseInt(filters.armyCost)) ||
                (filters.armyCostOperators.includes('>') && c.armyCost > parseInt(filters.armyCost)) ||
                (filters.armyCostOperators.includes('<') && c.armyCost < parseInt(filters.armyCost))
            );
        }
    }
    if(filters.cardName) filteredList = filteredList.filter((c:any) => c.name.includes(filters.cardName));
    if(filters.cardText) filteredList = filteredList.filter((c:any) => {
        return c.name?.includes(filters.cardText) ||
            c.type?.includes(filters.cardText) ||
            c.faction?.includes(filters.cardText) ||
            c.abilities.some((a:any) => a.name?.includes(filters.cardText) || a.description?.includes(filters.cardText)) ||
            c.attributes.species?.includes(filters.cardText) ||
            c.attributes.class?.includes(filters.cardText) ||
            c.attributes.personality?.includes(filters.cardText) ||
            c.attributes.size?.includes(filters.cardText)
    });
    if(filters.contemporaryLegal) filteredList = filteredList.filter((c:any) => c.attributes.contemporaryLegal);
    if(filters.cardTypes?.length > 0) filteredList = filteredList.filter((c:any) => filters.cardTypes.includes(c.type));
    if(filters.sizes?.length > 0) filteredList = filteredList.filter((c:any) => filters.sizes.includes(c.attributes.size));
    if(filters.species?.length > 0) filteredList = filteredList.filter((c:any) => filters.species.includes(c.attributes.species));
    if(filters.classes?.length > 0) filteredList = filteredList.filter((c:any) => filters.classes.includes(c.attributes.class));
    if(filters.personalities?.length > 0) filteredList = filteredList.filter((c:any) => filters.personalities.includes(c.attributes.personality));
    if(filters.homeworlds?.length > 0) filteredList = filteredList.filter((c:any) => filters.homeworlds.includes(c.homeworld));
    if(filters.sets?.length > 0) filteredList = filteredList.filter((c:any) => filters.sets.includes(c.set));

    setFilteredCards(filteredList);
  }

  const onClearFilters = () => {
    setSearchFilters({});
    setFilteredCards(data.cards);
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
        <Button
            style={styles.searchButton}
            color='#703095'
            title='Clear Filters'
            onPress={() => onClearFilters()}
        />
      </View>
      <FlatList
        data={filteredCards}
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
          <SearchModal isVisible={openSearch} onClose={() => setOpenSearch(false)} onApply={onSearchApply} filters={searchFilters} filterOptions={filterOptions}/>
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
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    padding: 8
  },
  searchButton: {

  },
  text: {
    color: '#fff',
  },
});
