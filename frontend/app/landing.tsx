import { View, Text, StyleSheet, Pressable, Platform, Dimensions, Image } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, {
  FadeInDown,
  FadeIn,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withTiming,
  withDelay,
  withSequence,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Users, User, ChevronRight, Home, UserPlus, CircleUser } from 'lucide-react-native';
import { useEffect, useState } from 'react';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');

const COLORS = {
  stone50: '#fafaf9',
  stone100: '#f5f5f4',
  stone200: '#e7e5e4',
  stone300: '#d6d3d1',
  stone400: '#a8a29e',
  stone500: '#78716c',
  stone700: '#44403c',
  stone900: '#1c1917',
  white: '#FFFFFF',
  red500: '#ef4444',
  red600: '#dc2626',
  rose50: '#fff1f2',
  rose100: '#ffe4e6',
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// Falling food emoji component - falls from top to bottom
function FallingEmoji({ emoji, startX, delay, duration }: { emoji: string; startX: number; delay: number; duration: number }) {
  const translateY = useSharedValue(-50);
  const translateX = useSharedValue(0);
  const opacity = useSharedValue(0);
  const rotate = useSharedValue(0);

  useEffect(() => {
    // Start animation after delay
    opacity.value = withDelay(delay, withTiming(0.3, { duration: 500 }));
    
    translateY.value = withDelay(
      delay,
      withRepeat(
        withTiming(SCREEN_HEIGHT + 50, { duration: duration, easing: Easing.linear }),
        -1,
        false
      )
    );
    
    // Slight horizontal sway
    translateX.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(15, { duration: duration / 4, easing: Easing.inOut(Easing.ease) }),
          withTiming(-15, { duration: duration / 2, easing: Easing.inOut(Easing.ease) }),
          withTiming(0, { duration: duration / 4, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        false
      )
    );
    
    // Rotation
    rotate.value = withDelay(
      delay,
      withRepeat(
        withTiming(360, { duration: duration, easing: Easing.linear }),
        -1,
        false
      )
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { translateX: translateX.value },
      { rotate: `${rotate.value}deg` },
    ],
    opacity: opacity.value,
    left: startX,
  }));

  return (
    <Animated.Text style={[styles.fallingEmoji, animatedStyle]}>
      {emoji}
    </Animated.Text>
  );
}

// Ramen Bowl Logo Component - using PNG image
function RamenLogo() {
  return (
    <View style={styles.logoContainer}>
      <Image
        source={require('../assets/images/42aaecb8daf9fe805d264506738108e934067bf1e19a2bce4515936448bb6077.png')}
        style={{ width: 120, height: 120 }}
        resizeMode="contain"
      />
    </View>
  );
}

function ActionButton({
  title,
  subtitle,
  icon,
  onPress,
  delay,
}: {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  onPress: () => void;
  delay: number;
}) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    scale.value = withSpring(0.98);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
  };

  return (
    <AnimatedPressable
      style={[styles.button, animatedStyle]}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      entering={FadeInDown.delay(delay).springify()}
    >
      <View style={styles.iconContainer}>{icon}</View>
      <View style={styles.textContainer}>
        <Text style={styles.buttonTitle}>{title}</Text>
        <Text style={styles.buttonSubtitle}>{subtitle}</Text>
      </View>
      <ChevronRight size={20} color={COLORS.stone300} />
    </AnimatedPressable>
  );
}

export default function LandingScreen() {
  const router = useRouter();

  const handleSolo = () => {
    router.push('/solo-setup');
  };

  const handleGroup = () => {
    router.push('/group/room');
  };

  const handleNavHome = () => {
    // Already on home
  };

  const handleNavFriends = () => {
    router.push('/friends');
  };

  const handleNavProfile = () => {
    router.push('/profile');
  };

  // Falling emoji configurations
  const fallingEmojis = [
    { emoji: '🍣', startX: 20, delay: 0, duration: 8000 },
    { emoji: '🍩', startX: SCREEN_WIDTH - 60, delay: 1000, duration: 9000 },
    { emoji: '🍜', startX: 80, delay: 2000, duration: 7500 },
    { emoji: '🥟', startX: SCREEN_WIDTH - 100, delay: 500, duration: 8500 },
    { emoji: '🍙', startX: SCREEN_WIDTH / 2 - 20, delay: 1500, duration: 9500 },
    { emoji: '🍡', startX: 40, delay: 3000, duration: 7000 },
    { emoji: '🍕', startX: SCREEN_WIDTH - 80, delay: 2500, duration: 8000 },
    { emoji: '🍔', startX: SCREEN_WIDTH / 2 + 30, delay: 3500, duration: 8500 },
  ];

  return (
    <View style={styles.container}>
      {/* Background gradient overlay */}
      <View style={styles.bgGradient} />
      
      {/* Falling food emojis */}
      {fallingEmojis.map((item, index) => (
        <FallingEmoji
          key={index}
          emoji={item.emoji}
          startX={item.startX}
          delay={item.delay}
          duration={item.duration}
        />
      ))}
      
      {/* Header with Logo */}
      <Animated.View
        style={styles.header}
        entering={FadeInDown.duration(800).springify()}
      >
        <RamenLogo />
        <Text style={styles.title}>EATADAKIMASU</Text>
        <Text style={styles.subtitle}>LET'S FIND YOUR NEXT MEAL</Text>
      </Animated.View>

      <View style={styles.buttonsContainer}>
        <ActionButton
          title="Solo Mode"
          subtitle="Decide on your own"
          icon={<User size={24} color={COLORS.stone700} strokeWidth={1.5} />}
          onPress={handleSolo}
          delay={400}
        />

        <ActionButton
          title="Group Mode"
          subtitle="Decide together with friends"
          icon={<Users size={24} color={COLORS.stone700} strokeWidth={1.5} />}
          onPress={handleGroup}
          delay={500}
        />
      </View>

      {/* Page indicator dots */}
      <Animated.View
        style={styles.dotsContainer}
        entering={FadeIn.delay(700)}
      >
        <View style={[styles.dot, styles.activeDot]} />
        <View style={styles.dot} />
        <View style={styles.dot} />
      </Animated.View>

      {/* Bottom Navigation Bar */}
      <Animated.View
        style={styles.navbar}
        entering={FadeInDown.delay(600).springify()}
      >
        <Pressable style={[styles.navItem, styles.navItemActive]} onPress={handleNavHome}>
          <Home size={22} color={COLORS.white} strokeWidth={2} />
        </Pressable>
        <Pressable style={styles.navItem} onPress={handleNavFriends}>
          <UserPlus size={22} color={COLORS.stone400} strokeWidth={1.5} />
        </Pressable>
        <Pressable style={styles.navItem} onPress={handleNavProfile}>
          <CircleUser size={22} color={COLORS.stone400} strokeWidth={1.5} />
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 24,
    position: 'relative',
    overflow: 'hidden',
  },
  bgGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: COLORS.rose50,
  },
  fallingEmoji: {
    position: 'absolute',
    fontSize: 28,
    top: -50,
    zIndex: 0,
  },
  
  // Logo container
  logoContainer: {
    width: 80,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },

  header: {
    alignItems: 'center',
    marginTop: 120,
    marginBottom: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.red600,
    marginBottom: 8,
    letterSpacing: 4,
  },
  subtitle: {
    fontSize: 11,
    color: COLORS.stone500,
    letterSpacing: 2,
    fontWeight: '500',
  },
  buttonsContainer: {
    flex: 1,
    justifyContent: 'flex-start',
    marginTop: 24,
    gap: 16,
  },
  button: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    paddingVertical: 18,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.stone100,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  textContainer: {
    flex: 1,
  },
  buttonTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.stone900,
    marginBottom: 3,
  },
  buttonSubtitle: {
    fontSize: 13,
    color: COLORS.stone400,
    fontWeight: '400',
  },
  
  // Page indicator dots
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginBottom: 24,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.stone300,
  },
  activeDot: {
    width: 24,
    backgroundColor: COLORS.red600,
    borderRadius: 4,
  },

  // Bottom Navigation Bar
  navbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 32,
    paddingVertical: 12,
    paddingHorizontal: 40,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 8,
    gap: 32,
    alignSelf: 'center',
  },
  navItem: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navItemActive: {
    backgroundColor: COLORS.red600,
    width: 56,
    height: 44,
    borderRadius: 22,
  },
});