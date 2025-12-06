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
  stone50: '#fafaf9',
  stone100: '#f5f5f4',
  stone200: '#e7e5e4',
  stone500: '#78716c',
  stone700: '#44403c',
  stone900: '#1c1917',
  red600: '#dc2626',
  rose100: '#ffe4e6',
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
        votes: restaurant.vote_count || restaurant.votes || 0,
        totalVotes: restaurant.totalVotes || 0,
      }))
      .filter((r: RestaurantWithVotes) => (r.votes || 0) > 0)
      .sort((a: RestaurantWithVotes, b: RestaurantWithVotes) => {
        // First sort by votes (descending)
        const voteDiff = (b.votes || 0) - (a.votes || 0);
        if (voteDiff !== 0) return voteDiff;
        
        // If votes are equal, sort by rating (descending)
        return (b.rating || 0) - (a.rating || 0);
      });

      console.log('Results loaded:', results.length, 'restaurants');
      console.log('Top 4:', results.slice(0, 4).map(r => ({ name: r.name, votes: r.votes, rating: r.rating })));

      // Show top 4 restaurants
      setRestaurants(results.slice(0, 4));
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
          <Trophy size={32} color={COLORS.red600} strokeWidth={2.5} />
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
          {/* Winner Card - Top 1 */}
          {restaurants[0] && (
            <AnimatedPressable
              style={styles.winnerCard}
              entering={FadeInDown.delay(200).springify()}
            >
              <View style={styles.winnerBadge}>
                <Trophy size={24} color={COLORS.white} strokeWidth={2.5} />
              </View>

              <Image
                source={{ uri: restaurants[0].photo }}
                style={styles.winnerImage}
                resizeMode="cover"
              />

              <View style={styles.winnerOverlay}>
                <Text style={styles.winnerLabel}>🏆 Winner</Text>
                <Text style={styles.winnerName} numberOfLines={2}>
                  {restaurants[0].name}
                </Text>

                <View style={styles.winnerInfoRow}>
                  <View style={styles.rating}>
                    <Star size={16} color="#FFB800" fill="#FFB800" />
                    <Text style={styles.winnerRatingText}>
                      {restaurants[0].rating.toFixed(1)}
                    </Text>
                  </View>
                  <Text style={styles.winnerSeparator}>•</Text>
                  <Text style={styles.winnerPrice}>
                    {getPriceSymbol(restaurants[0].price_range)}
                  </Text>
                  <Text style={styles.winnerSeparator}>•</Text>
                  <Text style={styles.winnerCuisine}>{restaurants[0].cuisine}</Text>
                </View>

                <View style={styles.winnerMetaRow}>
                  <MapPin size={14} color={COLORS.white} />
                  <Text style={styles.winnerAddress} numberOfLines={1}>
                    {restaurants[0].address}
                  </Text>
                </View>

                <View style={styles.winnerVoteContainer}>
                  <Text style={styles.winnerVoteText}>
                    ✓ {restaurants[0].votes} Approved Votes
                  </Text>
                </View>
              </View>
            </AnimatedPressable>
          )}

          {/* Top 2-4 Runners Up */}
          {restaurants.length > 1 && (
            <View style={styles.runnersUpSection}>
              <Text style={styles.runnersUpTitle}>Other Top Choices</Text>
              
              {restaurants.slice(1).map((restaurant, index) => (
                <AnimatedPressable
                  key={restaurant.id}
                  style={styles.runnerUpCard}
                  entering={FadeInDown.delay(400 + index * 100).springify()}
                >
                  <View style={styles.runnerUpRankBadge}>
                    {index === 0 && (
                      <View style={[styles.rankBadgeInner, { backgroundColor: COLORS.silver }]}>
                        <Text style={styles.rankText}>2</Text>
                      </View>
                    )}
                    {index === 1 && (
                      <View style={[styles.rankBadgeInner, { backgroundColor: COLORS.bronze }]}>
                        <Text style={styles.rankText}>3</Text>
                      </View>
                    )}
                    {index === 2 && (
                      <View style={[styles.rankBadgeInner, { backgroundColor: COLORS.darkGray }]}>
                        <Text style={styles.rankText}>4</Text>
                      </View>
                    )}
                  </View>

                  <Image
                    source={{ uri: restaurant.photo }}
                    style={styles.runnerUpImage}
                    resizeMode="cover"
                  />

                  <View style={styles.runnerUpInfo}>
                    <Text style={styles.runnerUpName} numberOfLines={1}>
                      {restaurant.name}
                    </Text>

                    <View style={styles.runnerUpInfoRow}>
                      <Star size={12} color="#FFB800" fill="#FFB800" />
                      <Text style={styles.runnerUpRating}>
                        {restaurant.rating.toFixed(1)}
                      </Text>
                      <Text style={styles.runnerUpSeparator}>•</Text>
                      <Text style={styles.runnerUpPrice}>
                        {getPriceSymbol(restaurant.price_range)}
                      </Text>
                    </View>

                    <View style={styles.runnerUpVotes}>
                      <Text style={styles.runnerUpVoteText}>
                        ✓ {restaurant.votes} votes
                      </Text>
                    </View>
                  </View>
                </AnimatedPressable>
              ))}
            </View>
          )}

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
    backgroundColor: COLORS.stone50,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.stone200,
    backgroundColor: COLORS.white,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: COLORS.red600,
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.stone500,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 120,
  },
  winnerCard: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 10,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: COLORS.gold,
  },
  winnerBadge: {
    position: 'absolute',
    top: 20,
    left: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.gold,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  winnerImage: {
    width: '100%',
    height: 280,
  },
  winnerOverlay: {
    padding: 24,
    backgroundColor: 'rgba(0,0,0,0.85)',
  },
  winnerLabel: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.gold,
    marginBottom: 8,
  },
  winnerName: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.white,
    marginBottom: 12,
  },
  winnerInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  winnerRatingText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.white,
  },
  winnerSeparator: {
    fontSize: 16,
    color: COLORS.white,
    opacity: 0.5,
  },
  winnerPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.white,
  },
  winnerCuisine: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
  },
  winnerMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  winnerAddress: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.white,
    opacity: 0.8,
    flex: 1,
  },
  winnerVoteContainer: {
    backgroundColor: 'rgba(255,215,0,0.2)',
    padding: 12,
    borderRadius: 12,
  },
  winnerVoteText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.gold,
    textAlign: 'center',
  },
  runnersUpSection: {
    marginBottom: 24,
  },
  runnersUpTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.darkGray,
    marginBottom: 16,
  },
  runnerUpCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    flexDirection: 'row',
  },
  runnerUpRankBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    zIndex: 10,
  },
  runnerUpImage: {
    width: 120,
    height: 120,
  },
  runnerUpInfo: {
    flex: 1,
    padding: 12,
    justifyContent: 'center',
  },
  runnerUpName: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.darkGray,
    marginBottom: 6,
  },
  runnerUpInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  runnerUpRating: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.darkGray,
  },
  runnerUpSeparator: {
    fontSize: 13,
    color: COLORS.darkGray,
    opacity: 0.3,
  },
  runnerUpPrice: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.darkGray,
  },
  runnerUpVotes: {
    backgroundColor: COLORS.lightGray,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  runnerUpVoteText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.accent,
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
    borderColor: COLORS.stone200,
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
    color: COLORS.stone900,
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
    color: COLORS.stone900,
  },
  separator: {
    fontSize: 14,
    color: COLORS.stone500,
  },
  price: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.stone900,
  },
  cuisine: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.stone700,
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
    color: COLORS.stone500,
    flex: 1,
  },
  voteContainer: {
    marginTop: 4,
  },
  voteBar: {
    height: 8,
    backgroundColor: COLORS.stone200,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 6,
  },
  voteBarFill: {
    height: '100%',
    backgroundColor: COLORS.red600,
    borderRadius: 4,
  },
  voteText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.stone500,
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
    color: COLORS.stone700,
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
    backgroundColor: COLORS.stone50,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 100,
  },
  startOverButton: {
    backgroundColor: COLORS.red600,
    borderRadius: 16,
    padding: 18,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    shadowColor: COLORS.red600,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  startOverButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.white,
    letterSpacing: 1,
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
});
