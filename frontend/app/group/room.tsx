import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  Platform,
  Alert,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { ArrowLeft, Plus, LogIn } from 'lucide-react-native';
import { useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const COLORS = {
  stone50: '#fafaf9',
  stone100: '#f5f5f4',
  stone200: '#e7e5e4',
  stone300: '#d6d3d1',
  stone400: '#a8a29e',
  stone500: '#78716c',
  stone600: '#57534e',
  stone900: '#1c1917',
  white: '#FFFFFF',
  red50: '#fef2f2',
  red600: '#dc2626',
  red700: '#b91c1c',
  rose500: '#f43f5e',
  pink500: '#ec4899',
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function RoomScreen() {
  const router = useRouter();
  const [mode, setMode] = useState<'select' | 'create' | 'join'>('select');
  const [roomCode, setRoomCode] = useState('');
  const [loading, setLoading] = useState(false);
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

  const handleBack = () => {
    if (mode === 'select') {
      router.back();
    } else {
      setMode('select');
      setRoomCode('');
    }
  };

  const handleCreateRoom = async () => {
    if (!userId) {
      Alert.alert('Error', 'Please log in first');
      router.push('/auth/login');
      return;
    }

    setLoading(true);
    try {
      const result = await createRoomMutation({
        userId: userId as any,
        mode: 'group',
      });

      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      // Navigate to waiting room where the room code will be displayed
      router.push({
        pathname: '/room-waiting',
        params: { 
          roomCode: result.roomCode,
          roomId: result.roomId,
          mode: 'group' 
        },
      });
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to create room. Please try again.');
      console.error('Create room error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinRoom = async () => {
    if (roomCode.length !== 6) {
      Alert.alert('Invalid Code', 'Please enter a 6-character room code.');
      return;
    }

    if (!userId) {
      Alert.alert('Error', 'Please log in first');
      router.push('/auth/login');
      return;
    }

    setLoading(true);
    try {
      const result = await joinRoomMutation({
        userId: userId as any,
        roomCode: roomCode.toUpperCase(),
      });

      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      // Navigate to waiting room
      router.push({
        pathname: '/room-waiting',
        params: { 
          roomCode: result.roomCode,
          roomId: result.roomId,
          mode: 'group' 
        },
      });
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to join room. Please try again.');
      console.error('Join room error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* Background decorations */}
      <View style={styles.bgDecoration1} />
      
      <Pressable style={styles.backButton} onPress={handleBack}>
        <ArrowLeft size={24} color={COLORS.stone600} />
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
                style={({ pressed }) => [
                  styles.optionButton,
                  pressed && styles.optionButtonPressed,
                ]}
                onPress={() => setMode('create')}
                entering={FadeInDown.delay(200).springify()}
              >
                <View style={[styles.optionIcon, styles.optionIconCreate]}>
                  <Plus size={32} color={COLORS.red600} strokeWidth={2.5} />
                </View>
                <View style={styles.optionTextContainer}>
                  <Text style={styles.optionTitle}>Create Room</Text>
                  <Text style={styles.optionSubtitle}>
                    Start a new group session
                  </Text>
                </View>
              </AnimatedPressable>

              <AnimatedPressable
                style={({ pressed }) => [
                  styles.optionButton,
                  pressed && styles.optionButtonPressed,
                ]}
                onPress={() => setMode('join')}
                entering={FadeInDown.delay(300).springify()}
              >
                <View style={[styles.optionIcon, styles.optionIconJoin]}>
                  <LogIn size={32} color={COLORS.red600} strokeWidth={2.5} />
                </View>
                <View style={styles.optionTextContainer}>
                  <Text style={styles.optionTitle}>Join Room</Text>
                  <Text style={styles.optionSubtitle}>
                    Enter a room code to join
                  </Text>
                </View>
              </AnimatedPressable>
            </View>
          </>
        )}

        {mode === 'create' && (
          <>
            <Text style={styles.description}>
              Create a room and share the code with your friends
            </Text>
            <Animated.View 
              style={styles.createButtonContainer}
              entering={FadeInDown.delay(200).springify()}
            >
              <Pressable
                style={[
                  styles.primaryButton,
                  loading && styles.buttonDisabled,
                ]}
                onPress={handleCreateRoom}
                disabled={loading}
              >
                <Plus size={20} color={COLORS.white} style={{ marginRight: 8 }} />
                <Text style={styles.primaryButtonText}>
                  {loading ? 'Creating...' : 'Create Room'}
                </Text>
              </Pressable>
            </Animated.View>
          </>
        )}

        {mode === 'join' && (
          <>
            <Text style={styles.description}>
              Enter the 6-character room code shared by your friend
            </Text>
            <Animated.View 
              style={styles.inputCard}
              entering={FadeInDown.delay(200).springify()}
            >
              <TextInput
                style={styles.input}
                placeholder="ROOM CODE"
                placeholderTextColor={COLORS.stone300}
                value={roomCode}
                onChangeText={(text) => setRoomCode(text.toUpperCase())}
                maxLength={6}
                autoCapitalize="characters"
                autoCorrect={false}
              />
            </Animated.View>
            <Text style={styles.charCount}>{roomCode.length}/6 characters</Text>
            <AnimatedPressable
              style={[
                styles.primaryButton,
                (loading || roomCode.length !== 6) && styles.buttonInactive,
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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.stone50,
  },
  scrollContent: {
    flexGrow: 1,
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 100,
  },
  bgDecoration1: {
    position: 'absolute',
    top: '5%',
    right: '-20%',
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(220, 38, 38, 0.08)',
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
    fontSize: 28,
    fontWeight: '900',
    color: COLORS.stone900,
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    color: COLORS.stone500,
    marginBottom: 32,
    lineHeight: 24,
  },
  optionsContainer: {
    gap: 24,
  },
  optionButton: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  optionButtonPressed: {
    backgroundColor: COLORS.red50,
    borderColor: COLORS.red600,
    transform: [{ scale: 0.98 }],
  },
  optionIcon: {
    width: 64,
    height: 64,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  optionIconCreate: {
    backgroundColor: COLORS.red50,
  },
  optionIconJoin: {
    backgroundColor: COLORS.red50,
  },
  optionTextContainer: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.stone900,
    marginBottom: 4,
  },
  optionSubtitle: {
    fontSize: 14,
    color: COLORS.stone500,
  },
  inputCard: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    marginBottom: 16,
  },
  input: {
    backgroundColor: COLORS.stone50,
    borderRadius: 16,
    padding: 20,
    fontSize: 28,
    fontWeight: '900',
    color: COLORS.stone900,
    textAlign: 'center',
    letterSpacing: 8,
  },
  charCount: {
    textAlign: 'center',
    color: COLORS.stone500,
    marginBottom: 24,
  },
  primaryButton: {
    backgroundColor: COLORS.red600,
    borderRadius: 32,
    padding: 18,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    shadowColor: COLORS.red600,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    minHeight: 56,
  },
  primaryButtonPressed: {
    backgroundColor: COLORS.red700,
    transform: [{ scale: 0.98 }],
  },
  buttonDisabled: {
    opacity: 0.6,
    backgroundColor: COLORS.stone400,
    shadowOpacity: 0.1,
  },
  buttonInactive: {
    opacity: 0.7,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.white,
  },
  createButtonContainer: {
    marginTop: 16,
  },
});

