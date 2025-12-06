import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  Animated,
  PanResponder,
  Modal,
  ScrollView,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Constants from 'expo-constants';

const API_URL = Constants.expoConfig?.extra?.EXPO_PUBLIC_BACKEND_URL || process.env.EXPO_PUBLIC_BACKEND_URL || '';
const SCREEN_WIDTH = Dimensions.get('window').width;
const SCREEN_HEIGHT = Dimensions.get('window').height;
const SWIPE_THRESHOLD = 120;

interface Restaurant {
  id: string;
  name: string;
  cuisine: string;
  rating: number;
  price_range: string;
  address: string;
  photo: string;
  menu_photos: string[];
}

export default function SwipeScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { roomCode, mode, location, cuisines, minBudget, maxBudget } = params;

  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [showMenu, setShowMenu] = useState(false);
  const [userId] = useState(`user_${Math.random().toString(36).substr(2, 9)}`);
  const [votedRestaurants, setVotedRestaurants] = useState<string[]>([]);

  const position = useRef(new Animated.ValueXY()).current;
  const rotate = position.x.interpolate({
    inputRange: [-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2],
    outputRange: ['-10deg', '0deg', '10deg'],
    extrapolate: 'clamp',
  });

  const likeOpacity = position.x.interpolate({
    inputRange: [0, SCREEN_WIDTH / 4],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const nopeOpacity = position.x.interpolate({
    inputRange: [-SCREEN_WIDTH / 4, 0],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  useEffect(() => {
    fetchRestaurants();
  }, []);

  const fetchRestaurants = async () => {
    try {
      const cuisineList = typeof cuisines === 'string' ? cuisines.split(',') : [cuisines];
      const response = await fetch(`${API_URL}/api/restaurants`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cuisines: cuisineList,
          min_budget: parseInt(minBudget as string),
          max_budget: parseInt(maxBudget as string),
          location: location,
        }),
      });

      const data = await response.json() as { restaurants?: Restaurant[] };
      setRestaurants(data.restaurants || []);
    } catch (error) {
      console.error('Fetch restaurants error:', error);
      Alert.alert('Error', 'Failed to load restaurants');
    } finally {
      setIsLoading(false);
    }
  };

  const submitVote = async (restaurantId: string, vote: 'yes' | 'no') => {
    try {
      await fetch(`${API_URL}/api/votes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          room_code: roomCode,
          user_id: userId,
          restaurant_id: restaurantId,
          vote: vote,
        }),
      });

      if (vote === 'yes') {
        setVotedRestaurants([...votedRestaurants, restaurantId]);
      }
    } catch (error) {
      console.error('Submit vote error:', error);
    }
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gesture) => {
        position.setValue({ x: gesture.dx, y: gesture.dy });
      },
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dx > SWIPE_THRESHOLD) {
          // Swipe right - Like
          forceSwipe('right');
        } else if (gesture.dx < -SWIPE_THRESHOLD) {
          // Swipe left - Nope
          forceSwipe('left');
        } else {
          // Reset position
          Animated.spring(position, {
            toValue: { x: 0, y: 0 },
            useNativeDriver: false,
            friction: 4,
          }).start();
        }
      },
    })
  ).current;

  const forceSwipe = (direction: 'left' | 'right') => {
    const x = direction === 'right' ? SCREEN_WIDTH + 100 : -SCREEN_WIDTH - 100;
    Animated.timing(position, {
      toValue: { x, y: 0 },
      duration: 250,
      useNativeDriver: false,
    }).start(() => onSwipeComplete(direction));
  };

  const onSwipeComplete = (direction: 'left' | 'right') => {
    const restaurant = restaurants[currentIndex];
    if (restaurant) {
      submitVote(restaurant.id, direction === 'right' ? 'yes' : 'no');
    }

    position.setValue({ x: 0, y: 0 });
    setCurrentIndex(currentIndex + 1);
  };

  const handleLike = () => {
    forceSwipe('right');
  };

  const handleNope = () => {
    forceSwipe('left');
  };

  const viewResults = () => {
    router.push({
      pathname: '/results',
      params: { roomCode, mode },
    });
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Finding restaurants...</Text>
      </View>
    );
  }

  if (currentIndex >= restaurants.length) {
    return (
      <View style={styles.completedContainer}>
        <Text style={styles.pacmanEmoji}>🔴</Text>
        <Text style={styles.completedTitle}>All Done!</Text>
        <Text style={styles.completedSubtitle}>
          {mode === 'group' ? "Let's see what everyone agreed on!" : "Here are your picks!"}
        </Text>
        <TouchableOpacity style={styles.resultsButton} onPress={viewResults}>
          <Text style={styles.resultsButtonText}>VIEW RESULTS</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const currentRestaurant = restaurants[currentIndex];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backButton}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerLogo}>Eatadakimasu</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Progress */}
      <View style={styles.progressContainer}>
        <Text style={styles.progressText}>
          {currentIndex + 1} / {restaurants.length}
        </Text>
      </View>

      {/* Card */}
      <View style={styles.cardContainer}>
        <Animated.View
          style={[
            styles.card,
            {
              transform: [
                { translateX: position.x },
                { translateY: position.y },
                { rotate: rotate },
              ],
            },
          ]}
          {...panResponder.panHandlers}
        >
          {/* Like/Nope Overlays */}
          <Animated.View style={[styles.likeOverlay, { opacity: likeOpacity }]}>
            <Text style={styles.likeText}>LIKE</Text>
          </Animated.View>
          <Animated.View style={[styles.nopeOverlay, { opacity: nopeOpacity }]}>
            <Text style={styles.nopeText}>NOPE</Text>
          </Animated.View>

          {/* Restaurant Image */}
          <TouchableOpacity
            style={styles.imageContainer}
            onPress={() => setShowMenu(true)}
            activeOpacity={0.9}
          >
            <Image source={{ uri: currentRestaurant.photo }} style={styles.restaurantImage} />
          </TouchableOpacity>

          {/* Restaurant Info */}
          <View style={styles.infoContainer}>
            <Text style={styles.restaurantName}>{currentRestaurant.name}</Text>
            <View style={styles.detailsRow}>
              <Text style={styles.rating}>⭐ {currentRestaurant.rating}</Text>
              <Text style={styles.price}>{currentRestaurant.price_range}</Text>
              <Text style={styles.cuisine}>{currentRestaurant.cuisine}</Text>
            </View>
            <Text style={styles.address} numberOfLines={1}>
              📍 {currentRestaurant.address}
            </Text>
            <Text style={styles.tapHint}>Tap image to view menu</Text>
          </View>
        </Animated.View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity style={styles.nopeButton} onPress={handleNope}>
          <Text style={styles.actionIcon}>✕</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.likeButton} onPress={handleLike}>
          <Text style={styles.actionIcon}>✓</Text>
        </TouchableOpacity>
      </View>

      {/* Menu Modal */}
      <Modal visible={showMenu} animationType="slide" transparent={true}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <ScrollView>
              <Text style={styles.modalTitle}>Menu Photos</Text>
              {currentRestaurant.menu_photos.map((photo, index) => (
                <Image key={index} source={{ uri: photo }} style={styles.menuPhoto} />
              ))}
            </ScrollView>
            <TouchableOpacity style={styles.closeButton} onPress={() => setShowMenu(false)}>
              <Text style={styles.closeButtonText}>CLOSE</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    color: '#666',
  },
  completedContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  pacmanEmoji: {
    fontSize: 80,
    marginBottom: 24,
  },
  completedTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  completedSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 32,
  },
  resultsButton: {
    backgroundColor: '#ff2346',
    paddingHorizontal: 40,
    paddingVertical: 16,
    borderRadius: 28,
  },
  resultsButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 16,
  },
  backButton: {
    fontSize: 28,
    color: '#ff2346',
  },
  headerLogo: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ff2346',
  },
  placeholder: {
    width: 28,
  },
  progressContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  progressText: {
    fontSize: 14,
    color: '#666',
  },
  cardContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    width: SCREEN_WIDTH - 40,
    height: SCREEN_HEIGHT * 0.65,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  likeOverlay: {
    position: 'absolute',
    top: 40,
    right: 40,
    zIndex: 10,
    backgroundColor: 'rgba(0, 255, 0, 0.3)',
    padding: 16,
    borderRadius: 12,
    borderWidth: 4,
    borderColor: '#00ff00',
  },
  likeText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#00ff00',
  },
  nopeOverlay: {
    position: 'absolute',
    top: 40,
    left: 40,
    zIndex: 10,
    backgroundColor: 'rgba(255, 0, 0, 0.3)',
    padding: 16,
    borderRadius: 12,
    borderWidth: 4,
    borderColor: '#ff0000',
  },
  nopeText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ff0000',
  },
  imageContainer: {
    flex: 1,
  },
  restaurantImage: {
    width: '100%',
    height: '100%',
  },
  infoContainer: {
    padding: 20,
    backgroundColor: '#FFFFFF',
  },
  restaurantName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  detailsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
  },
  rating: {
    fontSize: 14,
    color: '#666',
  },
  price: {
    fontSize: 14,
    color: '#666',
  },
  cuisine: {
    fontSize: 14,
    color: '#666',
    textTransform: 'capitalize',
  },
  address: {
    fontSize: 12,
    color: '#999',
    marginBottom: 8,
  },
  tapHint: {
    fontSize: 11,
    color: '#ff2346',
    fontStyle: 'italic',
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 60,
    paddingVertical: 30,
  },
  nopeButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#ff0000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 5,
    borderWidth: 3,
    borderColor: '#ff0000',
  },
  likeButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#00ff00',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 5,
    borderWidth: 3,
    borderColor: '#00ff00',
  },
  actionIcon: {
    fontSize: 36,
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  menuPhoto: {
    width: '100%',
    height: 250,
    borderRadius: 12,
    marginBottom: 12,
  },
  closeButton: {
    backgroundColor: '#ff2346',
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 16,
  },
  closeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});
