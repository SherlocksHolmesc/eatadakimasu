export interface Restaurant {
  id: string;
  name: string;
  cuisine: string;
  rating: number;
  price_range: string;
  address: string;
  photo: string;
  menu_photos?: string[];
  description?: string;
  distance?: number;
}

export interface Preferences {
  cuisines: string[];
  distance: number;
  priceRange: string;
  location?: string;
}

export interface Room {
  id: string;
  roomCode: string;
  mode: 'solo' | 'group';
  members: Member[];
  status: 'waiting' | 'preferences' | 'swiping' | 'results';
  createdAt: string;
}

export interface Member {
  userId: string;
  username: string;
  preferences?: Preferences;
}

export interface Vote {
  roomId: string;
  userId: string;
  restaurantId: string;
  vote: 'like' | 'dislike';
}
