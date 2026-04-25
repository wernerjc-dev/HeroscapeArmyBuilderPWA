import {useState} from 'react';
import { Modal, View, StyleSheet, Text, Pressable, TextInput, Button, FlatList, ScrollView, Switch } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import {useWindowDimensions} from 'react-native';
import { Checkbox } from 'expo-checkbox';
import Accordion from '@/components/accordion.tsx'

type Props = {
  isVisible: boolean;
  onClose: () => void;
  onApply: (any) => void;
  filters: any;
  filterOptions: any;
};

export default function SearchModal({ isVisible, onClose, onApply, filters, filterOptions }: Props) {
  const {width} = useWindowDimensions();
  const [affiliations, setAffiliations] = useState(filters?.affiliations || []);
  const [armyCost, setArmyCost] = useState(filters?.armyCost || undefined);
  const [armyCostOperators, setArmyCostOperators] = useState(filters?.armyCostOperators || ['=']);
  const [cardName, onChangeCardName] = useState(filters?.cardName || undefined);
  const [cardText, onChangeCardText] = useState(filters?.cardText || undefined);
  const [cardTypes, setCardTypes] = useState(filters?.cardTypes || []);
  const [contemporaryLegal, setContemporaryLegal] = useState(filters?.contemporaryLegal || undefined);
  const [sizes, setSizes] = useState(filters?.sizes || []);
  const [species, setSpecies] = useState(filters?.species || []);
  const [classes, setClasses] = useState(filters?.classes || []);
  const [personalities, setPersonalities] = useState(filters?.personalities || []);
  const [homeworlds, setHomeworlds] = useState(filters?.homeworlds || []);
  const [sets, setSets] = useState(filters?.sets || []);

  const onApplyPress = () => {
    const filters = {
      affiliations: affiliations,
      armyCost: armyCost,
      armyCostOperators: armyCostOperators,
      cardName: cardName,
      cardText: cardText,
      cardTypes: cardTypes,
      contemporaryLegal: contemporaryLegal,
      sizes: sizes,
      species: species,
      classes: classes,
      personalities: personalities,
      homeworlds: homeworlds,
      sets: sets
    };
    onApply(filters);
  }

  const onClearPress = () => {
    setAffiliations([]);
    setArmyCost(undefined);
    setArmyCostOperators(['=']);
    onChangeCardName(undefined);
    onChangeCardText(undefined);
    setCardTypes([]);
    setContemporaryLegal(undefined);
    setSizes([]);
    setSpecies([]);
    setClasses([]);
    setPersonalities([]);
    setHomeworlds([]);
    setSets([]);
  }

  const onAffiliationChange = (affiliation: any) => {
    if(affiliations.includes(affiliation)) {
        const tempAffiliations = affiliations.filter(a => a !== affiliation);
        setAffiliations(tempAffiliations);
    }
    else setAffiliations([...affiliations, affiliation]);
  }

  const onArmyCostOperatorChange = (operator: any) => {
    if(armyCostOperators.includes(operator)) {
        const tempOperators = armyCostOperators.filter(o => o !== operator);
        setArmyCostOperators(tempOperators);
    }
    else setArmyCostOperators([...armyCostOperators, operator]);
  }

  const handleArmyCostChange = (value) => {
    const cleanValue = value.replace(/[^0-9.]/g, '');
    setArmyCost(cleanValue);
    //const numericValue = parseFloat(cleanValue);
  };

  const onCardTypeChange = (cardType: any) => {
      if(cardTypes.includes(cardType)) {
          const tempCardTypes = cardTypes.filter(c => c !== cardType);
          setCardTypes(tempCardTypes);
      }
      else setCardTypes([...cardTypes, cardType]);
  }

  const onSizeChange = (size: any) => {
      if(sizes.includes(size)) {
          const tempSizes = sizes.filter(c => c !== size);
          setSizes(tempSizes);
      }
      else setSizes([...sizes, size]);
  }

  const onSpeciesChange = (sp: any) => {
      if(species.includes(sp)) {
          const tempSpecies = species.filter(c => c !== sp);
          setSpecies(tempSpecies);
      }
      else setSpecies([...species, sp]);
  }

  const onClassChange = (cl: any) => {
      if(classes.includes(cl)) {
          const tempClasses = classes.filter(c => c !== cl);
          setClasses(tempClasses);
      }
      else setClasses([...classes, cl]);
  }

  const onPersonalityChange = (personality: any) => {
      if(personalities.includes(personality)) {
          const tempPersonalities = personalities.filter(c => c !== personality);
          setPersonalities(tempPersonalities);
      }
      else setPersonalities([...personalities, personality]);
  }

  const onHomeworldChange = (homeworld: any) => {
      if(homeworlds.includes(homeworld)) {
          const tempHomeworlds = homeworlds.filter(c => c !== homeworld);
          setHomeworlds(tempHomeworlds);
      }
      else setHomeworlds([...homeworlds, homeworld]);
  }

  const onSetChange = (set: any) => {
      if(sets.includes(set)) {
          const tempSets = sets.filter(c => c !== set);
          setSets(tempSets);
      }
      else setSets([...sets, set]);
  }

  return (
    <Modal animationType="slide" transparent={true} visible={isVisible}>
      <View style={{...styles.modalContent, width: width}}>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>{'Search'}</Text>
          <Pressable onPress={onClose}>
            <MaterialIcons name="close" color="#fff" size={22} />
          </Pressable>
        </View>
        <View style={styles.buttonRow}>
            <View style={{flex: 0.5}}>
              <Button
                color='#703095'
                title='Clear'
                onPress={onClearPress}
              />
            </View>
            <View style={{flex: 0.5}}>
              <Button
                color='#703095'
                title='Apply'
                onPress={onApplyPress}
              />
            </View>
        </View>
        <ScrollView>
            <Accordion title='Affiliation' style={styles.accordion} startOpen>
                <View style={styles.columnWrapper}>
                    {filterOptions.affiliationOptions.map(item => {
                        return (
                            <View key={item} style={{...styles.row, padding: '8', width: '48%'}}>
                               <Checkbox
                                   value={affiliations?.includes(item)}
                                   onValueChange={() => onAffiliationChange(item)}
                                   color={affiliations?.includes(item) ? '#703095' : undefined}
                               />
                               <Text style={styles.checkboxLabel}>{item}</Text>
                           </View>
                        );
                    })}
                </View>
            </Accordion>
            <View style={styles.textBoxRow}>
              <TextInput
                style={{...styles.formElement, width: '100%'}}
                placeholder='Card Name'
                placeholderTextColor='#fff'
                value={cardName}
                onChangeText={onChangeCardName}
              />
            </View>
            <View style={styles.textBoxRow}>
              <TextInput
                style={{...styles.formElement, width: '100%'}}
                placeholder='Card Text'
                placeholderTextColor='#fff'
                value={cardText}
                onChangeText={onChangeCardText}
              />
            </View>
            <View style={styles.textBoxRow}>
              <TextInput
                style={{...styles.formElement, width: '50%'}}
                placeholder="Points"
                placeholderTextColor='#fff'
                value={armyCost}
                onChangeText={handleArmyCostChange}
                keyboardType="numeric" // Displays a numeric keyboard
              />
              <View style={{...styles.columnWrapper, width: '50%', flexWrap: 'no-wrap', paddingLeft: 0}}>
                {filterOptions.armyCostOperatorOptions.map(item => {
                    return (
                      <View key={item} style={{...styles.row, padding: '8', width: '30%'}}>
                        <Checkbox
                            value={armyCostOperators?.includes(item)}
                            onValueChange={() => onArmyCostOperatorChange(item)}
                            color={armyCostOperators?.includes(item) ? '#703095' : undefined}
                        />
                        <Text style={styles.checkboxLabel}>{item}</Text>
                      </View>
                    );
                })}
              </View>
            </View>
            <View style={{...styles.textBoxRow, paddingVertical: 0}}>
                <Switch
                    value={contemporaryLegal}
                    onValueChange={setContemporaryLegal}
                    trackColor={{false: '#767577', true: '#9a6eb4'}}
                    thumbColor={contemporaryLegal ? '#703095' : '#f4f3f4'}
                />
                <Text style={styles.checkboxLabel}>Contemporary Legal</Text>
            </View>
            <Accordion title='Card Type' style={styles.accordion}>
                <View style={styles.columnWrapper}>
                    {filterOptions.cardTypeOptions.map(item => {
                        return (
                            <View key={item} style={{...styles.row, padding: '8', width: '48%'}}>
                                <Checkbox
                                    value={cardTypes?.includes(item)}
                                    onValueChange={() => onCardTypeChange(item)}
                                    color={cardTypes?.includes(item) ? '#703095' : undefined}
                                />
                                <Text style={styles.checkboxLabel}>{item}</Text>
                            </View>
                        );
                    })}
                </View>
            </Accordion>
            <Accordion title='Size' style={styles.accordion}>
                <View style={styles.columnWrapper}>
                    {filterOptions.sizeOptions.map(item => {
                        return (
                            <View key={item} style={{...styles.row, padding: '8', width: '48%'}}>
                                <Checkbox
                                    value={sizes?.includes(item)}
                                    onValueChange={() => onSizeChange(item)}
                                    color={sizes?.includes(item) ? '#703095' : undefined}
                                />
                                <Text style={styles.checkboxLabel}>{item}</Text>
                            </View>
                        );
                    })}
                </View>
            </Accordion>
            <Accordion title='Species' style={styles.accordion}>
                <View style={styles.columnWrapper}>
                    {filterOptions.speciesOptions.map(item => {
                        return (
                            <View key={item} style={{...styles.row, padding: '8', width: '48%'}}>
                                <Checkbox
                                    value={species?.includes(item)}
                                    onValueChange={() => onSpeciesChange(item)}
                                    color={species?.includes(item) ? '#703095' : undefined}
                                />
                                <Text style={styles.checkboxLabel}>{item}</Text>
                            </View>
                        );
                    })}
                </View>
            </Accordion>
            <Accordion title='Class' style={styles.accordion}>
                <View style={styles.columnWrapper}>
                    {filterOptions.classOptions.map(item => {
                        return (
                            <View key={item} style={{...styles.row, padding: '8', width: '48%'}}>
                                <Checkbox
                                    value={classes?.includes(item)}
                                    onValueChange={() => onClassChange(item)}
                                    color={classes?.includes(item) ? '#703095' : undefined}
                                />
                                <Text style={styles.checkboxLabel}>{item}</Text>
                            </View>
                        );
                    })}
                </View>
            </Accordion>
            <Accordion title='Personality' style={styles.accordion}>
                <View style={styles.columnWrapper}>
                    {filterOptions.personalityOptions.map(item => {
                        return (
                            <View key={item} style={{...styles.row, padding: '8', width: '48%'}}>
                                <Checkbox
                                    value={personalities?.includes(item)}
                                    onValueChange={() => onPersonalityChange(item)}
                                    color={personalities?.includes(item) ? '#703095' : undefined}
                                />
                                <Text style={styles.checkboxLabel}>{item}</Text>
                            </View>
                        );
                    })}
                </View>
            </Accordion>
            <Accordion title='Homeworld' style={styles.accordion}>
                <View style={styles.columnWrapper}>
                    {filterOptions.homeworldOptions.map(item => {
                        return (
                            <View key={item} style={{...styles.row, padding: '8', width: '48%'}}>
                                <Checkbox
                                    value={homeworlds?.includes(item)}
                                    onValueChange={() => onHomeworldChange(item)}
                                    color={homeworlds?.includes(item) ? '#703095' : undefined}
                                />
                                <Text style={styles.checkboxLabel}>{item}</Text>
                            </View>
                        );
                    })}
                </View>
            </Accordion>
            <Accordion title='Set' style={styles.accordion}>
                <View style={styles.columnWrapper}>
                    {filterOptions.setOptions.map(item => {
                        return (
                            <View key={item} style={{...styles.row, padding: '8', width: '48%'}}>
                                <Checkbox
                                    value={sets?.includes(item)}
                                    onValueChange={() => onSetChange(item)}
                                    color={sets?.includes(item) ? '#703095' : undefined}
                                />
                                <Text style={styles.checkboxLabel}>{item}</Text>
                            </View>
                        );
                    })}
                </View>
            </Accordion>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
    accordion: {
        paddingHorizontal: 8,
        marginBottom: 4,
        paddingVertical: 4
    },
    buttonRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        padding: 8
    },
    checkboxLabel: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold'
    },
    columnWrapper: {
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        paddingHorizontal: 8
    },
    formElement: {
        backgroundColor: '#464C55',
        color: '#fff',
        padding: 12
    },
    header: {
        color: '#fff',
        fontSize: 20,
        fontWeight: 'bold',
        paddingHorizontal: 8,
        paddingVertical: 4
    },
    modalContent: {
        flex: 1,
        height: '100%',
        backgroundColor: '#25292e',
        borderTopRightRadius: 18,
        borderTopLeftRadius: 18,
        position: 'absolute',
        bottom: 0,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingVertical: 4
    },
    section: {
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        backgroundColor: '#464C55',
        marginTop: 8,
        paddingVertical: 4,
        paddingHorizontal: 8
    },
    textBoxRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingVertical: 4,
        paddingHorizontal: 8
    },
    titleContainer: {
        height: '5%',
        backgroundColor: '#464C55',
        borderTopRightRadius: 10,
        borderTopLeftRadius: 10,
        paddingHorizontal: 20,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    title: {
        color: '#fff',
        fontSize: 16,
    },
});