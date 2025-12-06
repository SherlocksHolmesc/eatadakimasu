import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { ArrowLeft, DollarSign } from 'lucide-react-native';
import Constants from 'expo-constants';

const API_URL = Constants.expoConfig?.extra?.EXPO_PUBLIC_BACKEND_URL || process.env.EXPO_PUBLIC_BACKEND_URL || '';

const COLORS = {
  white: '#FFFFFF',
  accent: '#ff2346',
  lightGray: '#f5f5f5',
  darkGray: '#333333',
};

const PRICE_RANGES = [
  { value: 1, label: '$', description: 'Budget-friendly' },
  { value: 2, label: '$$', description: 'Moderate' },
  { value: 3, label: '$$$', description: 'Upscale' },
  { value: 4, label: '$$$$', description: 'Fine dining' },
];

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function BudgetScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    roomCode?: string;
    mode: string;
    address: string;
    preferences: string;
  }>();
  const [minBudget, setMinBudget] = useState(1);
  const [maxBudget, setMaxBudget] = useState(4);
  const [loading, setLoading] = useState(false);

  const selectPriceRange = (value: number) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    if (value < minBudget) {
      setMinBudget(value);
    } else if (value > maxBudget) {
      setMaxBudget(value);
    } else {
      const distToMin = value - minBudget;
      const distToMax = maxBudget - value;
      if (distToMin <= distToMax) {
        setMinBudget(value);
      } else {
        setMaxBudget(value);
      }
    }
  };

  const handleContinue = async () => {
    setLoading(true);
    try {
      const preferences = params.preferences
        ? JSON.parse(params.preferences)
        : [];
      
      // Convert price range to dollar amounts (approximate)
      const minBudgetDollars = minBudget * 10;
      const maxBudgetDollars = maxBudget * 25;

      const response = await fetch(`${API_URL}/api/preferences`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          room_code: params.roomCode,
          location: params.address,
          cuisines: preferences,
          min_budget: minBudgetDollars,
          max_budget: maxBudgetDollars,
        }),
      });

      if (response.ok) {
        if (Platform.OS !== 'web') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }

        router.push({
          pathname: '/swipe',
          params: {
            roomCode: params.roomCode,
            mode: params.mode,
            location: params.address,
            cuisines: preferences.join(','),
            minBudget: minBudgetDollars.toString(),
            maxBudget: maxBudgetDollars.toString(),
          },
        });
      } else {
        Alert.alert('Error', 'Failed to save budget. Please try again.');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to save budget. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Pressable style={styles.backButton} onPress={() => router.back()}>
        <ArrowLeft size={24} color={COLORS.darkGray} />
      </Pressable>

      <Animated.View
        style={styles.content}
        entering={FadeInDown.delay(100).springify()}
      >
        <Text style={styles.title}>Budget Range</Text>
        <Text style={styles.description}>
          Select your comfortable price range
        </Text>

        <View style={styles.selectedRange}>
          <Text style={styles.rangeLabel}>Selected Range</Text>
          <Text style={styles.rangeValue}>
            {PRICE_RANGES[minBudget - 1].label} to{' '}
            {PRICE_RANGES[maxBudget - 1].label}
          </Text>
        </View>

        <View style={styles.priceRanges}>
          {PRICE_RANGES.map((range, index) => {
            const isInRange = range.value >= minBudget && range.value <= maxBudget;
            const isMin = range.value === minBudget;
            const isMax = range.value === maxBudget;

            return (
              <AnimatedPressable
                key={range.value}
                style={[
                  styles.priceButton,
                  isInRange && styles.priceButtonSelected,
                  isMin && styles.priceButtonMin,
                  isMax && styles.priceButtonMax,
                ]}
                onPress={() => selectPriceRange(range.value)}
                entering={FadeInDown.delay(200 + index * 100).springify()}
              >
                <View style={styles.priceIconContainer}>
                  <DollarSign
                    size={24}
                    color={isInRange ? COLORS.white : COLORS.accent}
                    strokeWidth={2.5}
                  />
                </View>
                <Text
                  style={[
                    styles.priceLabel,
                    isInRange && styles.priceLabelSelected,
                  ]}
                >
                  {range.label}
                </Text>
                <Text
                  style={[
                    styles.priceDescription,
                    isInRange && styles.priceDescriptionSelected,
                  ]}
                >
                  {range.description}
                </Text>
              </AnimatedPressable>
            );
          })}
        </View>

        <Animated.View
          style={styles.footer}
          entering={FadeInDown.delay(800).springify()}
        >
          <AnimatedPressable
            style={[styles.continueButton, loading && styles.buttonDisabled]}
            onPress={handleContinue}
            disabled={loading}
          >
            <Text style={styles.continueButtonText}>
              {loading ? 'Setting up...' : 'Start Swiping'}
            </Text>
          </AnimatedPressable>
        </Animated.View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
    paddingTop: 60,
    paddingHorizontal: 24,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    marginBottom: 20,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 36,
    fontWeight: '800',
    color: COLORS.darkGray,
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: COLORS.darkGray,
    opacity: 0.6,
    marginBottom: 40,
    lineHeight: 24,
  },
  selectedRange: {
    backgroundColor: `${COLORS.accent}10`,
    borderRadius: 16,
    padding: 20,
    marginBottom: 40,
    alignItems: 'center',
  },
  rangeLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.darkGray,
    opacity: 0.6,
    marginBottom: 4,
  },
  rangeValue: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.accent,
  },
  priceRanges: {
    gap: 16,
  },
  priceButton: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 2,
    borderColor: COLORS.lightGray,
  },
  priceButtonSelected: {
    backgroundColor: COLORS.accent,
    borderColor: COLORS.accent,
  },
  priceButtonMin: {
    borderTopWidth: 3,
  },
  priceButtonMax: {
    borderBottomWidth: 3,
  },
  priceIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: `${COLORS.accent}10`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  priceLabel: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.darkGray,
    marginRight: 12,
    minWidth: 60,
  },
  priceLabelSelected: {
    color: COLORS.white,
  },
  priceDescription: {
    fontSize: 15,
    color: COLORS.darkGray,
    opacity: 0.6,
  },
  priceDescriptionSelected: {
    color: COLORS.white,
    opacity: 0.9,
  },
  footer: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
  },
  continueButton: {
    backgroundColor: COLORS.accent,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  continueButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.white,
  },
});

