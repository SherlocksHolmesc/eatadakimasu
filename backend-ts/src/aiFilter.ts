import axios from 'axios';

interface Restaurant {
  id: string;
  name: string;
  cuisine: string;
  rating: number;
  price_range: string;
  address?: string;
  phone?: string;
  image?: string;
  description?: string;
}

interface MemberPreference {
  userId: string;
  username: string;
  preferences: {
    cuisines: string[];
    priceRange: string;
  };
}

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || '';

export async function filterRestaurantsWithAI(
  restaurants: Restaurant[],
  memberPreferences: MemberPreference[],
  location: string
): Promise<Restaurant[]> {
  try {
    // Prepare restaurant data for AI
    const restaurantList = restaurants.map((r, idx) => 
      `${idx + 1}. ${r.name} - ${r.cuisine} cuisine, ${r.price_range}, Rating: ${r.rating}/5`
    ).join('\n');

    // Prepare member preferences summary
    const preferenceSummary = memberPreferences.map(m => 
      `- ${m.username}: prefers ${m.preferences.cuisines.join(', ')}, budget ${m.preferences.priceRange}`
    ).join('\n');

    // Create AI prompt
    const prompt = `You are a restaurant recommendation expert. Analyze these restaurants and rank the top 10 that best match the group's preferences.

Location: ${location}

Group Preferences:
${preferenceSummary}

Available Restaurants:
${restaurantList}

Instructions:
1. Consider cuisine preferences from all members
2. Balance price ranges to suit the group budget
3. Prioritize highly-rated restaurants
4. Consider variety - don't recommend too many similar restaurants
5. Return ONLY a JSON array of restaurant indices (1-based) in order of recommendation

Format: [1, 5, 3, 12, 8, 4, 15, 2, 9, 7]
Return ONLY the array, no explanations.`;

    console.log('Calling OpenRouter AI for restaurant filtering...');

    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: 'google/gemini-2.0-flash-exp:free',
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      },
      {
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const aiResponse = response.data.choices[0]?.message?.content || '[]';
    console.log('AI Response:', aiResponse);

    // Parse AI response
    const match = aiResponse.match(/\[[\d,\s]+\]/);
    if (!match) {
      console.warn('AI did not return valid array, using original order');
      return restaurants.slice(0, 10);
    }

    const rankedIndices: number[] = JSON.parse(match[0]);
    const rankedRestaurants: Restaurant[] = [];

    for (const idx of rankedIndices) {
      if (idx > 0 && idx <= restaurants.length) {
        rankedRestaurants.push(restaurants[idx - 1]);
      }
      if (rankedRestaurants.length >= 10) break;
    }

    console.log(`AI ranked ${rankedRestaurants.length} restaurants`);
    return rankedRestaurants;
  } catch (error: any) {
    console.error('Error in AI filtering:', error.message);
    // Fallback: return top-rated restaurants
    return restaurants
      .sort((a, b) => b.rating - a.rating)
      .slice(0, 10);
  }
}

export async function generateRestaurantSummary(restaurant: Restaurant): Promise<string> {
  try {
    const prompt = `Write a brief, enthusiastic 1-sentence description for this restaurant:
Name: ${restaurant.name}
Cuisine: ${restaurant.cuisine}
Rating: ${restaurant.rating}/5
Price: ${restaurant.price_range}

Make it appealing and mention what makes it special.`;

    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: 'google/gemini-2.0-flash-exp:free',
        messages: [{ role: 'user', content: prompt }],
      },
      {
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return response.data.choices[0]?.message?.content || restaurant.description || '';
  } catch (error) {
    return restaurant.description || `${restaurant.cuisine} restaurant with ${restaurant.rating}/5 rating`;
  }
}
