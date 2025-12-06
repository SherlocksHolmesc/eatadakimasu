import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, {
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Users, User } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

const COLORS = {
  white: '#FFFFFF',
  accent: '#ff2346',
  lightGray: '#f5f5f5',
  darkGray: '#333333',
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

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
    scale.value = withSpring(0.95);
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

  return (
    <View style={styles.container}>
      <Animated.View
        style={styles.header}
        entering={FadeInDown.delay(200).springify()}
      >
        <Text style={styles.title}>Eatadakimasu</Text>
        <Text style={styles.subtitle}>
          Let's find your next delicious meal
        </Text>
      </Animated.View>

      <View style={styles.buttonsContainer}>
        <ActionButton
          title="Solo Mode"
          subtitle="Decide on your own"
          icon={<User size={32} color={COLORS.accent} strokeWidth={2.5} />}
          onPress={handleSolo}
          delay={400}
        />

        <ActionButton
          title="Group Mode"
          subtitle="Decide together with friends"
          icon={<Users size={32} color={COLORS.accent} strokeWidth={2.5} />}
          onPress={handleGroup}
          delay={600}
        />
      </View>

      <Animated.View
        style={styles.decorativeDotsContainer}
        entering={FadeInDown.delay(800)}
      >
        {[...Array(3)].map((_, i) => (
          <View
            key={i}
            style={[styles.decorativeDot, { opacity: 0.7 - i * 0.2 }]}
          />
        ))}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
    paddingHorizontal: 24,
    paddingTop: 80,
    paddingBottom: 60,
  },
  header: {
    alignItems: 'center',
    marginBottom: 60,
  },
  title: {
    fontSize: 42,
    fontWeight: '800',
    color: COLORS.accent,
    marginBottom: 12,
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.darkGray,
    opacity: 0.7,
    textAlign: 'center',
  },
  buttonsContainer: {
    flex: 1,
    justifyContent: 'center',
    gap: 20,
  },
  button: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: 24,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 5,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 16,
    backgroundColor: `${COLORS.accent}10`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  textContainer: {
    flex: 1,
  },
  buttonTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.darkGray,
    marginBottom: 4,
  },
  buttonSubtitle: {
    fontSize: 14,
    color: COLORS.darkGray,
    opacity: 0.6,
  },
  decorativeDotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginTop: 40,
  },
  decorativeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.accent,
  },
});