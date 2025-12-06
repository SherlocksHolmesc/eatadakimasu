import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Constants from 'expo-constants';

const API_URL = Constants.expoConfig?.extra?.EXPO_PUBLIC_BACKEND_URL || process.env.EXPO_PUBLIC_BACKEND_URL || '';

interface Restaurant {
  id: string;
  name: string;
  cuisine: string;
  rating: number;
  price_range: string;
  address: string;
  photo: string;
  vote_count?: number;
}

export default function ResultsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { roomCode, mode } = params;

  const [results, setResults] = useState<Restaurant[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchResults();
  }, []);

  const fetchResults = async () => {
    try {
      const response = await fetch(`${API_URL}/api/results/${roomCode}?mode=${mode}`);
      const data = await response.json() as { results?: Restaurant[] };
      setResults(data.results || []);
    } catch (error) {
      console.error('Fetch results error:', error);
      Alert.alert('Error', 'Failed to load results');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartOver = () => {
    router.replace('/landing');
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#ff2346" />
        <Text style={styles.loadingText}>Loading results...</Text>
      </View>
    );
  }

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

      {/* Title */}
      <View style={styles.titleContainer}>
        <Text style={styles.pacmanEmoji}>🔴</Text>
        <Text style={styles.title}>DECISION MADE!</Text>
        {mode === 'group' && (
          <Text style={styles.subtitle}>Ranked by group votes</Text>
        )}
      </View>

      {/* Results List */}
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {results.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No restaurants matched your preferences.</Text>
            <Text style={styles.emptySubtext}>Try adjusting your criteria!</Text>
          </View>
        ) : (
          results.map((restaurant, index) => (
            <View key={restaurant.id} style={styles.resultCard}>
              {mode === 'group' && index === 0 && (
                <View style={styles.topChoiceBadge}>
                  <Text style={styles.topChoiceText}>👑 TOP CHOICE</Text>
                </View>
              )}
              
              <Image source={{ uri: restaurant.photo }} style={styles.resultImage} />
              
              <View style={styles.resultInfo}>
                <View style={styles.resultHeader}>
                  <Text style={styles.resultName}>{restaurant.name}</Text>
                  {mode === 'group' && restaurant.vote_count && (
                    <View style={styles.votesBadge}>
                      <Text style={styles.votesText}>♥ {restaurant.vote_count}</Text>
                    </View>
                  )}
                </View>
                
                <View style={styles.detailsRow}>
                  <Text style={styles.rating}>⭐ {restaurant.rating}</Text>
                  <Text style={styles.price}>{restaurant.price_range}</Text>
                  <Text style={styles.cuisine}>{restaurant.cuisine}</Text>
                </View>
                
                <Text style={styles.address} numberOfLines={2}>
                  📍 {restaurant.address}
                </Text>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Actions */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity style={styles.actionButton} onPress={handleStartOver}>
          <Text style={styles.actionButtonText}>START OVER</Text>
        </TouchableOpacity>
      </View>
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
    marginTop: 16,
    fontSize: 16,
    color: '#666',
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
  titleContainer: {
    alignItems: 'center',
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  pacmanEmoji: {
    fontSize: 48,
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  emptyContainer: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
  },
  resultCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  topChoiceBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#ff2346',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    zIndex: 1,
  },
  topChoiceText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  resultImage: {
    width: '100%',
    height: 200,
  },
  resultInfo: {
    padding: 16,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  resultName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  votesBadge: {
    backgroundColor: '#fff0f3',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  votesText: {
    color: '#ff2346',
    fontSize: 14,
    fontWeight: 'bold',
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
  },
  actionsContainer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  actionButton: {
    backgroundColor: '#ff2346',
    paddingVertical: 16,
    borderRadius: 28,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
