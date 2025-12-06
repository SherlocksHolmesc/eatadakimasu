import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import Animated, {
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import {
  Settings,
  Edit2,
  MapPin,
  History,
  Heart,
  ArrowLeft,
  Camera,
  Check,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BottomNavBar } from '../components/BottomNavBar';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Textarea } from '../components/ui/Textarea';
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
  orange100: '#FFEDD5',
  orange600: '#EA580C',
  rose100: '#FFE4E6',
  rose600: '#E11D48',
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

export default function ProfileScreen() {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState<'home' | 'friends' | 'profile'>('profile');
  const [userId, setUserId] = useState<string | null>(null);

  // Get current user from Convex
  const currentUser = useQuery(
    api.friends.getCurrentUser,
    userId ? { userId: userId as any } : 'skip'
  );

  const updateProfileMutation = useMutation(api.friends.updateProfile);
  const generateUploadUrlMutation = useMutation(api.friends.generateUploadUrl);

  useEffect(() => {
    const loadUserId = async () => {
      const id = await AsyncStorage.getItem('userId');
      setUserId(id);
    };
    loadUserId();
  }, []);

  const pickImage = async () => {
    // Request permissions
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant permission to access your photo library.');
        return;
      }
    }

    // Launch image picker
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      await uploadImage(result.assets[0].uri);
    }
  };

  const uploadImage = async (imageUri: string) => {
    if (!userId) return;

    try {
      setUploadingImage(true);

      // Generate upload URL from Convex
      const uploadUrl = await generateUploadUrlMutation();

      // Convert image to blob
      const response = await fetch(imageUri);
      const blob = await response.blob();

      // Upload to Convex
      const uploadResponse = await fetch(uploadUrl, {
        method: 'POST',
        headers: { 'Content-Type': blob.type },
        body: blob,
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload image');
      }

      // Convex returns the storage ID as JSON: {"storageId": "..."}
      const result = await uploadResponse.json() as { storageId: string };
      const storageId = result.storageId;

      if (!storageId) {
        throw new Error('No storage ID returned from upload');
      }

      // Update profile with new image
      const updated = await updateProfileMutation({
        userId: userId as any,
        profileImageId: storageId as any, // Cast to Convex storage ID type
      });

      // Update local state
      setUser(prev => ({
        ...prev,
        profileImageUrl: updated.profileImageUrl,
      }));
      setEditForm(prev => ({
        ...prev,
        profileImageUrl: updated.profileImageUrl,
      }));

      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error: any) {
      Alert.alert('Upload Error', error.message || 'Failed to upload image');
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } finally {
      setUploadingImage(false);
    }
  };

  // User State - initialized with Convex data
  const [user, setUser] = useState({
    name: currentUser?.username || 'User',
    handle: `@${currentUser?.username || 'user'}`,
    uid: currentUser?.formattedUid || currentUser?.uid || 'Loading...',
    avatar: '🚗',
    location: currentUser?.location || '',
    bio: currentUser?.bio || '',
    profileImageUrl: currentUser?.profileImageUrl || null,
  });

  // Update user when currentUser changes
  useEffect(() => {
    if (currentUser) {
      setUser(prev => ({
        ...prev,
        name: currentUser.username,
        handle: `@${currentUser.username}`,
        uid: currentUser.formattedUid || currentUser.uid,
        location: currentUser.location || '',
        bio: currentUser.bio || '',
        profileImageUrl: currentUser.profileImageUrl || null,
      }));
    }
  }, [currentUser]);

  // Edit State
  const [editForm, setEditForm] = useState(user);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Update editForm when user changes
  useEffect(() => {
    setEditForm(user);
  }, [user]);

  const handleSave = async () => {
    if (!userId) return;

    try {
      const updated = await updateProfileMutation({
        userId: userId as any,
        bio: editForm.bio || undefined,
        location: editForm.location || undefined,
      });
      
      // Update local state with updated data
      setUser(prev => ({
        ...prev,
        bio: updated.bio,
        location: updated.location,
        profileImageUrl: updated.profileImageUrl,
      }));
      setIsEditing(false);
      
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update profile');
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    }
  };

  const handleTabChange = (tab: 'home' | 'friends' | 'profile') => {
    setActiveTab(tab);
    if (tab === 'home') {
      router.push('/landing');
    } else if (tab === 'friends') {
      router.push('/friends');
    }
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

      {isEditing ? (
        /* Edit Profile View */
        <View style={styles.editContainer}>
          <View style={styles.editHeader}>
            <Pressable
              onPress={() => setIsEditing(false)}
              style={styles.headerButton}
            >
              <ArrowLeft size={24} color={COLORS.stone600} />
            </Pressable>
            <Text style={styles.editHeaderTitle}>Edit Profile</Text>
            <Pressable onPress={handleSave} style={styles.headerButton}>
              <Check size={24} color={COLORS.red600} />
            </Pressable>
          </View>

          <ScrollView
            style={styles.editScrollView}
            contentContainerStyle={styles.editScrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Avatar Edit */}
            <View style={styles.avatarEditContainer}>
              <Pressable
                onPress={pickImage}
                disabled={uploadingImage}
                style={styles.avatarEditPressable}
              >
                <View style={styles.avatarEdit}>
                  {uploadingImage ? (
                    <ActivityIndicator size="large" color={COLORS.stone600} />
                  ) : editForm.profileImageUrl ? (
                    <Image
                      source={{ uri: editForm.profileImageUrl }}
                      style={styles.avatarEditImage}
                    />
                  ) : (
                    <Text style={styles.avatarEditEmoji}>{editForm.avatar}</Text>
                  )}
                  <View style={styles.cameraButton}>
                    <Camera size={16} color={COLORS.white} />
                  </View>
                </View>
              </Pressable>
              <Text style={styles.avatarEditHint}>
                {uploadingImage ? 'Uploading...' : 'Tap to change avatar'}
              </Text>
            </View>

            {/* Fields */}
            <View style={styles.editFields}>
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>USERNAME</Text>
                <Input
                  value={editForm.name}
                  editable={false}
                  style={[styles.fieldInput, { opacity: 0.6 }]}
                />
                <Text style={styles.fieldHint}>Username cannot be changed</Text>
              </View>
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>LOCATION</Text>
                <Input
                  placeholder="Enter your location"
                  value={editForm.location}
                  onChangeText={(text) =>
                    setEditForm({ ...editForm, location: text })
                  }
                  style={styles.fieldInput}
                />
              </View>
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>BIO</Text>
                <Textarea
                  placeholder="Tell us about yourself..."
                  value={editForm.bio}
                  onChangeText={(text) =>
                    setEditForm({ ...editForm, bio: text })
                  }
                  style={styles.fieldTextarea}
                />
              </View>
            </View>
          </ScrollView>
        </View>
      ) : (
        /* View Profile View */
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header Image */}
          <View style={styles.headerImage}>
            <View style={styles.headerImageOverlay} />
            <Pressable style={styles.settingsButton}>
              <Settings size={24} color={COLORS.white} />
            </Pressable>
          </View>

          {/* Profile Content */}
          <View style={styles.profileContent}>
            {/* Avatar */}
            <View style={styles.avatarSection}>
              <View style={styles.avatarContainer}>
                <View style={styles.avatar}>
                  {user.profileImageUrl ? (
                    <Image
                      source={{ uri: user.profileImageUrl }}
                      style={styles.avatarImage}
                    />
                  ) : (
                    <Text style={styles.avatarEmoji}>{user.avatar}</Text>
                  )}
                </View>
              </View>
              <Pressable
                onPress={() => setIsEditing(true)}
                style={styles.editButton}
              >
                <Edit2 size={16} color={COLORS.white} />
                <Text style={styles.editButtonText}>Edit Profile</Text>
              </Pressable>
            </View>

            {/* User Info */}
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{user.name}</Text>
              <Text style={styles.userHandle}>{user.handle}</Text>

              <View style={styles.uidBadge}>
                <Text style={styles.uidBadgeText}>UID: {user.uid}</Text>
              </View>

              {user.bio ? (
                <Text style={styles.userBio}>{user.bio}</Text>
              ) : (
                <Text style={[styles.userBio, { fontStyle: 'italic', opacity: 0.5 }]}>
                  No bio yet. Add one in edit mode!
                </Text>
              )}

              {user.location && (
                <View style={styles.locationContainer}>
                  <MapPin size={16} color={COLORS.stone400} />
                  <Text style={styles.locationText}>{user.location}</Text>
                </View>
              )}
            </View>

            {/* Stats */}
            <View style={styles.statsContainer}>
              <View style={styles.statCard}>
                <View style={[styles.statIcon, { backgroundColor: COLORS.orange100 }]}>
                  <History size={20} color={COLORS.orange600} />
                </View>
                <Text style={styles.statValue}>142</Text>
                <Text style={styles.statLabel}>Meals Found</Text>
              </View>
              <View style={styles.statCard}>
                <View style={[styles.statIcon, { backgroundColor: COLORS.rose100 }]}>
                  <Heart size={20} color={COLORS.rose600} />
                </View>
                <Text style={styles.statValue}>28</Text>
                <Text style={styles.statLabel}>Favorites</Text>
              </View>
            </View>

            {/* Recent History */}
            <Text style={styles.historyTitle}>Recent History</Text>
            <View style={styles.historyContainer}>
              {[1, 2, 3, 4, 5].map((i) => (
                <Pressable key={i} style={styles.historyItem}>
                  <View style={styles.historyImage} />
                  <View style={styles.historyInfo}>
                    <Text style={styles.historyName}>Delicious Ramen Shop {i}</Text>
                    <Text style={styles.historyDate}>2 days ago</Text>
                  </View>
                </Pressable>
              ))}
            </View>
          </View>
        </ScrollView>
      )}

      {/* Bottom Navigation */}
      {!isEditing && (
        <BottomNavBar activeTab="profile" onTabChange={handleTabChange} />
      )}
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
  headerImage: {
    height: 192,
    backgroundColor: COLORS.red600,
    position: 'relative',
    overflow: 'hidden',
  },
  headerImageOverlay: {
    position: 'absolute',
    inset: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  settingsButton: {
    position: 'absolute',
    top: 24,
    right: 24,
    padding: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 999,
  },
  profileContent: {
    paddingHorizontal: 24,
    marginTop: -64,
    position: 'relative',
    zIndex: 10,
  },
  avatarSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 24,
  },
  avatarContainer: {
    width: 128,
    height: 128,
    backgroundColor: COLORS.white,
    padding: 8,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  avatar: {
    width: '100%',
    height: '100%',
    backgroundColor: COLORS.stone100,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.stone200,
  },
  avatarEmoji: {
    fontSize: 48,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
  },
  editButton: {
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: COLORS.stone900,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  editButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '700',
  },
  userInfo: {
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    marginBottom: 24,
  },
  userName: {
    fontSize: 24,
    fontWeight: '900',
    color: COLORS.stone900,
    marginBottom: 4,
  },
  userHandle: {
    fontSize: 14,
    color: COLORS.stone500,
    fontWeight: '500',
    marginBottom: 16,
  },
  uidBadge: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.red50,
    borderWidth: 1,
    borderColor: COLORS.red100,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 16,
  },
  uidBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.red600,
    letterSpacing: 1,
  },
  userBio: {
    fontSize: 14,
    color: COLORS.stone600,
    lineHeight: 20,
    marginBottom: 16,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  locationText: {
    fontSize: 14,
    color: COLORS.stone400,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 32,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.stone100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '900',
    color: COLORS.stone900,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.stone500,
    fontWeight: '500',
  },
  historyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.stone900,
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  historyContainer: {
    gap: 12,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: COLORS.white,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.stone100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  historyImage: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: COLORS.stone100,
  },
  historyInfo: {
    flex: 1,
  },
  historyName: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.stone800,
    marginBottom: 4,
  },
  historyDate: {
    fontSize: 12,
    color: COLORS.stone500,
  },
  editContainer: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  editHeader: {
    paddingTop: 48,
    paddingBottom: 16,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.stone100,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  editHeaderTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.stone800,
  },
  headerButton: {
    padding: 8,
    borderRadius: 999,
  },
  editScrollView: {
    flex: 1,
  },
  editScrollContent: {
    padding: 24,
    gap: 24,
  },
  avatarEditContainer: {
    alignItems: 'center',
    gap: 16,
  },
  avatarEdit: {
    width: 128,
    height: 128,
    backgroundColor: COLORS.stone100,
    borderRadius: 64,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: COLORS.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    position: 'relative',
  },
  avatarEditEmoji: {
    fontSize: 64,
  },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    padding: 8,
    backgroundColor: COLORS.stone900,
    borderRadius: 999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  avatarEditHint: {
    fontSize: 12,
    color: COLORS.stone400,
  },
  avatarEditPressable: {
    alignItems: 'center',
  },
  avatarEditImage: {
    width: '100%',
    height: '100%',
    borderRadius: 64,
  },
  editFields: {
    gap: 16,
  },
  field: {
    gap: 8,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.stone500,
    textTransform: 'uppercase',
  },
  fieldHint: {
    fontSize: 11,
    color: COLORS.stone400,
    marginTop: 4,
  },
  fieldInput: {
    backgroundColor: COLORS.white,
  },
  fieldTextarea: {
    backgroundColor: COLORS.white,
    minHeight: 100,
  },
});

