import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  Platform,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { ArrowLeft, Plus, LogIn } from 'lucide-react-native';
import Constants from 'expo-constants';

const API_URL = Constants.expoConfig?.extra?.EXPO_PUBLIC_BACKEND_URL || process.env.EXPO_PUBLIC_BACKEND_URL || '';

const COLORS = {
  white: '#FFFFFF',
  accent: '#ff2346',
  lightGray: '#f5f5f5',
  darkGray: '#333333',
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function RoomScreen() {
  const router = useRouter();
  const [mode, setMode] = useState<'select' | 'create' | 'join'>('select');
  const [roomCode, setRoomCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleBack = () => {
    if (mode === 'select') {
      router.back();
    } else {
      setMode('select');
      setRoomCode('');
    }
  };

  const handleCreateRoom = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/rooms/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'group' }),
      });

      const data = await response.json() as { room_code?: string };

      if (data.room_code) {
        if (Platform.OS !== 'web') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }

        router.push({
          pathname: '/group/location',
          params: { roomCode: data.room_code, mode: 'group' },
        });
      } else {
        Alert.alert('Error', 'Failed to create room. Please try again.');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to create room. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinRoom = async () => {
    if (roomCode.length !== 6) {
      Alert.alert('Invalid Code', 'Please enter a 6-character room code.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/rooms/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ room_code: roomCode.toUpperCase() }),
      });

      if (response.ok) {
        const data = await response.json() as { room_code?: string };
        
        if (Platform.OS !== 'web') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }

        router.push({
          pathname: '/group/location',
          params: { roomCode: data.room_code || '', mode: 'group' },
        });
      } else {
        Alert.alert('Room Not Found', 'No active room found with this code.');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to join room. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Pressable style={styles.backButton} onPress={handleBack}>
        <ArrowLeft size={24} color={COLORS.darkGray} />
      </Pressable>

      <Animated.View
        style={styles.content}
        entering={FadeInDown.delay(100).springify()}
      >
        <Text style={styles.title}>Group Mode</Text>

        {mode === 'select' && (
          <>
            <Text style={styles.description}>
              Create a room for your group or join an existing one
            </Text>

            <View style={styles.optionsContainer}>
              <AnimatedPressable
                style={styles.optionButton}
                onPress={() => setMode('create')}
                entering={FadeInDown.delay(200).springify()}
              >
                <View style={styles.optionIcon}>
                  <Plus size={28} color={COLORS.accent} strokeWidth={2.5} />
                </View>
                <Text style={styles.optionTitle}>Create Room</Text>
                <Text style={styles.optionSubtitle}>
                  Start a new group session
                </Text>
              </AnimatedPressable>

              <AnimatedPressable
                style={styles.optionButton}
                onPress={() => setMode('join')}
                entering={FadeInDown.delay(300).springify()}
              >
                <View style={styles.optionIcon}>
                  <LogIn size={28} color={COLORS.accent} strokeWidth={2.5} />
                </View>
                <Text style={styles.optionTitle}>Join Room</Text>
                <Text style={styles.optionSubtitle}>
                  Enter a room code to join
                </Text>
              </AnimatedPressable>
            </View>
          </>
        )}

        {mode === 'create' && (
          <>
            <Text style={styles.description}>
              Create a room and share the code with your friends
            </Text>
            <AnimatedPressable
              style={[styles.primaryButton, loading && styles.buttonDisabled]}
              onPress={handleCreateRoom}
              disabled={loading}
              entering={FadeInDown.delay(200).springify()}
            >
              <Text style={styles.primaryButtonText}>
                {loading ? 'Creating...' : 'Create Room'}
              </Text>
            </AnimatedPressable>
          </>
        )}

        {mode === 'join' && (
          <>
            <Text style={styles.description}>
              Enter the 6-character room code shared by your friend
            </Text>
            <Animated.View entering={FadeInDown.delay(200).springify()}>
              <TextInput
                style={styles.input}
                placeholder="ROOM CODE"
                placeholderTextColor={`${COLORS.darkGray}40`}
                value={roomCode}
                onChangeText={(text) => setRoomCode(text.toUpperCase())}
                maxLength={6}
                autoCapitalize="characters"
                autoCorrect={false}
              />
            </Animated.View>
            <AnimatedPressable
              style={[
                styles.primaryButton,
                (loading || roomCode.length !== 6) && styles.buttonDisabled,
              ]}
              onPress={handleJoinRoom}
              disabled={loading || roomCode.length !== 6}
              entering={FadeInDown.delay(300).springify()}
            >
              <Text style={styles.primaryButtonText}>
                {loading ? 'Joining...' : 'Join Room'}
              </Text>
            </AnimatedPressable>
          </>
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
    paddingTop: 60,
    paddingHorizontal: 24,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    marginBottom: 20,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 36,
    fontWeight: '800',
    color: COLORS.darkGray,
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: COLORS.darkGray,
    opacity: 0.6,
    marginBottom: 40,
    lineHeight: 24,
  },
  optionsContainer: {
    gap: 16,
  },
  optionButton: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
  },
  optionIcon: {
    width: 56,
    height: 56,
    borderRadius: 14,
    backgroundColor: `${COLORS.accent}10`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  optionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.darkGray,
    marginBottom: 4,
  },
  optionSubtitle: {
    fontSize: 14,
    color: COLORS.darkGray,
    opacity: 0.6,
  },
  input: {
    backgroundColor: COLORS.lightGray,
    borderRadius: 16,
    padding: 20,
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.darkGray,
    textAlign: 'center',
    letterSpacing: 4,
    marginBottom: 20,
  },
  primaryButton: {
    backgroundColor: COLORS.accent,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  primaryButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.white,
  },
});

