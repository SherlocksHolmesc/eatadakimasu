import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Submit a vote for a restaurant
export const submitVote = mutation({
  args: {
    roomId: v.id("rooms"),
    userId: v.id("users"),
    restaurantId: v.string(),
    vote: v.string(), // "like" or "dislike"
  },
  handler: async (ctx, args) => {
    // Check if user already voted for this restaurant in this room
    const existingVote = await ctx.db
      .query("restaurantVotes")
      .withIndex("by_room_and_restaurant", (q) =>
        q.eq("roomId", args.roomId).eq("restaurantId", args.restaurantId)
      )
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .first();

    if (existingVote) {
      // Update existing vote
      await ctx.db.patch(existingVote._id, {
        vote: args.vote,
        votedAt: Date.now(),
      });
      return existingVote._id;
    }

    // Create new vote
    const voteId = await ctx.db.insert("restaurantVotes", {
      roomId: args.roomId,
      userId: args.userId,
      restaurantId: args.restaurantId,
      vote: args.vote,
      votedAt: Date.now(),
    });

    return voteId;
  },
});

// Get aggregated votes for a room
export const getAggregatedVotes = query({
  args: {
    roomId: v.id("rooms"),
  },
  handler: async (ctx, args) => {
    // Get all votes for this room
    const votes = await ctx.db
      .query("restaurantVotes")
      .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
      .collect();

    // Aggregate votes by restaurant
    const aggregated: Record<string, { likes: number; dislikes: number; totalVotes: number; likePercentage: number }> = {};

    for (const vote of votes) {
      if (!aggregated[vote.restaurantId]) {
        aggregated[vote.restaurantId] = {
          likes: 0,
          dislikes: 0,
          totalVotes: 0,
          likePercentage: 0,
        };
      }

      if (vote.vote === "like") {
        aggregated[vote.restaurantId].likes++;
      } else {
        aggregated[vote.restaurantId].dislikes++;
      }
      aggregated[vote.restaurantId].totalVotes++;
    }

    // Calculate percentages and sort by likes
    const results = Object.entries(aggregated).map(([restaurantId, data]) => ({
      restaurantId,
      likes: data.likes,
      dislikes: data.dislikes,
      totalVotes: data.totalVotes,
      likePercentage: (data.likes / data.totalVotes) * 100,
    }));

    // Sort by like percentage (descending) and then by total votes
    results.sort((a, b) => {
      if (b.likePercentage !== a.likePercentage) {
        return b.likePercentage - a.likePercentage;
      }
      return b.totalVotes - a.totalVotes;
    });

    return results.slice(0, 10); // Return top 10
  },
});

// Get top 3 restaurants for results screen
export const getTopRestaurants = query({
  args: {
    roomId: v.id("rooms"),
  },
  handler: async (ctx, args) => {
    // Get all votes for this room
    const votes = await ctx.db
      .query("restaurantVotes")
      .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
      .collect();

    // Aggregate votes by restaurant
    const aggregated: Record<string, { likes: number; dislikes: number; totalVotes: number; likePercentage: number }> = {};

    for (const vote of votes) {
      if (!aggregated[vote.restaurantId]) {
        aggregated[vote.restaurantId] = {
          likes: 0,
          dislikes: 0,
          totalVotes: 0,
          likePercentage: 0,
        };
      }

      if (vote.vote === "like") {
        aggregated[vote.restaurantId].likes++;
      } else {
        aggregated[vote.restaurantId].dislikes++;
      }
      aggregated[vote.restaurantId].totalVotes++;
    }

    // Calculate percentages and sort
    const results = Object.entries(aggregated)
      .filter(([_, data]) => data.likes > 0) // Only include restaurants with at least 1 like
      .map(([restaurantId, data]) => ({
        restaurantId,
        likes: data.likes,
        dislikes: data.dislikes,
        totalVotes: data.totalVotes,
        likePercentage: (data.likes / data.totalVotes) * 100,
      }));

    // Sort by like percentage (descending) and then by total votes
    results.sort((a, b) => {
      if (b.likePercentage !== a.likePercentage) {
        return b.likePercentage - a.likePercentage;
      }
      return b.totalVotes - a.totalVotes;
    });

    return results.slice(0, 3); // Return top 3
  },
});

// Get all member preferences for a room
export const getRoomPreferences = query({
  args: {
    roomId: v.id("rooms"),
  },
  handler: async (ctx, args) => {
    const members = await ctx.db
      .query("roomMembers")
      .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
      .collect();

    return members.map((member) => ({
      userId: member.userId,
      username: member.username,
      preferences: member.preferences,
    }));
  },
});
