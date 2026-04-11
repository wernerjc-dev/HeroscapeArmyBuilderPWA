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
};

const SWIPE_THRESHOLD = 50;

export default function SelectableCard({ imagePath, armyCost, quantity, onAdd, onRemove, onViewDetails, disabled }: Props) {
  const translateX = useSharedValue(0);

  const handleAdd = () => {
    onAdd();
  };

  const handleRemove = () => {
    onRemove();
  };

  const panGesture = Gesture.Pan()
    .minDistance(20)
    .onUpdate((e) => {
      if (Math.abs(e.translationX) > Math.abs(e.translationY)) {
        translateX.value = e.translationX;
      }
    })
    .onEnd((e) => {
      if (Math.abs(e.translationX) > Math.abs(e.translationY)) {
        if (e.translationX < -SWIPE_THRESHOLD) {
          runOnJS(handleRemove)();
        } else if (e.translationX > SWIPE_THRESHOLD) {
          runOnJS(handleAdd)();
        }
      }
      translateX.value = withSpring(0);
    });

  const longPressGesture = Gesture.LongPress()
    .minDuration(500)
    .onEnd(() => {
      runOnJS(onViewDetails)();
    });

  const singleTapGesture = Gesture.Tap()
    .onEnd(() => {
      runOnJS(handleAdd)();
    });

  const composed = Gesture.Race(
    longPressGesture,
    Gesture.Simultaneous(panGesture, singleTapGesture)
  );

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <View style={styles.container}>
      <View style={styles.actionHint}>
        <Text style={styles.actionText}>← Add</Text>
        <Text style={styles.actionText}>Remove →</Text>
      </View>
      <GestureDetector gesture={composed}>
        <Animated.View style={[styles.cardWrapper, animatedStyle, disabled && styles.disabled]}>
          <View style={styles.cardInner}>
            <Image
              source={ImageManifest[imagePath]}
              style={styles.image}
              contentFit="contain"
            />
            <View style={styles.costBadge}>
              <Text style={styles.costText}>{armyCost}</Text>
            </View>
            {quantity > 0 && (
              <View style={styles.quantityBadge}>
                <Text style={styles.quantityText}>{quantity}</Text>
              </View>
            )}
          </View>
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 4,
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
    top: 4,
    right: 4,
    backgroundColor: '#703095',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  costText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  quantityBadge: {
    position: 'absolute',
    bottom: 4,
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
