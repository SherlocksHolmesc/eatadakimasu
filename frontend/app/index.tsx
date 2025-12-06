import { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { PacManLoader } from '../components/PacManLoader';

const COLORS = {
  stone50: '#fafaf9',
};

export default function PreloaderScreen() {
  const router = useRouter();

  useEffect(() => {
    // Navigate to login/register after 4 seconds (matching new UI timing)
    const timer = setTimeout(() => {
      router.replace('/auth/login');
    }, 4000);

    return () => clearTimeout(timer);
  }, [router]);

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
    backgroundColor: COLORS.stone50,
    justifyContent: 'center',
    alignItems: 'center',
  },
});