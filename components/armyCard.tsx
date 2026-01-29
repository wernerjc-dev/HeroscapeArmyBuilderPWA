import { View, StyleSheet, Pressable } from 'react-native';
import { Image } from 'expo-image';
import ImageManifest from '@/data/ImageManifest.js'

type Props = {
  imagePath: string;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
};

export default function ArmyCard({imagePath, style, onPress}: Props) {
  return (
      <Pressable onPress={onPress ? onPress : ()=>{}}>
         <Image source={ImageManifest[imagePath]} style={styles.image}/>
      </Pressable>
  );
}

const styles = StyleSheet.create({
  image: {
    width: '100%',
    height: '100%',
  },
});