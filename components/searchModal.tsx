import { Modal, View, StyleSheet, Text, Pressable, TextInput } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import {useWindowDimensions} from 'react-native';

type Props = {
  isVisible: boolean;
  onClose: () => void;
  onApply: (any) => void;
  filters: any
};

export default function SearchModal({ isVisible, onClose, filters }: Props) {
  const {width} = useWindowDimensions();
  return (
    <Modal animationType="slide" transparent={true} visible={isVisible}>
      <View style={{...styles.modalContent, width: width}}>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>{'Search'}</Text>
          <Pressable onPress={onClose}>
            <MaterialIcons name="close" color="#fff" size={22} />
          </Pressable>
        </View>
        <View>
          <TextInput
            placeholder='Card Name'
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
    modalContent: {
        flex: 1,
        height: '100%',
        backgroundColor: '#25292e',
        borderTopRightRadius: 18,
        borderTopLeftRadius: 18,
        position: 'absolute',
        bottom: 0,
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