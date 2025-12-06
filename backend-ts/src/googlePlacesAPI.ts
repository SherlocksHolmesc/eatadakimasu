import axios from 'axios';

interface Restaurant {
  id: string;
  name: string;
  cuisine: string;
  rating: number;
  price_range: string;
  address: string;
  photo: string;
  description: string;
}

// Convert Google price level to our format
function priceLevelToRange(priceLevel?: number): string {
  if (!priceLevel) return '$$';
  if (priceLevel === 1) return '$';
  if (priceLevel === 2) return '$$';
  if (priceLevel === 3) return '$$$';
  return '$$$$';
}

// Generate placeholder image
function generatePlaceholderImage(name: string): string {
  const firstLetter = name.charAt(0).toUpperCase();
  return `data:image/svg+xml;base64,${Buffer.from(
    `<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
      <rect width="200" height="200" fill="#f0f0f0"/>
      <text x="50%" y="50%" font-size="48" fill="#666" text-anchor="middle" dy=".3em">${firstLetter}</text>
      <text x="50%" y="75%" font-size="12" fill="#999" text-anchor="middle">${name.substring(0, 20)}</text>
    </svg>`
  ).toString('base64')}`;
}

// Extract cuisine from place types and name
function extractCuisine(types: string[], name: string, cuisineFilter: string[]): string {
  // First, try to match with user's requested cuisines
  if (cuisineFilter && cuisineFilter.length > 0) {
    for (const cuisine of cuisineFilter) {
      const cuisineLower = cuisine.toLowerCase();
      // Check if name or types contain the cuisine
      if (name.toLowerCase().includes(cuisineLower)) {
        return cuisine.toLowerCase();
      }
      // Check specific cuisine keywords in types
      if (types.some(t => t.toLowerCase().includes(cuisineLower))) {
        return cuisine.toLowerCase();
      }
    }
  }

  // Fallback: try to detect cuisine from types
  const cuisineMap: Record<string, string> = {
    'japanese': 'japanese',
    'chinese': 'chinese',
    'thai': 'thai',
    'korean': 'korean',
    'indian': 'indian',
    'italian': 'italian',
    'mexican': 'mexican',
    'french': 'french',
    'vietnamese': 'vietnamese',
    'american': 'american',
  };

  for (const type of types) {
    const typeLower = type.toLowerCase();
    for (const [key, value] of Object.entries(cuisineMap)) {
      if (typeLower.includes(key)) {
        return value;
      }
    }
  }

  // Check name for cuisine keywords
  const nameLower = name.toLowerCase();
  for (const [key, value] of Object.entries(cuisineMap)) {
    if (nameLower.includes(key)) {
      return value;
    }
  }

  return 'restaurant';
}

export async function searchGooglePlaces(
  location: string,
  cuisines: string[],
  minBudget: number,
  maxBudget: number
): Promise<Restaurant[]> {
  try {
    const apiKey = process.env.GOOGLE_PLACES_API_KEY;
    
    if (!apiKey) {
      console.error('❌ GOOGLE_PLACES_API_KEY not set in environment');
      throw new Error('Google Places API key not configured');
    }

    console.log(`🔍 Searching Google Places for: ${cuisines.join(', ')} restaurants in ${location}`);

    // Step 1: Geocode the location to get coordinates
    const geocodeUrl = 'https://maps.googleapis.com/maps/api/geocode/json';
    const geocodeResponse = await axios.get(geocodeUrl, {
      params: {
        address: location,
        key: apiKey,
      },
    });

    if (!geocodeResponse.data.results || geocodeResponse.data.results.length === 0) {
      console.error('❌ Could not geocode location:', location);
      return [];
    }

    const { lat, lng } = geocodeResponse.data.results[0].geometry.location;
    const formattedAddress = geocodeResponse.data.results[0].formatted_address;
    console.log(`📍 Found location: ${formattedAddress} (${lat}, ${lng})`);

    // Step 2: Search for restaurants using Places Nearby Search
    const restaurants: Restaurant[] = [];

    // Search for each cuisine type separately to get accurate results
    for (const cuisine of cuisines) {
      const placesUrl = 'https://maps.googleapis.com/maps/api/place/nearbysearch/json';
      
      const searchResponse = await axios.get(placesUrl, {
        params: {
          location: `${lat},${lng}`,
          radius: 3000, // 3km radius for better coverage
          type: 'restaurant',
          keyword: `${cuisine} restaurant`,
          key: apiKey,
        },
      });

      console.log(`🍽️ Found ${searchResponse.data.results?.length || 0} ${cuisine} restaurants`);

      if (searchResponse.data.results) {
        for (const place of searchResponse.data.results) {
          // STRICT FILTERING: Only include if it matches the cuisine
          const detectedCuisine = extractCuisine(place.types || [], place.name, [cuisine]);
          
          // Skip if cuisine doesn't match what we're looking for
          if (!detectedCuisine.toLowerCase().includes(cuisine.toLowerCase()) &&
              !cuisine.toLowerCase().includes(detectedCuisine.toLowerCase()) &&
              !place.name.toLowerCase().includes(cuisine.toLowerCase())) {
            continue;
          }

          const priceRange = priceLevelToRange(place.price_level);
          
          // Get REAL restaurant photo from Google Places
          let imageUrl = generatePlaceholderImage(place.name);
          if (place.photos && place.photos[0] && place.photos[0].photo_reference) {
            // Use Google Places Photo API for REAL restaurant images
            imageUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photo_reference=${place.photos[0].photo_reference}&key=${apiKey}`;
            console.log(`📸 Photo URL: ${imageUrl.substring(0, 100)}...`);
          } else {
            console.log(`⚠️ No photo available for ${place.name}, using placeholder`);
          }

          restaurants.push({
            id: place.place_id,
            name: place.name,
            cuisine: cuisine.toLowerCase(), // Use the requested cuisine
            rating: place.rating || 4.0,
            price_range: priceRange,
            address: place.vicinity || formattedAddress,
            photo: imageUrl, // REAL photo from Google
            description: `${place.name} - ${cuisine} restaurant in ${location}`,
          });
        }
      }
    }

    // Remove duplicates by place_id
    const unique = Array.from(
      new Map(restaurants.map(r => [r.id, r])).values()
    );

    // Shuffle to provide variety
    const shuffled = unique.sort(() => Math.random() - 0.5);

    console.log(`✅ Returning ${shuffled.length} restaurants matching cuisines: ${cuisines.join(', ')}`);
    return shuffled;

  } catch (error: any) {
    console.error('❌ Google Places API error:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
    throw error;
  }
}
