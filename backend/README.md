# Eatadakimasu Backend

TypeScript/Express backend for the Eatadakimasu food recommendation app.

## Features

- RESTful API for room management (create, join, get)
- Member preferences management
- Restaurant filtering with AI (using OpenRouter + Google Gemini 2.0 Flash)
- Web scraping support (Google Maps - placeholder for now)
- In-memory storage (no database required)
- Vote tracking for restaurant selection

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file (copy from `.env.example`):
```bash
cp .env.example .env
```

3. Add your OpenRouter API key to `.env`:
```
OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

4. Run the development server:
```bash
npm run dev
```

The server will start on `http://localhost:8081` (or the port specified in `.env`).

## API Endpoints

### Health Check
- `GET /api/health` - Check if the server is running

### Rooms
- `POST /api/rooms/create` - Create a new room
- `POST /api/rooms/join` - Join an existing room
- `GET /api/rooms/:roomCode` - Get room details
- `POST /api/rooms/:roomId/preferences` - Update member preferences
- `GET /api/rooms/:roomId/restaurants` - Get filtered restaurants for a room

### Votes
- `POST /api/votes` - Submit a vote (like/dislike) for a restaurant
- `GET /api/rooms/:roomId/results` - Get voting results

## Development

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run type-check` - Type check without building

## Notes

- Currently uses mock restaurant data. Web scraping from Google Maps is a placeholder.
- AI filtering requires an OpenRouter API key. Without it, the app will use basic filtering.
- All data is stored in-memory and will be lost on server restart.
