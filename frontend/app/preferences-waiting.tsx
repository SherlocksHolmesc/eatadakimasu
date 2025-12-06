import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';

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

export default function PreferencesWaitingScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { roomCode, roomId, mode } = params;

  // Real-time query - automatically updates when members save preferences
  const roomData = useQuery(api.rooms.getRoom, 
    roomCode ? { roomCode: roomCode as string } : 'skip'
  );

  // Check if all members have set their preferences
  const allMembersReady = React.useMemo(() => {
    if (!roomData || !roomData.members) return false;
    return roomData.members.every((m: any) => m.preferences);
  }, [roomData]);

  // Auto-navigate when everyone is done
  React.useEffect(() => {
    if (allMembersReady && roomData) {
      console.log('All members have set preferences! Navigating to swipe...');
      
      // Aggregate preferences from all members
      const allCuisines = new Set<string>();
      let totalMinBudget = 0;
      let totalMaxBudget = 0;
      let location = 'Kuala Lumpur, Malaysia'; // Default location
      
      roomData.members.forEach((member: any) => {
        if (member.preferences) {
          // Collect all unique cuisines
          if (member.preferences.cuisines) {
            member.preferences.cuisines.forEach((c: string) => allCuisines.add(c));
          }
          
          // Use the first member's location (or you could aggregate/vote)
          if (member.preferences.location) {
            location = member.preferences.location;
          }
          
          // Extract budget from priceRange (format: "10-50")
          if (member.preferences.priceRange) {
            const [min, max] = member.preferences.priceRange.split('-').map(Number);
            totalMinBudget += min;
            totalMaxBudget += max;
          }
        }
      });
      
      // Average the budgets
      const memberCount = roomData.members.length;
      const avgMinBudget = Math.floor(totalMinBudget / memberCount);
      const avgMaxBudget = Math.floor(totalMaxBudget / memberCount);
      
      // Small delay to show "Everyone's ready!" message
      setTimeout(() => {
        router.push({
          pathname: '/swipe',
          params: {
            roomCode,
            roomId,
            mode,
            location: location,
            cuisines: Array.from(allCuisines).join(','),
            minBudget: String(avgMinBudget),
            maxBudget: String(avgMaxBudget),
          },
        });
      }, 2000);
    }
  }, [allMembersReady]);

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
      <Text style={styles.logo}>EATADAKIMASU</Text>

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
    backgroundColor: COLORS.stone50,
    padding: 24,
    paddingBottom: 100,
  },
  loadingText: {
    fontSize: 16,
    color: COLORS.stone500,
    textAlign: 'center',
    marginTop: 100,
  },
  logo: {
    fontSize: 24,
    fontWeight: '900',
    color: COLORS.red600,
    textAlign: 'center',
    marginTop: 60,
    marginBottom: 40,
    letterSpacing: 2,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.stone900,
    textAlign: 'center',
    marginBottom: 30,
  },
  progressContainer: {
    marginBottom: 30,
  },
  progressText: {
    fontSize: 16,
    color: COLORS.stone500,
    textAlign: 'center',
    marginBottom: 12,
    fontWeight: '600',
  },
  progressBar: {
    height: 12,
    backgroundColor: COLORS.stone200,
    borderRadius: 6,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.red600,
    borderRadius: 6,
  },
  membersContainer: {
    flex: 1,
    marginBottom: 20,
  },
  membersTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.stone700,
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
    backgroundColor: COLORS.white,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.stone900,
    marginBottom: 4,
  },
  cuisinePreview: {
    fontSize: 12,
    color: COLORS.stone500,
    fontStyle: 'italic',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: COLORS.stone300,
  },
  statusBadgeReady: {
    backgroundColor: COLORS.green500,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.white,
  },
  allReadyContainer: {
    padding: 16,
    backgroundColor: COLORS.green500,
    borderRadius: 12,
    marginBottom: 20,
  },
  allReadyText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.white,
    textAlign: 'center',
  },
  backButton: {
    padding: 16,
    borderWidth: 2,
    borderColor: COLORS.red600,
    borderRadius: 12,
    alignItems: 'center',
  },
  backButtonText: {
    color: COLORS.red600,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1,
  },
});

