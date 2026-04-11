import { StyleSheet, StyleProp, ViewStyle, Pressable } from 'react-native';
import { Image } from 'expo-image';
import ImageManifest from '@/data/ImageManifest.js'

type Props = {
  imagePath: string;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
};

export default function ArmyCard({ imagePath, style, onPress }: Props) {
  return (
    <Pressable onPress={onPress} style={{ flex: 1 }}>
      <Image 
        source={ImageManifest[imagePath]} 
        style={[styles.image, style]}
        contentFit="contain"
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  image: {
    width: '100%',
    height: '100%',
  },
});
