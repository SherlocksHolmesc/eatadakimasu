import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  Pressable,
  Platform,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Star, MapPin, Clock, Trophy, Home } from 'lucide-react-native';
import Constants from 'expo-constants';

const API_URL = Constants.expoConfig?.extra?.EXPO_PUBLIC_BACKEND_URL || process.env.EXPO_PUBLIC_BACKEND_URL || '';

const COLORS = {
  white: '#FFFFFF',
  accent: '#ff2346',
  lightGray: '#f5f5f5',
  darkGray: '#333333',
  gold: '#FFD700',
  silver: '#C0C0C0',
  bronze: '#CD7F32',
};

type RestaurantWithVotes = {
  id: string;
  name: string;
  photo: string;
  cuisine: string;
  price_range: string;
  rating: number;
  address: string;
  vote_count?: number;
  votes?: number;
  totalVotes?: number;
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function getPriceSymbol(priceRange: string): string {
  if (typeof priceRange === 'string') {
    return priceRange;
  }
  const num = typeof priceRange === 'number' ? priceRange : parseInt(priceRange);
  return '$'.repeat(Math.max(1, Math.min(4, num)));
}

export default function ResultsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    roomCode: string;
    mode: string;
  }>();
  const [restaurants, setRestaurants] = useState<RestaurantWithVotes[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadResults();
  }, []);

  const loadResults = async () => {
    try {
      const response = await fetch(`${API_URL}/api/results/${params.roomCode}?mode=${params.mode}`);
      const data = await response.json() as { results?: any[] };
      
      const results = (data.results || []).map((restaurant: any) => ({
        ...restaurant,
        votes: restaurant.vote_count || 0,
        totalVotes: restaurant.totalVotes || 0,
      }))
      .filter((r: RestaurantWithVotes) => (r.votes || 0) > 0)
      .sort((a: RestaurantWithVotes, b: RestaurantWithVotes) => (b.votes || 0) - (a.votes || 0));

      // For group mode, show only top 3
      if (params.mode === 'group') {
        setRestaurants(results.slice(0, 3));
      } else {
        setRestaurants(results);
      }
    } catch (error) {
      console.error('Error loading results:', error);
      Alert.alert('Error', 'Failed to load results');
    } finally {
      setLoading(false);
    }
  };

  const handleStartOver = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    router.replace('/landing');
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading results...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Animated.View
        style={styles.header}
        entering={FadeInDown.delay(100).springify()}
      >
        <View style={styles.headerContent}>
          <Trophy size={32} color={COLORS.accent} strokeWidth={2.5} />
          <Text style={styles.title}>
            {params.mode === 'solo' ? 'Your Picks' : 'Group Results'}
          </Text>
        </View>
        <Text style={styles.subtitle}>
          {restaurants.length === 0
            ? 'No matches found'
            : params.mode === 'solo'
              ? 'Restaurants you liked'
              : 'Most popular choices'}
        </Text>
      </Animated.View>

      {restaurants.length === 0 ? (
        <Animated.View
          style={styles.emptyContainer}
          entering={FadeInDown.delay(200).springify()}
        >
          <Text style={styles.emptyText}>
            No restaurants were approved. Try adjusting your preferences and
            search again.
          </Text>
        </Animated.View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {restaurants.map((restaurant, index) => (
            <AnimatedPressable
              key={restaurant.id}
              style={styles.restaurantCard}
              entering={FadeInDown.delay(200 + index * 100).springify()}
            >
              <View style={styles.rankBadge}>
                {index === 0 && (
                  <View
                    style={[styles.rankBadgeInner, { backgroundColor: COLORS.gold }]}
                  >
                    <Text style={styles.rankText}>1</Text>
                  </View>
                )}
                {index === 1 && (
                  <View
                    style={[
                      styles.rankBadgeInner,
                      { backgroundColor: COLORS.silver },
                    ]}
                  >
                    <Text style={styles.rankText}>2</Text>
                  </View>
                )}
                {index === 2 && (
                  <View
                    style={[
                      styles.rankBadgeInner,
                      { backgroundColor: COLORS.bronze },
                    ]}
                  >
                    <Text style={styles.rankText}>3</Text>
                  </View>
                )}
                {index > 2 && (
                  <View
                    style={[
                      styles.rankBadgeInner,
                      { backgroundColor: COLORS.darkGray },
                    ]}
                  >
                    <Text style={styles.rankText}>{index + 1}</Text>
                  </View>
                )}
              </View>

              <Image
                source={{ uri: restaurant.photo }}
                style={styles.restaurantImage}
                resizeMode="cover"
              />

              <View style={styles.restaurantInfo}>
                <Text style={styles.restaurantName} numberOfLines={1}>
                  {restaurant.name}
                </Text>

                <View style={styles.infoRow}>
                  <View style={styles.rating}>
                    <Star size={14} color="#FFB800" fill="#FFB800" />
                    <Text style={styles.ratingText}>
                      {restaurant.rating.toFixed(1)}
                    </Text>
                  </View>
                  <Text style={styles.separator}>•</Text>
                  <Text style={styles.price}>
                    {getPriceSymbol(restaurant.price_range)}
                  </Text>
                  <Text style={styles.separator}>•</Text>
                  <Text style={styles.cuisine}>{restaurant.cuisine}</Text>
                </View>

                <View style={styles.metaRow}>
                  <View style={styles.metaItem}>
                    <MapPin size={12} color={COLORS.darkGray} />
                    <Text style={styles.metaText} numberOfLines={1}>
                      {restaurant.address}
                    </Text>
                  </View>
                </View>

                {params.mode === 'group' && restaurant.votes && restaurant.totalVotes && (
                  <View style={styles.voteContainer}>
                    <View style={styles.voteBar}>
                      <View
                        style={[
                          styles.voteBarFill,
                          {
                            width: `${(restaurant.votes / restaurant.totalVotes) * 100}%`,
                          },
                        ]}
                      />
                    </View>
                    <Text style={styles.voteText}>
                      {restaurant.votes} of {restaurant.totalVotes} votes
                    </Text>
                  </View>
                )}
              </View>
            </AnimatedPressable>
          ))}

          <View style={styles.footerSpacer} />
        </ScrollView>
      )}

      <Animated.View
        style={styles.footer}
        entering={FadeInDown.delay(1000).springify()}
      >
        <AnimatedPressable
          style={styles.startOverButton}
          onPress={handleStartOver}
        >
          <Home size={20} color={COLORS.white} strokeWidth={2.5} />
          <Text style={styles.startOverButtonText}>Start Over</Text>
        </AnimatedPressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: COLORS.darkGray,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.darkGray,
    opacity: 0.6,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 120,
  },
  restaurantCard: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 5,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.lightGray,
  },
  rankBadge: {
    position: 'absolute',
    top: 16,
    left: 16,
    zIndex: 10,
  },
  rankBadgeInner: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  rankText: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.white,
  },
  restaurantImage: {
    width: '100%',
    height: 180,
  },
  restaurantInfo: {
    padding: 16,
  },
  restaurantName: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.darkGray,
    marginBottom: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.darkGray,
  },
  separator: {
    fontSize: 14,
    color: COLORS.darkGray,
    opacity: 0.3,
  },
  price: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.darkGray,
  },
  cuisine: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.darkGray,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.darkGray,
    opacity: 0.6,
    flex: 1,
  },
  voteContainer: {
    marginTop: 4,
  },
  voteBar: {
    height: 8,
    backgroundColor: COLORS.lightGray,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 6,
  },
  voteBarFill: {
    height: '100%',
    backgroundColor: COLORS.accent,
    borderRadius: 4,
  },
  voteText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.darkGray,
    opacity: 0.6,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.darkGray,
    textAlign: 'center',
    lineHeight: 28,
  },
  footerSpacer: {
    height: 40,
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
  startOverButton: {
    backgroundColor: COLORS.accent,
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  startOverButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.white,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.white,
  },
  loadingText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.darkGray,
  },
});
