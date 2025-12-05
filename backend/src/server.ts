import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import {
  createRoom,
  getRoom,
  getRoomByCode,
  joinRoom,
  updateMemberPreferences,
  addVote,
  getVotes,
  updateRoomStatus
} from './db';
import { MOCK_RESTAURANTS } from './mockData';
import { scrapeGoogleMaps } from './scraper';
import { filterRestaurantsWithAI } from './aiFilter';
import { Restaurant, Preferences } from './types';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8081;

// Middleware
app.use(cors());
app.use(express.json());

// Helper function to generate room code
function generateRoomCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', message: 'Eatadakimasu API is running!' });
});

// Create room
app.post('/api/rooms/create', (req, res) => {
  try {
    const { userId, username, mode } = req.body;
    
    if (!userId || !username || !mode) {
      return res.status(400).json({ error: 'Missing required fields: userId, username, mode' });
    }

    if (mode !== 'solo' && mode !== 'group') {
      return res.status(400).json({ error: 'Mode must be "solo" or "group"' });
    }

    const roomCode = generateRoomCode();
    const room = createRoom(roomCode, userId, username, mode);

    res.json({
      roomId: room.id,
      roomCode: room.roomCode,
      mode: room.mode
    });
  } catch (error: any) {
    console.error('Error creating room:', error);
    res.status(500).json({ error: 'Failed to create room' });
  }
});

// Join room
app.post('/api/rooms/join', (req, res) => {
  try {
    const { roomCode, userId, username } = req.body;

    if (!roomCode || !userId || !username) {
      return res.status(400).json({ error: 'Missing required fields: roomCode, userId, username' });
    }

    const room = getRoomByCode(roomCode);
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    const updatedRoom = joinRoom(room.id, userId, username);
    if (!updatedRoom) {
      return res.status(500).json({ error: 'Failed to join room' });
    }

    res.json({
      roomId: updatedRoom.id,
      roomCode: updatedRoom.roomCode,
      mode: updatedRoom.mode,
      status: updatedRoom.status,
      members: updatedRoom.members
    });
  } catch (error: any) {
    console.error('Error joining room:', error);
    res.status(500).json({ error: 'Failed to join room' });
  }
});

// Get room
app.get('/api/rooms/:roomCode', (req, res) => {
  try {
    const { roomCode } = req.params;
    const room = getRoomByCode(roomCode);

    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    res.json(room);
  } catch (error: any) {
    console.error('Error getting room:', error);
    res.status(500).json({ error: 'Failed to get room' });
  }
});

// Update member preferences
app.post('/api/rooms/:roomId/preferences', async (req, res) => {
  try {
    const { roomId } = req.params;
    const { userId, preferences } = req.body;

    if (!userId || !preferences) {
      return res.status(400).json({ error: 'Missing required fields: userId, preferences' });
    }

    const room = updateMemberPreferences(roomId, userId, preferences);
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    // Check if all members have set preferences
    const allMembersReady = room.members.every(m => m.preferences);

    if (allMembersReady && room.members.length > 0) {
      // All members ready - aggregate preferences and get restaurants
      const aggregatedPreferences = aggregatePreferences(room.members.map(m => m.preferences!));
      
      // Use web scraping to get restaurants (for now, use mock data filtered by preferences)
      let restaurants = filterMockRestaurants(aggregatedPreferences);
      
      // Use AI to further filter restaurants
      if (process.env.OPENROUTER_API_KEY) {
        try {
          restaurants = await filterRestaurantsWithAI(restaurants, aggregatedPreferences);
        } catch (aiError) {
          console.error('AI filtering failed, using filtered mock data:', aiError);
        }
      }

      // Update room status to swiping
      updateRoomStatus(roomId, 'swiping');
    }

    res.json({ success: true, room });
  } catch (error: any) {
    console.error('Error updating preferences:', error);
    res.status(500).json({ error: 'Failed to update preferences' });
  }
});

// Get restaurants for solo mode (using preferences)
app.post('/api/restaurants', async (req, res) => {
  try {
    const { cuisines, min_budget, max_budget, location } = req.body;

    if (!cuisines || !Array.isArray(cuisines) || cuisines.length === 0) {
      return res.status(400).json({ error: 'Cuisines are required' });
    }

    const preferences: Preferences = {
      cuisines,
      distance: 10, // Default distance
      priceRange: `${min_budget || 10}-${max_budget || 50}`,
      location: location || ''
    };

    // Get restaurants (for now, use mock data)
    let restaurants = filterMockRestaurants(preferences);

    // Use AI to filter if API key is available
    if (process.env.OPENROUTER_API_KEY) {
      try {
        restaurants = await filterRestaurantsWithAI(restaurants, preferences);
      } catch (aiError) {
        console.error('AI filtering failed, using filtered mock data:', aiError);
      }
    }

    res.json({ restaurants });
  } catch (error: any) {
    console.error('Error getting restaurants:', error);
    res.status(500).json({ error: 'Failed to get restaurants' });
  }
});

// Get restaurants for room
app.get('/api/rooms/:roomId/restaurants', async (req, res) => {
  try {
    const { roomId } = req.params;
    const room = getRoom(roomId);

    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    // Aggregate preferences from all members
    const membersWithPreferences = room.members.filter(m => m.preferences);
    if (membersWithPreferences.length === 0) {
      return res.json([]);
    }

    const aggregatedPreferences = aggregatePreferences(
      membersWithPreferences.map(m => m.preferences!)
    );

    // Get restaurants (for now, use mock data)
    let restaurants = filterMockRestaurants(aggregatedPreferences);

    // Use AI to filter if API key is available
    if (process.env.OPENROUTER_API_KEY) {
      try {
        restaurants = await filterRestaurantsWithAI(restaurants, aggregatedPreferences);
      } catch (aiError) {
        console.error('AI filtering failed, using filtered mock data:', aiError);
      }
    }

    res.json(restaurants);
  } catch (error: any) {
    console.error('Error getting restaurants:', error);
    res.status(500).json({ error: 'Failed to get restaurants' });
  }
});

// Submit vote
app.post('/api/votes', (req, res) => {
  try {
    const { roomId, userId, restaurantId, vote } = req.body;

    if (!roomId || !userId || !restaurantId || !vote) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (vote !== 'like' && vote !== 'dislike') {
      return res.status(400).json({ error: 'Vote must be "like" or "dislike"' });
    }

    addVote(roomId, userId, restaurantId, vote);
    res.json({ success: true });
  } catch (error: any) {
    console.error('Error submitting vote:', error);
    res.status(500).json({ error: 'Failed to submit vote' });
  }
});

// Get results
app.get('/api/rooms/:roomId/results', (req, res) => {
  try {
    const { roomId } = req.params;
    const room = getRoom(roomId);

    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    const votes = getVotes(roomId);
    
    // Calculate scores for each restaurant
    const scores = new Map<string, number>();
    votes.forEach(vote => {
      const current = scores.get(vote.restaurantId) || 0;
      scores.set(vote.restaurantId, current + (vote.vote === 'like' ? 1 : -1));
    });

    // Sort by score
    const sorted = Array.from(scores.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([restaurantId, score]) => ({
        restaurantId,
        score,
        votes: votes.filter(v => v.restaurantId === restaurantId)
      }));

    res.json({ results: sorted, totalVotes: votes.length });
  } catch (error: any) {
    console.error('Error getting results:', error);
    res.status(500).json({ error: 'Failed to get results' });
  }
});

// Helper function to aggregate preferences from multiple members
function aggregatePreferences(preferencesList: Preferences[]): Preferences {
  // Combine all cuisines (union)
  const allCuisines = Array.from(new Set(preferencesList.flatMap(p => p.cuisines)));
  
  // Average distance
  const avgDistance = preferencesList.reduce((sum, p) => sum + p.distance, 0) / preferencesList.length;
  
  // Combine price ranges (take the intersection - use the most restrictive)
  const priceRanges = preferencesList.map(p => p.priceRange);
  const minPrices = priceRanges.map(r => parseInt(r.split('-')[0]));
  const maxPrices = priceRanges.map(r => parseInt(r.split('-')[1]));
  const minPrice = Math.max(...minPrices);
  const maxPrice = Math.min(...maxPrices);
  const priceRange = `${minPrice}-${maxPrice}`;
  
  // Use first location (or combine if needed)
  const location = preferencesList[0]?.location || '';

  return {
    cuisines: allCuisines,
    distance: avgDistance,
    priceRange,
    location
  };
}

// Helper function to filter mock restaurants based on preferences
function filterMockRestaurants(preferences: Preferences): Restaurant[] {
  const [minPrice, maxPrice] = preferences.priceRange.split('-').map(Number);
  const priceMap: { [key: string]: number } = { '$': 10, '$$': 25, '$$$': 50, '$$$$': 100 };

  return MOCK_RESTAURANTS.filter(restaurant => {
    // Check cuisine
    if (!preferences.cuisines.includes(restaurant.cuisine)) {
      return false;
    }

    // Check price range
    const restaurantPrice = priceMap[restaurant.price_range] || 25;
    if (restaurantPrice < minPrice || restaurantPrice > maxPrice) {
      return false;
    }

    return true;
  });
}

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Eatadakimasu backend server running on port ${PORT}`);
  console.log(`📡 Health check: http://localhost:${PORT}/api/health`);
  if (!process.env.OPENROUTER_API_KEY) {
    console.warn('⚠️  OPENROUTER_API_KEY not set - AI filtering will be disabled');
  }
});
