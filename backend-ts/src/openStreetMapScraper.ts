import axios from 'axios';

interface Restaurant {
  id: string;
  name: string;
  cuisine: string;
  rating: number;
  price_range: string;
  address: string;
  image: string;
  description: string;
}

// Convert budget to price range
function budgetToPriceRange(minBudget: number, maxBudget: number): string {
  const avgBudget = (minBudget + maxBudget) / 2;
  if (avgBudget < 20) return '$';
  if (avgBudget < 40) return '$$';
  if (avgBudget < 80) return '$$$';
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

// Calculate distance between two coordinates in km
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Get coordinates from location name using Nominatim
async function getCoordinates(location: string): Promise<{ lat: number; lon: number; displayName: string } | null> {
  try {
    // Add "Kuala Lumpur Malaysia" to make search more specific if not already included
    let searchQuery = location;
    if (!location.toLowerCase().includes('malaysia') && !location.toLowerCase().includes('kuala lumpur')) {
      searchQuery = `${location}, Kuala Lumpur, Malaysia`;
    }
    
    console.log(`🔎 Geocoding: "${location}" → searching for "${searchQuery}"`);
    
    // Try specific search first (for malls, landmarks, specific locations)
    const response = await axios.get('https://nominatim.openstreetmap.org/search', {
      params: {
        q: searchQuery,
        format: 'json',
        limit: 10, // Get more results to find the best match
        addressdetails: 1,
      },
      headers: {
        'User-Agent': 'EatadakimasuApp/1.0',
      },
      timeout: 10000,
    });

    if (response.data && response.data.length > 0) {
      // Prioritize results that are more specific (amenity, building, shop over city)
      let bestMatch = response.data[0];
      
      // Look for more specific matches (malls, buildings, specific places)
      for (const result of response.data) {
        const display = result.display_name.toLowerCase();
        const originalLocation = location.toLowerCase();
        
        // Strong match: exact name in display name
        if (display.includes(originalLocation.replace(/\s+/g, ' '))) {
          // Prefer specific types over generic city
          if (
            result.type !== 'city' &&
            result.type !== 'state' &&
            (result.type === 'mall' ||
             result.type === 'building' ||
             result.type === 'retail' ||
             result.class === 'amenity' ||
             result.class === 'shop' ||
             result.class === 'building')
          ) {
            bestMatch = result;
            break;
          }
        }
      }

      console.log(`📍 Using location: ${bestMatch.display_name}`);
      console.log(`📍 Type: ${bestMatch.type}, Class: ${bestMatch.class}`);
      
      return {
        lat: parseFloat(bestMatch.lat),
        lon: parseFloat(bestMatch.lon),
        displayName: bestMatch.display_name,
      };
    }
    return null;
  } catch (error: any) {
    console.error('Error getting coordinates:', error.message);
    return null;
  }
}

// Search restaurants using Overpass API (OpenStreetMap)
export async function scrapeOpenStreetMap(
  location: string,
  cuisines: string[],
  minBudget: number,
  maxBudget: number
): Promise<Restaurant[]> {
  try {
    console.log(`🗺️ Searching OpenStreetMap for restaurants in ${location}`);

    // Get coordinates for the location
    const coords = await getCoordinates(location);
    if (!coords) {
      console.log('❌ Could not find coordinates for location');
      return [];
    }

    console.log(`📍 Found coordinates: ${coords.lat}, ${coords.lon}`);
    console.log(`🎯 Location: ${coords.displayName}`);

    // Use smaller radius for specific locations (malls, buildings) vs general city searches
    const isSpecificLocation = coords.displayName.toLowerCase().includes('mall') ||
                                coords.displayName.toLowerCase().includes('utama') ||
                                coords.displayName.toLowerCase().includes('trx') ||
                                coords.displayName.toLowerCase().includes('exchange') ||
                                coords.displayName.toLowerCase().includes('pavilion');
    
    const radius = isSpecificLocation ? 1000 : 3000; // 1km for specific places, 3km for general areas
    console.log(`🔍 Search radius: ${radius}m (${isSpecificLocation ? 'specific location' : 'general area'})`);
    
    const overpassQuery = `
      [out:json][timeout:25];
      (
        node["amenity"="restaurant"](around:${radius},${coords.lat},${coords.lon});
        way["amenity"="restaurant"](around:${radius},${coords.lat},${coords.lon});
      );
      out body;
      >;
      out skel qt;
    `;

    const response = await axios.post(
      'https://overpass-api.de/api/interpreter',
      overpassQuery,
      {
        headers: {
          'Content-Type': 'text/plain',
        },
        timeout: 30000,
      }
    );

    const restaurants: Restaurant[] = [];
    const elements = response.data.elements || [];

    console.log(`📊 Found ${elements.length} restaurant nodes from OSM`);

    // Shuffle elements to get different results each time
    const shuffledElements = elements.sort(() => Math.random() - 0.5);

    for (const element of shuffledElements) {
      if (!element.tags || !element.tags.name) continue;

      const name = element.tags.name;
      // FIX: Don't default to user's cuisine if tag is missing - use actual tag or "Asian"
      const cuisineTag = element.tags.cuisine || 'asian';
      const addressTags = element.tags;

      // Build address from OSM tags - include more location details
      const addressParts = [
        addressTags['addr:housenumber'],
        addressTags['addr:street'],
        addressTags['addr:suburb'] || addressTags['addr:neighbourhood'],
        addressTags['addr:city'],
      ].filter(Boolean);
      
      // If address is too generic, try to include landmark/mall info from element location
      let address = addressParts.length > 0 ? addressParts.join(', ') : '';
      
      // Try to extract nearby landmark or mall info
      if (!address || addressParts.length < 2) {
        // Use the general location as address
        address = coords.displayName.split(',').slice(0, 3).join(',').trim();
      }
      
      // Add distance info if coordinates available
      if (element.lat && element.lon) {
        const distance = calculateDistance(coords.lat, coords.lon, element.lat, element.lon);
        if (distance < 1) {
          address = `${Math.round(distance * 1000)}m away - ${address}`;
        } else {
          address = `${distance.toFixed(1)}km away - ${address}`;
        }
      }

      // LESS STRICT FILTERING - accept more variety
      let cuisineScore = 0;
      if (cuisines.length > 0) {
        // Give higher score to exact matches, but don't exclude non-matches
        const exactMatch = cuisines.some(c =>
          cuisineTag.toLowerCase().includes(c.toLowerCase()) ||
          c.toLowerCase().includes(cuisineTag.toLowerCase()) ||
          name.toLowerCase().includes(c.toLowerCase())
        );
        
        cuisineScore = exactMatch ? 2 : 1; // Prefer matches but include variety
      }

      const priceRange = budgetToPriceRange(minBudget, maxBudget);
      const rating = 4.0 + Math.random() * 1.0; // Random rating between 4.0-5.0

      restaurants.push({
        id: `osm_${element.id}`,
        name,
        cuisine: cuisineTag.split(';')[0], // Take first cuisine if multiple
        rating: Math.round(rating * 10) / 10,
        price_range: priceRange,
        address,
        image: generatePlaceholderImage(name),
        description: `${name} - ${cuisineTag} cuisine in ${location}`,
        cuisineScore, // Store score for sorting
      } as any);

      if (restaurants.length >= 50) break; // Get more restaurants for variety
    }

    // Sort by cuisine score (prefer matches) but keep randomization
    const sorted = restaurants.sort((a: any, b: any) => {
      if (a.cuisineScore === b.cuisineScore) return Math.random() - 0.5;
      return b.cuisineScore - a.cuisineScore;
    });

    // Remove the score field before returning
    const final = sorted.slice(0, 20).map(r => {
      const { cuisineScore, ...rest } = r as any;
      return rest;
    });

    console.log(`✅ Extracted ${final.length} restaurants from OSM`);
    return final;

  } catch (error: any) {
    console.error('❌ OpenStreetMap scraping error:', error.message);
    return [];
  }
}

// Fallback: Use Foursquare Places API (free tier, no API key for basic search)
export async function scrapeFoursquarePlaces(
  location: string,
  cuisines: string[],
  minBudget: number,
  maxBudget: number
): Promise<Restaurant[]> {
  try {
    // Get coordinates first
    const coords = await getCoordinates(location);
    if (!coords) return [];

    console.log(`🔍 Searching Foursquare for restaurants near ${coords.lat},${coords.lon}`);

    // Note: This is a simplified version. Real implementation would need Foursquare API key
    // For now, return empty to fall back to OSM
    return [];

  } catch (error: any) {
    console.error('❌ Foursquare error:', error.message);
    return [];
  }
}

// Combined scraper
export async function scrapeRestaurantsNoAPI(
  location: string,
  cuisines: string[],
  minBudget: number,
  maxBudget: number
): Promise<Restaurant[]> {
  // Try OpenStreetMap first (100% free, no API key)
  const osmResults = await scrapeOpenStreetMap(location, cuisines, minBudget, maxBudget);
  
  if (osmResults.length > 0) {
    return osmResults;
  }

  // If OSM fails, try other free sources
  const foursquareResults = await scrapeFoursquarePlaces(location, cuisines, minBudget, maxBudget);
  
  return [...osmResults, ...foursquareResults];
}
