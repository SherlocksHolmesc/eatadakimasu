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

// Fetch real food images from Unsplash (free API)
async function fetchCuisineImage(cuisine: string): Promise<string> {
  try {
    // Unsplash API (free tier: 50 requests/hour)
    const accessKey = process.env.UNSPLASH_ACCESS_KEY || 'demo';
    
    // Search terms for each cuisine
    const searchTerms: Record<string, string> = {
      'thai': 'thai food pad thai',
      'japanese': 'japanese sushi ramen',
      'chinese': 'chinese food dim sum',
      'korean': 'korean food bibimbap',
      'indian': 'indian food curry',
      'italian': 'italian pasta pizza',
      'mexican': 'mexican tacos',
      'american': 'burger fries',
      'french': 'french cuisine',
      'vietnamese': 'vietnamese pho',
    };
    
    const query = searchTerms[cuisine.toLowerCase()] || `${cuisine} food`;
    
    if (accessKey && accessKey !== 'demo') {
      const response = await axios.get('https://api.unsplash.com/photos/random', {
        params: {
          query,
          orientation: 'landscape',
        },
        headers: {
          'Authorization': `Client-ID ${accessKey}`,
        },
        timeout: 5000,
      });
      
      if (response.data && response.data.urls) {
        return response.data.urls.regular;
      }
    }
  } catch (error) {
    // Silently fail and use fallback
  }
  
  // Fallback to curated food images (no API key needed)
  return getCuisineImageFallback(cuisine);
}

// Fallback: Use direct Unsplash photo URLs (curated, no API needed)
function getCuisineImageFallback(cuisine: string): string {
  const cuisineImages: Record<string, string[]> = {
    'thai': [
      'https://images.unsplash.com/photo-1559314809-0d155014e29e?w=800',
      'https://images.unsplash.com/photo-1562565652-a0d8f0c59eb4?w=800',
      'https://images.unsplash.com/photo-1559314809-0d155014e29e?w=800',
    ],
    'japanese': [
      'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=800',
      'https://images.unsplash.com/photo-1583623025817-d180a2221d0a?w=800',
      'https://images.unsplash.com/photo-1553621042-f6e147245754?w=800',
    ],
    'chinese': [
      'https://images.unsplash.com/photo-1526318896980-cf78c088247c?w=800',
      'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=800',
      'https://images.unsplash.com/photo-1496116218417-1a781b1c416c?w=800',
    ],
    'korean': [
      'https://images.unsplash.com/photo-1498654896293-37aacf113fd9?w=800',
      'https://images.unsplash.com/photo-1590301157890-4810ed352733?w=800',
      'https://images.unsplash.com/photo-1580439052749-2e1e2c2abf42?w=800',
    ],
    'indian': [
      'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800',
      'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=800',
      'https://images.unsplash.com/photo-1574894709920-11b28e7367e3?w=800',
    ],
    'italian': [
      'https://images.unsplash.com/photo-1473093295043-cdd812d0e601?w=800',
      'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=800',
      'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800',
    ],
    'mexican': [
      'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=800',
      'https://images.unsplash.com/photo-1599974979949-785de17ce1f6?w=800',
      'https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=800',
    ],
  };
  
  const images = cuisineImages[cuisine.toLowerCase()] || [
    'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800',
  ];
  
  return images[Math.floor(Math.random() * images.length)];
}

function budgetToPriceRange(minBudget: number, maxBudget: number): string {
  const avgBudget = (minBudget + maxBudget) / 2;
  if (avgBudget < 20) return '$';
  if (avgBudget < 40) return '$$';
  if (avgBudget < 80) return '$$$';
  return '$$$$';
}

function generatePlaceholderImage(name: string, cuisine: string): string {
  const cuisineEmojis: Record<string, string> = {
    'thai': '🍜',
    'japanese': '🍱',
    'chinese': '🥢',
    'korean': '🍲',
    'indian': '🍛',
    'italian': '🍝',
    'mexican': '🌮',
    'american': '🍔',
    'french': '🥖',
    'vietnamese': '🥡',
  };
  
  const emoji = cuisineEmojis[cuisine.toLowerCase()] || '🍽️';
  const firstLetter = name.charAt(0).toUpperCase();
  
  return `data:image/svg+xml;base64,${Buffer.from(
    `<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
      <rect width="200" height="200" fill="#f5f5f5"/>
      <text x="50%" y="45%" font-size="60" text-anchor="middle">${emoji}</text>
      <text x="50%" y="75%" font-size="24" fill="#333" text-anchor="middle" font-weight="bold">${firstLetter}</text>
    </svg>`
  ).toString('base64')}`;
}

// Generate realistic restaurant names based on cuisine
function generateRestaurantNames(cuisine: string, count: number): string[] {
  const templates: Record<string, string[]> = {
    'thai': [
      'Thai Orchid', 'Siam Kitchen', 'Bangkok Street', 'Thai Spice', 'Golden Thai',
      'Thai Paradise', 'Mango Tree', 'Thai Smile', 'Lemongrass Thai', 'Thai Garden',
      'Pad Thai House', 'Thai Basil', 'Som Tam Kitchen', 'Thai Express', 'Thai Corner'
    ],
    'japanese': [
      'Sakura Sushi', 'Tokyo Kitchen', 'Ramen Ichiban', 'Sushi Paradise', 'Miyabi Japanese',
      'Zen Sushi', 'Osaka Kitchen', 'Matsu Japanese', 'Koi Sushi', 'Kyoto House',
      'Yaki Tori', 'Sushi Express', 'Tempura House', 'Bento Box', 'Teriyaki Palace'
    ],
    'chinese': [
      'Dragon Palace', 'Golden Wok', 'Jade Garden', 'Lucky Restaurant', 'Dim Sum House',
      'Peking Kitchen', 'Imperial Garden', 'Canton Express', 'Dynasty Restaurant', 'Red Lantern',
      'Ming Court', 'Shanghai Kitchen', 'Golden Dragon', 'Lotus Garden', 'Fortune Kitchen'
    ],
    'korean': [
      'Seoul Kitchen', 'K-BBQ House', 'Kimchi Paradise', 'Korean Garden', 'Bibimbap House',
      'Gangnam Kitchen', 'Korean Grill', 'Seoul Garden', 'Kimchi House', 'Korea Town',
      'BBQ Nation', 'Korean Express', 'Seoul Food', 'K-Kitchen', 'Bulgogi House'
    ],
    'indian': [
      'Taj Mahal', 'Curry House', 'Bombay Palace', 'Spice Garden', 'Masala Kitchen',
      'Mumbai Cafe', 'Tandoor House', 'Delhi Darbar', 'Spice Route', 'Indian Paradise',
      'Curry Express', 'Biryani House', 'Namaste India', 'Spice Box', 'Royal Indian'
    ],
    'italian': [
      'Bella Italia', 'Pasta Paradise', 'Trattoria', 'La Cucina', 'Pizza House',
      'Olive Garden', 'Roma Kitchen', 'Venice Restaurant', 'Mama Mia', 'Italian Corner',
      'Prego', 'Napoli Kitchen', 'Amore Italiano', 'Cucina Italiana', 'Casa Pasta'
    ],
    'mexican': [
      'Taco Fiesta', 'El Sombrero', 'Mexican Kitchen', 'Burrito Bar', 'Amigos Cantina',
      'Salsa House', 'Casa Mexico', 'Tequila Grill', 'Mexican Express', 'Nacho Paradise',
      'El Mariachi', 'Fiesta Mexicana', 'Taco House', 'Azteca Kitchen', 'Mexican Corner'
    ],
  };

  const names = templates[cuisine.toLowerCase()] || [
    `${cuisine} Kitchen`, `${cuisine} House`, `${cuisine} Paradise`, `${cuisine} Express`,
    `${cuisine} Corner`, `${cuisine} Garden`, `${cuisine} Palace`, `${cuisine} Grill`
  ];

  // Shuffle and return
  return names.sort(() => Math.random() - 0.5).slice(0, count);
}

// Generate realistic addresses for the EXACT location provided
function generateAddresses(location: string, count: number): string[] {
  // Common Malaysian address patterns
  const addressPatterns = [
    `No. {num}, Jalan {street}, ${location}`,
    `{num}, Jalan {street}, ${location}`,
    `Lot {lot}, ${location}`,
    `{num}, Persiaran {street}, ${location}`,
    `Block {block}, ${location}`,
    `{num}-{num2}, ${location}`,
    `Ground Floor, ${location}`,
    `Level {level}, ${location}`,
  ];
  
  const streetNames = ['Utama', 'Maju', 'Sentosa', 'Indah', 'Harmoni', 'Sri', 'Bestari', 'Putra', 'Cemerlang', 'Gemilang'];
  const addresses: string[] = [];
  
  for (let i = 0; i < count; i++) {
    const pattern = addressPatterns[Math.floor(Math.random() * addressPatterns.length)];
    const num = Math.floor(Math.random() * 200) + 1;
    const num2 = num + Math.floor(Math.random() * 3) + 1;
    const lot = `G-${Math.floor(Math.random() * 50) + 1}`;
    const block = String.fromCharCode(65 + Math.floor(Math.random() * 5)); // A-E
    const level = Math.floor(Math.random() * 3) + 1;
    const street = streetNames[Math.floor(Math.random() * streetNames.length)];
    
    let address = pattern
      .replace('{num}', String(num))
      .replace('{num2}', String(num2))
      .replace('{lot}', lot)
      .replace('{block}', block)
      .replace('{level}', String(level))
      .replace('{street}', street);
    
    addresses.push(address);
  }
  
  return addresses;
}

export async function generateRealisticRestaurants(
  location: string,
  cuisines: string[],
  minBudget: number,
  maxBudget: number
): Promise<Restaurant[]> {
  try {
    console.log(`🎯 Generating realistic ${cuisines.join(', ')} restaurants`);
    console.log(`📍 Location: ${location} (ALL restaurants will be at this location)`);
    
    const restaurants: Restaurant[] = [];
    const restaurantsPerCuisine = Math.ceil(15 / cuisines.length);

    for (const cuisine of cuisines) {
      const names = generateRestaurantNames(cuisine, restaurantsPerCuisine);
      const addresses = generateAddresses(location, restaurantsPerCuisine);
      const priceRange = budgetToPriceRange(minBudget, maxBudget);

      // Get cuisine-specific images
      const cuisineImage = getCuisineImageFallback(cuisine);

      for (let i = 0; i < names.length; i++) {
        const rating = 3.8 + Math.random() * 1.2; // 3.8 to 5.0
        
        restaurants.push({
          id: `gen_${cuisine}_${i}_${Date.now()}`,
          name: names[i],
          cuisine: cuisine.toLowerCase(),
          rating: Math.round(rating * 10) / 10,
          price_range: priceRange,
          address: addresses[i],
          photo: cuisineImage, // Use real food image
          description: `Authentic ${cuisine} cuisine at ${location}`,
        });
      }
    }

    // Shuffle for variety
    const shuffled = restaurants.sort(() => Math.random() - 0.5);
    
    console.log(`✅ Generated ${shuffled.length} realistic restaurants`);
    console.log(`   Cuisines: ${cuisines.join(', ')}`);
    console.log(`   Location: ${location}`);
    
    return shuffled;

  } catch (error: any) {
    console.error('❌ Generation error:', error.message);
    return [];
  }
}
