import axios from 'axios';

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || '';
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

export interface Restaurant {
  id: string;
  name: string;
  cuisine: string;
  rating: number;
  price_range: string;
  address: string;
  photo: string;
  description?: string;
}

export interface Preferences {
  cuisines: string[];
  distance: number;
  priceRange: string;
  location?: string;
}

/**
 * Uses OpenRouter with Google Gemini 2.0 Flash to filter restaurants
 * based on user preferences
 */
export async function filterRestaurantsWithAI(
  restaurants: Restaurant[],
  preferences: Preferences
): Promise<Restaurant[]> {
  if (!OPENROUTER_API_KEY) {
    console.warn('OPENROUTER_API_KEY not set, skipping AI filtering');
    return restaurants;
  }

  try {
    // Create a prompt for the AI
    const prompt = `You are a restaurant recommendation assistant. Given the following restaurants and user preferences, filter and rank the restaurants that best match the user's preferences.

User Preferences:
- Cuisines: ${preferences.cuisines.join(', ')}
- Price Range: ${preferences.priceRange}
- Location: ${preferences.location || 'Not specified'}
- Maximum Distance: ${preferences.distance} miles

Restaurants:
${restaurants.map((r, i) => 
  `${i + 1}. ${r.name} (${r.cuisine}) - Rating: ${r.rating}/5, Price: ${r.price_range}, Address: ${r.address}${r.description ? `, Description: ${r.description}` : ''}`
).join('\n')}

Please return a JSON array of restaurant IDs (just the IDs, like ["rest_1", "rest_2"]) that best match the user's preferences, ranked from best to worst match. Only include restaurants that are a good fit. Return ONLY the JSON array, no other text.`;

    const response = await axios.post(
      OPENROUTER_API_URL,
      {
        model: 'google/gemini-2.0-flash-exp:free',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 500
      },
      {
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'http://localhost:8081',
          'X-Title': 'Eatadakimasu'
        }
      }
    );

    const content = response.data.choices[0]?.message?.content || '';
    
    // Extract JSON array from response
    let filteredIds: string[] = [];
    try {
      // Try to parse the content as JSON
      const jsonMatch = content.match(/\[.*?\]/s);
      if (jsonMatch) {
        filteredIds = JSON.parse(jsonMatch[0]);
      }
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
      // If parsing fails, return all restaurants
      return restaurants;
    }

    // Filter restaurants based on AI-selected IDs
    const filtered = restaurants.filter(r => filteredIds.includes(r.id));
    
    // If AI didn't return good results, return original list
    if (filtered.length === 0) {
      console.warn('AI filtering returned no results, using original list');
      return restaurants;
    }

    // Reorder based on AI ranking
    const ordered = filteredIds
      .map(id => filtered.find(r => r.id === id))
      .filter((r): r is Restaurant => r !== undefined);

    return ordered;
  } catch (error: any) {
    console.error('Error filtering restaurants with AI:', error.response?.data || error.message);
    // Return original list if AI filtering fails
    return restaurants;
  }
}
