import { useState } from 'react';
import { Modal, View, Text, Pressable, StyleSheet, ScrollView, Image, useWindowDimensions } from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, runOnJS } from 'react-native-reanimated';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import ImageManifest from '@/data/ImageManifest.js';

type Props = {
  isVisible: boolean;
  onClose: () => void;
  data: any
};

function ZoomableImage({ uri }: { uri: any }) {
  const scale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedScale = useSharedValue(1);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);

  const pinchGesture = Gesture.Pinch()
    .onUpdate((e) => {
      const newScale = savedScale.value * e.scale;
      scale.value = Math.max(1, Math.min(4, newScale));
    })
    .onEnd(() => {
      if (scale.value < 1) {
        scale.value = withSpring(1);
        savedScale.value = 1;
      } else if (scale.value > 4) {
        scale.value = withSpring(4);
        savedScale.value = 4;
      } else {
        savedScale.value = scale.value;
      }
    });

  const panGesture = Gesture.Pan()
    .onUpdate((e) => {
      if (scale.value > 1) {
        translateX.value = savedTranslateX.value + e.translationX;
        translateY.value = savedTranslateY.value + e.translationY;
      }
    })
    .onEnd(() => {
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    });

  const resetZoom = () => {
    scale.value = withSpring(1);
    translateX.value = withSpring(0);
    translateY.value = withSpring(0);
    savedScale.value = 1;
    savedTranslateX.value = 0;
    savedTranslateY.value = 0;
  };

  const doubleTapGesture = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      runOnJS(resetZoom)();
    });

  const composed = Gesture.Simultaneous(pinchGesture, panGesture, doubleTapGesture);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  return (
    <View style={styles.imageWrapper}>
      <GestureDetector gesture={composed}>
        <Animated.View style={[styles.imageContainer, animatedStyle]}>
          <Image source={uri} style={styles.image} resizeMode="contain" />
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

export default function ArmyCardDetail({ isVisible, onClose, data }: Props) {
  const { width, height } = useWindowDimensions();

  if (!data || !data.localImagePath) return null;

  const imagePath = data.localImagePath.replace(/\\/g, '/');
  const imageSource = ImageManifest[imagePath];

  return (
    <Modal animationType="slide" transparent={true} visible={isVisible}>
      <GestureHandlerRootView style={styles.gestureRoot}>
        <SafeAreaView style={[styles.modalContainer, { height }]} edges={['bottom']}>
          <View style={[styles.modalContent, { width, height }]}>
            <Pressable onPress={onClose} style={styles.titleContainer}>
              <Text style={styles.title}>{data.name}</Text>
              <MaterialIcons name="close" color="#fff" size={22} />
            </Pressable>
            <View style={[styles.zoomContainer, { height: width }]}>
              {imageSource ? (
                <ZoomableImage uri={imageSource} />
              ) : (
                <Text style={styles.noImage}>Image not found</Text>
              )}
            </View>
            <ScrollView style={styles.detailContainer} contentContainerStyle={styles.detailContent}>
              <View style={styles.textRow}>
                <Text style={styles.textLabel}>Contemporary Legal:</Text>
                <Text style={styles.text}>{data.attributes?.contemporaryLegal ? "Yes" : "No"}</Text>
              </View>
              <View style={styles.textRow}>
                <Text style={styles.textLabel}>Homeworld:</Text>
                <Text style={styles.text}>{data.homeworld}</Text>
              </View>
              <View style={styles.textRow}>
                <Text style={styles.textLabel}>Set:</Text>
                <Text style={styles.text}>{data.set}</Text>
              </View>
              {(data.erratas && data.erratas) && (
                <View style={styles.textColumn}>
                  <Text style={styles.textLabel}>Errata:</Text>
                  <Text style={styles.errataText}>
                    {data.erratas.replace(/<br\s*\/?>/g, '\n')}
                  </Text>
                </View>
              )}
            </ScrollView>
          </View>
        </SafeAreaView>
      </GestureHandlerRootView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  gestureRoot: {
    flex: 1,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    flex: 1,
    backgroundColor: '#25292e',
    borderTopRightRadius: 18,
    borderTopLeftRadius: 18,
  },
  titleContainer: {
    height: 50,
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
    fontWeight: 'bold',
  },
  zoomContainer: {
    overflow: 'hidden',
  },
  imageWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageContainer: {
    width: '100%',
    height: '100%',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  noImage: {
    color: '#aaa',
    fontSize: 14,
  },
  detailContainer: {
    flex: 1,
    padding: 16,
  },
  detailContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  textRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  textColumn: {
    marginTop: 8,
  },
  textLabel: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  text: {
    color: '#aaa',
    fontSize: 16,
    marginLeft: 8,
  },
  errataText: {
    color: '#aaa',
    fontSize: 16,
    marginTop: 4,
    paddingLeft: 20,
  },
});