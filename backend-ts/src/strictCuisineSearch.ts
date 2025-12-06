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

function budgetToPriceRange(minBudget: number, maxBudget: number): string {
  const avgBudget = (minBudget + maxBudget) / 2;
  if (avgBudget < 20) return '$';
  if (avgBudget < 40) return '$$';
  if (avgBudget < 80) return '$$$';
  return '$$$$';
}

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

async function getCoordinates(location: string): Promise<{ lat: number; lon: number } | null> {
  try {
    let searchQuery = location;
    if (!location.toLowerCase().includes('malaysia')) {
      searchQuery = `${location}, Kuala Lumpur, Malaysia`;
    }
    
    console.log(`📍 Geocoding: "${searchQuery}"`);
    
    const response = await axios.get('https://nominatim.openstreetmap.org/search', {
      params: {
        q: searchQuery,
        format: 'json',
        limit: 1,
      },
      headers: {
        'User-Agent': 'EatadakimasuApp/1.0',
      },
      timeout: 10000,
    });

    if (response.data && response.data.length > 0) {
      return {
        lat: parseFloat(response.data[0].lat),
        lon: parseFloat(response.data[0].lon),
      };
    }
    return null;
  } catch (error: any) {
    console.error('Geocoding error:', error.message);
    return null;
  }
}

export async function searchRestaurantsStrict(
  location: string,
  cuisines: string[],
  minBudget: number,
  maxBudget: number
): Promise<Restaurant[]> {
  try {
    const coords = await getCoordinates(location);
    if (!coords) {
      console.log('❌ Could not find coordinates');
      return [];
    }

    console.log(`📍 Coordinates: ${coords.lat}, ${coords.lon}`);
    
    const restaurants: Restaurant[] = [];
    
    // Search for EACH cuisine separately with STRICT matching
    for (const cuisine of cuisines) {
      console.log(`🔍 Searching for ${cuisine} restaurants...`);
      
      // Build Overpass query for this specific cuisine
      const cuisineLower = cuisine.toLowerCase();
      const radius = 3000;
      
      const overpassQuery = `
        [out:json][timeout:25];
        (
          node["amenity"="restaurant"]["cuisine"~"${cuisineLower}",i](around:${radius},${coords.lat},${coords.lon});
          way["amenity"="restaurant"]["cuisine"~"${cuisineLower}",i](around:${radius},${coords.lat},${coords.lon});
        );
        out body;
      `;

      try {
        const response = await axios.post(
          'https://overpass-api.de/api/interpreter',
          overpassQuery,
          {
            headers: { 'Content-Type': 'text/plain' },
            timeout: 30000,
          }
        );

        const elements = response.data.elements || [];
        console.log(`   Found ${elements.length} ${cuisine} restaurants`);

        for (const element of elements) {
          if (!element.tags || !element.tags.name) continue;

          const cuisineTag = element.tags.cuisine || '';
          
          // STRICT: Only include if cuisine tag matches what we searched for
          if (!cuisineTag.toLowerCase().includes(cuisineLower)) continue;

          const name = element.tags.name;
          const address = [
            element.tags['addr:street'],
            element.tags['addr:city'] || location,
          ].filter(Boolean).join(', ') || location;

          restaurants.push({
            id: `osm_${element.id}`,
            name,
            cuisine: cuisineLower, // Use the exact cuisine we searched for
            rating: 4.0 + Math.random() * 1.0,
            price_range: budgetToPriceRange(minBudget, maxBudget),
            address,
            photo: generatePlaceholderImage(name),
            description: `${name} - ${cuisine} restaurant`,
          });

          if (restaurants.length >= 20) break;
        }
      } catch (err: any) {
        console.error(`   Error searching ${cuisine}:`, err.message);
      }
    }

    // Shuffle for variety
    const shuffled = restaurants.sort(() => Math.random() - 0.5);
    
    console.log(`✅ Total restaurants found: ${shuffled.length}`);
    return shuffled.slice(0, 20);

  } catch (error: any) {
    console.error('❌ Search error:', error.message);
    return [];
  }
}
