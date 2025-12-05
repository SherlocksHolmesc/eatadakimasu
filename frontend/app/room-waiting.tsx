import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Share, Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

export default function RoomWaitingScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { roomCode, roomId } = params;

  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [roomData, setRoomData] = useState<any>(null);
  const [isHost, setIsHost] = useState(false);
  const [hasNavigated, setHasNavigated] = useState(false);

  useEffect(() => {
    const getUserId = async () => {
      const id = await AsyncStorage.getItem('userId');
      setCurrentUserId(id || '');
    };
    getUserId();
  }, []);

  // Poll for room data
  useEffect(() => {
    if (!roomCode) return;

    const fetchRoomData = async () => {
      try {
        const response = await fetch(`${API_URL}/api/rooms/${roomCode}`);
        if (response.ok) {
          const data = await response.json();
          setRoomData(data);
          
          // Check if current user is the host (first member)
          if (data.members && data.members.length > 0) {
            setIsHost(data.members[0].userId === currentUserId);
          }

          // Auto-navigate when status changes to preferences
          if (data.status === 'preferences' && !hasNavigated) {
            setHasNavigated(true);
            router.push({
              pathname: '/preferences',
              params: { roomCode, roomId: data.id, mode: 'group' }
            });
          }
        }
      } catch (error) {
        console.error('Error fetching room data:', error);
      }
    };

    fetchRoomData();
    const interval = setInterval(fetchRoomData, 2000); // Poll every 2 seconds
    return () => clearInterval(interval);
  }, [roomCode, currentUserId, hasNavigated]);

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
    if (!roomData || !roomId) {
      Alert.alert('Error', 'Room data not loaded');
      return;
    }

    // Navigate to preferences screen
    router.push({
      pathname: '/preferences',
      params: { roomCode, roomId, mode: 'group' }
    });
  };

  const handleLeave = async () => {
    const confirmLeave = Platform.OS === 'web' 
      ? window.confirm('Are you sure you want to leave the room?')
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
    router.back();
  };

  if (!roomData) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading room...</Text>
      </View>
    );
  }

  const allMembersReady = roomData.members && roomData.members.length > 0;
  const currentMember = roomData.members?.find((m: any) => m.userId === currentUserId);

  return (
    <View style={styles.container}>
      {/* Back button */}
      <TouchableOpacity 
        style={styles.backButton}
        onPress={handleLeave}
      >
        <Text style={styles.backButtonText}>←</Text>
      </TouchableOpacity>

      {/* Logo */}
      <Text style={styles.logo}>Eatadakimasu</Text>

      {/* Room Code Display */}
      <View style={styles.roomCodeContainer}>
        <Text style={styles.roomCodeLabel}>ROOM CODE</Text>
        <Text style={styles.roomCode}>{roomCode}</Text>
        <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
          <Text style={styles.shareButtonText}>📤 SHARE CODE</Text>
        </TouchableOpacity>
      </View>

      {/* Members List */}
      <View style={styles.membersContainer}>
        <Text style={styles.membersTitle}>
          Members ({roomData.members.length})
        </Text>
        
        <ScrollView style={styles.membersList}>
          {roomData.members.map((member, index) => (
            <View key={index} style={styles.memberItem}>
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
                <Text style={styles.readyText}>
                  {member.isReady ? '✓ Ready' : 'Waiting...'}
                </Text>
              </View>
            </View>
          ))}
        </ScrollView>
      </View>

      {/* Ready Button */}
      <TouchableOpacity 
        style={[
          styles.readyButton,
          currentMember?.isReady && styles.readyButtonActive
        ]}
        onPress={handleReady}
      >
        <Text style={styles.readyButtonText}>
          {currentMember?.isReady ? "I'M READY ✓" : "READY UP"}
        </Text>
      </TouchableOpacity>

      {/* Start Button (Host Only) */}
      {isHost && (
        <TouchableOpacity 
          style={[
            styles.startButton,
            !allReady && styles.startButtonDisabled
          ]}
          onPress={handleStart}
          disabled={!allReady}
        >
          <Text style={styles.startButtonText}>
            {allReady ? 'START SWIPING' : 'WAITING FOR EVERYONE...'}
          </Text>
        </TouchableOpacity>
      )}

      {!isHost && allReady && (
        <View style={styles.waitingForHost}>
          <Text style={styles.waitingText}>Waiting for host to start...</Text>
        </View>
      )}
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
    marginBottom: 30,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 100,
  },
  roomCodeContainer: {
    backgroundColor: '#f8f8f8',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 2,
    borderColor: '#ff2346',
  },
  roomCodeLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: 'bold',
    marginBottom: 8,
  },
  roomCode: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#ff2346',
    letterSpacing: 4,
    marginBottom: 16,
  },
  shareButton: {
    backgroundColor: '#ff2346',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  shareButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  membersContainer: {
    flex: 1,
    marginBottom: 20,
  },
  membersTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  membersList: {
    flex: 1,
  },
  memberItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    marginBottom: 8,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  readyIndicator: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: '#e0e0e0',
  },
  readyIndicatorActive: {
    backgroundColor: '#4CAF50',
  },
  readyText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  readyButton: {
    backgroundColor: '#ff2346',
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  readyButtonActive: {
    backgroundColor: '#4CAF50',
  },
  readyButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  startButton: {
    backgroundColor: '#ff2346',
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  startButtonDisabled: {
    backgroundColor: '#ccc',
  },
  startButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  waitingForHost: {
    padding: 16,
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    alignItems: 'center',
  },
  waitingText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
});

