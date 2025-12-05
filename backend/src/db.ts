import { Room, Vote, Member, Preferences } from './types';

// In-memory storage (replaces MongoDB)
const rooms = new Map<string, Room>();
const votes = new Map<string, Vote[]>();

export function createRoom(roomCode: string, userId: string, username: string, mode: 'solo' | 'group'): Room {
  const room: Room = {
    id: generateId(),
    roomCode,
    mode,
    members: [{
      userId,
      username
    }],
    status: 'waiting',
    createdAt: new Date().toISOString()
  };
  
  rooms.set(room.id, room);
  votes.set(room.id, []);
  
  return room;
}

export function getRoom(roomId: string): Room | undefined {
  return rooms.get(roomId);
}

export function getRoomByCode(roomCode: string): Room | undefined {
  for (const room of rooms.values()) {
    if (room.roomCode === roomCode) {
      return room;
    }
  }
  return undefined;
}

export function joinRoom(roomId: string, userId: string, username: string): Room | null {
  const room = rooms.get(roomId);
  if (!room) return null;
  
  // Check if user is already a member
  if (room.members.some(m => m.userId === userId)) {
    return room;
  }
  
  room.members.push({ userId, username });
  rooms.set(roomId, room);
  
  return room;
}

export function updateMemberPreferences(
  roomId: string,
  userId: string,
  preferences: Preferences
): Room | null {
  const room = rooms.get(roomId);
  if (!room) return null;
  
  const member = room.members.find(m => m.userId === userId);
  if (!member) return null;
  
  member.preferences = preferences;
  rooms.set(roomId, room);
  
  return room;
}

export function addVote(roomId: string, userId: string, restaurantId: string, vote: 'like' | 'dislike'): void {
  const roomVotes = votes.get(roomId) || [];
  
  // Remove existing vote from this user for this restaurant
  const filtered = roomVotes.filter(
    v => !(v.userId === userId && v.restaurantId === restaurantId)
  );
  
  // Add new vote
  filtered.push({ roomId, userId, restaurantId, vote });
  votes.set(roomId, filtered);
}

export function getVotes(roomId: string): Vote[] {
  return votes.get(roomId) || [];
}

export function updateRoomStatus(roomId: string, status: Room['status']): Room | null {
  const room = rooms.get(roomId);
  if (!room) return null;
  
  room.status = status;
  rooms.set(roomId, room);
  
  return room;
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}
