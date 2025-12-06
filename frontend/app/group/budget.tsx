import { useState, useEffect } from 'react';
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
  Alert,
  ScrollView,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { ArrowLeft } from 'lucide-react-native';
import Slider from '@react-native-community/slider';
import { useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const COLORS = {
  white: '#FFFFFF',
  stone50: '#fafaf9',
  stone100: '#f5f5f4',
  stone200: '#e7e5e4',
  stone500: '#78716c',
  stone700: '#44403c',
  stone900: '#1c1917',
  red600: '#dc2626',
  rose100: '#ffe4e6',
  rose500: '#f43f5e',
  rose600: '#e11d48',
  green500: '#22c55e',
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function BudgetScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    roomCode?: string;
    roomId?: string;
    mode: string;
    address: string;
    preferences: string;
  }>();
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [minBudget, setMinBudget] = useState(10);
  const [maxBudget, setMaxBudget] = useState(50);
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccessfully, setSavedSuccessfully] = useState(false);

  const updateMemberPreferencesMutation = useMutation(api.rooms.updateMemberPreferences);

  useEffect(() => {
    const getUserId = async () => {
      const id = await AsyncStorage.getItem('userId');
      setCurrentUserId(id || '');
    };
    getUserId();
  }, []);

  const handleContinue = async () => {
    // Both solo and group mode need roomId and userId
    if (!params.roomId || !currentUserId) {
      console.error('Missing roomId or userId');
      Alert.alert('Error', 'Missing required information. Please try again.');
      return;
    }

    const preferences = params.preferences
      ? JSON.parse(params.preferences)
      : [];

    setIsSaving(true);
    try {
      // Save all preferences to Convex (location, cuisines, budget)
      await updateMemberPreferencesMutation({
        roomId: params.roomId as any,
        userId: currentUserId as any,
        preferences: {
          cuisines: preferences,
          distance: 10, // Default distance
          priceRange: `${minBudget}-${maxBudget}`,
        },
      });

      console.log('Preferences saved successfully!');
      setSavedSuccessfully(true);

      // For group mode, go to waiting screen
      // For solo mode, go directly to swipe
      if (params.mode === 'group') {
        setTimeout(() => {
          router.push({
            pathname: '/preferences-waiting',
            params: {
              roomCode: params.roomCode,
              roomId: params.roomId,
              mode: params.mode,
            },
          });
        }, 1500);
      } else {
        // Solo mode - go directly to swipe
        setTimeout(() => {
          router.push({
            pathname: '/swipe',
            params: {
              roomCode: params.roomCode,
              roomId: params.roomId,
              mode: 'solo',
              location: params.address,
              cuisines: preferences.join(','),
              minBudget: minBudget.toString(),
              maxBudget: maxBudget.toString(),
            },
          });
        }, 1500);
      }
    } catch (error: any) {
      console.error('Save preferences error:', error);
      Alert.alert('Error', error.message || 'Failed to save preferences. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <Pressable style={styles.backButton} onPress={() => router.back()}>
        <ArrowLeft size={24} color={COLORS.stone700} />
      </Pressable>

      <Animated.View
        style={styles.content}
        entering={FadeInDown.delay(100).springify()}
      >
        <Text style={styles.title}>Budget</Text>
        <Text style={styles.description}>
          Set your budget range in MYR
        </Text>

        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View
            style={styles.budgetContainer}
            entering={FadeInDown.delay(200).springify()}
          >
            <View style={styles.budgetRow}>
              <View style={styles.budgetItem}>
                <Text style={styles.budgetLabel}>Minimum</Text>
                <Text style={styles.budgetValue}>RM {minBudget}</Text>
              </View>
              <View style={styles.budgetItem}>
                <Text style={styles.budgetLabel}>Maximum</Text>
                <Text style={styles.budgetValue}>RM {maxBudget}</Text>
              </View>
            </View>

            <View style={styles.sliderContainer}>
              <Text style={styles.sliderLabel}>Minimum Budget</Text>
              <Slider
                style={styles.slider}
                minimumValue={5}
                maximumValue={195}
                step={5}
                value={minBudget}
                onValueChange={(value) => {
                  // Only update min, don't touch max
                  // If min would exceed max, cap it at max - 5
                  const newMin = value >= maxBudget ? maxBudget - 5 : value;
                  setMinBudget(Math.max(5, newMin));
                }}
                minimumTrackTintColor={COLORS.rose600}
                maximumTrackTintColor={COLORS.stone200}
                thumbTintColor={COLORS.rose600}
              />
              <View style={styles.sliderValues}>
                <Text style={styles.sliderValueText}>RM 5</Text>
                <Text style={styles.sliderValueText}>RM 195</Text>
              </View>
            </View>

            <View style={styles.sliderContainer}>
              <Text style={styles.sliderLabel}>Maximum Budget</Text>
              <Slider
                style={styles.slider}
                minimumValue={10}
                maximumValue={200}
                step={5}
                value={maxBudget}
                onValueChange={(value) => {
                  // Only update max, don't touch min
                  // If max would go below min, cap it at min + 5
                  const newMax = value <= minBudget ? minBudget + 5 : value;
                  setMaxBudget(Math.min(200, newMax));
                }}
                minimumTrackTintColor={COLORS.rose600}
                maximumTrackTintColor={COLORS.stone200}
                thumbTintColor={COLORS.rose600}
              />
              <View style={styles.sliderValues}>
                <Text style={styles.sliderValueText}>RM 10</Text>
                <Text style={styles.sliderValueText}>RM 200</Text>
              </View>
            </View>
          </Animated.View>

          <View style={styles.footerSpacer} />
        </ScrollView>

        <Animated.View
          style={styles.footer}
          entering={FadeInDown.delay(300).springify()}
        >
          {savedSuccessfully && (
            <Text style={styles.successMessage}>
              ✓ Preferences saved! {params.mode === 'group' ? 'Waiting for others...' : ''}
            </Text>
          )}
          <AnimatedPressable
            style={[
              styles.continueButton,
              savedSuccessfully && styles.continueButtonSuccess,
              (isSaving || savedSuccessfully) && styles.buttonDisabled
            ]}
            onPress={handleContinue}
            disabled={isSaving || savedSuccessfully}
          >
            <Text style={styles.continueButtonText}>
              {savedSuccessfully ? '✓ SAVED!' : (isSaving ? 'SAVING...' : 'SAVE & CONTINUE')}
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
  content: {
    flex: 1,
  },
  title: {
    fontSize: 36,
    fontWeight: '800',
    color: COLORS.stone900,
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: COLORS.stone500,
    marginBottom: 30,
    lineHeight: 24,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  budgetContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: COLORS.stone200,
  },
  budgetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  budgetItem: {
    flex: 1,
    alignItems: 'center',
  },
  budgetLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.stone500,
    marginBottom: 8,
  },
  budgetValue: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.rose600,
  },
  sliderContainer: {
    marginBottom: 32,
  },
  sliderLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.stone900,
    marginBottom: 16,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  sliderValues: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  sliderValueText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.stone500,
  },
  footerSpacer: {
    height: 120,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.stone50,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 40,
    borderTopWidth: 1,
    borderTopColor: COLORS.stone200,
  },
  successMessage: {
    textAlign: 'center',
    color: COLORS.green500,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  continueButton: {
    backgroundColor: COLORS.red600,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  continueButtonSuccess: {
    backgroundColor: COLORS.green500,
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

