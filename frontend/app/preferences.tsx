import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Constants from 'expo-constants';
import Slider from '@react-native-community/slider';

const API_URL = Constants.expoConfig?.extra?.EXPO_PUBLIC_BACKEND_URL || process.env.EXPO_PUBLIC_BACKEND_URL || '';

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
  const { roomCode, mode } = params;

  const [location, setLocation] = useState('');
  const [selectedCuisines, setSelectedCuisines] = useState<string[]>([]);
  const [minBudget, setMinBudget] = useState(10);
  const [maxBudget, setMaxBudget] = useState(50);
  const [isSaving, setIsSaving] = useState(false);

  const toggleCuisine = (cuisineId: string) => {
    if (selectedCuisines.includes(cuisineId)) {
      setSelectedCuisines(selectedCuisines.filter(c => c !== cuisineId));
    } else {
      setSelectedCuisines([...selectedCuisines, cuisineId]);
    }
  };

  const handleNext = async () => {
    if (!location.trim()) {
      Alert.alert('Error', 'Please enter a location');
      return;
    }

    if (selectedCuisines.length === 0) {
      Alert.alert('Error', 'Please select at least one cuisine');
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch(`${API_URL}/api/preferences`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          room_code: roomCode,
          location: location,
          cuisines: selectedCuisines,
          min_budget: minBudget,
          max_budget: maxBudget,
        }),
      });

      if (response.ok) {
        router.push({
          pathname: '/swipe',
          params: {
            roomCode,
            mode,
            location,
            cuisines: selectedCuisines.join(','),
            minBudget,
            maxBudget,
          },
        });
      } else {
        Alert.alert('Error', 'Failed to save preferences');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to save preferences');
      console.error('Save preferences error:', error);
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
        style={styles.nextButton}
        onPress={handleNext}
        disabled={isSaving}
      >
        <Text style={styles.nextButtonText}>
          {isSaving ? 'LOADING...' : 'NEXT'}
        </Text>
      </TouchableOpacity>
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
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
});