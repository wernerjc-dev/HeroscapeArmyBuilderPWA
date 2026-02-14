import {Modal, View, Text, Image, Pressable, StyleSheet, ScrollView} from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import ImageManifest from '@/data/ImageManifest.js';
import {useWindowDimensions} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ImageZoom } from '@likashefqet/react-native-image-zoom';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useState } from 'react';

type Props = {
  isVisible: boolean;
  onClose: () => void;
  data: any
};

export default function ArmyCardDetail({ isVisible, onClose, data }: Props) {
  const {width} = useWindowDimensions();
  const [showDetails, setShowDetails] = useState(true);

  return (
    <Modal animationType="slide" transparent={true} visible={isVisible}>
      <GestureHandlerRootView>
          <View style={{...styles.modalContent, width: width}}>
            <View style={styles.titleContainer}>
              <Text style={styles.title}>{data.name}</Text>
              <Pressable onPress={onClose}>
                <MaterialIcons name="close" color="#fff" size={22} />
              </Pressable>
            </View>
            <View style={{width: width, height: width, padding: '10px'}}>
                <ImageZoom
                    style={styles.image}
                    source={ImageManifest[data.localImagePath]}
                    minScale={1}
                    maxScale={5}
                    isPinchEnabled
                    isDoubleTapEnabled
                    doubleTapScale={3}
                    onInteractionStart={() => setShowDetails(false)}
                    onDoubleTap={() => setShowDetails(false)}
                    onResetAnimationEnd={() => setShowDetails(true)}
                />
            </View>
            {showDetails && <ScrollView style={styles.detailContainer}>
                    <View style={styles.textRow}>
                        <Text style={styles.textLabel}>Contemporary Legal:</Text>
                        <Text style={styles.text}>{data.attributes.contemporaryLegal ? "Yes" : "No"}</Text>
                    </View>
                    <View style={styles.textRow}>
                        <Text style={styles.textLabel}>Homeworld:</Text>
                        <Text style={styles.text}>{data.homeworld}</Text>
                    </View>
                    <View style={styles.textRow}>
                        <Text style={styles.textLabel}>Set:</Text>
                        <Text style={styles.text}>{data.set}</Text>
                    </View>
                    {(data.erratas && data.erratas) &&
                        <View style={styles.textColumn}>
                            <Text style={styles.textLabel}>Errata:</Text>
                            <Text style={{...styles.text, paddingLeft: 20, paddingBottom: 20}}>{data.erratas.replace(/<br\s*\/?>/g, '\n')}</Text>
                        </View>
                    }
                </ScrollView>
            }
          </View>
      </GestureHandlerRootView>
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
  image: {
    width: '100%',
    height: '100%',
    maxWidth: 600
  },
  detailContainer: {
    padding: 8
  },
  textRow: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
  },
  textColumn: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-start',
  },
  textLabel: {
    paddingLeft: 10,
    color: '#fff',
    fontSize: 20
  },
  text: {
    color: '#fff',
    paddingLeft: 10,
    fontSize: 18
  }

});