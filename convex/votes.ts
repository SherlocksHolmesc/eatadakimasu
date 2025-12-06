import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Submit a vote for a restaurant
export const submitVote = mutation({
  args: {
    roomId: v.id("rooms"),
    userId: v.id("users"),
    restaurantId: v.string(),
    vote: v.string(), // "like" or "dislike"
    restaurantData: v.optional(
      v.object({
        id: v.string(),
        name: v.string(),
        photo: v.optional(v.string()),
        cuisine: v.string(),
        rating: v.optional(v.number()),
        price_range: v.optional(v.string()),
        address: v.optional(v.string()),
        location: v.optional(v.object({
          lat: v.number(),
          lng: v.number(),
        })),
      })
    ),
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
        restaurantData: args.restaurantData,
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
      restaurantData: args.restaurantData,
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
    const aggregated: Record<string, { 
      likes: number; 
      dislikes: number; 
      totalVotes: number; 
      likePercentage: number;
      restaurantData: any;
    }> = {};

    for (const vote of votes) {
      if (!aggregated[vote.restaurantId]) {
        aggregated[vote.restaurantId] = {
          likes: 0,
          dislikes: 0,
          totalVotes: 0,
          likePercentage: 0,
          restaurantData: vote.restaurantData,
        };
      }

      if (vote.vote === "like" || vote.vote === "yes") {
        aggregated[vote.restaurantId].likes++;
      } else {
        aggregated[vote.restaurantId].dislikes++;
      }
      aggregated[vote.restaurantId].totalVotes++;
      
      // Update restaurant data if available (use latest)
      if (vote.restaurantData) {
        aggregated[vote.restaurantId].restaurantData = vote.restaurantData;
      }
    }

    // Calculate percentages and format results
    const results = Object.entries(aggregated)
      .filter(([_, data]) => data.likes > 0) // Only include restaurants with at least 1 like
      .map(([restaurantId, data]) => ({
        ...data.restaurantData,
        id: restaurantId,
        vote_count: data.likes,
        votes: data.likes,
        votes_percentage: Math.round((data.likes / data.totalVotes) * 100),
      }));

    // Sort by votes first, then by rating as tiebreaker
    results.sort((a, b) => {
      const voteDiff = b.votes - a.votes;
      if (voteDiff !== 0) return voteDiff;
      return (b.rating || 0) - (a.rating || 0);
    });

    return results.slice(0, 4); // Return top 4
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
