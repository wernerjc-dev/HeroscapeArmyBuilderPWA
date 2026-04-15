import { View, StyleSheet, Text } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, runOnJS } from 'react-native-reanimated';
import { Image } from 'expo-image';
import ImageManifest from '@/data/ImageManifest.js';

type Props = {
  imagePath: string;
  armyCost: number;
  quantity: number;
  onAdd: () => void;
  onRemove: () => void;
  onViewDetails: () => void;
  disabled?: boolean;
  showCost?: boolean;
};

const SWIPE_THRESHOLD = 40;

export default function SelectableCard({ imagePath, armyCost, quantity, onAdd, onRemove, onViewDetails, disabled, showCost = true }: Props) {
  const translateX = useSharedValue(0);
  const normalizedPath = imagePath ? imagePath.replace(/\\/g, '/') : '';

  const panGesture = Gesture.Pan()
    .activeOffsetX([-10, 10])
    .failOffsetY([-5, 5])
    .onUpdate((e) => {
      // Allow vertical scrolling - only move for horizontal
      if (Math.abs(e.translationX) > Math.abs(e.translationY)) {
        translateX.value = e.translationX;
      }
    })
    .onEnd((e) => {
      // Only trigger for horizontal swipe, not vertical scroll
      if (Math.abs(e.translationX) > Math.abs(e.translationY)) {
        if (e.translationX < -SWIPE_THRESHOLD) {
          runOnJS(onRemove)();
        } else if (e.translationX > SWIPE_THRESHOLD) {
          runOnJS(onAdd)();
        }
      }
      translateX.value = withSpring(0);
    });

  const longPressGesture = Gesture.LongPress()
    .minDuration(400)
    .onEnd(() => {
      runOnJS(onViewDetails)();
    });

  const tapGesture = Gesture.Tap()
    .onEnd(() => {
      runOnJS(onAdd)();
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <View style={styles.container}>
      <View style={styles.actionHint}>
        <Text style={styles.actionText}>← Remove</Text>
        <Text style={styles.actionText}>Add →</Text>
      </View>
      <GestureDetector gesture={panGesture}>
        <Animated.View style={[styles.cardWrapper, animatedStyle, disabled && styles.disabled]}>
          <GestureDetector gesture={longPressGesture}>
            <GestureDetector gesture={tapGesture}>
              <View style={styles.cardInner}>
                <Image
                  source={ImageManifest[normalizedPath]}
                  style={styles.image}
                  contentFit="contain"
                />
                {quantity > 0 && (
                  <View style={styles.quantityBadge}>
                    <Text style={styles.quantityText}>{quantity}</Text>
                  </View>
                )}
                {showCost && (
                  <View style={styles.costBadge}>
                    <Text style={styles.costText}>{armyCost}</Text>
                  </View>
                )}
              </View>
            </GestureDetector>
          </GestureDetector>
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 6,
    marginLeft: -5
  },
  actionHint: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 10,
    zIndex: -1,
  },
  actionText: {
    color: '#666',
    fontSize: 12,
    fontWeight: 'bold',
  },
  cardWrapper: {
    flex: 1,
    aspectRatio: 1,
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    overflow: 'hidden',
  },
  cardInner: {
    flex: 1,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  costBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: '#703095',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  costText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  quantityBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
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
  disabled: {
    opacity: 0.5,
  },
});