import { Restaurant } from './types';

export const MOCK_RESTAURANTS: Restaurant[] = [
  {
    id: "rest_1",
    name: "Ramen Ichiraru",
    cuisine: "japanese",
    rating: 4.5,
    price_range: "$$",
    address: "123 Noodle Street, Downtown",
    photo: "https://images.unsplash.com/photo-1557872943-16a5ac26437e?w=800",
    menu_photos: [
      "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400",
      "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400"
    ],
    description: "Authentic Japanese ramen with rich, flavorful broths",
    distance: 0.8
  },
  {
    id: "rest_2",
    name: "Pizza Paradiso",
    cuisine: "italian",
    rating: 4.7,
    price_range: "$$",
    address: "456 Italian Way, Midtown",
    photo: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800",
    menu_photos: [
      "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400"
    ],
    description: "Wood-fired pizzas with fresh ingredients",
    distance: 1.2
  },
  {
    id: "rest_3",
    name: "Taco Fiesta",
    cuisine: "mexican",
    rating: 4.3,
    price_range: "$",
    address: "789 Spice Avenue, Uptown",
    photo: "https://images.unsplash.com/photo-1565299585323-38174c3b0d71?w=800",
    description: "Fresh tacos and authentic Mexican street food",
    distance: 0.5
  },
  {
    id: "rest_4",
    name: "Curry House",
    cuisine: "indian",
    rating: 4.6,
    price_range: "$$",
    address: "321 Spice Road, Downtown",
    photo: "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800",
    description: "Traditional Indian curries and tandoori dishes",
    distance: 1.5
  },
  {
    id: "rest_5",
    name: "Burger Junction",
    cuisine: "american",
    rating: 4.4,
    price_range: "$",
    address: "654 Main Street, Midtown",
    photo: "https://images.unsplash.com/photo-1550547660-d9450f859349?w=800",
    description: "Gourmet burgers and crispy fries",
    distance: 0.9
  },
  {
    id: "rest_6",
    name: "Dumpling Delight",
    cuisine: "chinese",
    rating: 4.5,
    price_range: "$$",
    address: "987 Chinatown Lane, Downtown",
    photo: "https://images.unsplash.com/photo-1496116218417-1a781b1c416c?w=800",
    description: "Handmade dumplings and authentic Chinese cuisine",
    distance: 1.1
  }
];
