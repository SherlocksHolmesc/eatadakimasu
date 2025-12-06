import { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { PacManLoader } from '@/components/PacManLoader';

const COLORS = {
  white: '#FFFFFF',
};

export default function PreloaderScreen() {
  const router = useRouter();

  useEffect(() => {
    // Animate progress bar
    Animated.timing(progress, {
      toValue: 1,
      duration: 3000,
      easing: Easing.ease,
      useNativeDriver: false,
    }).start();

    // Animate Pacman eating
    Animated.timing(pacmanPosition, {
      toValue: 1,
      duration: 3000,
      easing: Easing.ease,
      useNativeDriver: true,
    }).start();

    // Navigate to login/register after 3 seconds
    const timer = setTimeout(() => {
      router.replace('/auth/login');
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <Animated.View
      style={styles.container}
      entering={FadeIn.duration(300)}
      exiting={FadeOut.duration(300)}
    >
      <PacManLoader />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
});