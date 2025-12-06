# 🍽️ Eatadakimasu

> **"I don't know what to eat!"** - We've all been there. Let's just discuss and decide together.

Eatadakimasu is a social restaurant discovery app that helps you and your friends decide where to eat together. Whether you're dining solo or with a group, our app makes finding the perfect restaurant a fun, collaborative experience.

## 📖 About

Eatadakimasu solves the age-old problem of indecision when choosing where to eat. Instead of endless group chats and "I don't know, you decide" conversations, our app provides a structured, interactive way to discover and agree on restaurants.

**The Problem We Solve:**
- ❌ Endless back-and-forth messages trying to decide where to eat
- ❌ One person always having to make the decision
- ❌ Difficulty finding restaurants that satisfy everyone's preferences
- ❌ Not knowing what restaurants are available nearby
- ❌ The classic "I don't know, what do you want?" dilemma

**Our Solution:**
- ✅ Swipe through restaurants like Tinder - quick and fun
- ✅ Group mode where everyone votes on their favorites
- ✅ Real-time collaboration with friends
- ✅ Smart recommendations based on location, cuisine, and budget
- ✅ Automatic aggregation of votes to find the perfect match

## ✨ Features

### 🎯 Core Features

- **Solo Mode**: Find restaurants for yourself with personalized recommendations
- **Group Mode**: Create rooms and invite friends to vote together
- **Swipe Interface**: Tinder-like swiping experience for restaurant discovery
- **Real-time Voting**: See votes from all group members in real-time
- **Results Aggregation**: Automatically calculates the most popular restaurants based on votes
- **Smart Recommendations**: AI-powered restaurant suggestions based on:
  - Location (GPS or manual input)
  - Cuisine preferences
  - Budget range
  - Group preferences (in group mode)

### 👥 Social Features

- **Friend System**: Add friends by UID and manage your friend list
- **Friend Requests**: Send, accept, or reject friend requests
- **User Profiles**: 
  - Customizable profile with bio and location
  - Profile picture upload
  - Unique UID for easy friend discovery
- **Real-time Updates**: See when friends join rooms and vote

### 🎨 User Experience

- **Beautiful UI**: Modern, clean interface with smooth animations
- **Animated Food Emojis**: Playful falling food animations in the background
- **Haptic Feedback**: Tactile responses for better user interaction
- **Bottom Navigation**: Easy access to Home, Friends, and Profile
- **Responsive Design**: Works seamlessly on iOS, Android, and Web

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Expo CLI (will be installed with dependencies)
- Convex account (for backend database)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd eatadakimasu
   ```

2. **Install root dependencies**
   ```bash
   npm install
   ```

3. **Install frontend dependencies**
   ```bash
   cd frontend
   npm install
   ```

4. **Install backend dependencies**
   ```bash
   cd ../backend-ts
   npm install
   ```

5. **Set up Convex**
   ```bash
   cd ..
   npx convex dev
   ```
   This will:
   - Create a Convex account if you don't have one
   - Set up your Convex project
   - Sync your database schema
   - Generate TypeScript types

6. **Configure environment variables**
   
   Create a `.env` file in `backend-ts/`:
   ```env
   GOOGLE_PLACES_API_KEY=your_google_places_api_key_here
   PORT=8001
   ```

   Update `frontend/app.json` with your Convex URL:
   ```json
   {
     "extra": {
       "EXPO_PUBLIC_CONVEX_URL": "your_convex_url",
       "EXPO_PUBLIC_BACKEND_URL": "http://localhost:8001",
       "EXPO_PUBLIC_GOOGLE_CLIENT_ID": "your_google_client_id",
       "EXPO_PUBLIC_GOOGLE_PLACES_API_KEY": "your_google_places_api_key"
     }
   }
   ```

### Running the Application

1. **Start Convex (in project root)**
   ```bash
   npx convex dev
   ```
   Keep this running in a separate terminal.

2. **Start the backend server (in `backend-ts/`)**
   ```bash
   cd backend-ts
   npm run dev
   ```
   The backend will run on `http://localhost:8001`

3. **Start the frontend (in `frontend/`)**
   ```bash
   cd frontend
   npm start
   ```
   Or for web:
   ```bash
   npm run web
   ```

4. **Open the app**
   - Press `w` for web
   - Press `a` for Android emulator
   - Press `i` for iOS simulator
   - Scan QR code with Expo Go app on your phone

## 🛠️ Tech Stack

### Frontend
- **React Native** (0.81.4) - Cross-platform mobile framework
- **Expo** (^54.0.27) - Development platform and tooling
- **Expo Router** - File-based routing
- **TypeScript** - Type-safe development
- **React Native Reanimated** - Smooth animations
- **Lucide React Native** - Beautiful icons
- **Expo Image Picker** - Profile picture uploads
- **Expo Clipboard** - Copy UID functionality
- **Expo Haptics** - Tactile feedback

### Backend
- **Convex** (^1.30.0) - Real-time database and backend
  - Real-time queries and mutations
  - File storage for profile images
  - Automatic TypeScript type generation
- **Express.js** - REST API server
- **TypeScript** - Type-safe backend
- **Axios** - HTTP client
- **Cheerio** - Web scraping for restaurant data
- **Google Places API** - Restaurant search and location data
- **OpenStreetMap** - Fallback restaurant search

### Key Libraries
- **AsyncStorage** - Local data persistence
- **React Navigation** - Navigation system
- **Gesture Handler** - Swipe gestures

## 🎯 Why We Built This

**The Inspiration:**
Every day, millions of people face the same frustrating question: "What do you want to eat?" This simple question often leads to:
- 30-minute group chats with no decision
- One person feeling pressured to choose
- Settling for the same old places
- Missing out on great restaurants nearby

**Our Vision:**
We wanted to transform restaurant discovery from a chore into a fun, social experience. By combining:
- The addictive swiping mechanic (like Tinder)
- Real-time collaboration (like Google Docs)
- Smart recommendations (like Netflix)
- Social features (like Instagram)

We created a platform where deciding where to eat becomes as enjoyable as the meal itself.

**The "Let's Just Discuss" Philosophy:**
Instead of one person making all the decisions or endless back-and-forth, Eatadakimasu creates a structured discussion where:
- Everyone can see the same options
- Everyone can vote on what they like
- The app does the math to find the best match
- It's transparent, fair, and fun

## 💡 Impact

### For Users
- **Saves Time**: No more 30-minute debates about where to eat
- **Reduces Stress**: Takes the pressure off decision-making
- **Discovers New Places**: Finds restaurants you never knew existed
- **Improves Group Decisions**: Democratic voting ensures everyone's happy
- **Enhances Social Experience**: Makes planning meals with friends fun

### For Restaurants
- **Increased Visibility**: Helps local restaurants get discovered
- **Better Customer Matching**: Connects restaurants with customers who actually want their cuisine
- **Data Insights**: (Future) Can provide insights on what customers are looking for

### For Communities
- **Supports Local Businesses**: Helps users discover and support local restaurants
- **Reduces Food Waste**: Better matching means more satisfied customers
- **Builds Connections**: Brings friends together over shared dining experiences

## 📱 App Structure

```
eatadakimasu/
├── frontend/          # React Native Expo app
│   ├── app/           # Screen components
│   ├── components/    # Reusable UI components
│   └── convex/        # Convex type definitions
├── backend-ts/        # Express.js REST API
│   └── src/          # Backend server and scrapers
├── convex/           # Convex backend functions
│   ├── auth.ts       # Authentication
│   ├── friends.ts    # Friend system
│   ├── rooms.ts      # Room management
│   ├── votes.ts      # Voting system
│   └── schema.ts     # Database schema
└── package.json      # Root dependencies
```

## 🔑 Key Features Explained

### Solo Mode
Perfect for when you're dining alone or want to quickly find a restaurant. Simply:
1. Set your location
2. Choose your cuisine preferences
3. Set your budget
4. Swipe through recommendations
5. Get instant results

### Group Mode
Ideal for dining with friends:
1. Create a room and share the code
2. Friends join and set their preferences
3. Everyone swipes through the same restaurants
4. Votes are aggregated in real-time
5. See the top-rated restaurants everyone agreed on

### Friend System
- Add friends by their unique UID
- Send and manage friend requests
- See your friend list
- View friend profiles

### Profile Management
- Upload a profile picture
- Add a bio and location
- Share your UID with friends
- Customize your profile

## 🐛 Troubleshooting

### Convex Functions Not Found
If you see "Could not find public function" errors:
- Make sure `npx convex dev` is running
- Restart the Convex dev server
- Check for TypeScript errors that might prevent syncing

### Backend 404 Errors
If you see 404 errors when calling the API:
- Ensure the backend server is running on port 8001
- Check that `EXPO_PUBLIC_BACKEND_URL` is set correctly
- Restart your Expo app with `npx expo start --clear`

### Profile Images Not Showing
- Check that Convex file storage is working
- Verify the image was uploaded successfully
- Ensure friends are using the latest version of the app

## 📝 License

This project is part of a hackathon submission.

## 👥 Contributing

This is a hackathon project. Contributions and feedback are welcome!

## 🙏 Acknowledgments

- Built with ❤️ during a hackathon
- Inspired by the universal struggle of deciding where to eat
- Powered by amazing open-source technologies

---

**Made with 🍜 and 💻 for everyone who's ever said "I don't know, what do you want?"**
