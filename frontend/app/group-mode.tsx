import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import Constants from 'expo-constants';

const API_URL = Constants.expoConfig?.extra?.EXPO_PUBLIC_BACKEND_URL || process.env.EXPO_PUBLIC_BACKEND_URL || '';

export default function GroupModeScreen() {
  const router = useRouter();
  const [roomCode, setRoomCode] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);

  const createRoom = async () => {
    setIsCreating(true);
    try {
      const response = await fetch(`${API_URL}/api/rooms/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'group' }),
      });
      
      const data = await response.json();
      
      if (data.room_code) {
        router.push({
          pathname: '/preferences',
          params: { roomCode: data.room_code, mode: 'group' }
        });
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to create room. Please try again.');
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

    setIsJoining(true);
    try {
      const response = await fetch(`${API_URL}/api/rooms/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ room_code: roomCode.toUpperCase() }),
      });
      
      if (response.ok) {
        const data = await response.json();
        router.push({
          pathname: '/preferences',
          params: { roomCode: data.room_code, mode: 'group' }
        });
      } else {
        Alert.alert('Error', 'Room not found. Please check the code.');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to join room. Please try again.');
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