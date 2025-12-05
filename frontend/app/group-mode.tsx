import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

export default function GroupModeScreen() {
  const router = useRouter();
  const [roomCode, setRoomCode] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);

  useEffect(() => {
    // Get logged-in user ID and username
    const getUserData = async () => {
      const id = await AsyncStorage.getItem('userId');
      const name = await AsyncStorage.getItem('username');
      setUserId(id);
      setUsername(name);
      
      // If no user, create a temporary one
      if (!id) {
        const tempId = `user_${Math.random().toString(36).substr(2, 9)}`;
        const tempName = 'User' + Math.floor(Math.random() * 1000);
        await AsyncStorage.setItem('userId', tempId);
        await AsyncStorage.setItem('username', tempName);
        setUserId(tempId);
        setUsername(tempName);
      }
    };
    getUserData();
  }, []);

  const createRoom = async () => {
    if (!userId || !username) {
      Alert.alert('Error', 'Please log in first');
      router.push('/auth/login');
      return;
    }

    setIsCreating(true);
    try {
      const response = await fetch(`${API_URL}/api/rooms/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          username,
          mode: 'group'
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create room');
      }

      const result = await response.json();

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

    if (!userId || !username) {
      Alert.alert('Error', 'Please log in first');
      router.push('/auth/login');
      return;
    }

    setIsJoining(true);
    try {
      const response = await fetch(`${API_URL}/api/rooms/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomCode: roomCode.toUpperCase(),
          userId,
          username
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Room not found');
      }

      const result = await response.json();

      // Navigate to waiting room
      router.push({
        pathname: '/room-waiting',
        params: { 
          roomCode: result.roomCode,
          roomId: result.roomId,
          mode: result.mode || 'group' 
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
      {/* Back button */}
      <TouchableOpacity 
        style={styles.backButton}
        onPress={() => router.back()}
      >
        <Text style={styles.backButtonText}>←</Text>
      </TouchableOpacity>

      {/* Logo */}
      <Text style={styles.logo}>Eatadakimasu</Text>

      <Text style={styles.title}>GROUP DECISION</Text>

      {/* Create/Join Buttons */}
      <View style={styles.actionContainer}>
        <TouchableOpacity 
          style={[styles.actionButton, styles.filledButton]}
          onPress={createRoom}
          disabled={isCreating}
        >
          <Text style={styles.filledButtonText}>
            {isCreating ? 'CREATING...' : 'CREATE ROOM'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.actionButton, styles.outlinedButton]}
          onPress={() => {}}
        >
          <Text style={styles.outlinedButtonText}>JOIN ROOM</Text>
        </TouchableOpacity>
      </View>

      {/* Room Code Input */}
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Room Code</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter 6-digit code"
          value={roomCode}
          onChangeText={(text) => setRoomCode(text.toUpperCase())}
          maxLength={6}
          autoCapitalize="characters"
        />
      </View>

      <TouchableOpacity 
        style={styles.submitButton}
        onPress={joinRoom}
        disabled={isJoining}
      >
        <Text style={styles.submitButtonText}>
          {isJoining ? 'JOINING...' : 'ENTER'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 24,
  },
  backButton: {
    width: 40,
    height: 40,
    marginTop: 40,
    marginBottom: 20,
  },
  backButtonText: {
    fontSize: 28,
    color: '#ff2346',
  },
  logo: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ff2346',
    textAlign: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 32,
  },
  actionContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 40,
  },
  actionButton: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filledButton: {
    backgroundColor: '#ff2346',
  },
  filledButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  outlinedButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#ff2346',
  },
  outlinedButtonText: {
    color: '#ff2346',
    fontSize: 14,
    fontWeight: 'bold',
  },
  inputContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    textAlign: 'center',
  },
  submitButton: {
    backgroundColor: '#ff2346',
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});