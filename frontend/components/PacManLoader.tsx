import { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
} from 'react-native-reanimated';

const COLORS = {
  accent: '#dc2626', // red-600
  white: '#FFFFFF',
  stone50: '#fafaf9',
};

const FOOD_EMOJIS = ['🍔', '🍕', '🍣', '🍩', '🦐'];

export function PacManLoader() {
  const mouthRotation = useSharedValue(0);
  const pacmanPosition = useSharedValue(0);
  const foodOpacity1 = useSharedValue(1);
  const foodOpacity2 = useSharedValue(1);
  const foodOpacity3 = useSharedValue(1);
  const foodOpacity4 = useSharedValue(1);
  const foodOpacity5 = useSharedValue(1);

  useEffect(() => {
    // Pac-Man mouth animation
    mouthRotation.value = withRepeat(
      withSequence(
        withTiming(30, { duration: 200, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 200, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );

    // Pac-Man moving across
    pacmanPosition.value = withRepeat(
      withSequence(
        withTiming(200, { duration: 2500, easing: Easing.linear }),
        withTiming(0, { duration: 0 })
      ),
      -1,
      false
    );

    // Food items disappearing as Pac-Man passes
    foodOpacity1.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 0 }),
        withTiming(1, { duration: 400 }),
        withTiming(0, { duration: 100 }),
        withTiming(0, { duration: 2000 })
      ),
      -1,
      false
    );

    foodOpacity2.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 0 }),
        withTiming(1, { duration: 800 }),
        withTiming(0, { duration: 100 }),
        withTiming(0, { duration: 1600 })
      ),
      -1,
      false
    );

    foodOpacity3.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 0 }),
        withTiming(1, { duration: 1200 }),
        withTiming(0, { duration: 100 }),
        withTiming(0, { duration: 1200 })
      ),
      -1,
      false
    );

    foodOpacity4.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 0 }),
        withTiming(1, { duration: 1600 }),
        withTiming(0, { duration: 100 }),
        withTiming(0, { duration: 800 })
      ),
      -1,
      false
    );

    foodOpacity5.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 0 }),
        withTiming(1, { duration: 2000 }),
        withTiming(0, { duration: 100 }),
        withTiming(0, { duration: 400 })
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

  const pacmanContainerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: pacmanPosition.value }],
  }));

  const food1Style = useAnimatedStyle(() => ({ opacity: foodOpacity1.value }));
  const food2Style = useAnimatedStyle(() => ({ opacity: foodOpacity2.value }));
  const food3Style = useAnimatedStyle(() => ({ opacity: foodOpacity3.value }));
  const food4Style = useAnimatedStyle(() => ({ opacity: foodOpacity4.value }));
  const food5Style = useAnimatedStyle(() => ({ opacity: foodOpacity5.value }));

  const foodStyles = [food1Style, food2Style, food3Style, food4Style, food5Style];

  return (
    <View style={styles.container}>
      <Text style={styles.loadingText}>LOADING...</Text>
      <View style={styles.loaderContainer}>
        {/* Food items */}
        <View style={styles.foodRow}>
          {FOOD_EMOJIS.map((emoji, index) => (
            <Animated.Text key={index} style={[styles.foodEmoji, foodStyles[index]]}>
              {emoji}
            </Animated.Text>
          ))}
        </View>
        
        {/* Pac-Man */}
        <Animated.View style={[styles.pacmanWrapper, pacmanContainerStyle]}>
          <View style={styles.pacmanContainer}>
            <Animated.View style={[styles.pacmanTop, pacmanTopStyle]} />
            <Animated.View style={[styles.pacmanBottom, pacmanBottomStyle]} />
            <View style={styles.pacmanEye} />
          </View>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 24,
    fontWeight: '900',
    color: COLORS.accent,
    letterSpacing: 4,
    marginBottom: 40,
  },
  loaderContainer: {
    width: 260,
    height: 60,
    position: 'relative',
    justifyContent: 'center',
  },
  foodRow: {
    position: 'absolute',
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 8,
  },
  foodEmoji: {
    fontSize: 20,
  },
  pacmanWrapper: {
    position: 'absolute',
    left: 0,
    zIndex: 10,
  },
  pacmanContainer: {
    width: 48,
    height: 48,
    position: 'relative',
  },
  pacmanTop: {
    position: 'absolute',
    width: 48,
    height: 24,
    backgroundColor: COLORS.accent,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    top: 0,
    left: 0,
    transformOrigin: 'bottom center',
  },
  pacmanBottom: {
    position: 'absolute',
    width: 48,
    height: 24,
    backgroundColor: COLORS.accent,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    bottom: 0,
    left: 0,
    transformOrigin: 'top center',
  },
  pacmanEye: {
    position: 'absolute',
    width: 6,
    height: 6,
    backgroundColor: COLORS.white,
    borderRadius: 3,
    top: 8,
    right: 16,
    zIndex: 20,
  },
});

