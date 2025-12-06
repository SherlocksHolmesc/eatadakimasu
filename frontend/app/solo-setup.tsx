import React, { useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, Alert, ActivityIndicator, Pressable, BackHandler, Image } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { ArrowLeft } from 'lucide-react-native';

const COLORS = {
  white: '#FFFFFF',
  stone50: '#fafaf9',
  stone500: '#78716c',
  stone700: '#44403c',
  red600: '#dc2626',
  rose50: '#fff1f2',
};

export default function SoloSetupScreen() {
  const router = useRouter();
  const [isCreating, setIsCreating] = React.useState(false);
  const [userId, setUserId] = React.useState<string | null>(null);
  const [hasStarted, setHasStarted] = React.useState(false);
  const isMounted = useRef(true);

  const createRoomMutation = useMutation(api.rooms.createRoom);

  // Handle hardware back button on Android
  useFocusEffect(
    useCallback(() => {
      isMounted.current = true;
      setIsCreating(false);
      setHasStarted(false);
      
      const onBackPress = () => {
        router.back();
        return true;
      };
      
      const backHandler = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      
      // Load user ID
      const getUserId = async () => {
        const id = await AsyncStorage.getItem('userId');
        if (isMounted.current) {
          setUserId(id);
        }
      };
      getUserId();
      
      return () => {
        isMounted.current = false;
        backHandler.remove();
        setIsCreating(false);
        setHasStarted(false);
      };
    }, [])
  );

  // Handle back button press
  const handleBack = useCallback(() => {
    setHasStarted(true); // Prevent auto-start
    setIsCreating(false);
    router.back();
  }, [router]);

  const startSolo = async () => {
    if (!userId || hasStarted || isCreating) {
      return;
    }

    if (!userId) {
      router.push('/auth/login');
      return;
    }

    setHasStarted(true);
    setIsCreating(true);
    
    try {
      console.log('Solo setup: Creating room with userId:', userId);
      const result = await createRoomMutation({
        userId: userId as any,
        mode: 'solo',
      });
      
      if (!isMounted.current) return;
      
      console.log('Solo setup: Room created:', result);
      
      // Validate result
      if (!result || !result.roomId || !result.roomCode) {
        console.error('Invalid room creation result:', result);
        Alert.alert('Error', 'Failed to create room. Please try again.');
        setHasStarted(false);
        setIsCreating(false);
        return;
      }
      
      // Store roomId in AsyncStorage as backup
      await AsyncStorage.setItem('soloRoomId', result.roomId.toString());
      await AsyncStorage.setItem('soloRoomCode', result.roomCode);
      
      router.push({
        pathname: '/solo/location',
        params: { 
          roomCode: result.roomCode, 
          roomId: result.roomId.toString(),
          mode: 'solo' 
        }
      });
    } catch (error: any) {
      if (!isMounted.current) return;
      console.error('Create solo room error:', error);
      Alert.alert('Error', error.message || 'Failed to create room. Please try again.');
      setHasStarted(false);
    } finally {
      if (isMounted.current) {
        setIsCreating(false);
      }
    }
  };

  useEffect(() => {
    if (userId && !hasStarted && isMounted.current) {
      startSolo();
    }
  }, [userId, hasStarted]);

  return (
    <View style={styles.container}>
      {/* Background Gradient */}
      <View style={styles.bgGradient} />
      
      {/* Back Button */}
      <Pressable style={styles.backButton} onPress={handleBack}>
        <ArrowLeft size={24} color={COLORS.stone700} />
      </Pressable>
      
      {/* Logo - PNG Ramen Bowl */}
      <Animated.View 
        style={styles.logoContainer}
        entering={FadeIn.delay(200)}
      >
        <Image
          source={require('../assets/images/42aaecb8daf9fe805d264506738108e934067bf1e19a2bce4515936448bb6077.png')}
          style={{ width: 120, height: 120 }}
          resizeMode="contain"
        />
      </Animated.View>
      
      <Animated.Text 
        style={styles.logo}
        entering={FadeInDown.delay(300).springify()}
      >
        EATADAKIMASU
      </Animated.Text>
      
      <Animated.View 
        style={styles.loadingContainer}
        entering={FadeInDown.delay(400).springify()}
      >
        <ActivityIndicator size="large" color={COLORS.red600} />
        <Text style={styles.loadingText}>
          {isCreating ? 'Setting up your experience...' : 'Preparing...'}
        </Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  bgGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: COLORS.rose50,
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 24,
    width: 44,
    height: 44,
    justifyContent: 'center',
    zIndex: 10,
  },
  logoContainer: {
    marginBottom: 16,
  },
  logo: {
    fontSize: 28,
    fontWeight: '900',
    color: COLORS.red600,
    letterSpacing: 4,
    marginBottom: 40,
  },
  loadingContainer: {
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: COLORS.stone500,
    marginTop: 16,
    fontWeight: '500',
  },
});