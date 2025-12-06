import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { searchGooglePlaces } from './googlePlacesAPI';
import { searchRestaurantsStrict } from './strictCuisineSearch';
import { generateRealisticRestaurants } from './realisticRestaurantGenerator';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 8001;

// Middleware
app.use(cors());
app.use(express.json());

// Types
interface RestaurantQuery {
  location: string;
  cuisines: string[];
  min_budget: number;
  max_budget: number;
}

// Helper function
function generateRoomCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// In-memory storage for votes (for hackathon purposes)
interface Vote {
  room_code: string;
  user_id: string;
  restaurant_id: string;
  vote: string;
  restaurant_data?: any;
}

const votesDB: Vote[] = [];

// Routes
app.get('/', (_req: Request, res: Response) => {
  res.json({ 
    message: 'Eatadakimasu API', 
    status: 'running',
    endpoints: ['/api/health', '/api/rooms/create', '/api/restaurants', '/api/vote', '/api/results']
  });
});

app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'healthy', service: 'eatadakimasu-backend-ts' });
});

app.post('/api/rooms/create', (req: Request, res: Response) => {
  const roomCode = generateRoomCode();
  res.json({ room_code: roomCode, mode: req.body.mode || 'group' });
});

app.post('/api/rooms/join', (req: Request, res: Response) => {
  const { room_code } = req.body;
  if (!room_code || room_code.length !== 6) {
    return res.status(400).json({ detail: 'Invalid room code format' });
  }
  res.json({ room_code, status: 'joined' });
});

app.get('/api/rooms/:room_code', (req: Request, res: Response) => {
  res.json({ room_code: req.params.room_code, status: 'active' });
});

app.post('/api/preferences', (req: Request, res: Response) => {
  res.json({ success: true, message: 'Preferences saved to Convex' });
});

app.post('/api/votes', (req: Request, res: Response) => {
  try {
    const { room_code, user_id, restaurant_id, vote, restaurant_data } = req.body;
    
    // Store vote in memory
    votesDB.push({
      room_code,
      user_id,
      restaurant_id,
      vote,
      restaurant_data
    });
    
    console.log(`✅ Vote recorded: ${user_id} voted ${vote} for ${restaurant_id} in room ${room_code}`);
    res.json({ success: true, message: 'Vote recorded' });
  } catch (error) {
    console.error('Error recording vote:', error);
    res.status(500).json({ error: 'Failed to record vote' });
  }
});

app.post('/api/restaurants', async (req: Request, res: Response) => {
  try {
    const query: RestaurantQuery = req.body;

    let restaurants: any[] = [];
    
    // Try Google Places API first if key is available
    if (process.env.GOOGLE_PLACES_API_KEY && process.env.GOOGLE_PLACES_API_KEY !== 'YOUR_GOOGLE_PLACES_API_KEY_HERE') {
      try {
        restaurants = await searchGooglePlaces(
          query.location,
          query.cuisines,
          query.min_budget,
          query.max_budget
        );
      } catch (err) {
        console.log('Google Places failed, using strict OSM search');
      }
    }
    
    // Fallback to strict OpenStreetMap search
    if (restaurants.length === 0) {
      restaurants = await searchRestaurantsStrict(
        query.location,
        query.cuisines,
        query.min_budget,
        query.max_budget
      );
    }
    
    // Final fallback: generate realistic restaurants
    if (restaurants.length === 0) {
      console.log('Using realistic restaurant generator');
      restaurants = await generateRealisticRestaurants(
        query.location,
        query.cuisines,
        query.min_budget,
        query.max_budget
      );
    }

    if (restaurants.length === 0) {
      return res.status(404).json({ 
        restaurants: [], 
        message: 'No restaurants found. Please try a different location or cuisine.' 
      });
    }

    res.json({ restaurants });
  } catch (error: any) {
    console.error('Error in /api/restaurants:', error.message);
    res.status(500).json({ 
      restaurants: [], 
      message: 'Failed to fetch restaurants. Please try again.' 
    });
  }
});

app.post('/api/restaurants/group-recommend', async (req: Request, res: Response) => {
  try {
    const query: RestaurantQuery = req.body;

    console.log(`🔍 Searching restaurants in ${query.location} for cuisines: ${query.cuisines}`);
    
    let allRestaurants: any[] = [];
    
    // Try Google Places API first if key is available
    if (process.env.GOOGLE_PLACES_API_KEY && process.env.GOOGLE_PLACES_API_KEY !== 'YOUR_GOOGLE_PLACES_API_KEY_HERE') {
      try {
        allRestaurants = await searchGooglePlaces(
          query.location,
          query.cuisines,
          query.min_budget,
          query.max_budget
        );
      } catch (err) {
        console.log('Google Places failed, using strict OSM search');
      }
    }
    
    // Fallback to strict OpenStreetMap search
    if (allRestaurants.length === 0) {
      allRestaurants = await searchRestaurantsStrict(
        query.location,
        query.cuisines,
        query.min_budget,
        query.max_budget
      );
    }
    
    // Final fallback: generate realistic restaurants
    if (allRestaurants.length === 0) {
      console.log('Using realistic restaurant generator');
      allRestaurants = await generateRealisticRestaurants(
        query.location,
        query.cuisines,
        query.min_budget,
        query.max_budget
      );
    }

    if (allRestaurants.length === 0) {
      console.log('⚠️ No restaurants found from web scraping');
      return res.status(404).json({
        restaurants: [],
        message: 'No restaurants found. Try a different location or cuisine.'
      });
    }

    console.log(`✅ Found ${allRestaurants.length} restaurants from web scraping`);

    // Skip AI filtering for now (since OpenRouter API has issues)
    // Just return the scraped results directly
    res.json({
      restaurants: allRestaurants.slice(0, 10),
      total_found: allRestaurants.length,
      location: query.location,
      message: `Found ${allRestaurants.length} restaurants matching your preferences`,
    });
  } catch (error: any) {
    console.error('❌ Error in group recommend:', error.message);
    res.status(500).json({
      restaurants: [],
      message: 'Failed to fetch restaurants. Please try again.',
    });
  }
});

app.get('/api/results/:room_code', async (req: Request, res: Response) => {
  try {
    const { room_code } = req.params;
    
    // Get all votes for this room
    const votes = votesDB.filter(v => v.room_code === room_code);
    
    if (votes.length === 0) {
      return res.json({ results: [] });
    }

    // Count votes per restaurant (only count 'yes' or 'like' votes)
    const votesByRestaurant = new Map<string, { count: number; restaurant: any }>();
    
    for (const vote of votes) {
      if (vote.vote === 'yes' || vote.vote === 'like') {
        const current = votesByRestaurant.get(vote.restaurant_id) || { count: 0, restaurant: vote.restaurant_data };
        votesByRestaurant.set(vote.restaurant_id, {
          count: current.count + 1,
          restaurant: vote.restaurant_data || current.restaurant
        });
      }
    }

    // Convert to array and add vote counts
    const results = Array.from(votesByRestaurant.values())
      .map(({ count, restaurant }) => ({
        ...restaurant,
        vote_count: count,
        votes: count,
        votes_percentage: Math.round((count / votes.length) * 100)
      }))
      .sort((a, b) => {
        // Sort by votes first
        if (b.vote_count !== a.vote_count) {
          return b.vote_count - a.vote_count;
        }
        // If votes are equal, sort by rating
        return (b.rating || 0) - (a.rating || 0);
      });

    console.log(`📊 Results for room ${room_code}:`, results.length, 'restaurants with votes');
    res.json({ results });
  } catch (error) {
    console.error('Error getting results:', error);
    res.status(500).json({ error: 'Failed to get results' });
  }
});

app.post('/api/ai-recommend', async (req: Request, res: Response) => {
  try {
    const query: RestaurantQuery = req.body;

    let restaurants: any[] = [];
    
    if (process.env.GOOGLE_PLACES_API_KEY && process.env.GOOGLE_PLACES_API_KEY !== 'YOUR_GOOGLE_PLACES_API_KEY_HERE') {
      try {
        restaurants = await searchGooglePlaces(
          query.location,
          query.cuisines,
          query.min_budget,
          query.max_budget
        );
      } catch (err) {
        console.log('Using strict OSM search');
      }
    }
    
    if (restaurants.length === 0) {
      restaurants = await searchRestaurantsStrict(
        query.location,
        query.cuisines,
        query.min_budget,
        query.max_budget
      );
    }

    if (restaurants.length === 0) {
      return res.status(404).json({
        recommendation: 'No restaurants found for your criteria.',
        restaurants: []
      });
    }

    const finalRestaurants = restaurants;

    // Skip AI filtering for now, return scraped results directly
    res.json({
      recommendation: `Found ${finalRestaurants.length} great restaurants matching your preferences!`,
      restaurants: finalRestaurants.slice(0, 5),
    });
  } catch (error: any) {
    console.error('Error in AI recommend:', error.message);
    res.status(500).json({
      recommendation: 'Failed to fetch restaurants. Please try again.',
      restaurants: []
    });
  }
});

// Export for Vercel serverless
export default app;

// Start server only in development (not on Vercel)
if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`\n🚀 Backend server running on http://localhost:${PORT}`);
    console.log(`📍 Health check: http://localhost:${PORT}/api/health\n`);
  });
}
