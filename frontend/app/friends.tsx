import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ScrollView,
  Platform,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { ArrowLeft, UserPlus, Search, Users, X } from 'lucide-react-native';

const COLORS = {
  white: '#FFFFFF',
  stone50: '#fafaf9',
  stone100: '#f5f5f4',
  stone200: '#e7e5e4',
  stone300: '#d6d3d1',
  stone400: '#a8a29e',
  stone500: '#78716c',
  stone700: '#44403c',
  stone900: '#1c1917',
  red600: '#dc2626',
  rose50: '#fff1f2',
  rose100: '#ffe4e6',
  green500: '#22c55e',
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// Mock friends data
const MOCK_FRIENDS = [
  { id: '1', name: 'Alice Chen', username: '@alice_foodie' },
  { id: '2', name: 'Bob Wilson', username: '@bob_eats' },
  { id: '3', name: 'Carol Davis', username: '@carol_yum' },
];

export default function FriendsScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [friends] = useState(MOCK_FRIENDS);

  const handleBack = () => {
    router.back();
  };

  const handleAddFriend = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    // TODO: Implement add friend functionality
  };

  const filteredFriends = friends.filter(
    (friend) =>
      friend.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      friend.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View style={styles.container}>
      {/* Background */}
      <View style={styles.bgGradient} />

      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={handleBack}>
          <ArrowLeft size={24} color={COLORS.stone700} />
        </Pressable>
        
        <Animated.View 
          style={styles.titleContainer}
          entering={FadeInDown.delay(100).springify()}
        >
          <Image
            source={require('../assets/images/42aaecb8daf9fe805d264506738108e934067bf1e19a2bce4515936448bb6077.png')}
            style={{ width: 60, height: 60 }}
            resizeMode="contain"
          />
          <Text style={styles.title}>FRIENDS</Text>
        </Animated.View>
      </View>

      {/* Search Bar */}
      <Animated.View 
        style={styles.searchContainer}
        entering={FadeInDown.delay(200).springify()}
      >
        <Search size={20} color={COLORS.stone400} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search friends..."
          placeholderTextColor={COLORS.stone400}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <Pressable onPress={() => setSearchQuery('')}>
            <X size={18} color={COLORS.stone400} />
          </Pressable>
        )}
      </Animated.View>

      {/* Add Friend Button */}
      <Animated.View entering={FadeInDown.delay(300).springify()}>
        <AnimatedPressable
          style={({ pressed }) => [
            styles.addFriendButton,
            pressed && styles.buttonPressed,
          ]}
          onPress={handleAddFriend}
        >
          <View style={styles.addFriendIcon}>
            <UserPlus size={24} color={COLORS.red600} />
          </View>
          <View style={styles.addFriendText}>
            <Text style={styles.addFriendTitle}>Add New Friend</Text>
            <Text style={styles.addFriendSubtitle}>Invite by username or code</Text>
          </View>
        </AnimatedPressable>
      </Animated.View>

      {/* Friends List */}
      <Animated.View 
        style={styles.sectionHeader}
        entering={FadeIn.delay(400)}
      >
        <Users size={18} color={COLORS.stone500} />
        <Text style={styles.sectionTitle}>Your Friends ({filteredFriends.length})</Text>
      </Animated.View>

      <ScrollView 
        style={styles.friendsList}
        showsVerticalScrollIndicator={false}
      >
        {filteredFriends.map((friend, index) => (
          <Animated.View
            key={friend.id}
            entering={FadeInDown.delay(500 + index * 100).springify()}
          >
            <Pressable 
              style={({ pressed }) => [
                styles.friendCard,
                pressed && styles.cardPressed,
              ]}
            >
              <View style={styles.friendAvatar}>
                <Text style={styles.avatarText}>
                  {friend.name.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={styles.friendInfo}>
                <Text style={styles.friendName}>{friend.name}</Text>
                <Text style={styles.friendUsername}>{friend.username}</Text>
              </View>
              <View style={styles.inviteButton}>
                <Text style={styles.inviteText}>Invite</Text>
              </View>
            </Pressable>
          </Animated.View>
        ))}
        
        {filteredFriends.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No friends found</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
    paddingHorizontal: 24,
  },
  bgGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 280,
    backgroundColor: COLORS.rose50,
    borderBottomLeftRadius: 100,
    borderBottomRightRadius: 100,
  },
  header: {
    marginTop: 50,
    marginBottom: 24,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    marginBottom: 16,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: COLORS.red600,
    letterSpacing: 3,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: COLORS.stone900,
  },
  addFriendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 2,
    borderColor: COLORS.rose100,
  },
  buttonPressed: {
    backgroundColor: COLORS.rose50,
    transform: [{ scale: 0.98 }],
  },
  addFriendIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.rose100,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  addFriendText: {
    flex: 1,
  },
  addFriendTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.stone900,
    marginBottom: 2,
  },
  addFriendSubtitle: {
    fontSize: 13,
    color: COLORS.stone500,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.stone500,
    letterSpacing: 1,
  },
  friendsList: {
    flex: 1,
  },
  friendCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  cardPressed: {
    backgroundColor: COLORS.stone50,
  },
  friendAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.red600,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.white,
  },
  friendInfo: {
    flex: 1,
  },
  friendName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.stone900,
    marginBottom: 2,
  },
  friendUsername: {
    fontSize: 13,
    color: COLORS.stone500,
  },
  inviteButton: {
    backgroundColor: COLORS.rose100,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  inviteText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.red600,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.stone400,
  },
});
