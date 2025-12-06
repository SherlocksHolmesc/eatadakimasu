import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  Platform,
  Pressable,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Slider from '@react-native-community/slider';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { ArrowLeft } from 'lucide-react-native';

const COLORS = {
  white: '#FFFFFF',
  accent: '#ff2346',
  lightGray: '#f5f5f5',
  darkGray: '#333333',
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const CUISINES = [
  { id: 'japanese', label: 'Japanese', icon: '🍣' },
  { id: 'italian', label: 'Italian', icon: '🍕' },
  { id: 'mexican', label: 'Mexican', icon: '🌯' },
  { id: 'indian', label: 'Indian', icon: '🍛' },
  { id: 'american', label: 'American', icon: '🍔' },
  { id: 'chinese', label: 'Chinese', icon: '🥟' },
];

export default function PreferencesScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { roomCode, roomId, mode } = params;

  // Debug: Log if component re-mounts
  React.useEffect(() => {
    console.log('✅ Preferences screen mounted');
    return () => {
      console.log('❌ Preferences screen unmounted');
    };
  }, []);

  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [location, setLocation] = useState('');
  const [selectedCuisines, setSelectedCuisines] = useState<string[]>([]);
  const [minBudget, setMinBudget] = useState(10);
  const [maxBudget, setMaxBudget] = useState(50);
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccessfully, setSavedSuccessfully] = useState(false);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);

  const updateMemberPreferencesMutation = useMutation(api.rooms.updateMemberPreferences);
  
  // Don't query room data during selection to avoid re-renders
  // We'll show member progress only in the waiting screen

  React.useEffect(() => {
    const getUserId = async () => {
      const id = await AsyncStorage.getItem('userId');
      setCurrentUserId(id || '');
    };
    getUserId();
  }, []);

  const toggleCuisine = (cuisineId: string) => {
    setHasUserInteracted(true); // Mark that user has started selecting
    if (selectedCuisines.includes(cuisineId)) {
      setSelectedCuisines(selectedCuisines.filter(c => c !== cuisineId));
    } else {
      setSelectedCuisines([...selectedCuisines, cuisineId]);
    }
  };

  const handleNext = async () => {
    if (selectedCuisines.length === 0) {
      const message = 'Please select at least one cuisine';
      if (Platform.OS === 'web') {
        (globalThis as any).alert(message);
      } else {
        Alert.alert('Error', message);
      }
      return;
    }

    if (!roomId || !currentUserId) {
      console.error('Missing roomId or userId');
      return;
    }

    setIsSaving(true);
    try {
      console.log('Saving preferences to Convex...');
      await updateMemberPreferencesMutation({
        roomId: roomId as any,
        userId: currentUserId as any,
        preferences: {
          cuisines: selectedCuisines,
          distance: maxBudget, // Using as distance for now
          priceRange: `${minBudget}-${maxBudget}`,
        },
      });

      console.log('Preferences saved successfully!');
      setSavedSuccessfully(true);
      
      // For group mode, go to waiting screen
      // For solo mode, go directly to swipe
      if (mode === 'group') {
        // Show success message briefly before going to waiting screen
        setTimeout(() => {
          router.push({
            pathname: '/preferences-waiting',
            params: {
              roomCode,
              roomId,
              mode,
            },
          });
        }, 1500);
      } else {
        // Solo mode - go directly to swipe
        setTimeout(() => {
          router.push({
            pathname: '/swipe',
            params: {
              roomCode,
              roomId,
              mode,
              cuisines: selectedCuisines.join(','),
              minBudget,
              maxBudget,
            },
          });
        }, 1500);
      }
    } catch (error: any) {
      console.error('Save preferences error:', error);
      const message = 'Failed to save preferences. Please try again.';
      if (Platform.OS === 'web') {
        (globalThis as any).alert(message);
      } else {
        Alert.alert('Error', message);
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <Pressable 
        style={styles.backButton}
        onPress={() => router.back()}
      >
        <ArrowLeft size={24} color={COLORS.darkGray} />
      </Pressable>

      <Animated.View
        style={styles.header}
        entering={FadeInDown.delay(100).springify()}
      >
        <Text style={styles.title}>Preferences</Text>
        <Text style={styles.description}>
          Set your location, food preferences, and budget
        </Text>
        {mode === 'group' && roomCode && (
          <View style={styles.roomCodeContainer}>
            <Text style={styles.roomCodeLabel}>Room Code: </Text>
            <Text style={styles.roomCode}>{roomCode}</Text>
          </View>
        )}
      </Animated.View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >

        {/* Location */}
        <Animated.View 
          style={styles.section}
          entering={FadeInDown.delay(200).springify()}
        >
          <Text style={styles.sectionLabel}>Location</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your location"
            placeholderTextColor={`${COLORS.darkGray}60`}
            value={location}
            onChangeText={setLocation}
          />
        </Animated.View>

        {/* Food Preferences */}
        <Animated.View 
          style={styles.section}
          entering={FadeInDown.delay(300).springify()}
        >
          <Text style={styles.sectionLabel}>Food Preferences</Text>
          <View style={styles.cuisineGrid}>
            {CUISINES.map((cuisine, index) => (
              <AnimatedPressable
                key={cuisine.id}
                style={[
                  styles.cuisineButton,
                  selectedCuisines.includes(cuisine.id) && styles.cuisineButtonSelected,
                ]}
                onPress={() => toggleCuisine(cuisine.id)}
                entering={FadeInDown.delay(400 + index * 50).springify()}
              >
                <Text style={styles.cuisineIcon}>{cuisine.icon}</Text>
                <Text
                  style={[
                    styles.cuisineLabel,
                    selectedCuisines.includes(cuisine.id) && styles.cuisineLabelSelected,
                  ]}
                >
                  {cuisine.label}
                </Text>
              </AnimatedPressable>
            ))}
          </View>
        </Animated.View>

        {/* Budget */}
        <Animated.View 
          style={styles.section}
          entering={FadeInDown.delay(700).springify()}
        >
          <Text style={styles.sectionLabel}>Budget</Text>
          <View style={styles.budgetContainer}>
            <View style={styles.budgetRow}>
              <Text style={styles.budgetText}>Min: ${minBudget}</Text>
              <Text style={styles.budgetText}>Max: ${maxBudget}</Text>
            </View>
            <View style={styles.sliderContainer}>
              <Text style={styles.sliderLabel}>Min</Text>
              <Slider
                style={styles.slider}
                minimumValue={5}
                maximumValue={maxBudget - 5}
                step={5}
                value={minBudget}
                onValueChange={setMinBudget}
                minimumTrackTintColor={COLORS.accent}
                maximumTrackTintColor={COLORS.lightGray}
                thumbTintColor={COLORS.accent}
              />
            </View>
            <View style={styles.sliderContainer}>
              <Text style={styles.sliderLabel}>Max</Text>
              <Slider
                style={styles.slider}
                minimumValue={minBudget + 5}
                maximumValue={100}
                step={5}
                value={maxBudget}
                onValueChange={setMaxBudget}
                minimumTrackTintColor={COLORS.accent}
                maximumTrackTintColor={COLORS.lightGray}
                thumbTintColor={COLORS.accent}
              />
            </View>
          </View>
        </Animated.View>

        <View style={styles.footerSpacer} />
      </ScrollView>

      {/* Footer with Button */}
      <Animated.View
        style={styles.footer}
        entering={FadeInDown.delay(800).springify()}
      >
        {savedSuccessfully && (
          <Text style={styles.successMessage}>
            ✓ Preferences saved! {mode === 'group' ? 'Waiting for others...' : ''}
          </Text>
        )}
        <AnimatedPressable
          style={[
            styles.nextButton,
            savedSuccessfully && styles.nextButtonSuccess,
            (isSaving || savedSuccessfully) && styles.buttonDisabled
          ]}
          onPress={handleNext}
          disabled={isSaving || savedSuccessfully}
        >
          <Text style={styles.nextButtonText}>
            {savedSuccessfully ? '✓ SAVED!' : (isSaving ? 'SAVING...' : 'SAVE & CONTINUE')}
          </Text>
        </AnimatedPressable>
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
  header: {
    marginBottom: 30,
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
    lineHeight: 24,
    marginBottom: 16,
  },
  roomCodeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${COLORS.accent}10`,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    marginTop: 8,
  },
  roomCodeLabel: {
    fontSize: 14,
    color: COLORS.darkGray,
    opacity: 0.6,
    fontWeight: '600',
  },
  roomCode: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.accent,
    letterSpacing: 2,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  section: {
    marginBottom: 32,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.darkGray,
    marginBottom: 16,
  },
  input: {
    height: 56,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    borderRadius: 16,
    paddingHorizontal: 20,
    fontSize: 16,
    backgroundColor: COLORS.white,
    color: COLORS.darkGray,
  },
  cuisineGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  cuisineButton: {
    width: '30%',
    aspectRatio: 1,
    backgroundColor: COLORS.lightGray,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  cuisineButtonSelected: {
    backgroundColor: `${COLORS.accent}10`,
    borderColor: COLORS.accent,
  },
  cuisineIcon: {
    fontSize: 36,
    marginBottom: 8,
  },
  cuisineLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.darkGray,
    opacity: 0.7,
  },
  cuisineLabelSelected: {
    color: COLORS.accent,
    opacity: 1,
    fontWeight: '700',
  },
  budgetContainer: {
    backgroundColor: COLORS.lightGray,
    padding: 20,
    borderRadius: 16,
  },
  budgetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  budgetText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.darkGray,
  },
  sliderContainer: {
    marginBottom: 16,
  },
  sliderLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.darkGray,
    opacity: 0.6,
    marginBottom: 8,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  footerSpacer: {
    height: 120,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.white,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 40,
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
  },
  successMessage: {
    textAlign: 'center',
    color: '#4CAF50',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  nextButton: {
    backgroundColor: COLORS.accent,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nextButtonSuccess: {
    backgroundColor: '#4CAF50',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  memberProgress: {
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  memberProgressTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  memberItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  memberName: {
    fontSize: 14,
    color: '#333',
  },
  memberStatus: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
});