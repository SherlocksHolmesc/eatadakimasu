import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Dimensions,
  Pressable,
  Platform,
  Modal,
  ScrollView,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
  interpolate,
} from 'react-native-reanimated';
import {
  Gesture,
  GestureDetector,
} from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import { X, Heart, Star, MapPin, Clock, ChevronLeft } from 'lucide-react-native';
import Constants from 'expo-constants';

const API_URL = Constants.expoConfig?.extra?.EXPO_PUBLIC_BACKEND_URL || process.env.EXPO_PUBLIC_BACKEND_URL || '';
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.3;

const COLORS = {
  white: '#FFFFFF',
  stone50: '#fafaf9',
  stone100: '#f5f5f4',
  stone200: '#e7e5e4',
  stone500: '#78716c',
  stone700: '#44403c',
  stone900: '#1c1917',
  red600: '#dc2626',
  green500: '#22c55e',
  rose100: '#ffe4e6',
};

type Restaurant = {
  id: string;
  name: string;
  photo: string;
  cuisine: string;
  price_range: string;
  rating: number;
  address: string;
  menu_photos?: string[];
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function getPriceSymbol(priceRange: string): string {
  if (typeof priceRange === 'string') {
    return priceRange;
  }
  const num = typeof priceRange === 'number' ? priceRange : parseInt(priceRange);
  return '$'.repeat(Math.max(1, Math.min(4, num)));
}

export default function SwipeScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    roomCode?: string;
    mode: string;
    location: string;
    cuisines: string;
    minBudget: string;
    maxBudget: string;
  }>();
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [userId] = useState(`user_${Math.random().toString(36).substr(2, 9)}`);

  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  useEffect(() => {
    loadRestaurants();
  }, []);

  const loadRestaurants = async () => {
    try {
      const cuisineList = typeof params.cuisines === 'string' ? params.cuisines.split(',') : [params.cuisines];
      const response = await fetch(`${API_URL}/api/restaurants`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cuisines: cuisineList,
          min_budget: parseInt(params.minBudget),
          max_budget: parseInt(params.maxBudget),
          location: params.location,
        }),
      });

      const data = await response.json() as { restaurants?: Restaurant[] };
      setRestaurants(data.restaurants || []);
    } catch (error) {
      console.error('Error loading restaurants:', error);
      Alert.alert('Error', 'Failed to load restaurants');
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (vote: boolean) => {
    if (currentIndex >= restaurants.length) return;

    const restaurant = restaurants[currentIndex];

    try {
      // Save vote to backend API (for both solo and group)
      await fetch(`${API_URL}/api/votes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          room_code: params.roomCode || '',
          user_id: userId,
          restaurant_id: restaurant.id,
          vote: vote ? 'yes' : 'no',
        }),
      });

      if (Platform.OS !== 'web') {
        Haptics.impactAsync(
          vote
            ? Haptics.ImpactFeedbackStyle.Medium
            : Haptics.ImpactFeedbackStyle.Light
        );
      }

      if (currentIndex === restaurants.length - 1) {
        // Navigate to results - both solo and group mode
        router.push({
          pathname: '/results',
          params: {
            roomCode: params.roomCode || '',
            mode: params.mode,
          },
        });
      } else {
        setCurrentIndex((prev) => prev + 1);
        translateX.value = 0;
        translateY.value = 0;
      }
    } catch (error) {
      console.error('Error voting:', error);
    }
  };

  const handleSwipe = (direction: 'left' | 'right') => {
    translateX.value = withTiming(
      direction === 'right' ? SCREEN_WIDTH * 1.5 : -SCREEN_WIDTH * 1.5,
      { duration: 300 },
      () => {
        runOnJS(handleVote)(direction === 'right');
      }
    );
  };

  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      translateX.value = event.translationX;
      translateY.value = event.translationY;
    })
    .onEnd(() => {
      if (Math.abs(translateX.value) > SWIPE_THRESHOLD) {
        const direction = translateX.value > 0 ? 'right' : 'left';
        translateX.value = withTiming(
          direction === 'right' ? SCREEN_WIDTH * 1.5 : -SCREEN_WIDTH * 1.5,
          { duration: 300 },
          () => {
            runOnJS(handleVote)(direction === 'right');
          }
        );
      } else {
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
      }
    });

  const cardStyle = useAnimatedStyle(() => {
    const rotate = interpolate(
      translateX.value,
      [-SCREEN_WIDTH, 0, SCREEN_WIDTH],
      [-20, 0, 20]
    );

    const opacity = interpolate(
      Math.abs(translateX.value),
      [0, SWIPE_THRESHOLD],
      [1, 0.8]
    );

    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { rotate: `${rotate}deg` },
      ] as any,
      opacity,
    };
  });

  const likeOpacityStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      translateX.value,
      [0, SWIPE_THRESHOLD],
      [0, 1]
    );
    return { opacity };
  });

  const nopeOpacityStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      translateX.value,
      [-SWIPE_THRESHOLD, 0],
      [1, 0]
    );
    return { opacity };
  });

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading restaurants...</Text>
      </View>
    );
  }

  if (restaurants.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No restaurants found</Text>
        <Pressable
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  const currentRestaurant = restaurants[currentIndex];

  if (!currentRestaurant) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <ChevronLeft size={28} color={COLORS.stone700} />
        </Pressable>
        {params.roomCode && (
          <View style={styles.roomCodeContainer}>
            <Text style={styles.roomCodeLabel}>Room</Text>
            <Text style={styles.roomCode}>{params.roomCode}</Text>
          </View>
        )}
        <View style={styles.progressContainer}>
          <Text style={styles.progressText}>
            {currentIndex + 1}/{restaurants.length}
          </Text>
        </View>
      </View>

      <View style={styles.cardsContainer}>
        <GestureDetector gesture={panGesture}>
          <Animated.View style={[styles.card, cardStyle]}>
            <Pressable onPress={() => setShowModal(true)} style={styles.cardInner}>
              <Image
                source={{ uri: currentRestaurant.photo }}
                style={styles.cardImage}
                resizeMode="cover"
              />

              <Animated.View style={[styles.likeStamp, likeOpacityStyle]}>
                <Text style={styles.stampText}>LIKE</Text>
              </Animated.View>

              <Animated.View style={[styles.nopeStamp, nopeOpacityStyle]}>
                <Text style={styles.stampText}>NOPE</Text>
              </Animated.View>

              <View style={styles.cardOverlay}>
                <View style={styles.cardInfo}>
                  <Text style={styles.restaurantName} numberOfLines={1}>
                    {currentRestaurant.name}
                  </Text>
                  <View style={styles.infoRow}>
                    <View style={styles.rating}>
                      <Star size={16} color="#FFB800" fill="#FFB800" />
                      <Text style={styles.ratingText}>
                        {currentRestaurant.rating.toFixed(1)}
                      </Text>
                    </View>
                    <Text style={styles.separator}>•</Text>
                    <Text style={styles.price}>
                      {getPriceSymbol(currentRestaurant.price_range)}
                    </Text>
                    <Text style={styles.separator}>•</Text>
                    <Text style={styles.cuisine}>
                      {currentRestaurant.cuisine}
                    </Text>
                  </View>
                  <View style={styles.metaRow}>
                    <View style={styles.metaItem}>
                      <MapPin size={14} color={COLORS.white} />
                      <Text style={styles.metaText}>
                        {currentRestaurant.address.split(',')[0]}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            </Pressable>
          </Animated.View>
        </GestureDetector>

        {currentIndex < restaurants.length - 1 && (
          <View style={[styles.card, styles.nextCard]}>
            <Image
              source={{ uri: restaurants[currentIndex + 1].photo }}
              style={styles.cardImage}
              resizeMode="cover"
            />
          </View>
        )}
      </View>

      <View style={styles.actions}>
        <AnimatedPressable
          style={styles.actionButton}
          onPress={() => handleSwipe('left')}
        >
          <X size={32} color={COLORS.red600} strokeWidth={2.5} />
        </AnimatedPressable>

        <AnimatedPressable
          style={[styles.actionButton, styles.likeButton]}
          onPress={() => handleSwipe('right')}
        >
          <Heart size={32} color={COLORS.green500} strokeWidth={2.5} />
        </AnimatedPressable>
      </View>

      <Modal
        visible={showModal}
        animationType="slide"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{currentRestaurant.name}</Text>
            <Pressable onPress={() => setShowModal(false)}>
              <X size={28} color={COLORS.stone700} />
            </Pressable>
          </View>

          <ScrollView style={styles.modalContent}>
            <Image
              source={{ uri: currentRestaurant.photo }}
              style={styles.modalImage}
              resizeMode="cover"
            />

            <View style={styles.modalInfo}>
              <View style={styles.modalRow}>
                <Star size={20} color="#FFB800" fill="#FFB800" />
                <Text style={styles.modalRating}>
                  {currentRestaurant.rating.toFixed(1)}
                </Text>
                <Text style={styles.modalSeparator}>•</Text>
                <Text style={styles.modalPrice}>
                  {getPriceSymbol(currentRestaurant.price_range)}
                </Text>
                <Text style={styles.modalSeparator}>•</Text>
                <Text style={styles.modalCuisine}>
                  {currentRestaurant.cuisine}
                </Text>
              </View>

              <View style={styles.modalMeta}>
                <View style={styles.modalMetaItem}>
                  <MapPin size={18} color={COLORS.stone700} />
                  <Text style={styles.modalMetaText}>
                    {currentRestaurant.address}
                  </Text>
                </View>
              </View>

              {currentRestaurant.menu_photos && currentRestaurant.menu_photos.length > 0 && (
                <>
                  <Text style={styles.menuPhotosLabel}>Menu Photos</Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.menuPhotosScroll}
                  >
                    {currentRestaurant.menu_photos.map((photo, index) => (
                      <Image
                        key={index}
                        source={{ uri: photo }}
                        style={styles.menuPhoto}
                        resizeMode="cover"
                      />
                    ))}
                  </ScrollView>
                </>
              )}
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.stone50,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 20,
  },
  roomCodeContainer: {
    backgroundColor: COLORS.rose100,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  roomCodeLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.stone500,
    textAlign: 'center',
  },
  roomCode: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.red600,
    letterSpacing: 2,
    textAlign: 'center',
  },
  progressContainer: {
    backgroundColor: COLORS.stone200,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.stone700,
  },
  cardsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    width: SCREEN_WIDTH - 48,
    height: SCREEN_HEIGHT * 0.6,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 10,
    position: 'absolute',
  },
  nextCard: {
    transform: [{ scale: 0.95 }],
    opacity: 0.5,
  },
  cardInner: {
    flex: 1,
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  likeStamp: {
    position: 'absolute',
    top: 40,
    right: 40,
    backgroundColor: COLORS.green500,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    transform: [{ rotate: '20deg' }],
    borderWidth: 4,
    borderColor: COLORS.white,
  },
  nopeStamp: {
    position: 'absolute',
    top: 40,
    left: 40,
    backgroundColor: COLORS.red600,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    transform: [{ rotate: '-20deg' }],
    borderWidth: 4,
    borderColor: COLORS.white,
  },
  stampText: {
    fontSize: 32,
    fontWeight: '800',
    color: COLORS.white,
    letterSpacing: 2,
  },
  cardOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 24,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  cardInfo: {
    gap: 8,
  },
  restaurantName: {
    fontSize: 32,
    fontWeight: '800',
    color: COLORS.white,
    marginBottom: 4,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.white,
  },
  separator: {
    fontSize: 16,
    color: COLORS.white,
    opacity: 0.5,
  },
  price: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.white,
  },
  cuisine: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.white,
    opacity: 0.9,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 40,
    paddingBottom: 100,
  },
  actionButton: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
    borderWidth: 2,
    borderColor: COLORS.red600,
  },
  likeButton: {
    borderColor: COLORS.green500,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.stone50,
  },
  loadingText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.stone700,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.stone50,
    paddingHorizontal: 24,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.stone700,
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: COLORS.red600,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.white,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.stone100,
    backgroundColor: COLORS.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.stone900,
    flex: 1,
    letterSpacing: 0.5,
  },
  modalContent: {
    flex: 1,
    backgroundColor: COLORS.stone50,
  },
  modalImage: {
    width: '100%',
    height: 280,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  modalInfo: {
    padding: 24,
    backgroundColor: COLORS.white,
    marginTop: 16,
    marginHorizontal: 16,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  modalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  modalRating: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.stone900,
  },
  modalSeparator: {
    fontSize: 18,
    color: COLORS.stone500,
  },
  modalPrice: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.stone900,
  },
  modalCuisine: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.stone700,
  },
  modalMeta: {
    gap: 12,
    marginBottom: 24,
  },
  modalMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalMetaText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.stone500,
  },
  menuPhotosLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.stone900,
    marginBottom: 12,
  },
  menuPhotosScroll: {
    marginHorizontal: -24,
    paddingHorizontal: 24,
  },
  menuPhoto: {
    width: 200,
    height: 150,
    borderRadius: 12,
    marginRight: 12,
  },
});
