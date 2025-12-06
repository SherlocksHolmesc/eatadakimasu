import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, {
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  FadeIn,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Users, User } from 'lucide-react-native';
import { BottomNavBar } from '../components/BottomNavBar';

const COLORS = {
  white: '#FFFFFF',
  accent: '#DC2626',
  lightGray: '#F5F5F4',
  darkGray: '#1C1917',
  stone50: '#FAFAF9',
  stone100: '#F5F5F4',
  stone200: '#E7E5E4',
  stone400: '#A8A29E',
  stone500: '#78716C',
  stone600: '#57534E',
  stone900: '#1C1917',
  red50: '#FEF2F2',
  red600: '#DC2626',
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// Food emojis for background animation
const FOOD_EMOJIS = ['🍕', '🍔', '🍜', '🍱', '🌮', '🍣', '🍦', '🍩'];

function FallingFood({ emoji, index }: { emoji: string; index: number }) {
  const translateY = useSharedValue(-100);
  const rotate = useSharedValue(0);
  const left = useSharedValue(Math.random() * 100);

  React.useEffect(() => {
    translateY.value = withTiming(1200, {
      duration: 20000 + Math.random() * 20000,
    });
    rotate.value = withTiming(360, {
      duration: 20000 + Math.random() * 20000,
    });
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { rotate: `${rotate.value}deg` },
    ],
    left: `${left.value}%`,
  }));

  return (
    <Animated.View
      style={[
        styles.fallingFood,
        animatedStyle,
      ]}
    >
      <Text style={styles.foodEmoji}>{emoji}</Text>
    </Animated.View>
  );
}

export default function LandingScreen() {
  const router = useRouter();
  const [hoveredMode, setHoveredMode] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'home' | 'friends' | 'profile'>('home');

  const handleSolo = () => {
    router.push('/solo-setup');
  };

  const handleGroup = () => {
    router.push('/group/room');
  };

  const handleTabChange = (tab: 'home' | 'friends' | 'profile') => {
    setActiveTab(tab);
    if (tab === 'friends') {
      router.push('/friends');
    } else if (tab === 'profile') {
      router.push('/profile');
    } else {
      router.push('/landing');
    }
  };

  const modes = [
    {
      id: 'solo',
      icon: User,
      title: 'Solo Mode',
      description: 'Decide on your own',
      onPress: handleSolo,
    },
    {
      id: 'group',
      icon: Users,
      title: 'Group Mode',
      description: 'Decide together with friends',
      onPress: handleGroup,
    },
  ];

  return (
    <View style={styles.container}>
      {/* Background Japanese Pattern */}
      <View style={styles.bgCircle1} />
      <View style={styles.bgCircle2} />

      {/* Spinning Falling Food Background */}
      {FOOD_EMOJIS.map((emoji, index) => (
        <FallingFood key={index} emoji={emoji} index={index} />
      ))}

      {/* Main Content */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          {/* Header */}
          <Animated.View
            style={styles.header}
            entering={FadeInDown.delay(200).springify()}
          >
            <Animated.View
              style={styles.logoContainer}
              entering={FadeIn.delay(300).springify()}
            >
              <View style={styles.logoPlaceholder}>
                <Text style={styles.logoEmoji}>🍽️</Text>
              </View>
            </Animated.View>

            <Text style={styles.title}>EATADAKIMASU</Text>
            <Text style={styles.subtitle}>LET'S FIND YOUR NEXT MEAL</Text>
          </Animated.View>

          {/* Mode selection cards */}
          <Animated.View
            style={styles.modesContainer}
            entering={FadeInDown.delay(400).springify()}
          >
            {modes.map((mode, index) => {
              const Icon = mode.icon;
              const isHovered = hoveredMode === mode.id;

              return (
                <ModeCard
                  key={mode.id}
                  icon={Icon}
                  title={mode.title}
                  description={mode.description}
                  onPress={mode.onPress}
                  delay={0.4 + index * 0.1}
                  isHovered={isHovered}
                  onHoverStart={() => setHoveredMode(mode.id)}
                  onHoverEnd={() => setHoveredMode(null)}
                />
              );
            })}
          </Animated.View>

          {/* Bottom dots indicator */}
          <Animated.View
            style={styles.dotsContainer}
            entering={FadeInDown.delay(600)}
          >
            {[0, 1, 2].map((index) => (
              <View
                key={index}
                style={[
                  styles.dot,
                  index === 0 && styles.dotActive,
                ]}
              />
            ))}
          </Animated.View>
        </View>
      </ScrollView>

      {/* Bottom Navigation */}
      <BottomNavBar activeTab={activeTab} onTabChange={handleTabChange} />
    </View>
  );
}

interface ModeCardProps {
  icon: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
  title: string;
  description: string;
  onPress: () => void;
  delay: number;
  isHovered: boolean;
  onHoverStart: () => void;
  onHoverEnd: () => void;
}

function ModeCard({
  icon: Icon,
  title,
  description,
  onPress,
  delay,
  isHovered,
  onHoverStart,
  onHoverEnd,
}: ModeCardProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    scale.value = withSpring(0.98);
    onHoverStart();
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
    onHoverEnd();
  };

  return (
    <AnimatedPressable
      style={[styles.modeCard, isHovered && styles.modeCardHovered, animatedStyle]}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      entering={FadeInDown.delay(delay).springify()}
    >
      <View style={[styles.iconContainer, isHovered && styles.iconContainerHovered]}>
        <Icon
          size={24}
          color={isHovered ? COLORS.red600 : COLORS.stone900}
          strokeWidth={2}
        />
      </View>

      <View style={styles.textContainer}>
        <Text style={styles.modeTitle}>{title}</Text>
        <Text style={styles.modeDescription}>{description}</Text>
      </View>

      <View style={[styles.arrowContainer, isHovered && styles.arrowContainerHovered]}>
        <Text style={styles.arrow}>→</Text>
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.stone50,
    overflow: 'hidden',
  },
  bgCircle1: {
    position: 'absolute',
    top: -128,
    right: -128,
    width: 256,
    height: 256,
    backgroundColor: 'rgba(220, 38, 38, 0.05)',
    borderRadius: 128,
  },
  bgCircle2: {
    position: 'absolute',
    bottom: -192,
    left: -192,
    width: 384,
    height: 384,
    backgroundColor: 'rgba(168, 162, 158, 0.2)',
    borderRadius: 192,
  },
  fallingFood: {
    position: 'absolute',
    opacity: 0.09,
  },
  foodEmoji: {
    fontSize: 32,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 120,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 80,
    paddingBottom: 40,
    maxWidth: 400,
    width: '100%',
    alignSelf: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoContainer: {
    marginBottom: 24,
  },
  logoPlaceholder: {
    width: 128,
    height: 128,
    borderRadius: 64,
    backgroundColor: COLORS.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoEmoji: {
    fontSize: 64,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: COLORS.red600,
    marginBottom: 8,
    letterSpacing: 4,
  },
  subtitle: {
    fontSize: 12,
    color: COLORS.stone500,
    letterSpacing: 1,
    fontWeight: '500',
  },
  modesContainer: {
    gap: 16,
    marginBottom: 32,
  },
  modeCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.stone100,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  modeCardHovered: {
    borderColor: COLORS.red600,
    backgroundColor: COLORS.red50,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: COLORS.stone50,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  iconContainerHovered: {
    backgroundColor: COLORS.red50,
  },
  textContainer: {
    flex: 1,
  },
  modeTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.stone900,
    marginBottom: 2,
  },
  modeDescription: {
    fontSize: 12,
    color: COLORS.stone500,
  },
  arrowContainer: {
    marginLeft: 8,
  },
  arrow: {
    fontSize: 20,
    color: COLORS.stone400,
  },
  arrowContainerHovered: {},
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginTop: 32,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.stone400,
  },
  dotActive: {
    width: 24,
    backgroundColor: COLORS.red600,
  },
});