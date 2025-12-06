import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Platform,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { ArrowLeft, Check } from 'lucide-react-native';

const COLORS = {
  stone50: '#fafaf9',
  stone100: '#f5f5f4',
  stone200: '#e7e5e4',
  stone300: '#d6d3d1',
  stone400: '#a8a29e',
  stone500: '#78716c',
  stone700: '#44403c',
  stone800: '#292524',
  stone900: '#1c1917',
  white: '#FFFFFF',
  red600: '#dc2626',
  red700: '#b91c1c',
};

const CUISINES = [
  'Japanese',
  'Italian',
  'Chinese',
  'Mexican',
  'Indian',
  'Thai',
  'Korean',
  'American',
  'French',
  'Mediterranean',
  'Vietnamese',
  'Middle Eastern',
  'Spanish',
  'Greek',
  'Brazilian',
];

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function SoloPreferencesScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    roomCode?: string;
    roomId?: string;
    mode: string;
    address: string;
  }>();
  const [selectedCuisines, setSelectedCuisines] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const toggleCuisine = (cuisine: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    setSelectedCuisines((prev) =>
      prev.includes(cuisine)
        ? prev.filter((c) => c !== cuisine)
        : [...prev, cuisine]
    );
  };

  const handleContinue = async () => {
    if (selectedCuisines.length === 0) {
      Alert.alert('Required', 'Please select at least one cuisine type.');
      return;
    }

    setLoading(true);
    try {
      router.push({
        pathname: '/solo/budget',
        params: {
          roomCode: params.roomCode,
          roomId: params.roomId,
          mode: params.mode,
          address: params.address,
          preferences: JSON.stringify(selectedCuisines),
        },
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to save preferences. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Pressable style={styles.backButton} onPress={() => router.back()}>
        <ArrowLeft size={24} color={COLORS.stone700} />
      </Pressable>

      <Animated.View
        style={styles.header}
        entering={FadeInDown.delay(100).springify()}
      >
        <Text style={styles.title}>Food Preferences</Text>
        <Text style={styles.description}>
          Select the types of cuisine you're interested in
        </Text>
      </Animated.View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.grid}>
          {CUISINES.map((cuisine, index) => {
            const isSelected = selectedCuisines.includes(cuisine);
            return (
              <AnimatedPressable
                key={cuisine}
                style={[
                  styles.cuisineChip,
                  isSelected && styles.cuisineChipSelected,
                ]}
                onPress={() => toggleCuisine(cuisine)}
                entering={FadeInDown.delay(200 + index * 50).springify()}
              >
                {isSelected && (
                  <View style={styles.checkIcon}>
                    <Check size={16} color={COLORS.white} strokeWidth={3} />
                  </View>
                )}
                <Text
                  style={[
                    styles.cuisineText,
                    isSelected && styles.cuisineTextSelected,
                  ]}
                >
                  {cuisine}
                </Text>
              </AnimatedPressable>
            );
          })}
        </View>

        <View style={styles.footerSpacer} />
      </ScrollView>

      <Animated.View
        style={styles.footer}
        entering={FadeInDown.delay(1000).springify()}
      >
        <Text style={styles.selectedCount}>
          {selectedCuisines.length} selected
        </Text>
        <AnimatedPressable
          style={[
            styles.continueButton,
            (selectedCuisines.length === 0 || loading) && styles.buttonDisabled,
          ]}
          onPress={handleContinue}
          disabled={selectedCuisines.length === 0 || loading}
        >
          <Text style={styles.continueButtonText}>
            {loading ? 'Loading...' : 'Continue'}
          </Text>
        </AnimatedPressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.stone50,
    paddingTop: 60,
    paddingHorizontal: 24,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    marginBottom: 20,
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: COLORS.red600,
    marginBottom: 8,
    letterSpacing: 2,
  },
  description: {
    fontSize: 16,
    color: COLORS.stone500,
    lineHeight: 24,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  cuisineChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.stone200,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.stone200,
  },
  cuisineChipSelected: {
    backgroundColor: COLORS.red600,
    borderColor: COLORS.red600,
  },
  checkIcon: {
    marginRight: 6,
  },
  cuisineText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.stone700,
  },
  cuisineTextSelected: {
    color: COLORS.white,
  },
  footerSpacer: {
    height: 160,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.stone50,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 100,
  },
  selectedCount: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.stone500,
    textAlign: 'center',
    marginBottom: 12,
  },
  continueButton: {
    backgroundColor: COLORS.red600,
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.red600,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.white,
    letterSpacing: 1,
  },
});

