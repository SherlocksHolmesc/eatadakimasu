import { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
} from 'react-native-reanimated';

const COLORS = {
  accent: '#ff2346',
  white: '#FFFFFF',
};

export function PacManLoader() {
  const mouthRotation = useSharedValue(0);
  const dot1Opacity = useSharedValue(1);
  const dot2Opacity = useSharedValue(1);
  const dot3Opacity = useSharedValue(1);

  useEffect(() => {
    mouthRotation.value = withRepeat(
      withSequence(
        withTiming(25, { duration: 200, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 200, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );

    dot1Opacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 100 }),
        withTiming(0.3, { duration: 300 })
      ),
      -1,
      false
    );

    dot2Opacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 300 }),
        withTiming(1, { duration: 100 }),
        withTiming(0.3, { duration: 300 })
      ),
      -1,
      false
    );

    dot3Opacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 600 }),
        withTiming(1, { duration: 100 }),
        withTiming(0.3, { duration: 300 })
      ),
      -1,
      false
    );
  }, []);

  const pacmanTopStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `-${mouthRotation.value}deg` }],
  }));

  const pacmanBottomStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${mouthRotation.value}deg` }],
  }));

  const dot1Style = useAnimatedStyle(() => ({
    opacity: dot1Opacity.value,
  }));

  const dot2Style = useAnimatedStyle(() => ({
    opacity: dot2Opacity.value,
  }));

  const dot3Style = useAnimatedStyle(() => ({
    opacity: dot3Opacity.value,
  }));

  return (
    <View style={styles.container}>
      <View style={styles.pacmanContainer}>
        <Animated.View style={[styles.pacmanTop, pacmanTopStyle]} />
        <Animated.View style={[styles.pacmanBottom, pacmanBottomStyle]} />
      </View>
      <View style={styles.dotsContainer}>
        <Animated.View style={[styles.dot, dot1Style]} />
        <Animated.View style={[styles.dot, dot2Style]} />
        <Animated.View style={[styles.dot, dot3Style]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pacmanContainer: {
    width: 60,
    height: 60,
    position: 'relative',
  },
  pacmanTop: {
    position: 'absolute',
    width: 60,
    height: 30,
    backgroundColor: COLORS.accent,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    top: 0,
    left: 0,
  },
  pacmanBottom: {
    position: 'absolute',
    width: 60,
    height: 30,
    backgroundColor: COLORS.accent,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    bottom: 0,
    left: 0,
  },
  dotsContainer: {
    flexDirection: 'row',
    marginLeft: 20,
    gap: 12,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.accent,
  },
});

