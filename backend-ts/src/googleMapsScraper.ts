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

const SERPAPI_KEY = process.env.SERPAPI_KEY || '';

// Convert budget in MYR to price range symbols
function budgetToPrice(minBudget: number, maxBudget: number): string {
  const avgBudget = (minBudget + maxBudget) / 2;
  if (avgBudget <= 20) return '$';
  if (avgBudget <= 40) return '$$';
  if (avgBudget <= 80) return '$$$';
  return '$$$$';
}

// Convert price range symbols back to MYR
function priceToMYR(priceRange: string): { min: number; max: number } {
  const ranges: Record<string, { min: number; max: number }> = {
    '$': { min: 10, max: 20 },
    '$$': { min: 20, max: 40 },
    '$$$': { min: 40, max: 80 },
    '$$$$': { min: 80, max: 150 },
  };
  return ranges[priceRange] || { min: 10, max: 50 };
}

export async function scrapeRestaurantsGoogleMaps(
  location: string,
  cuisines: string[],
  minBudgetMyr: number,
  maxBudgetMyr: number,
  radiusKm: number = 5
): Promise<Restaurant[]> {
  try {
    const priceRange = budgetToPrice(minBudgetMyr, maxBudgetMyr);
    const query = `${cuisines.join(' ')} restaurants in ${location}`;

    console.log(`Searching Google Maps: "${query}" with budget RM${minBudgetMyr}-${maxBudgetMyr}`);

    const response = await axios.get('https://serpapi.com/search.json', {
      params: {
        engine: 'google_maps',
        q: query,
        ll: '@3.1390,101.6869,12z', // Kuala Lumpur coordinates as default
        type: 'search',
        api_key: SERPAPI_KEY,
      },
    });

    const results = response.data.local_results || [];
    const restaurants: Restaurant[] = [];

    for (const result of results) {
      // Filter by price if available
      if (result.price) {
        const resultPrice = result.price.length || 2;
        const targetPrice = priceRange.length;
        if (Math.abs(resultPrice - targetPrice) > 1) continue;
      }

      // Determine cuisine from type or title
      let detectedCuisine = 'international';
      const lowerTitle = (result.title || '').toLowerCase();
      const lowerType = (result.type || '').toLowerCase();
      
      for (const cuisine of cuisines) {
        if (lowerTitle.includes(cuisine.toLowerCase()) || lowerType.includes(cuisine.toLowerCase())) {
          detectedCuisine = cuisine;
          break;
        }
      }

      restaurants.push({
        id: `gmap_${result.place_id || Math.random().toString(36).substr(2, 9)}`,
        name: result.title || 'Unknown Restaurant',
        cuisine: detectedCuisine,
        rating: result.rating || 4.0,
        price_range: result.price || priceRange,
        address: result.address || '',
        phone: result.phone || '',
        image: result.thumbnail || '',
        description: result.description || `${detectedCuisine} restaurant in ${location}`,
      });
    }

    console.log(`Found ${restaurants.length} restaurants from Google Maps`);
    return restaurants;
  } catch (error: any) {
    console.error('Error scraping Google Maps:', error.message);
    return [];
  }
}

export async function scrapeRestaurantDetails(placeId: string): Promise<Partial<Restaurant> | null> {
  try {
    const response = await axios.get('https://serpapi.com/search.json', {
      params: {
        engine: 'google_maps',
        type: 'place',
        place_id: placeId,
        api_key: SERPAPI_KEY,
      },
    });

    const place = response.data.place_results;
    if (!place) return null;

    return {
      image: place.photos?.[0]?.thumbnail || place.thumbnail,
      phone: place.phone,
      address: place.address,
      description: place.description || place.editorial_summary,
    };
  } catch (error: any) {
    console.error('Error fetching restaurant details:', error.message);
    return null;
  }
}
