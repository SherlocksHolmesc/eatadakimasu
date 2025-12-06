import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function SoloSetupScreen() {
  const router = useRouter();
  const [isCreating, setIsCreating] = React.useState(false);
  const [userId, setUserId] = React.useState<string | null>(null);

  const createRoomMutation = useMutation(api.rooms.createRoom);

  useEffect(() => {
    const getUserId = async () => {
      const id = await AsyncStorage.getItem('userId');
      setUserId(id);
    };
    getUserId();
  }, []);

  const startSolo = async () => {
    if (!userId) {
      router.push('/auth/login');
      return;
    }

    setIsCreating(true);
    try {
      console.log('Solo setup: Creating room with userId:', userId);
      const result = await createRoomMutation({
        userId: userId as any,
        mode: 'solo',
      });
      
      console.log('Solo setup: Room created:', result);
      console.log('Solo setup: roomCode:', result?.roomCode);
      console.log('Solo setup: roomId:', result?.roomId);
      
      // Validate result
      if (!result || !result.roomId || !result.roomCode) {
        console.error('Invalid room creation result:', result);
        Alert.alert('Error', 'Failed to create room. Please try again.');
        return;
      }
      
      // Store roomId in AsyncStorage as backup
      await AsyncStorage.setItem('soloRoomId', result.roomId.toString());
      await AsyncStorage.setItem('soloRoomCode', result.roomCode);
      
      router.push({
        pathname: '/solo/location',
        params: { 
          roomCode: result.roomCode, 
          roomId: result.roomId.toString(), // Ensure it's a string
          mode: 'solo' 
        }
      });
    } catch (error: any) {
      console.error('Create solo room error:', error);
      Alert.alert('Error', error.message || 'Failed to create room. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  useEffect(() => {
    if (userId) {
      startSolo();
    }
  }, [userId]);

  return (
    <View style={styles.container}>
      <Text style={styles.logo}>Eatadakimasu</Text>
      <Text style={styles.loadingText}>{isCreating ? 'Setting up your experience...' : 'Ready!'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  logo: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#ff2346',
    marginBottom: 20,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
});