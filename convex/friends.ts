import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Helper function to format user ID as UID string
function formatUserId(userId: string): string {
  // Convert Convex ID to a readable format
  // Example: "j1234567890abcdef" -> "UID-1234-ABCD"
  const parts = userId.split('');
  if (parts.length >= 4) {
    const part1 = parts.slice(1, 5).join('').toUpperCase();
    const part2 = parts.slice(5, 9).join('').toUpperCase();
    return `UID-${part1}-${part2}`;
  }
  return userId;
}

// Get user by UID (search functionality)
export const getUserByUid = query({
  args: { uid: v.string() },
  handler: async (ctx, args) => {
    if (!args.uid || args.uid.trim().length === 0) {
      return null;
    }

    const searchTerm = args.uid.trim().toUpperCase();

    // If search term is in formatted UID format (UID-XXXX-YYYY), search by formatted UID
    if (searchTerm.startsWith("UID-")) {
      const uidParts = searchTerm.replace("UID-", "").split("-");
      if (uidParts.length === 2) {
        // Search through all users and format their IDs to find a match
        const allUsers = await ctx.db.query("users").collect();
        for (const user of allUsers) {
          const formattedUid = formatUserId(user._id);
          if (formattedUid.toUpperCase() === searchTerm) {
            return {
              userId: user._id,
              username: user.username,
              email: user.email,
              uid: formattedUid,
            };
          }
        }
        // If no match found by formatted UID, return null
        return null;
      }
    }

    // First, try to find by ID directly (if UID is a Convex ID)
    // This is the fastest check
    try {
      const userById = await ctx.db.get(searchTerm as any);
      if (userById && '_id' in userById && 'username' in userById && 'email' in userById) {
        return {
          userId: userById._id,
          username: userById.username,
          email: userById.email,
          uid: formatUserId(userById._id),
        };
      }
    } catch (e) {
      // Invalid ID format, continue to other searches
    }

    // Try to find by username (if UID is actually a username)
    const userByUsername = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", searchTerm))
      .first();

    if (userByUsername) {
      return {
        userId: userByUsername._id,
        username: userByUsername.username,
        email: userByUsername.email,
        uid: formatUserId(userByUsername._id),
      };
    }

    // Try to find by email
    const userByEmail = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", searchTerm))
      .first();

    if (userByEmail) {
      return {
        userId: userByEmail._id,
        username: userByEmail.username,
        email: userByEmail.email,
        uid: formatUserId(userByEmail._id),
      };
    }

    return null;
  },
});

// Get current user info with formatted UID
export const getCurrentUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) return null;

    return {
      userId: user._id,
      username: user.username,
      email: user.email,
      uid: formatUserId(user._id),
      formattedUid: formatUserId(user._id),
    };
  },
});

// Send friend request
export const sendFriendRequest = mutation({
  args: {
    fromUserId: v.id("users"),
    toUserId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Don't allow self-friending
    if (args.fromUserId === args.toUserId) {
      throw new Error("Cannot send friend request to yourself");
    }

    // Check if users exist
    const fromUser = await ctx.db.get(args.fromUserId);
    const toUser = await ctx.db.get(args.toUserId);

    if (!fromUser || !toUser) {
      throw new Error("User not found");
    }

    // Check if already friends
    const existingFriendship = await ctx.db
      .query("friendships")
      .withIndex("by_users", (q) => 
        q.eq("userId1", args.fromUserId).eq("userId2", args.toUserId)
      )
      .first();

    if (!existingFriendship) {
      const reverseFriendship = await ctx.db
        .query("friendships")
        .withIndex("by_users", (q) => 
          q.eq("userId1", args.toUserId).eq("userId2", args.fromUserId)
        )
        .first();

      if (reverseFriendship) {
        throw new Error("Already friends");
      }
    } else {
      throw new Error("Already friends");
    }

    // Check if there's already a pending request
    const existingRequest = await ctx.db
      .query("friendRequests")
      .withIndex("by_users", (q) => 
        q.eq("fromUserId", args.fromUserId).eq("toUserId", args.toUserId)
      )
      .first();

    if (existingRequest && existingRequest.status === "pending") {
      throw new Error("Friend request already sent");
    }

    // Check reverse request
    const reverseRequest = await ctx.db
      .query("friendRequests")
      .withIndex("by_users", (q) => 
        q.eq("fromUserId", args.toUserId).eq("toUserId", args.fromUserId)
      )
      .first();

    if (reverseRequest && reverseRequest.status === "pending") {
      throw new Error("This user has already sent you a friend request");
    }

    // Create friend request
    await ctx.db.insert("friendRequests", {
      fromUserId: args.fromUserId,
      toUserId: args.toUserId,
      status: "pending",
      createdAt: Date.now(),
    });

    return { success: true };
  },
});

// Accept friend request
export const acceptFriendRequest = mutation({
  args: {
    requestId: v.id("friendRequests"),
    fromUserId: v.id("users"),
    toUserId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Get the request
    const request = await ctx.db.get(args.requestId);
    if (!request) {
      throw new Error("Friend request not found");
    }

    if (request.status !== "pending") {
      throw new Error("Friend request already processed");
    }

    // Update request status
    await ctx.db.patch(args.requestId, {
      status: "accepted",
    });

    // Create bidirectional friendship
    await ctx.db.insert("friendships", {
      userId1: args.fromUserId,
      userId2: args.toUserId,
      createdAt: Date.now(),
    });

    return { success: true };
  },
});

// Reject/Ignore friend request
export const rejectFriendRequest = mutation({
  args: {
    requestId: v.id("friendRequests"),
  },
  handler: async (ctx, args) => {
    const request = await ctx.db.get(args.requestId);
    if (!request) {
      throw new Error("Friend request not found");
    }

    await ctx.db.patch(args.requestId, {
      status: "rejected",
    });

    return { success: true };
  },
});

// Get incoming friend requests
export const getIncomingFriendRequests = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const requests = await ctx.db
      .query("friendRequests")
      .withIndex("by_to_user", (q) => 
        q.eq("toUserId", args.userId).eq("status", "pending")
      )
      .collect();

    const requestsWithUserInfo = await Promise.all(
      requests.map(async (request) => {
        const fromUser = await ctx.db.get(request.fromUserId);
        if (!fromUser) return null;

        return {
          requestId: request._id,
          fromUserId: request.fromUserId,
          fromUsername: fromUser.username,
          fromEmail: fromUser.email,
          createdAt: request.createdAt,
        };
      })
    );

    return requestsWithUserInfo.filter((r) => r !== null);
  },
});

// Get friend list
export const getFriends = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    // Get friendships where user is userId1
    const friendships1 = await ctx.db
      .query("friendships")
      .withIndex("by_user1", (q) => q.eq("userId1", args.userId))
      .collect();

    // Get friendships where user is userId2
    const friendships2 = await ctx.db
      .query("friendships")
      .withIndex("by_user2", (q) => q.eq("userId2", args.userId))
      .collect();

    // Combine and get friend user info
    const friendIds = [
      ...friendships1.map((f) => f.userId2),
      ...friendships2.map((f) => f.userId1),
    ];

    const friends = await Promise.all(
      friendIds.map(async (friendId) => {
        const user = await ctx.db.get(friendId);
        if (!user) return null;

        return {
          userId: user._id,
          username: user.username,
          email: user.email,
          uid: formatUserId(user._id),
        };
      })
    );

    return friends.filter((f) => f !== null);
  },
});

