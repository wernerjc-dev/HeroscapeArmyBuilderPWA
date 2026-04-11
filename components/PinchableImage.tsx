import { useRef } from 'react';
import { Animated, Image, StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

type Props = {
  source: number;
  width: number;
  height: number;
};

export default function PinchableImage({ source, width, height }: Props) {
  const scale = useRef(new Animated.Value(1)).current;
  const savedScale = useRef(1);

  const pinchGesture = Gesture.Pinch()
    .onUpdate((event) => {
      const newScale = savedScale.current * event.scale;
      scale.setValue(Math.min(Math.max(newScale, 1), 5));
    })
    .onEnd(() => {
      savedScale.current = Math.min(Math.max(Animated.getWebRef ? 1 : savedScale.current, 1), 5);
      if (savedScale.current < 1) {
        savedScale.current = 1;
        Animated.spring(scale, {
          toValue: 1,
          useNativeDriver: true,
        }).start();
      }
    });

  const doubleTapGesture = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      if (savedScale.current > 1) {
        savedScale.current = 1;
        Animated.spring(scale, {
          toValue: 1,
          useNativeDriver: true,
        }).start();
      } else {
        savedScale.current = 3;
        Animated.spring(scale, {
          toValue: 3,
          useNativeDriver: true,
        }).start();
      }
    });

  const composed = Gesture.Simultaneous(pinchGesture, doubleTapGesture);

  return (
    <View style={[styles.container, { width, height }]}>
      <GestureDetector gesture={composed}>
        <Animated.Image
          source={source}
          style={[
            styles.image,
            { width, height },
            { transform: [{ scale }] },
          ]}
          resizeMode="contain"
        />
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
  image: {
    resizeMode: 'contain',
  },
});
