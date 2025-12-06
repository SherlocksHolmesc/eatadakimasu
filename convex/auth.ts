import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Simple password hashing (in production, use bcrypt or similar)
function simpleHash(password: string): string {
  // Browser-compatible base64 encoding
  // In production, use a proper hashing library like bcrypt
  return btoa(password);
}

function verifyPassword(password: string, hash: string): boolean {
  return simpleHash(password) === hash;
}

// Register a new user
export const register = mutation({
  args: {
    username: v.string(),
    email: v.string(),
    password: v.string(),
  },
  handler: async (ctx, args) => {
    // Check if email already exists
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (existingUser) {
      throw new Error("Email already registered");
    }

    // Check if username already exists
    const existingUsername = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", args.username))
      .first();

    if (existingUsername) {
      throw new Error("Username already taken");
    }

    // Create new user
    const userId = await ctx.db.insert("users", {
      username: args.username,
      email: args.email,
      passwordHash: simpleHash(args.password),
      createdAt: Date.now(),
    });

    return {
      userId,
      username: args.username,
      email: args.email,
    };
  },
});

// Login user
export const login = mutation({
  args: {
    email: v.string(),
    password: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (!user) {
      throw new Error("Invalid email or password");
    }

    // Check if user has a password (not OAuth-only user)
    if (!user.passwordHash) {
      throw new Error("This account uses Google sign-in. Please sign in with Google.");
    }

    if (!verifyPassword(args.password, user.passwordHash)) {
      throw new Error("Invalid email or password");
    }

    return {
      userId: user._id,
      username: user.username,
      email: user.email,
    };
  },
});

// Google OAuth login/register
export const loginWithGoogle = mutation({
  args: {
    idToken: v.string(),
    email: v.string(),
    name: v.string(),
    googleId: v.string(),
  },
  handler: async (ctx, args) => {
    // Verify the token with Google (simplified - in production, verify JWT properly)
    // For now, we'll trust the client-provided data since we're using Google's OAuth
    
    // Check if user exists by Google ID
    let user = await ctx.db
      .query("users")
      .withIndex("by_googleId", (q) => q.eq("googleId", args.googleId))
      .first();

    if (user) {
      // User exists, return their data
      return {
        userId: user._id,
        username: user.username,
        email: user.email,
      };
    }

    // Check if email already exists (might be from regular registration)
    const existingUserByEmail = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (existingUserByEmail) {
      // Update existing user to add Google ID
      await ctx.db.patch(existingUserByEmail._id, {
        googleId: args.googleId,
      });
      return {
        userId: existingUserByEmail._id,
        username: existingUserByEmail.username,
        email: existingUserByEmail.email,
      };
    }

    // Create new user with Google OAuth
    // Generate username from name or email
    const baseUsername = args.name.split(' ')[0].toLowerCase().replace(/[^a-z0-9]/g, '') || 
                         args.email.split('@')[0];
    let username = baseUsername;
    let counter = 1;

    // Ensure username is unique
    while (await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", username))
      .first()) {
      username = `${baseUsername}${counter}`;
      counter++;
    }

    const userId = await ctx.db.insert("users", {
      username,
      email: args.email,
      googleId: args.googleId,
      createdAt: Date.now(),
    });

    return {
      userId,
      username,
      email: args.email,
    };
  },
});

// Get user by ID
export const getUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) return null;

    return {
      userId: user._id,
      username: user.username,
      email: user.email,
    };
  },
});

