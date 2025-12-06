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
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Slider from '@react-native-community/slider';

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
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Header */}
      <TouchableOpacity 
        style={styles.backButton}
        onPress={() => router.back()}
      >
        <Text style={styles.backButtonText}>←</Text>
      </TouchableOpacity>

      <View style={styles.headerContainer}>
        <Text style={styles.pacmanEmoji}>🔴</Text>
        <Text style={styles.logo}>Eatadakimasu</Text>
      </View>

      {mode === 'group' && roomCode && (
        <View style={styles.roomCodeContainer}>
          <Text style={styles.roomCodeLabel}>Room Code:</Text>
          <Text style={styles.roomCode}>{roomCode}</Text>
        </View>
      )}

      <Text style={styles.title}>WHERE & WHAT?</Text>

      {/* Location */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>LOCATION</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your location"
          value={location}
          onChangeText={setLocation}
        />
      </View>

      {/* Food Preferences */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>FOOD PREFERENCES</Text>
        <View style={styles.cuisineGrid}>
          {CUISINES.map((cuisine) => (
            <TouchableOpacity
              key={cuisine.id}
              style={[
                styles.cuisineButton,
                selectedCuisines.includes(cuisine.id) && styles.cuisineButtonSelected,
              ]}
              onPress={() => toggleCuisine(cuisine.id)}
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
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Budget */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>BUDGET</Text>
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
              minimumTrackTintColor="#ff2346"
              maximumTrackTintColor="#ddd"
              thumbTintColor="#ff2346"
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
              minimumTrackTintColor="#ff2346"
              maximumTrackTintColor="#ddd"
              thumbTintColor="#ff2346"
            />
          </View>
        </View>
      </View>

      {/* Next Button */}
      <TouchableOpacity
        style={[
          styles.nextButton,
          savedSuccessfully && styles.nextButtonSuccess
        ]}
        onPress={handleNext}
        disabled={isSaving || savedSuccessfully}
      >
        <Text style={styles.nextButtonText}>
          {savedSuccessfully ? '✓ ALL DONE!' : (isSaving ? 'SAVING...' : 'SAVE & CONTINUE')}
        </Text>
      </TouchableOpacity>
      
      {savedSuccessfully && (
        <Text style={styles.successMessage}>
          Your preferences have been saved! 🎉
        </Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  contentContainer: {
    padding: 24,
  },
  backButton: {
    width: 40,
    height: 40,
    marginTop: 40,
    marginBottom: 20,
  },
  backButtonText: {
    fontSize: 28,
    color: '#ff2346',
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  pacmanEmoji: {
    fontSize: 40,
    marginBottom: 8,
  },
  logo: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ff2346',
  },
  roomCodeContainer: {
    backgroundColor: '#fff0f3',
    padding: 12,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  roomCodeLabel: {
    fontSize: 14,
    color: '#666',
    marginRight: 8,
  },
  roomCode: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ff2346',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 24,
  },
  section: {
    marginBottom: 32,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  cuisineGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  cuisineButton: {
    width: '30%',
    aspectRatio: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  cuisineButtonSelected: {
    backgroundColor: '#fff0f3',
    borderColor: '#ff2346',
  },
  cuisineIcon: {
    fontSize: 32,
    marginBottom: 4,
  },
  cuisineLabel: {
    fontSize: 12,
    color: '#666',
  },
  cuisineLabelSelected: {
    color: '#ff2346',
    fontWeight: 'bold',
  },
  budgetContainer: {
    backgroundColor: '#f5f5f5',
    padding: 16,
    borderRadius: 12,
  },
  budgetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  budgetText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  sliderContainer: {
    marginBottom: 12,
  },
  sliderLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  nextButton: {
    backgroundColor: '#ff2346',
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  nextButtonSuccess: {
    backgroundColor: '#4CAF50',
  },
  successMessage: {
    textAlign: 'center',
    color: '#4CAF50',
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: -20,
    marginBottom: 20,
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