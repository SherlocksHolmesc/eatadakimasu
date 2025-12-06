import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Platform,
  Alert,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { ArrowLeft, User, Settings, LogOut, ChevronRight, Heart, Clock, Star } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function ProfileScreen() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    const storedUsername = await AsyncStorage.getItem('username');
    const storedEmail = await AsyncStorage.getItem('email');
    setUsername(storedUsername || 'Guest');
    setEmail(storedEmail || 'Not logged in');
  };

  const handleBack = () => {
    router.back();
  };

  const handleLogout = async () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.multiRemove(['userId', 'username', 'email']);
            router.replace('/auth/login');
          },
        },
      ]
    );
  };

  const menuItems = [
    { icon: Heart, label: 'Favorite Restaurants', subtitle: '12 saved', onPress: () => {} },
    { icon: Clock, label: 'History', subtitle: 'View past sessions', onPress: () => {} },
    { icon: Star, label: 'Preferences', subtitle: 'Food preferences', onPress: () => {} },
    { icon: Settings, label: 'Settings', subtitle: 'App settings', onPress: () => {} },
  ];

  return (
    <View style={styles.container}>
      {/* Background */}
      <View style={styles.bgGradient} />

      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={handleBack}>
          <ArrowLeft size={24} color={COLORS.stone700} />
        </Pressable>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Profile Card */}
        <Animated.View 
          style={styles.profileCard}
          entering={FadeInDown.delay(100).springify()}
        >
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Image
                source={require('../assets/images/42aaecb8daf9fe805d264506738108e934067bf1e19a2bce4515936448bb6077.png')}
                style={{ width: 70, height: 70, tintColor: COLORS.white }}
                resizeMode="contain"
              />
            </View>
          </View>
          <Text style={styles.username}>{username}</Text>
          <Text style={styles.email}>{email}</Text>
          
          {/* Stats */}
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>24</Text>
              <Text style={styles.statLabel}>Sessions</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>156</Text>
              <Text style={styles.statLabel}>Swipes</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>12</Text>
              <Text style={styles.statLabel}>Friends</Text>
            </View>
          </View>
        </Animated.View>

        {/* Menu Items */}
        <Animated.View 
          style={styles.menuContainer}
          entering={FadeInDown.delay(200).springify()}
        >
          {menuItems.map((item, index) => (
            <AnimatedPressable
              key={item.label}
              style={({ pressed }) => [
                styles.menuItem,
                pressed && styles.menuItemPressed,
              ]}
              onPress={item.onPress}
              entering={FadeInDown.delay(300 + index * 100).springify()}
            >
              <View style={styles.menuIconContainer}>
                <item.icon size={22} color={COLORS.red600} />
              </View>
              <View style={styles.menuTextContainer}>
                <Text style={styles.menuLabel}>{item.label}</Text>
                <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
              </View>
              <ChevronRight size={20} color={COLORS.stone300} />
            </AnimatedPressable>
          ))}
        </Animated.View>

        {/* Logout Button */}
        <Animated.View entering={FadeIn.delay(700)}>
          <AnimatedPressable
            style={({ pressed }) => [
              styles.logoutButton,
              pressed && styles.logoutButtonPressed,
            ]}
            onPress={handleLogout}
          >
            <LogOut size={20} color={COLORS.red600} />
            <Text style={styles.logoutText}>Logout</Text>
          </AnimatedPressable>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  bgGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 320,
    backgroundColor: COLORS.rose50,
    borderBottomLeftRadius: 100,
    borderBottomRightRadius: 100,
  },
  header: {
    paddingHorizontal: 24,
    marginTop: 50,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  profileCard: {
    backgroundColor: COLORS.white,
    borderRadius: 28,
    padding: 28,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 6,
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: COLORS.red600,
    justifyContent: 'center',
    alignItems: 'center',
  },
  username: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.stone900,
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: COLORS.stone500,
    marginBottom: 24,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: COLORS.stone100,
    width: '100%',
  },
  statItem: {
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  statNumber: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.red600,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.stone500,
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: COLORS.stone200,
  },
  menuContainer: {
    marginBottom: 24,
  },
  menuItem: {
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
  menuItemPressed: {
    backgroundColor: COLORS.stone50,
    transform: [{ scale: 0.98 }],
  },
  menuIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: COLORS.rose50,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  menuTextContainer: {
    flex: 1,
  },
  menuLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.stone900,
    marginBottom: 2,
  },
  menuSubtitle: {
    fontSize: 13,
    color: COLORS.stone500,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.rose50,
    borderRadius: 16,
    padding: 16,
    gap: 8,
    borderWidth: 1,
    borderColor: COLORS.rose100,
  },
  logoutButtonPressed: {
    backgroundColor: COLORS.rose100,
    transform: [{ scale: 0.98 }],
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.red600,
  },
});
