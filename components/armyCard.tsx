import { StyleSheet, StyleProp, ViewStyle, Pressable } from 'react-native';
import { Image } from 'expo-image';
import ImageManifest from '@/data/ImageManifest.js'

type Props = {
  imagePath: string;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  disabled?: boolean;
};

export default function ArmyCard({ imagePath, style, onPress, disabled }: Props) {
  const normalizedPath = imagePath ? imagePath.replace(/\\/g, '/') : '';
  return (
    <Pressable onPress={onPress} style={{ flex: 1, opacity: disabled ? 0.4 : 1 }}>
      <Image 
        source={ImageManifest[normalizedPath]} 
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
