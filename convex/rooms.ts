import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Generate a random 6-character room code
function generateRoomCode(): string {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return code;
}

// Create a new room
export const createRoom = mutation({
  args: {
    userId: v.id("users"),
    mode: v.string(),
  },
  handler: async (ctx, args) => {
    // Generate unique room code
    let roomCode = generateRoomCode();
    let existingRoom = await ctx.db
      .query("rooms")
      .withIndex("by_roomCode", (q) => q.eq("roomCode", roomCode))
      .first();

    // Keep generating until we get a unique code
    while (existingRoom) {
      roomCode = generateRoomCode();
      existingRoom = await ctx.db
        .query("rooms")
        .withIndex("by_roomCode", (q) => q.eq("roomCode", roomCode))
        .first();
    }

    // Create the room
    const roomId = await ctx.db.insert("rooms", {
      roomCode,
      hostUserId: args.userId,
      createdAt: Date.now(),
      isActive: true,
      mode: args.mode,
    });

    // Get user info
    const user = await ctx.db.get(args.userId);
    
    // Add host as first member
    await ctx.db.insert("roomMembers", {
      roomId,
      userId: args.userId,
      username: user?.username || "Host",
      joinedAt: Date.now(),
      isReady: false,
    });

    return {
      roomId,
      roomCode,
    };
  },
});

// Join an existing room
export const joinRoom = mutation({
  args: {
    userId: v.id("users"),
    roomCode: v.string(),
  },
  handler: async (ctx, args) => {
    // Find the room
    const room = await ctx.db
      .query("rooms")
      .withIndex("by_roomCode", (q) => q.eq("roomCode", args.roomCode))
      .first();

    if (!room) {
      throw new Error("Room not found");
    }

    if (!room.isActive) {
      throw new Error("Room is no longer active");
    }

    // Check if user is already in the room
    const existingMember = await ctx.db
      .query("roomMembers")
      .withIndex("by_room_and_user", (q) =>
        q.eq("roomId", room._id).eq("userId", args.userId)
      )
      .first();

    if (existingMember) {
      return {
        roomId: room._id,
        roomCode: room.roomCode,
        alreadyMember: true,
      };
    }

    // Get user info
    const user = await ctx.db.get(args.userId);

    // Add user to room
    await ctx.db.insert("roomMembers", {
      roomId: room._id,
      userId: args.userId,
      username: user?.username || "Guest",
      joinedAt: Date.now(),
      isReady: false,
    });

    return {
      roomId: room._id,
      roomCode: room.roomCode,
      alreadyMember: false,
    };
  },
});

// Get room details with members (real-time query)
export const getRoom = query({
  args: { roomCode: v.string() },
  handler: async (ctx, args) => {
    const room = await ctx.db
      .query("rooms")
      .withIndex("by_roomCode", (q) => q.eq("roomCode", args.roomCode))
      .first();

    if (!room) {
      return null;
    }

    // Get all members
    const members = await ctx.db
      .query("roomMembers")
      .withIndex("by_room", (q) => q.eq("roomId", room._id))
      .collect();

    return {
      roomId: room._id,
      roomCode: room.roomCode,
      hostUserId: room.hostUserId,
      isActive: room.isActive,
      mode: room.mode,
      createdAt: room.createdAt,
      preferences: room.preferences,
      sessionStarted: room.sessionStarted,
      currentScreen: room.currentScreen,
      members: members.map((m) => ({
        userId: m.userId,
        username: m.username,
        joinedAt: m.joinedAt,
        isReady: m.isReady,
        preferences: m.preferences,
      })),
    };
  },
});

// Get all members of a room (real-time query)
export const getRoomMembers = query({
  args: { roomId: v.id("rooms") },
  handler: async (ctx, args) => {
    const members = await ctx.db
      .query("roomMembers")
      .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
      .collect();

    return members.map((m) => ({
      userId: m.userId,
      username: m.username,
      joinedAt: m.joinedAt,
      isReady: m.isReady,
    }));
  },
});

// Update user ready status
export const setUserReady = mutation({
  args: {
    roomId: v.id("rooms"),
    userId: v.id("users"),
    isReady: v.boolean(),
  },
  handler: async (ctx, args) => {
    const member = await ctx.db
      .query("roomMembers")
      .withIndex("by_room_and_user", (q) =>
        q.eq("roomId", args.roomId).eq("userId", args.userId)
      )
      .first();

    if (!member) {
      throw new Error("Member not found in room");
    }

    await ctx.db.patch(member._id, {
      isReady: args.isReady,
    });

    return { success: true };
  },
});

// Update room preferences
export const updateRoomPreferences = mutation({
  args: {
    roomId: v.id("rooms"),
    preferences: v.object({
      cuisines: v.optional(v.array(v.string())),
      distance: v.optional(v.number()),
      priceRange: v.optional(v.string()),
    }),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.roomId, {
      preferences: args.preferences,
    });

    return { success: true };
  },
});

// Leave room
export const leaveRoom = mutation({
  args: {
    roomId: v.id("rooms"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const member = await ctx.db
      .query("roomMembers")
      .withIndex("by_room_and_user", (q) =>
        q.eq("roomId", args.roomId).eq("userId", args.userId)
      )
      .first();

    if (member) {
      await ctx.db.delete(member._id);
    }

    // Check if room is now empty
    const remainingMembers = await ctx.db
      .query("roomMembers")
      .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
      .collect();

    if (remainingMembers.length === 0) {
      // Deactivate room if empty
      await ctx.db.patch(args.roomId, {
        isActive: false,
      });
    }

    return { success: true };
  },
});

// Vote on a restaurant
export const voteRestaurant = mutation({
  args: {
    roomId: v.id("rooms"),
    userId: v.id("users"),
    restaurantId: v.string(),
    vote: v.string(), // "like" or "dislike"
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("restaurantVotes", {
      roomId: args.roomId,
      userId: args.userId,
      restaurantId: args.restaurantId,
      vote: args.vote,
      votedAt: Date.now(),
    });

    return { success: true };
  },
});

// Get restaurant votes for a room
export const getRestaurantVotes = query({
  args: { 
    roomId: v.id("rooms"),
    restaurantId: v.string(),
  },
  handler: async (ctx, args) => {
    const votes = await ctx.db
      .query("restaurantVotes")
      .withIndex("by_room_and_restaurant", (q) =>
        q.eq("roomId", args.roomId).eq("restaurantId", args.restaurantId)
      )
      .collect();

    const likes = votes.filter((v) => v.vote === "like").length;
    const dislikes = votes.filter((v) => v.vote === "dislike").length;

    return {
      likes,
      dislikes,
      total: votes.length,
      votes,
    };
  },
});

// Start session - navigate all members to the same screen
export const startSession = mutation({
  args: {
    roomId: v.id("rooms"),
    screen: v.string(), // "preferences", "swiping", etc.
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.roomId, {
      sessionStarted: true,
      currentScreen: args.screen,
    });

    return { success: true };
  },
});

// Update member preferences
export const updateMemberPreferences = mutation({
  args: {
    roomId: v.id("rooms"),
    userId: v.id("users"),
    preferences: v.object({
      cuisines: v.optional(v.array(v.string())),
      distance: v.optional(v.number()),
      priceRange: v.optional(v.string()),
    }),
  },
  handler: async (ctx, args) => {
    const member = await ctx.db
      .query("roomMembers")
      .withIndex("by_room_and_user", (q) =>
        q.eq("roomId", args.roomId).eq("userId", args.userId)
      )
      .first();

    if (!member) {
      throw new Error("Member not found in room");
    }

    await ctx.db.patch(member._id, {
      preferences: args.preferences,
    });

    return { success: true };
  },
});

