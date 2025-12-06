import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, ActivityIndicator, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { ArrowLeft, Users, UserPlus } from 'lucide-react-native';

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

export default function GroupModeScreen() {
  const router = useRouter();
  const [roomCode, setRoomCode] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  const createRoomMutation = useMutation(api.rooms.createRoom);
  const joinRoomMutation = useMutation(api.rooms.joinRoom);

  useEffect(() => {
    // Get logged-in user ID
    const getUserId = async () => {
      const id = await AsyncStorage.getItem('userId');
      setUserId(id);
    };
    getUserId();
  }, []);

  const createRoom = async () => {
    if (!userId) {
      Alert.alert('Error', 'Please log in first');
      router.push('/auth/login');
      return;
    }

    setIsCreating(true);
    try {
      const result = await createRoomMutation({
        userId: userId as any,
        mode: 'group',
      });

      // Navigate to a waiting room screen with the room code
      router.push({
        pathname: '/room-waiting',
        params: { 
          roomCode: result.roomCode,
          roomId: result.roomId,
          mode: 'group' 
        }
      });
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to create room. Please try again.');
      console.error('Create room error:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const joinRoom = async () => {
    if (!roomCode.trim()) {
      Alert.alert('Error', 'Please enter a room code');
      return;
    }

    if (!userId) {
      Alert.alert('Error', 'Please log in first');
      router.push('/auth/login');
      return;
    }

    setIsJoining(true);
    try {
      const result = await joinRoomMutation({
        userId: userId as any,
        roomCode: roomCode.toUpperCase(),
      });

      // Navigate to waiting room
      router.push({
        pathname: '/room-waiting',
        params: { 
          roomCode: result.roomCode,
          roomId: result.roomId,
          mode: 'group' 
        }
      });
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Room not found. Please check the code.');
      console.error('Join room error:', error);
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Background Gradient */}
      <View style={styles.bgGradient} />
      
      {/* Back button */}
      <TouchableOpacity 
        style={styles.backButton}
        onPress={() => router.back()}
      >
        <ArrowLeft size={24} color={COLORS.stone700} />
      </TouchableOpacity>

      {/* Logo - PNG Ramen Bowl */}
      <Animated.View 
        style={styles.logoContainer}
        entering={FadeInDown.delay(100).springify()}
      >
        <Image
          source={require('../assets/images/42aaecb8daf9fe805d264506738108e934067bf1e19a2bce4515936448bb6077.png')}
          style={{ width: 100, height: 100 }}
          resizeMode="contain"
        />
        <Text style={styles.logo}>EATADAKIMASU</Text>
      </Animated.View>

      <Animated.Text 
        style={styles.title}
        entering={FadeInDown.delay(200).springify()}
      >
        GROUP DECISION
      </Animated.Text>

      {/* Create/Join Buttons */}
      <Animated.View 
        style={styles.actionContainer}
        entering={FadeInDown.delay(300).springify()}
      >
        <TouchableOpacity 
          style={[styles.actionButton, styles.filledButton]}
          onPress={createRoom}
          disabled={isCreating}
        >
          <Users size={18} color={COLORS.white} style={{ marginRight: 8 }} />
          <Text style={styles.filledButtonText}>
            {isCreating ? 'CREATING...' : 'CREATE ROOM'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.actionButton, styles.outlinedButton]}
          onPress={() => {}}
        >
          <UserPlus size={18} color={COLORS.red600} style={{ marginRight: 8 }} />
          <Text style={styles.outlinedButtonText}>JOIN ROOM</Text>
        </TouchableOpacity>
      </Animated.View>

      {/* Room Code Input */}
      <Animated.View 
        style={styles.inputContainer}
        entering={FadeInDown.delay(400).springify()}
      >
        <Text style={styles.label}>Room Code</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter 6-digit code"
          placeholderTextColor={COLORS.stone400}
          value={roomCode}
          onChangeText={(text) => setRoomCode(text.toUpperCase())}
          maxLength={6}
          autoCapitalize="characters"
        />
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(500).springify()}>
        <TouchableOpacity 
          style={styles.submitButton}
          onPress={joinRoom}
          disabled={isJoining}
        >
          <Text style={styles.submitButtonText}>
            {isJoining ? 'JOINING...' : 'ENTER'}
          </Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
    padding: 24,
  },
  bgGradient: {
    position: 'absolute',
    top: -50,
    right: -80,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: COLORS.rose100,
    opacity: 0.6,
  },
  backButton: {
    width: 44,
    height: 44,
    marginTop: 40,
    marginBottom: 20,
    justifyContent: 'center',
    zIndex: 1,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 24,
    zIndex: 1,
  },
  logo: {
    fontSize: 20,
    fontWeight: '900',
    color: COLORS.red600,
    letterSpacing: 3,
    marginTop: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.stone900,
    textAlign: 'center',
    marginBottom: 32,
    letterSpacing: 2,
  },
  actionContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 40,
  },
  actionButton: {
    flex: 1,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  filledButton: {
    backgroundColor: COLORS.red600,
  },
  filledButtonText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1,
  },
  outlinedButton: {
    backgroundColor: COLORS.white,
    borderWidth: 2,
    borderColor: COLORS.red600,
  },
  outlinedButtonText: {
    color: COLORS.red600,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1,
  },
  inputContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    color: COLORS.stone500,
    marginBottom: 8,
    fontWeight: '600',
  },
  input: {
    height: 56,
    borderWidth: 1,
    borderColor: COLORS.stone200,
    borderRadius: 16,
    paddingHorizontal: 16,
    fontSize: 18,
    textAlign: 'center',
    backgroundColor: COLORS.white,
    color: COLORS.stone900,
    letterSpacing: 4,
    fontWeight: '600',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  submitButton: {
    backgroundColor: COLORS.red600,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.red600,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 2,
  },
});