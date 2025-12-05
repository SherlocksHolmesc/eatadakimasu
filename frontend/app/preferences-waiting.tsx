import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

export default function PreferencesWaitingScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { roomCode, roomId, mode } = params;

  const [roomData, setRoomData] = useState<any>(null);
  const [hasNavigated, setHasNavigated] = useState(false);

  // Poll for room data
  useEffect(() => {
    if (!roomCode) return;

    const fetchRoomData = async () => {
      try {
        const response = await fetch(`${API_URL}/api/rooms/${roomCode}`);
        if (response.ok) {
          const data = await response.json();
          setRoomData(data);

          // Check if all members have set their preferences
          const allMembersReady = data.members && data.members.every((m: any) => m.preferences);
          
          // Auto-navigate when everyone is done
          if (allMembersReady && !hasNavigated) {
            console.log('All members have set preferences! Navigating to swipe...');
            setHasNavigated(true);
            setTimeout(() => {
              router.push({
                pathname: '/swipe',
                params: {
                  roomCode,
                  roomId: data.id,
                  mode,
                },
              });
            }, 2000);
          }
        }
      } catch (error) {
        console.error('Error fetching room data:', error);
      }
    };

    fetchRoomData();
    const interval = setInterval(fetchRoomData, 2000); // Poll every 2 seconds
    return () => clearInterval(interval);
  }, [roomCode, hasNavigated]);

  // Check if all members have set their preferences
  const allMembersReady = roomData?.members?.every((m: any) => m.preferences) || false;

  if (!roomData) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  const membersReady = roomData.members.filter((m: any) => m.preferences).length;
  const totalMembers = roomData.members.length;

  return (
    <View style={styles.container}>
      {/* Logo */}
      <Text style={styles.logo}>Eatadakimasu</Text>

      {/* Title */}
      <Text style={styles.title}>
        {allMembersReady ? "Everyone's Ready! 🎉" : "Waiting for Others..."}
      </Text>

      {/* Progress */}
      <View style={styles.progressContainer}>
        <Text style={styles.progressText}>
          {membersReady} / {totalMembers} members ready
        </Text>
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill, 
              { width: `${(membersReady / totalMembers) * 100}%` }
            ]} 
          />
        </View>
      </View>

      {/* Members List */}
      <View style={styles.membersContainer}>
        <Text style={styles.membersTitle}>Group Members:</Text>
        <ScrollView style={styles.membersList}>
          {roomData.members.map((member: any, index: number) => (
            <View key={index} style={styles.memberItem}>
              <View style={styles.memberInfo}>
                <Text style={styles.memberName}>
                  {member.username} {member.userId === roomData.hostUserId && '👑'}
                </Text>
                {member.preferences && (
                  <Text style={styles.cuisinePreview}>
                    {member.preferences.cuisines?.slice(0, 2).join(', ') || 'Preferences set'}
                  </Text>
                )}
              </View>
              <View style={[
                styles.statusBadge,
                member.preferences && styles.statusBadgeReady
              ]}>
                <Text style={styles.statusText}>
                  {member.preferences ? '✓ Ready' : '⏳ Choosing...'}
                </Text>
              </View>
            </View>
          ))}
        </ScrollView>
      </View>

      {allMembersReady && (
        <View style={styles.allReadyContainer}>
          <Text style={styles.allReadyText}>
            Starting swipe session...
          </Text>
        </View>
      )}

      {/* Back Button */}
      <TouchableOpacity 
        style={styles.backButton}
        onPress={() => router.back()}
      >
        <Text style={styles.backButtonText}>← BACK TO PREFERENCES</Text>
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
  loadingText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 100,
  },
  logo: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ff2346',
    textAlign: 'center',
    marginTop: 60,
    marginBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 30,
  },
  progressContainer: {
    marginBottom: 30,
  },
  progressText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 12,
    fontWeight: '600',
  },
  progressBar: {
    height: 12,
    backgroundColor: '#f0f0f0',
    borderRadius: 6,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#ff2346',
    borderRadius: 6,
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
    marginBottom: 4,
  },
  cuisinePreview: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: '#e0e0e0',
  },
  statusBadgeReady: {
    backgroundColor: '#4CAF50',
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  allReadyContainer: {
    padding: 16,
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    marginBottom: 20,
  },
  allReadyText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  backButton: {
    padding: 16,
    borderWidth: 2,
    borderColor: '#ff2346',
    borderRadius: 12,
    alignItems: 'center',
  },
  backButtonText: {
    color: '#ff2346',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

