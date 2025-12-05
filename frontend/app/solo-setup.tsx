import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import Constants from 'expo-constants';

const API_URL = Constants.expoConfig?.extra?.EXPO_PUBLIC_BACKEND_URL || process.env.EXPO_PUBLIC_BACKEND_URL || '';

export default function SoloSetupScreen() {
  const router = useRouter();
  const [isCreating, setIsCreating] = React.useState(false);

  const startSolo = async () => {
    setIsCreating(true);
    try {
      const response = await fetch(`${API_URL}/api/rooms/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'solo' }),
      });
      
      const data = await response.json();
      
      if (data.room_code) {
        router.push({
          pathname: '/preferences',
          params: { roomCode: data.room_code, mode: 'solo' }
        });
      }
    } catch (error) {
      console.error('Create solo room error:', error);
    } finally {
      setIsCreating(false);
    }
  };

  React.useEffect(() => {
    startSolo();
  }, []);

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