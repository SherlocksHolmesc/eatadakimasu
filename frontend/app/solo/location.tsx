import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  Platform,
  Alert,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import * as Location from 'expo-location';
import Constants from 'expo-constants';
import { ArrowLeft, MapPin, Navigation, Search } from 'lucide-react-native';

const COLORS = {
  white: '#FFFFFF',
  accent: '#ff2346',
  lightGray: '#f5f5f5',
  darkGray: '#333333',
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const GOOGLE_PLACES_API_KEY = Constants.expoConfig?.extra?.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY || 
                               process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY || 
                               'AIzaSyAxFISyG5u-taGCpqVyUbUA8cVi7w6o0HE';

type PlacePrediction = {
  place_id: string;
  description: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
};

type GooglePlacesAutocompleteResponse = {
  predictions?: PlacePrediction[];
  error_message?: string;
  status?: string;
};

type GoogleGeocodeResponse = {
  results?: Array<{
    formatted_address: string;
    place_id: string;
    address_components: Array<{
      long_name: string;
      short_name: string;
      types: string[];
    }>;
  }>;
  error_message?: string;
  status?: string;
};

export default function SoloLocationScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    roomCode?: string;
    roomId?: string;
    mode: string;
  }>();
  const [address, setAddress] = useState('');
  const [selectedPlace, setSelectedPlace] = useState<PlacePrediction | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingGPS, setLoadingGPS] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [predictions, setPredictions] = useState<PlacePrediction[]>([]);
  const [loadingPredictions, setLoadingPredictions] = useState(false);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fetch Google Places Autocomplete predictions
  const fetchPredictions = async (input: string) => {
    if (!input.trim() || input.length < 2) {
      setPredictions([]);
      return;
    }

    setLoadingPredictions(true);
    try {
      // For web, we need to use a CORS proxy. For native, direct fetch works.
      const apiUrl = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(input)}&key=${GOOGLE_PLACES_API_KEY}&components=country:my`;
      
      let response: Response;
      if (Platform.OS === 'web') {
        // Use CORS proxy for web - try multiple proxies for reliability
        try {
          // Try allorigins first
          response = await fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(apiUrl)}`);
        } catch {
          // Fallback to corsproxy.io
          response = await fetch(`https://corsproxy.io/?${encodeURIComponent(apiUrl)}`);
        }
      } else {
        // Direct fetch for native (iOS/Android)
        response = await fetch(apiUrl);
      }

      const data = await response.json() as GooglePlacesAutocompleteResponse;
      
      if (data.predictions) {
        setPredictions(data.predictions);
      } else if (data.error_message || data.status === 'REQUEST_DENIED') {
        const errorMsg = data.error_message || 'API not authorized';
        console.error('Google Places API error:', errorMsg);
        if (data.status === 'REQUEST_DENIED') {
          Alert.alert(
            'API Authorization Error',
            `Places API not authorized.\n\nPlease enable "Places API" in Google Cloud Console:\n1. Go to console.cloud.google.com\n2. Select your project\n3. Enable "Places API"\n4. Make sure your API key has access to this API.`
          );
        }
      }
    } catch (error) {
      console.error('Error fetching predictions:', error);
      // For native, try direct fetch as fallback
      if (Platform.OS !== 'web') {
        try {
          const directUrl = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(input)}&key=${GOOGLE_PLACES_API_KEY}&components=country:my`;
          const directResponse = await fetch(directUrl);
          const directData = await directResponse.json() as GooglePlacesAutocompleteResponse;
          if (directData.predictions) {
            setPredictions(directData.predictions);
          }
        } catch (fallbackError) {
          console.error('Fallback fetch also failed:', fallbackError);
        }
      }
    } finally {
      setLoadingPredictions(false);
    }
  };

  // Handle search input with debounce
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      if (searchQuery.trim()) {
        fetchPredictions(searchQuery);
      } else {
        setPredictions([]);
      }
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  const handleSelectPlace = (place: PlacePrediction) => {
    setSelectedPlace(place);
    setAddress(place.description);
    setSearchQuery(place.description);
    setPredictions([]);
    
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleUseCurrentLocation = async () => {
    setLoadingGPS(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert(
          'Permission Denied',
          'Location permission is required to use this feature.'
        );
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      // Use Google Places Reverse Geocoding for better address
      const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${location.coords.latitude},${location.coords.longitude}&key=${GOOGLE_PLACES_API_KEY}`;
      
      let response: Response;
      if (Platform.OS === 'web') {
        // Use CORS proxy for web
        try {
          response = await fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(geocodeUrl)}`);
        } catch {
          response = await fetch(`https://corsproxy.io/?${encodeURIComponent(geocodeUrl)}`);
        }
      } else {
        response = await fetch(geocodeUrl);
      }
      
      const data = await response.json() as GoogleGeocodeResponse;

      // Check for API errors
      if (data.error_message || data.status === 'REQUEST_DENIED') {
        const errorMsg = data.error_message || 'API not authorized';
        console.error('Google Geocoding API error:', errorMsg);
        Alert.alert(
          'API Authorization Error',
          `${errorMsg}\n\nPlease enable "Geocoding API" in Google Cloud Console:\n1. Go to console.cloud.google.com\n2. Select your project\n3. Enable "Geocoding API"\n4. Make sure your API key has access to this API.`
        );
        setLoadingGPS(false);
        return;
      }

      if (data.results && data.results.length > 0) {
        const formattedAddress = data.results[0].formatted_address;
        setAddress(formattedAddress);
        setSearchQuery(formattedAddress);
        setSelectedPlace({
          place_id: data.results[0].place_id,
          description: formattedAddress,
          structured_formatting: {
            main_text: data.results[0].address_components[0]?.long_name || '',
            secondary_text: formattedAddress,
          },
        });

        if (Platform.OS !== 'web') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      } else {
        // If Google API returns no results, show error with coordinates as fallback
        const fallbackAddress = `${location.coords.latitude.toFixed(6)}, ${location.coords.longitude.toFixed(6)}`;
        setAddress(fallbackAddress);
        setSearchQuery(fallbackAddress);
        Alert.alert(
          'Location Found',
          'Could not get address details. Using coordinates instead. You can search for a location manually.',
        );
      }
    } catch (error) {
      console.error('Location error:', error);
      Alert.alert('Error', 'Failed to get your location. Please try again.');
    } finally {
      setLoadingGPS(false);
    }
  };

  const handleContinue = async () => {
    // Use selected place description or the current address
    const finalAddress = selectedPlace?.description || address || searchQuery;
    
    if (!finalAddress.trim()) {
      Alert.alert('Required', 'Please enter a location or use your GPS.');
      return;
    }

    setLoading(true);
    try {
      router.push({
        pathname: '/solo/preferences',
        params: {
          roomCode: params.roomCode,
          roomId: params.roomId,
          mode: params.mode,
          address: finalAddress,
        },
      });
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
        <Text style={styles.title}>Location</Text>
        <Text style={styles.description}>
          Where are you looking for restaurants?
        </Text>

        <Animated.View
          style={styles.gpsButton}
          entering={FadeInDown.delay(200).springify()}
        >
          <AnimatedPressable
            style={styles.gpsButtonInner}
            onPress={handleUseCurrentLocation}
            disabled={loadingGPS}
          >
            <View style={styles.gpsIcon}>
              <Navigation
                size={24}
                color={COLORS.accent}
                strokeWidth={2.5}
              />
            </View>
            <View style={styles.gpsTextContainer}>
              <Text style={styles.gpsTitle}>Use Current Location</Text>
              <Text style={styles.gpsSubtitle}>
                {loadingGPS ? 'Getting location...' : 'Find nearby restaurants'}
              </Text>
            </View>
          </AnimatedPressable>
        </Animated.View>

        <Animated.View
          style={styles.divider}
          entering={FadeInDown.delay(300).springify()}
        >
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or</Text>
          <View style={styles.dividerLine} />
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(400).springify()}>
          <View style={styles.inputContainer}>
            <Search
              size={20}
              color={COLORS.darkGray}
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              placeholder="Search for a location..."
              placeholderTextColor={`${COLORS.darkGray}40`}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCorrect={false}
              onFocus={() => {
                if (address && !searchQuery) {
                  setSearchQuery(address);
                }
              }}
            />
            {loadingPredictions && (
              <ActivityIndicator size="small" color={COLORS.accent} style={{ marginLeft: 8 }} />
            )}
          </View>

          {/* Autocomplete Suggestions List */}
          {predictions.length > 0 && (
            <View style={styles.predictionsContainer}>
              <FlatList
                data={predictions}
                keyExtractor={(item) => item.place_id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.predictionItem}
                    onPress={() => handleSelectPlace(item)}
                  >
                    <MapPin size={16} color={COLORS.accent} style={{ marginRight: 12 }} />
                    <View style={styles.predictionTextContainer}>
                      <Text style={styles.predictionMainText}>
                        {item.structured_formatting.main_text}
                      </Text>
                      <Text style={styles.predictionSecondaryText}>
                        {item.structured_formatting.secondary_text}
                      </Text>
                    </View>
                  </TouchableOpacity>
                )}
                nestedScrollEnabled
                keyboardShouldPersistTaps="handled"
              />
            </View>
          )}

          {/* Show selected address */}
          {selectedPlace && address && (
            <View style={styles.selectedAddressContainer}>
              <MapPin size={16} color={COLORS.accent} />
              <Text style={styles.selectedAddressText} numberOfLines={2}>
                {address}
              </Text>
            </View>
          )}
        </Animated.View>

        <Animated.View
          style={styles.footer}
          entering={FadeInDown.delay(500).springify()}
        >
          <AnimatedPressable
            style={[
              styles.continueButton,
              (!address.trim() && !searchQuery.trim() || loading) && styles.buttonDisabled,
            ]}
            onPress={handleContinue}
            disabled={(!address.trim() && !searchQuery.trim()) || loading}
          >
            <Text style={styles.continueButtonText}>
              {loading ? 'Loading...' : 'Continue'}
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
  gpsButton: {
    marginBottom: 30,
  },
  gpsButtonInner: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
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
    borderWidth: 1,
    borderColor: COLORS.lightGray,
  },
  gpsIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: `${COLORS.accent}10`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  gpsTextContainer: {
    flex: 1,
  },
  gpsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.darkGray,
    marginBottom: 2,
  },
  gpsSubtitle: {
    fontSize: 13,
    color: COLORS.darkGray,
    opacity: 0.6,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.lightGray,
  },
  dividerText: {
    paddingHorizontal: 16,
    fontSize: 14,
    color: COLORS.darkGray,
    opacity: 0.4,
    fontWeight: '600',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.lightGray,
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 18,
  },
  inputIcon: {
    marginRight: 12,
    opacity: 0.5,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: COLORS.darkGray,
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
  predictionsContainer: {
    marginTop: 8,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    maxHeight: 300,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
  },
  predictionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  predictionTextContainer: {
    flex: 1,
  },
  predictionMainText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.darkGray,
    marginBottom: 2,
  },
  predictionSecondaryText: {
    fontSize: 13,
    color: COLORS.darkGray,
    opacity: 0.6,
  },
  selectedAddressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${COLORS.accent}10`,
    borderRadius: 12,
    padding: 12,
    marginTop: 12,
  },
  selectedAddressText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.accent,
    marginLeft: 8,
  },
});

