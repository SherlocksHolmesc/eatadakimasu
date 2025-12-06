import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Users table for authentication
  users: defineTable({
    username: v.string(),
    email: v.string(),
    passwordHash: v.optional(v.string()), // Optional for OAuth users
    googleId: v.optional(v.string()), // Google OAuth ID
    createdAt: v.number(),
  })
    .index("by_email", ["email"])
    .index("by_username", ["username"])
    .index("by_googleId", ["googleId"]),

  // Rooms table for group sessions
  rooms: defineTable({
    roomCode: v.string(),
    hostUserId: v.id("users"),
    createdAt: v.number(),
    isActive: v.boolean(),
    mode: v.string(), // "group" or "solo"
    sessionStarted: v.optional(v.boolean()), // Track if host started the session
    currentScreen: v.optional(v.string()), // Track current screen: "waiting", "preferences", "swiping"
    preferences: v.optional(
      v.object({
        cuisines: v.optional(v.array(v.string())),
        distance: v.optional(v.number()),
        priceRange: v.optional(v.string()),
      })
    ),
  })
    .index("by_roomCode", ["roomCode"])
    .index("by_isActive", ["isActive"]),

  // Room members - tracks who's in which room
  roomMembers: defineTable({
    roomId: v.id("rooms"),
    userId: v.id("users"),
    username: v.string(),
    joinedAt: v.number(),
    isReady: v.boolean(),
    preferences: v.optional(
      v.object({
        cuisines: v.optional(v.array(v.string())),
        distance: v.optional(v.number()),
        priceRange: v.optional(v.string()),
      })
    ),
  })
    .index("by_room", ["roomId"])
    .index("by_user", ["userId"])
    .index("by_room_and_user", ["roomId", "userId"]),

  // Restaurant votes/swipes
  restaurantVotes: defineTable({
    roomId: v.id("rooms"),
    userId: v.id("users"),
    restaurantId: v.string(),
    vote: v.string(), // "like" or "dislike"
    votedAt: v.number(),
  })
    .index("by_room", ["roomId"])
    .index("by_room_and_restaurant", ["roomId", "restaurantId"]),
});

