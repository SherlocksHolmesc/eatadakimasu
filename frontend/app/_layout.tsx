import { Stack } from 'expo-router';
import { ConvexProvider, ConvexReactClient } from 'convex/react';
import Constants from 'expo-constants';

// Get Convex URL from environment
const convexUrl = Constants.expoConfig?.extra?.EXPO_PUBLIC_CONVEX_URL || 
                  process.env.EXPO_PUBLIC_CONVEX_URL || 
                  'https://famous-shepherd-2.convex.cloud';

// Initialize Convex client
const convex = new ConvexReactClient(convexUrl);

export default function RootLayout() {
  return (
    <ConvexProvider client={convex}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="auth/login" />
        <Stack.Screen name="auth/register" />
        <Stack.Screen name="landing" />
        <Stack.Screen name="solo-setup" />
        <Stack.Screen name="group-mode" />
        <Stack.Screen name="room-waiting" />
        <Stack.Screen name="preferences" />
        <Stack.Screen name="preferences-waiting" />
        <Stack.Screen name="swipe" />
        <Stack.Screen name="results" />
      </Stack>
    </ConvexProvider>
  );
}

