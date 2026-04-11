import { StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { Image } from 'expo-image';
import ImageManifest from '@/data/ImageManifest.js'
import { useWindowDimensions } from 'react-native';

type Props = {
  imagePath: string;
  style?: StyleProp<ViewStyle>;
};

export default function ArmyCard({ imagePath, style }: Props) {
  return (
    <Image 
      source={ImageManifest[imagePath]} 
      style={[styles.image, style]}
      contentFit="contain"
    />
  );
}

const styles = StyleSheet.create({
  image: {
    width: '100%',
    height: '100%',
  },
});
