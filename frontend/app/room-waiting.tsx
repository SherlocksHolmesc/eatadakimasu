import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  Share,
  Platform,
  Pressable,
  Modal,
  TextInput,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { ArrowLeft, MapPin, Navigation, Search } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import * as Location from 'expo-location';
import Constants from 'expo-constants';

const COLORS = {
  white: '#FFFFFF',
  stone50: '#fafaf9',
  stone100: '#f5f5f4',
  stone200: '#e7e5e4',
  stone300: '#d6d3d1',
  stone500: '#78716c',
  stone700: '#44403c',
  stone900: '#1c1917',
  red600: '#dc2626',
  rose100: '#ffe4e6',
  green500: '#22c55e',
  darkGray: '#1C1917',
  lightGray: '#F5F5F4',
  accent: '#DC2626',
};

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

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function RoomWaitingScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { roomCode, roomId } = params;

  const [currentUserId, setCurrentUserId] = React.useState<string>('');
  const [showLeaveConfirm, setShowLeaveConfirm] = React.useState(false);
  const [showLocationModal, setShowLocationModal] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [predictions, setPredictions] = React.useState<PlacePrediction[]>([]);
  const [loadingPredictions, setLoadingPredictions] = React.useState(false);
  const [loadingGPS, setLoadingGPS] = React.useState(false);
  const [selectedLocation, setSelectedLocation] = React.useState<string>('');

  // Real-time query - automatically updates when members join/leave
  const roomData = useQuery(api.rooms.getRoom, 
    roomCode ? { roomCode: roomCode as string } : 'skip'
  );

  // Debug: Log roomData changes
  React.useEffect(() => {
    console.log('=== ROOM DATA CHANGED ===');
    console.log('Full roomData:', JSON.stringify(roomData, null, 2));
  }, [roomData]);

  const setUserReadyMutation = useMutation(api.rooms.setUserReady);
  const leaveRoomMutation = useMutation(api.rooms.leaveRoom);
  const startSessionMutation = useMutation(api.rooms.startSession);
  const updateMemberPreferencesMutation = useMutation(api.rooms.updateMemberPreferences);

  React.useEffect(() => {
    const getUserId = async () => {
      const id = await AsyncStorage.getItem('userId');
      setCurrentUserId(id || '');
    };
    getUserId();
  }, []);

  // Auto-navigate when host starts the session
  const [hasNavigated, setHasNavigated] = React.useState(false);
  
  React.useEffect(() => {
    console.log('=== Navigation Check ===');
    
    // Only run if roomData is loaded
    if (!roomData) {
      console.log('No roomData yet, skipping navigation check');
      return;
    }
    
    // Don't navigate if we already did
    if (hasNavigated) {
      console.log('Already navigated, skipping');
      return;
    }
    
    console.log('Checking navigation conditions:');
    console.log('  sessionStarted:', roomData.sessionStarted);
    console.log('  currentScreen:', roomData.currentScreen);
    console.log('  roomCode:', roomCode);
    console.log('  roomId:', roomId);
    
    if (roomData.sessionStarted && roomData.currentScreen === 'preferences') {
      console.log('🚀 CONDITIONS MET! NAVIGATING TO PREFERENCES!');
      setHasNavigated(true); // Prevent multiple navigations
      // Only navigate if user hasn't already set preferences
      const currentMember = roomData.members.find((m: any) => m.userId === currentUserId);
      if (!currentMember?.preferences) {
        router.push({
          pathname: '/group/preferences',
          params: { roomCode, roomId, mode: 'group' }
        });
      }
    } else {
      console.log('❌ Conditions not met for navigation');
    }
  }, [roomData, hasNavigated]);

  const fetchPredictions = async (input: string) => {
    if (!input.trim() || input.length < 2) {
      setPredictions([]);
      return;
    }

    setLoadingPredictions(true);
    try {
      const apiUrl = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(input)}&key=${GOOGLE_PLACES_API_KEY}&components=country:my`;
      
      let response: Response;
      if (Platform.OS === 'web') {
        try {
          response = await fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(apiUrl)}`);
        } catch {
          response = await fetch(`https://corsproxy.io/?${encodeURIComponent(apiUrl)}`);
        }
      } else {
        response = await fetch(apiUrl);
      }

      const data = await response.json() as { predictions?: any[] };
      
      if (data.predictions) {
        setPredictions(data.predictions);
      }
    } catch (error) {
      console.error('Error fetching predictions:', error);
    } finally {
      setLoadingPredictions(false);
    }
  };

  const handleSelectPlace = (place: PlacePrediction) => {
    setSelectedLocation(place.description);
    setSearchQuery(place.description);
    setPredictions([]);
    setShowLocationModal(false);
    
    // Update location in member preferences
    if (roomId && currentUserId) {
      updateMemberPreferencesMutation({
        roomId: roomId as any,
        userId: currentUserId as any,
        preferences: {
          location: place.description,
        },
      }).catch((error) => {
        console.error('Error updating location:', error);
        Alert.alert('Error', 'Failed to save location');
      });
    }
    
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleUseCurrentLocation = async () => {
    setLoadingGPS(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required to use this feature.');
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${location.coords.latitude},${location.coords.longitude}&key=${GOOGLE_PLACES_API_KEY}`;
      
      let response: Response;
      if (Platform.OS === 'web') {
        try {
          response = await fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(geocodeUrl)}`);
        } catch {
          response = await fetch(`https://corsproxy.io/?${encodeURIComponent(geocodeUrl)}`);
        }
      } else {
        response = await fetch(geocodeUrl);
      }
      
      const data = await response.json() as { results?: Array<{ formatted_address: string }> };

      if (data.results && data.results.length > 0) {
        const formattedAddress = data.results[0].formatted_address;
        setSelectedLocation(formattedAddress);
        setSearchQuery(formattedAddress);
        setShowLocationModal(false);
        setPredictions([]);

        // Update location in member preferences
        if (roomId && currentUserId) {
          updateMemberPreferencesMutation({
            roomId: roomId as any,
            userId: currentUserId as any,
            preferences: {
              location: formattedAddress,
            },
          }).catch((error) => {
            console.error('Error updating location:', error);
          });
        }

        if (Platform.OS !== 'web') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      }
    } catch (error) {
      console.error('Location error:', error);
      Alert.alert('Error', 'Failed to get your location. Please try again.');
    } finally {
      setLoadingGPS(false);
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Join my food room! Room Code: ${roomCode}\n\nDownload Eatadakimasu and enter this code to join.`,
      });
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  const handleReady = async () => {
    if (!roomId || !currentUserId) return;

    try {
      const currentMember = roomData?.members.find(m => m.userId === currentUserId);
      await setUserReadyMutation({
        roomId: roomId as any,
        userId: currentUserId as any,
        isReady: !currentMember?.isReady,
      });
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const handleStart = async () => {
    console.log('START clicked!');
    console.log('roomId:', roomId);
    console.log('roomData:', roomData);
    
    // Check if everyone is ready
    const allReady = roomData?.members.every(m => m.isReady);
    console.log('allReady:', allReady);
    
    if (!allReady) {
      if (Platform.OS === 'web') {
        (globalThis as any).alert('Wait for everyone to be ready!');
      } else {
        Alert.alert('Not Ready', 'Wait for everyone to be ready!');
      }
      return;
    }

    if (!roomId) {
      console.log('No roomId, returning');
      return;
    }

    try {
      console.log('Calling startSessionMutation...');
      // Start the session - this will trigger navigation for ALL members
      await startSessionMutation({
        roomId: roomId as any,
        screen: 'preferences',
      });
      console.log('Session started successfully!');
      
      // Navigate immediately for the host to preferences screen
      console.log('Navigating host to preferences...');
      router.push({
        pathname: '/group/preferences',
        params: { roomCode, roomId, mode: 'group' }
      });
    } catch (error: any) {
      console.error('Start session error:', error);
      if (Platform.OS === 'web') {
        (globalThis as any).alert('Error starting session: ' + error.message);
      } else {
        Alert.alert('Error', 'Error starting session: ' + error.message);
      }
    }
  };

  const handleLeave = () => {
    // Show popup confirmation instead of native alert
    setShowLeaveConfirm(true);
  };

  const confirmLeaveRoom = async () => {
    setShowLeaveConfirm(false);
    
    try {
      // Only call leaveRoom if we have the required data
      if (roomId && currentUserId) {
        await leaveRoomMutation({
          roomId: roomId as any,
          userId: currentUserId as any,
        });
      }
      router.back();
    } catch (error: any) {
      console.error('Leave room error:', error);
      // Still navigate back even if there's an error
      router.back();
    }
  };

  const cancelLeave = () => {
    setShowLeaveConfirm(false);
  };

  if (!roomData) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading room...</Text>
      </View>
    );
  }

  const isHost = roomData.hostUserId === currentUserId;
  const allReady = roomData.members.every(m => m.isReady);
  const currentMember = roomData.members.find(m => m.userId === currentUserId);

  return (
    <View style={styles.container}>
      {/* Back button */}
      <Pressable 
        style={styles.backButton}
        onPress={handleLeave}
      >
        <ArrowLeft size={24} color={COLORS.stone700} />
      </Pressable>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Animated.View
          style={styles.content}
          entering={FadeInDown.delay(100).springify()}
        >
        {/* Title */}
        <Text style={styles.title}>Group Room</Text>
        <Text style={styles.description}>
          Share the room code with your friends to join
        </Text>

        {/* Location Display/Edit - Host Only */}
        {isHost && (
          <Animated.View 
            style={styles.locationContainer}
            entering={FadeInDown.delay(150).springify()}
          >
            <View style={styles.locationHeader}>
              <MapPin size={20} color={COLORS.accent} />
              <Text style={styles.locationLabel}>Location</Text>
            </View>
            {selectedLocation ? (
              <Pressable 
                style={styles.locationValue}
                onPress={() => setShowLocationModal(true)}
              >
                <Text numberOfLines={1} style={styles.locationValueText}>
                  {selectedLocation}
                </Text>
              </Pressable>
            ) : (
              <Pressable 
                style={styles.selectLocationButton}
                onPress={() => setShowLocationModal(true)}
              >
                <Text style={styles.selectLocationText}>Select location...</Text>
              </Pressable>
            )}
          </Animated.View>
        )}

        {/* Room Code Display */}
        <Animated.View 
          style={styles.roomCodeContainer}
          entering={FadeInDown.delay(200).springify()}
        >
          <Text style={styles.roomCodeLabel}>ROOM CODE</Text>
          <Text style={styles.roomCode}>{roomCode}</Text>
          <AnimatedPressable 
            style={styles.shareButton} 
            onPress={handleShare}
            entering={FadeInDown.delay(300).springify()}
          >
            <Text style={styles.shareButtonText}>📤 Share Code</Text>
          </AnimatedPressable>
        </Animated.View>

        {/* Members List */}
        <View style={styles.membersContainer}>
          <Text style={styles.membersTitle}>
            Members ({roomData.members.length})
          </Text>
          
          <ScrollView style={styles.membersList} showsVerticalScrollIndicator={false}>
            {roomData.members.map((member, index) => (
              <Animated.View 
                key={index} 
                style={styles.memberItem}
                entering={FadeInDown.delay(400 + index * 50).springify()}
              >
                <View style={styles.memberInfo}>
                  <Text style={styles.memberName}>
                    {member.username}
                    {member.userId === roomData.hostUserId && ' 👑'}
                  </Text>
                </View>
                <View style={[
                  styles.readyIndicator,
                  member.isReady && styles.readyIndicatorActive
                ]}>
                  <Text style={[
                    styles.readyText,
                    member.isReady && styles.readyTextActive
                  ]}>
                    {member.isReady ? '✓ Ready' : 'Waiting...'}
                  </Text>
                </View>
              </Animated.View>
            ))}
          </ScrollView>
        </View>

        {/* Ready Button */}
        <AnimatedPressable 
          style={[
            styles.readyButton,
            currentMember?.isReady && styles.readyButtonActive
          ]}
          onPress={handleReady}
          entering={FadeInDown.delay(500).springify()}
        >
          <Text style={styles.readyButtonText}>
            {currentMember?.isReady ? "I'M READY ✓" : "READY UP"}
          </Text>
        </AnimatedPressable>

        {/* Start Button (Host Only) */}
        {isHost && (
          <AnimatedPressable 
            style={[
              styles.startButton,
              !allReady && styles.startButtonDisabled
            ]}
            onPress={handleStart}
            disabled={!allReady}
            entering={FadeInDown.delay(600).springify()}
          >
            <Text style={styles.startButtonText}>
              {allReady ? 'SET PREFERENCES' : 'WAITING FOR EVERYONE...'}
            </Text>
          </AnimatedPressable>
        )}

        {!isHost && allReady && (
          <Animated.View 
            style={styles.waitingForHost}
            entering={FadeInDown.delay(600).springify()}
          >
            <Text style={styles.waitingText}>Waiting for host to start...</Text>
          </Animated.View>
        )}
      </Animated.View>
      </ScrollView>

      {/* Location Selection Modal */}
      <Modal
        visible={showLocationModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowLocationModal(false)}
      >
        <View style={styles.locationModalContainer}>
          <View style={styles.locationModalContent}>
            <View style={styles.locationModalHeader}>
              <Text style={styles.locationModalTitle}>Select Location</Text>
              <Pressable onPress={() => setShowLocationModal(false)}>
                <Text style={styles.locationModalClose}>✕</Text>
              </Pressable>
            </View>

            {/* GPS Button */}
            <Pressable 
              style={styles.gpsButton}
              onPress={handleUseCurrentLocation}
              disabled={loadingGPS}
            >
              {loadingGPS ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <>
                  <Navigation size={20} color={COLORS.white} />
                  <Text style={styles.gpsButtonText}>Use Current Location</Text>
                </>
              )}
            </Pressable>

            {/* Search Input */}
            <View style={styles.searchContainer}>
              <Search size={18} color={COLORS.darkGray} style={{ marginRight: 8 }} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search location..."
                placeholderTextColor={COLORS.darkGray}
                value={searchQuery}
                onChangeText={(text) => {
                  setSearchQuery(text);
                  fetchPredictions(text);
                }}
              />
            </View>

            {/* Predictions List */}
            {loadingPredictions ? (
              <ActivityIndicator size="large" color={COLORS.accent} style={{ marginTop: 20 }} />
            ) : (
              <FlatList
                data={predictions}
                keyExtractor={(item) => item.place_id}
                renderItem={({ item }) => (
                  <Pressable 
                    style={styles.predictionItem}
                    onPress={() => handleSelectPlace(item)}
                  >
                    <MapPin size={16} color={COLORS.darkGray} style={{ marginRight: 8 }} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.predictionMainText}>
                        {item.structured_formatting.main_text}
                      </Text>
                      <Text style={styles.predictionSecondaryText}>
                        {item.structured_formatting.secondary_text}
                      </Text>
                    </View>
                  </Pressable>
                )}
              />
            )}
          </View>
        </View>
      </Modal>

      {/* Leave Confirmation Modal */}
      <Modal
        visible={showLeaveConfirm}
        transparent
        animationType="fade"
        onRequestClose={cancelLeave}
      >
        <View style={styles.modalOverlay}>
          <Animated.View 
            style={styles.confirmModal}
            entering={FadeInDown.springify()}
          >
            <Text style={styles.confirmTitle}>Leave Room?</Text>
            <Text style={styles.confirmMessage}>
              Are you sure you want to leave this room?
            </Text>
            
            <View style={styles.confirmButtonsContainer}>
              <Pressable 
                style={styles.cancelButton}
                onPress={cancelLeave}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </Pressable>
              
              <Pressable 
                style={styles.leaveButton}
                onPress={confirmLeaveRoom}
              >
                <Text style={styles.leaveButtonText}>Leave</Text>
              </Pressable>
            </View>
          </Animated.View>
        </View>
      </Modal>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
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
    fontSize: 28,
    fontWeight: '900',
    color: COLORS.red600,
    marginBottom: 8,
    letterSpacing: 2,
  },
  description: {
    fontSize: 16,
    color: COLORS.stone500,
    marginBottom: 40,
    lineHeight: 24,
  },
  locationContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.accent,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  locationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  locationLabel: {
    fontSize: 12,
    color: COLORS.darkGray,
    opacity: 0.6,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  locationValue: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: COLORS.lightGray,
    borderRadius: 12,
  },
  locationValueText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.darkGray,
  },
  selectLocationButton: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: COLORS.lightGray,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.accent,
    borderStyle: 'dashed',
  },
  selectLocationText: {
    fontSize: 14,
    color: COLORS.darkGray,
    opacity: 0.6,
    fontWeight: '500',
  },
  locationModalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  locationModalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '90%',
  },
  locationModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  locationModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.darkGray,
  },
  locationModalClose: {
    fontSize: 24,
    color: COLORS.darkGray,
    opacity: 0.6,
  },
  gpsButton: {
    flexDirection: 'row',
    backgroundColor: COLORS.accent,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 16,
  },
  gpsButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '600',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.lightGray,
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    fontSize: 14,
    color: COLORS.darkGray,
  },
  predictionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  predictionMainText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.darkGray,
    marginBottom: 4,
  },
  predictionSecondaryText: {
    fontSize: 12,
    color: COLORS.darkGray,
    opacity: 0.6,
  },
  loadingText: {
    fontSize: 16,
    color: COLORS.stone500,
    textAlign: 'center',
    marginTop: 100,
  },
  roomCodeContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 2,
    borderColor: COLORS.red600,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  roomCodeLabel: {
    fontSize: 12,
    color: COLORS.stone500,
    fontWeight: '600',
    marginBottom: 12,
    letterSpacing: 1,
  },
  roomCode: {
    fontSize: 42,
    fontWeight: '900',
    color: COLORS.red600,
    letterSpacing: 6,
    marginBottom: 20,
  },
  shareButton: {
    backgroundColor: COLORS.red600,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
    minWidth: 140,
    alignItems: 'center',
  },
  shareButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '700',
  },
  membersContainer: {
    flex: 1,
    marginBottom: 20,
  },
  membersTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.stone700,
    marginBottom: 16,
  },
  membersList: {
    flex: 1,
  },
  memberItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.stone200,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.stone900,
  },
  readyIndicator: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: COLORS.stone200,
  },
  readyIndicatorActive: {
    backgroundColor: COLORS.green500,
  },
  readyText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.stone700,
  },
  readyTextActive: {
    color: COLORS.white,
  },
  readyButton: {
    backgroundColor: COLORS.red600,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: COLORS.red600,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  readyButtonActive: {
    backgroundColor: COLORS.green500,
    shadowColor: COLORS.green500,
  },
  readyButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 1,
  },
  startButton: {
    backgroundColor: COLORS.red600,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.red600,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  startButtonDisabled: {
    backgroundColor: COLORS.stone300,
    shadowColor: '#000',
    shadowOpacity: 0.1,
  },
  startButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 1,
  },
  waitingForHost: {
    padding: 16,
    backgroundColor: COLORS.stone100,
    borderRadius: 16,
    alignItems: 'center',
  },
  waitingText: {
    fontSize: 14,
    color: COLORS.stone500,
    fontStyle: 'italic',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmModal: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: 28,
    width: '85%',
    maxWidth: 380,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  confirmTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.darkGray,
    marginBottom: 12,
    textAlign: 'center',
  },
  confirmMessage: {
    fontSize: 16,
    color: COLORS.darkGray,
    opacity: 0.7,
    marginBottom: 28,
    textAlign: 'center',
    lineHeight: 24,
  },
  confirmButtonsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: COLORS.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.darkGray,
  },
  leaveButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: COLORS.accent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  leaveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.white,
  },
});

