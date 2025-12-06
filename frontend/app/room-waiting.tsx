import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Share, Platform, Pressable } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { ArrowLeft } from 'lucide-react-native';

const COLORS = {
  white: '#FFFFFF',
  stone50: '#fafaf9',
  stone100: '#f5f5f4',
  stone200: '#e7e5e4',
  stone300: '#d6d3d1',
  stone500: '#78716c',
  stone700: '#44403c',
  stone900: '#1c1917',
  red600: '#dc2626',
  rose100: '#ffe4e6',
  green500: '#22c55e',
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function RoomWaitingScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { roomCode, roomId } = params;

  const [currentUserId, setCurrentUserId] = React.useState<string>('');

  // Real-time query - automatically updates when members join/leave
  const roomData = useQuery(api.rooms.getRoom, 
    roomCode ? { roomCode: roomCode as string } : 'skip'
  );

  // Debug: Log roomData changes
  React.useEffect(() => {
    console.log('=== ROOM DATA CHANGED ===');
    console.log('Full roomData:', JSON.stringify(roomData, null, 2));
  }, [roomData]);

  const setUserReadyMutation = useMutation(api.rooms.setUserReady);
  const leaveRoomMutation = useMutation(api.rooms.leaveRoom);
  const startSessionMutation = useMutation(api.rooms.startSession);

  React.useEffect(() => {
    const getUserId = async () => {
      const id = await AsyncStorage.getItem('userId');
      setCurrentUserId(id || '');
    };
    getUserId();
  }, []);

  // Auto-navigate when host starts the session
  const [hasNavigated, setHasNavigated] = React.useState(false);
  
  React.useEffect(() => {
    console.log('=== Navigation Check ===');
    
    // Only run if roomData is loaded
    if (!roomData) {
      console.log('No roomData yet, skipping navigation check');
      return;
    }
    
    // Don't navigate if we already did
    if (hasNavigated) {
      console.log('Already navigated, skipping');
      return;
    }
    
    console.log('Checking navigation conditions:');
    console.log('  sessionStarted:', roomData.sessionStarted);
    console.log('  currentScreen:', roomData.currentScreen);
    console.log('  roomCode:', roomCode);
    console.log('  roomId:', roomId);
    
    if (roomData.sessionStarted && roomData.currentScreen === 'preferences') {
      console.log('🚀 CONDITIONS MET! NAVIGATING TO PREFERENCES!');
      setHasNavigated(true); // Prevent multiple navigations
      // Only navigate if user hasn't already set preferences
      const currentMember = roomData.members.find((m: any) => m.userId === currentUserId);
      if (!currentMember?.preferences) {
        router.push({
          pathname: '/group/location',
          params: { roomCode, roomId, mode: 'group' }
        });
      }
    } else {
      console.log('❌ Conditions not met for navigation');
    }
  }, [roomData, hasNavigated]);

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Join my food room! Room Code: ${roomCode}\n\nDownload Eatadakimasu and enter this code to join.`,
      });
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  const handleReady = async () => {
    if (!roomId || !currentUserId) return;

    try {
      const currentMember = roomData?.members.find(m => m.userId === currentUserId);
      await setUserReadyMutation({
        roomId: roomId as any,
        userId: currentUserId as any,
        isReady: !currentMember?.isReady,
      });
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const handleStart = async () => {
    console.log('START clicked!');
    console.log('roomId:', roomId);
    console.log('roomData:', roomData);
    
    // Check if everyone is ready
    const allReady = roomData?.members.every(m => m.isReady);
    console.log('allReady:', allReady);
    
    if (!allReady) {
      if (Platform.OS === 'web') {
        (globalThis as any).alert('Wait for everyone to be ready!');
      } else {
        Alert.alert('Not Ready', 'Wait for everyone to be ready!');
      }
      return;
    }

    if (!roomId) {
      console.log('No roomId, returning');
      return;
    }

    try {
      console.log('Calling startSessionMutation...');
      // Start the session - this will trigger navigation for ALL members
      await startSessionMutation({
        roomId: roomId as any,
        screen: 'preferences',
      });
      console.log('Session started successfully!');
      
      // Navigate immediately for the host to location screen (first step)
      console.log('Navigating host to location...');
      router.push({
        pathname: '/group/location',
        params: { roomCode, roomId, mode: 'group' }
      });
    } catch (error: any) {
      console.error('Start session error:', error);
      if (Platform.OS === 'web') {
        (globalThis as any).alert('Error starting session: ' + error.message);
      } else {
        Alert.alert('Error', 'Error starting session: ' + error.message);
      }
    }
  };

  const handleLeave = async () => {
    // Use window.confirm for web, Alert.alert for native
    const confirmLeave = Platform.OS === 'web' 
      ? (globalThis as any).window?.confirm('Are you sure you want to leave the room?') || false
      : await new Promise<boolean>((resolve) => {
          Alert.alert(
            'Leave Room',
            'Are you sure you want to leave?',
            [
              { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
              { text: 'Leave', style: 'destructive', onPress: () => resolve(true) },
            ]
          );
        });

    if (!confirmLeave) return;

    try {
      // Only call leaveRoom if we have the required data
      if (roomId && currentUserId) {
        await leaveRoomMutation({
          roomId: roomId as any,
          userId: currentUserId as any,
        });
      }
      router.back();
    } catch (error: any) {
      console.error('Leave room error:', error);
      // Still navigate back even if there's an error
      router.back();
    }
  };

  if (!roomData) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading room...</Text>
      </View>
    );
  }

  const isHost = roomData.hostUserId === currentUserId;
  const allReady = roomData.members.every(m => m.isReady);
  const currentMember = roomData.members.find(m => m.userId === currentUserId);

  return (
    <View style={styles.container}>
      {/* Back button */}
      <Pressable 
        style={styles.backButton}
        onPress={handleLeave}
      >
        <ArrowLeft size={24} color={COLORS.stone700} />
      </Pressable>

      <Animated.View
        style={styles.content}
        entering={FadeInDown.delay(100).springify()}
      >
        {/* Title */}
        <Text style={styles.title}>Group Room</Text>
        <Text style={styles.description}>
          Share the room code with your friends to join
        </Text>

        {/* Room Code Display */}
        <Animated.View 
          style={styles.roomCodeContainer}
          entering={FadeInDown.delay(200).springify()}
        >
          <Text style={styles.roomCodeLabel}>ROOM CODE</Text>
          <Text style={styles.roomCode}>{roomCode}</Text>
          <AnimatedPressable 
            style={styles.shareButton} 
            onPress={handleShare}
            entering={FadeInDown.delay(300).springify()}
          >
            <Text style={styles.shareButtonText}>📤 Share Code</Text>
          </AnimatedPressable>
        </Animated.View>

        {/* Members List */}
        <View style={styles.membersContainer}>
          <Text style={styles.membersTitle}>
            Members ({roomData.members.length})
          </Text>
          
          <ScrollView style={styles.membersList} showsVerticalScrollIndicator={false}>
            {roomData.members.map((member, index) => (
              <Animated.View 
                key={index} 
                style={styles.memberItem}
                entering={FadeInDown.delay(400 + index * 50).springify()}
              >
                <View style={styles.memberInfo}>
                  <Text style={styles.memberName}>
                    {member.username}
                    {member.userId === roomData.hostUserId && ' 👑'}
                  </Text>
                </View>
                <View style={[
                  styles.readyIndicator,
                  member.isReady && styles.readyIndicatorActive
                ]}>
                  <Text style={[
                    styles.readyText,
                    member.isReady && styles.readyTextActive
                  ]}>
                    {member.isReady ? '✓ Ready' : 'Waiting...'}
                  </Text>
                </View>
              </Animated.View>
            ))}
          </ScrollView>
        </View>

        {/* Ready Button */}
        <AnimatedPressable 
          style={[
            styles.readyButton,
            currentMember?.isReady && styles.readyButtonActive
          ]}
          onPress={handleReady}
          entering={FadeInDown.delay(500).springify()}
        >
          <Text style={styles.readyButtonText}>
            {currentMember?.isReady ? "I'M READY ✓" : "READY UP"}
          </Text>
        </AnimatedPressable>

        {/* Start Button (Host Only) */}
        {isHost && (
          <AnimatedPressable 
            style={[
              styles.startButton,
              !allReady && styles.startButtonDisabled
            ]}
            onPress={handleStart}
            disabled={!allReady}
            entering={FadeInDown.delay(600).springify()}
          >
            <Text style={styles.startButtonText}>
              {allReady ? 'SET PREFERENCES' : 'WAITING FOR EVERYONE...'}
            </Text>
          </AnimatedPressable>
        )}

        {!isHost && allReady && (
          <Animated.View 
            style={styles.waitingForHost}
            entering={FadeInDown.delay(600).springify()}
          >
            <Text style={styles.waitingText}>Waiting for host to start...</Text>
          </Animated.View>
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.stone50,
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
    fontSize: 28,
    fontWeight: '900',
    color: COLORS.red600,
    marginBottom: 8,
    letterSpacing: 2,
  },
  description: {
    fontSize: 16,
    color: COLORS.stone500,
    marginBottom: 40,
    lineHeight: 24,
  },
  loadingText: {
    fontSize: 16,
    color: COLORS.stone500,
    textAlign: 'center',
    marginTop: 100,
  },
  roomCodeContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 2,
    borderColor: COLORS.red600,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  roomCodeLabel: {
    fontSize: 12,
    color: COLORS.stone500,
    fontWeight: '600',
    marginBottom: 12,
    letterSpacing: 1,
  },
  roomCode: {
    fontSize: 42,
    fontWeight: '900',
    color: COLORS.red600,
    letterSpacing: 6,
    marginBottom: 20,
  },
  shareButton: {
    backgroundColor: COLORS.red600,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
    minWidth: 140,
    alignItems: 'center',
  },
  shareButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '700',
  },
  membersContainer: {
    flex: 1,
    marginBottom: 20,
  },
  membersTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.stone700,
    marginBottom: 16,
  },
  membersList: {
    flex: 1,
  },
  memberItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.stone200,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.stone900,
  },
  readyIndicator: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: COLORS.stone200,
  },
  readyIndicatorActive: {
    backgroundColor: COLORS.green500,
  },
  readyText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.stone700,
  },
  readyTextActive: {
    color: COLORS.white,
  },
  readyButton: {
    backgroundColor: COLORS.red600,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: COLORS.red600,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  readyButtonActive: {
    backgroundColor: COLORS.green500,
    shadowColor: COLORS.green500,
  },
  readyButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 1,
  },
  startButton: {
    backgroundColor: COLORS.red600,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.red600,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  startButtonDisabled: {
    backgroundColor: COLORS.stone300,
    shadowColor: '#000',
    shadowOpacity: 0.1,
  },
  startButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 1,
  },
  waitingForHost: {
    padding: 16,
    backgroundColor: COLORS.stone100,
    borderRadius: 16,
    alignItems: 'center',
  },
  waitingText: {
    fontSize: 14,
    color: COLORS.stone500,
    fontStyle: 'italic',
  },
});

