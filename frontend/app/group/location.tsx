import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  Platform,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import * as Location from 'expo-location';
import { ArrowLeft, MapPin, Navigation } from 'lucide-react-native';

const COLORS = {
  white: '#FFFFFF',
  accent: '#ff2346',
  lightGray: '#f5f5f5',
  darkGray: '#333333',
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function LocationScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    roomCode?: string;
    roomId?: string;
    mode: string;
  }>();
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingGPS, setLoadingGPS] = useState(false);

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

      const location = await Location.getCurrentPositionAsync({});
      const reverseGeocode = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      if (reverseGeocode.length > 0) {
        const place = reverseGeocode[0];
        const formattedAddress = `${place.street || ''}, ${place.city || ''}, ${place.region || ''}`.trim().replace(/^,\s*|,\s*$/g, '');
        setAddress(formattedAddress);

        if (Platform.OS !== 'web') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to get your location. Please try again.');
    } finally {
      setLoadingGPS(false);
    }
  };

  const handleContinue = async () => {
    if (!address.trim()) {
      Alert.alert('Required', 'Please enter a location or use your GPS.');
      return;
    }

    setLoading(true);
    try {
      router.push({
        pathname: '/group/preferences',
        params: {
          roomCode: params.roomCode,
          roomId: params.roomId,
          mode: params.mode,
          address,
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
            <MapPin
              size={20}
              color={COLORS.darkGray}
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              placeholder="Enter an address or city"
              placeholderTextColor={`${COLORS.darkGray}40`}
              value={address}
              onChangeText={setAddress}
              autoCorrect={false}
            />
          </View>
        </Animated.View>

        <Animated.View
          style={styles.footer}
          entering={FadeInDown.delay(500).springify()}
        >
          <AnimatedPressable
            style={[
              styles.continueButton,
              (!address.trim() || loading) && styles.buttonDisabled,
            ]}
            onPress={handleContinue}
            disabled={!address.trim() || loading}
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
});

