import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import Animated, {
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { UserPlus, Search, Copy, UserCheck, User } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setStringAsync } from 'expo-clipboard';
import { BottomNavBar } from '../components/BottomNavBar';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import * as Haptics from 'expo-haptics';

const COLORS = {
  white: '#FFFFFF',
  stone50: '#FAFAF9',
  stone100: '#F5F5F4',
  stone200: '#E7E5E4',
  stone400: '#A8A29E',
  stone500: '#78716C',
  stone600: '#57534E',
  stone800: '#292524',
  stone900: '#1C1917',
  red50: '#FEF2F2',
  red100: '#FEE2E2',
  red600: '#DC2626',
  green500: '#22C55E',
  green600: '#16A34A',
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const FOOD_EMOJIS = ['🍕', '🍔', '🍜', '🍱', '🌮', '🍣', '🍦', '🍩'];

function FallingFood({ emoji, index }: { emoji: string; index: number }) {
  const translateY = useSharedValue(-100);
  const rotate = useSharedValue(0);
  const left = useSharedValue(Math.random() * 100);

  React.useEffect(() => {
    translateY.value = withTiming(1200, {
      duration: 20000 + Math.random() * 20000,
    });
    rotate.value = withTiming(360, {
      duration: 20000 + Math.random() * 20000,
    });
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { rotate: `${rotate.value}deg` },
    ],
    left: `${left.value}%`,
  }));

  return (
    <Animated.View style={[styles.fallingFood, animatedStyle]}>
      <Text style={styles.foodEmoji}>{emoji}</Text>
    </Animated.View>
  );
}

export default function FriendScreen() {
  const router = useRouter();
  const [internalTab, setInternalTab] = useState<'list' | 'requests'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [userId, setUserId] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  // Convex queries and mutations
  const currentUser = useQuery(
    api.friends.getCurrentUser,
    userId ? { userId: userId as any } : 'skip'
  );
  const friends = useQuery(
    api.friends.getFriends,
    userId ? { userId: userId as any } : 'skip'
  );
  const friendRequests = useQuery(
    api.friends.getIncomingFriendRequests,
    userId ? { userId: userId as any } : 'skip'
  );

  const sendFriendRequestMutation = useMutation(api.friends.sendFriendRequest);
  const acceptFriendRequestMutation = useMutation(api.friends.acceptFriendRequest);
  const rejectFriendRequestMutation = useMutation(api.friends.rejectFriendRequest);
  
  // Search user - we'll use a query with state
  const [searchUid, setSearchUid] = useState<string | null>(null);
  const searchedUserQuery = useQuery(
    api.friends.getUserByUid,
    searchUid ? { uid: searchUid } : 'skip'
  );

  useEffect(() => {
    const loadUserId = async () => {
      const id = await AsyncStorage.getItem('userId');
      setUserId(id);
    };
    loadUserId();
  }, []);

  const handleCopyUid = async () => {
    const uidToCopy = currentUser?.formattedUid || currentUser?.uid;
    
    if (!uidToCopy) {
      Alert.alert('Error', 'UID not available');
      return;
    }

    try {
      await setStringAsync(uidToCopy);
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      Alert.alert('Success', 'UID copied to clipboard!');
    } catch (error) {
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      Alert.alert('Error', 'Failed to copy UID');
    }
  };

  const handleSearchUser = () => {
    if (!searchQuery.trim() || !userId) return;
    
    setIsSearching(true);
    setSearchUid(searchQuery.trim());
  };

  // Handle search result
  useEffect(() => {
    if (searchUid && searchedUserQuery !== undefined) {
      setIsSearching(false);
      // UI will show "not found" message automatically
    }
  }, [searchedUserQuery, searchUid]);

  const handleAddFriend = async () => {
    if (!searchedUserQuery || !userId) return;
    
    if (searchedUserQuery.userId === userId) {
      Alert.alert('Error', 'Cannot add yourself as a friend');
      return;
    }

    try {
      await sendFriendRequestMutation({
        fromUserId: userId as any,
        toUserId: searchedUserQuery.userId as any,
      });
      Alert.alert('Success', `Friend request sent to ${searchedUserQuery.username}`);
      setSearchQuery('');
      setSearchUid(null);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to send friend request');
    }
  };

  const handleAcceptRequest = async (requestId: string, fromUserId: string) => {
    if (!userId) return;
    
    try {
      await acceptFriendRequestMutation({
        requestId: requestId as any,
        fromUserId: fromUserId as any,
        toUserId: userId as any,
      });
      Alert.alert('Success', 'Friend request accepted');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to accept request');
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    try {
      await rejectFriendRequestMutation({
        requestId: requestId as any,
      });
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to reject request');
    }
  };

  const handleTabChange = (tab: 'home' | 'friends' | 'profile') => {
    if (tab === 'home') {
      router.push('/landing');
    } else if (tab === 'profile') {
      router.push('/profile');
    }
    // If tab is 'friends', we're already here, so do nothing
  };

  return (
    <View style={styles.container}>
      {/* Background Japanese Pattern */}
      <View style={styles.bgCircle1} />
      <View style={styles.bgCircle2} />

      {/* Spinning Falling Food Background */}
      {FOOD_EMOJIS.map((emoji, index) => (
        <FallingFood key={index} emoji={emoji} index={index} />
      ))}

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>FRIENDS</Text>
          <Text style={styles.subtitle}>Expand your dining circle</Text>
        </View>

        {/* Internal Tabs */}
        <View style={styles.tabsContainer}>
          <View style={styles.tabs}>
            <Pressable
              style={[styles.tab, internalTab === 'list' && styles.tabActive]}
              onPress={() => setInternalTab('list')}
            >
              <Text style={[styles.tabText, internalTab === 'list' && styles.tabTextActive]}>
                Friend List
              </Text>
            </Pressable>
            <Pressable
              style={[styles.tab, internalTab === 'requests' && styles.tabActive]}
              onPress={() => setInternalTab('requests')}
            >
              <Text style={[styles.tabText, internalTab === 'requests' && styles.tabTextActive]}>
                Requests
              </Text>
              {friendRequests && friendRequests.length > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{friendRequests.length}</Text>
                </View>
              )}
            </Pressable>
          </View>
        </View>

        {internalTab === 'requests' ? (
          /* Requests View */
          <View style={styles.content}>
            {/* Add Friend Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Add by UID</Text>
              <View style={styles.searchContainer}>
                <View style={styles.searchInputContainer}>
                  <Search size={20} color={COLORS.stone400} style={styles.searchIcon} />
                  <Input
                    placeholder="Enter friend's UID"
                    value={searchQuery}
                    onChangeText={(text) => {
                      setSearchQuery(text);
                      setSearchUid(null);
                    }}
                    onSubmitEditing={handleSearchUser}
                    style={styles.searchInput}
                  />
                </View>
                <Pressable 
                  style={[styles.addButton, isSearching && styles.addButtonDisabled]} 
                  onPress={handleSearchUser}
                  disabled={isSearching}
                >
                  {isSearching ? (
                    <ActivityIndicator size="small" color={COLORS.white} />
                  ) : (
                    <Search size={24} color={COLORS.white} />
                  )}
                </Pressable>
              </View>
              
              {/* Show loading state */}
              {isSearching && searchUid && (
                <View style={[styles.searchedUserCard, { justifyContent: 'center', paddingVertical: 20 }]}>
                  <ActivityIndicator size="small" color={COLORS.red600} />
                  <Text style={styles.loadingText}>Searching...</Text>
                </View>
              )}

              {/* Show "not found" message */}
              {!isSearching && searchUid && searchedUserQuery === null && (
                <View style={[styles.searchedUserCard, { justifyContent: 'center', paddingVertical: 20 }]}>
                  <Text style={styles.emptyText}>No user found with that UID</Text>
                </View>
              )}

              {/* Show searched user */}
              {!isSearching && searchedUserQuery && searchUid && searchedUserQuery.userId && (
                <View style={styles.searchedUserCard}>
                  <View style={styles.avatar}>
                    {searchedUserQuery.profileImageUrl ? (
                      <Image
                        key={searchedUserQuery.profileImageUrl}
                        source={{ uri: searchedUserQuery.profileImageUrl }}
                        style={styles.avatarImage}
                        resizeMode="cover"
                      />
                    ) : (
                      <Text style={styles.avatarEmoji}>👤</Text>
                    )}
                  </View>
                  <View style={styles.friendInfo}>
                    <Text style={styles.friendName}>{searchedUserQuery.username}</Text>
                    <Text style={styles.friendUid}>UID: {searchedUserQuery.uid || searchedUserQuery.userId}</Text>
                  </View>
                  <Pressable 
                    style={[
                      styles.sendRequestButton,
                      searchedUserQuery.userId === userId && styles.sendRequestButtonDisabled
                    ]} 
                    onPress={handleAddFriend}
                    disabled={searchedUserQuery.userId === userId}
                  >
                    <UserPlus size={20} color={COLORS.white} />
                    <Text style={styles.sendRequestText}>
                      {searchedUserQuery.userId === userId ? 'You' : 'Add'}
                    </Text>
                  </Pressable>
                </View>
              )}
            </View>

            {/* Friend Requests */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                Incoming Requests {friendRequests && friendRequests.length > 0 && `(${friendRequests.length})`}
              </Text>
              {friendRequests === undefined ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color={COLORS.red600} />
                </View>
              ) : friendRequests.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>No pending requests</Text>
                </View>
              ) : (
                friendRequests.map((request: any, index: number) => (
                  <View key={request.requestId} style={styles.friendCard}>
                    <View style={styles.avatar}>
                      {request.fromProfileImageUrl ? (
                        <Image
                          key={request.fromProfileImageUrl}
                          source={{ uri: request.fromProfileImageUrl }}
                          style={styles.avatarImage}
                          resizeMode="cover"
                        />
                      ) : (
                        <Text style={styles.avatarEmoji}>
                          {index % 3 === 0 ? '🐼' : index % 3 === 1 ? '🦊' : '🐨'}
                        </Text>
                      )}
                    </View>
                    <View style={styles.friendInfo}>
                      <Text style={styles.friendName}>{request.fromUsername}</Text>
                      <Text style={styles.friendUid}>UID: {request.fromUserId}</Text>
                    </View>
                    <View style={styles.friendActions}>
                      <Pressable 
                        style={styles.acceptButton}
                        onPress={() => handleAcceptRequest(request.requestId, request.fromUserId)}
                      >
                        <Text style={styles.acceptButtonText}>Accept</Text>
                      </Pressable>
                      <Pressable 
                        style={styles.ignoreButton}
                        onPress={() => handleRejectRequest(request.requestId)}
                      >
                        <Text style={styles.ignoreButtonText}>Ignore</Text>
                      </Pressable>
                    </View>
                  </View>
                ))
              )}
            </View>
          </View>
        ) : (
          /* Friend List View */
          <View style={styles.content}>
            {/* My UID Card */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>My UID</Text>
              {currentUser === undefined ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color={COLORS.red600} />
                </View>
              ) : (
                <View style={styles.uidCard}>
                  <Text style={styles.uidText}>{currentUser?.formattedUid || currentUser?.uid || 'Loading...'}</Text>
                  <Pressable onPress={handleCopyUid} style={styles.copyButton}>
                    <Copy size={16} color={COLORS.stone500} />
                  </Pressable>
                </View>
              )}
            </View>

            {/* Friend List */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                Your Friends {friends !== undefined && `(${friends.length})`}
              </Text>
              {friends === undefined ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color={COLORS.red600} />
                </View>
              ) : friends.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>No friends yet. Add some friends!</Text>
                </View>
              ) : (
                friends.map((friend: any) => {
                  // Debug: Log friend data to see if profileImageUrl is present
                  if (__DEV__) {
                    console.log('Friend data:', {
                      username: friend.username,
                      hasProfileImage: !!friend.profileImageUrl,
                      profileImageUrl: friend.profileImageUrl,
                    });
                  }
                  
                  return (
                    <View key={friend.userId} style={styles.friendCard}>
                      <View style={styles.friendAvatar}>
                        {friend.profileImageUrl ? (
                          <Image
                            key={friend.profileImageUrl} // Force re-render when URL changes
                            source={{ uri: friend.profileImageUrl }}
                            style={styles.friendAvatarImage}
                            resizeMode="cover"
                            onError={(e) => {
                              if (__DEV__) {
                                console.error('Image load error for', friend.username, ':', e.nativeEvent.error);
                              }
                            }}
                            onLoad={() => {
                              if (__DEV__) {
                                console.log('Image loaded successfully for', friend.username);
                              }
                            }}
                          />
                        ) : (
                          <User size={24} color={COLORS.red600} />
                        )}
                      </View>
                    <View style={styles.friendInfo}>
                      <Text style={styles.friendName}>{friend.username}</Text>
                      <View style={styles.onlineIndicator}>
                        <View style={styles.onlineDot} />
                        <Text style={styles.onlineText}>Online</Text>
                      </View>
                    </View>
                    <Pressable style={styles.friendActionButton}>
                      <UserCheck size={20} color={COLORS.stone400} />
                    </Pressable>
                  </View>
                  );
                })
              )}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Bottom Navigation */}
      <BottomNavBar activeTab="friends" onTabChange={handleTabChange} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.stone50,
    overflow: 'hidden',
  },
  bgCircle1: {
    position: 'absolute',
    top: -128,
    right: -128,
    width: 256,
    height: 256,
    backgroundColor: 'rgba(220, 38, 38, 0.05)',
    borderRadius: 128,
  },
  bgCircle2: {
    position: 'absolute',
    bottom: -192,
    left: -192,
    width: 384,
    height: 384,
    backgroundColor: 'rgba(168, 162, 158, 0.2)',
    borderRadius: 192,
  },
  fallingFood: {
    position: 'absolute',
    opacity: 0.09,
  },
  foodEmoji: {
    fontSize: 32,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  header: {
    paddingTop: 48,
    paddingBottom: 24,
    paddingHorizontal: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: COLORS.red600,
    letterSpacing: 4,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.stone500,
    fontWeight: '500',
  },
  tabsContainer: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  tabs: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 4,
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: COLORS.stone100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  tabActive: {
    backgroundColor: COLORS.stone100,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.stone400,
  },
  tabTextActive: {
    color: COLORS.stone900,
  },
  badge: {
    marginLeft: 8,
    backgroundColor: COLORS.red600,
    borderRadius: 10,
    width: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    fontSize: 10,
    color: COLORS.white,
    fontWeight: '700',
  },
  content: {
    paddingHorizontal: 24,
    gap: 24,
  },
  section: {
    gap: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.stone800,
    paddingHorizontal: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    padding: 16,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  searchIcon: {
    position: 'absolute',
    left: 16,
    zIndex: 1,
  },
  searchInput: {
    paddingLeft: 48,
    height: 56,
    backgroundColor: COLORS.white,
    borderColor: COLORS.stone200,
    borderRadius: 16,
  },
  addButton: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: COLORS.red600,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.red600,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  friendCard: {
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    borderWidth: 1,
    borderColor: COLORS.stone100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.stone100,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarEmoji: {
    fontSize: 24,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  friendAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.red50,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  friendAvatarImage: {
    width: '100%',
    height: '100%',
  },
  friendInfo: {
    flex: 1,
  },
  friendName: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.stone800,
    marginBottom: 4,
  },
  friendUid: {
    fontSize: 12,
    color: COLORS.stone500,
  },
  onlineIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.green500,
  },
  onlineText: {
    fontSize: 12,
    color: COLORS.green600,
    fontWeight: '500',
  },
  friendActions: {
    flexDirection: 'row',
    gap: 8,
  },
  acceptButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: COLORS.red600,
    borderRadius: 12,
    shadowColor: COLORS.red600,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  acceptButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.white,
  },
  ignoreButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: COLORS.stone100,
    borderRadius: 12,
  },
  ignoreButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.stone600,
  },
  friendActionButton: {
    padding: 8,
    borderRadius: 12,
  },
  uidCard: {
    backgroundColor: COLORS.stone50,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.stone200,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  uidText: {
    flex: 1,
    fontFamily: 'monospace',
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.stone600,
    letterSpacing: 1,
  },
  copyButton: {
    padding: 8,
    borderRadius: 12,
  },
  searchedUserCard: {
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    borderWidth: 1,
    borderColor: COLORS.stone100,
    marginTop: 12,
  },
  sendRequestButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: COLORS.red600,
    borderRadius: 12,
    shadowColor: COLORS.red600,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  sendRequestText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.white,
  },
  addButtonDisabled: {
    opacity: 0.5,
  },
  sendRequestButtonDisabled: {
    opacity: 0.5,
    backgroundColor: COLORS.stone400,
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.stone400,
  },
  loadingText: {
    fontSize: 14,
    color: COLORS.stone500,
    marginLeft: 12,
  },
});
