import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { StyleSheet } from 'react-native';

export default function RootLayout() {
  useFrameworkReady();

  return (
    <GestureHandlerRootView style={styles.container}>
      <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="landing" />
        <Stack.Screen name="group-mode" />
        <Stack.Screen name="solo-setup" />
        <Stack.Screen name="group/room" />
        <Stack.Screen name="group/location" />
        <Stack.Screen name="group/preferences" />
        <Stack.Screen name="group/budget" />
        <Stack.Screen name="preferences" />
        <Stack.Screen name="swipe" />
        <Stack.Screen name="results" />
      </Stack>
      <StatusBar style="dark" />
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

