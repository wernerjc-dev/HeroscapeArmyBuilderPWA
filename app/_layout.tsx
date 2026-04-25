import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useServiceWorker } from '@/utils/useServiceWorker';

export default function RootLayout() {
  useServiceWorker();

  return (
    <SafeAreaProvider>
        <GestureHandlerRootView>
            <Stack 
              screenOptions={{ 
                headerShown: false,
              }}
            >
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen name="+not-found" />
            </Stack>
            <StatusBar style="light" translucent={true} />
        </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}
