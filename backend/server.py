from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel
from typing import List, Optional
import os
import random
import string
from datetime import datetime
from dotenv import load_dotenv
from emergentintegrations.llm.chat import LlmChat, UserMessage
import asyncio

# Load environment variables
load_dotenv()

app = FastAPI()

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# MongoDB connection
MONGO_URL = os.getenv("MONGO_URL")
DB_NAME = os.getenv("DB_NAME")
EMERGENT_LLM_KEY = os.getenv("EMERGENT_LLM_KEY")

client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

# Collections
rooms_collection = db["rooms"]
votes_collection = db["votes"]

# Mock restaurant data with base64 placeholder images
MOCK_RESTAURANTS = [
    {
        "id": "rest_1",
        "name": "Ramen Ichiraru",
        "cuisine": "japanese",
        "rating": 4.5,
        "price_range": "$$",
        "address": "123 Noodle Street, Downtown",
        "photo": "https://images.unsplash.com/photo-1557872943-16a5ac26437e?w=800",
        "menu_photos": [
            "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800",
            "https://images.unsplash.com/photo-1617093727343-374698b1b08d?w=800"
        ]
    },
    {
        "id": "rest_2",
        "name": "Pizzen Ichirasu",
        "cuisine": "italian",
        "rating": 4.3,
        "price_range": "$$",
        "address": "456 Pizza Avenue, Midtown",
        "photo": "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800",
        "menu_photos": [
            "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800"
        ]
    },
    {
        "id": "rest_3",
        "name": "Taco Fiesta",
        "cuisine": "mexican",
        "rating": 4.7,
        "price_range": "$",
        "address": "789 Taco Lane, West End",
        "photo": "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=800",
        "menu_photos": [
            "https://images.unsplash.com/photo-1599974579688-8dbdd335c77f?w=800"
        ]
    },
    {
        "id": "rest_4",
        "name": "Curry Palace",
        "cuisine": "indian",
        "rating": 4.6,
        "price_range": "$$",
        "address": "321 Spice Road, East Side",
        "photo": "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800",
        "menu_photos": [
            "https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?w=800"
        ]
    },
    {
        "id": "rest_5",
        "name": "Burger Barn",
        "cuisine": "american",
        "rating": 4.2,
        "price_range": "$",
        "address": "654 Burger Boulevard, North Quarter",
        "photo": "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800",
        "menu_photos": [
            "https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?w=800"
        ]
    },
    {
        "id": "rest_6",
        "name": "Dim Sum Delight",
        "cuisine": "chinese",
        "rating": 4.8,
        "price_range": "$$",
        "address": "987 Dumpling Drive, Chinatown",
        "photo": "https://images.unsplash.com/photo-1563245372-f21724e3856d?w=800",
        "menu_photos": [
            "https://images.unsplash.com/photo-1496116218417-1a781b1c416c?w=800"
        ]
    },
    {
        "id": "rest_7",
        "name": "Sushi Station",
        "cuisine": "japanese",
        "rating": 4.9,
        "price_range": "$$$",
        "address": "111 Sushi Street, Harbor",
        "photo": "https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=800",
        "menu_photos": [
            "https://images.unsplash.com/photo-1583623025817-d180a2221d0a?w=800"
        ]
    },
    {
        "id": "rest_8",
        "name": "Pasta Perfetto",
        "cuisine": "italian",
        "rating": 4.4,
        "price_range": "$$",
        "address": "222 Pasta Place, Little Italy",
        "photo": "https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=800",
        "menu_photos": [
            "https://images.unsplash.com/photo-1612874742237-6526221588e3?w=800"
        ]
    }
]

# Pydantic models
class RoomCreate(BaseModel):
    mode: str  # "solo" or "group"

class RoomJoin(BaseModel):
    room_code: str

class PreferencesSave(BaseModel):
    room_code: str
    location: str
    cuisines: List[str]
    min_budget: int
    max_budget: int

class Vote(BaseModel):
    room_code: str
    user_id: str
    restaurant_id: str
    vote: str  # "yes" or "no"

class RestaurantQuery(BaseModel):
    cuisines: List[str]
    min_budget: int
    max_budget: int
    location: str

# Helper functions
def generate_room_code():
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))

def filter_restaurants(cuisines: List[str], min_budget: int, max_budget: int):
    """Filter mock restaurants based on preferences"""
    filtered = []
    
    # Map price range to budget
    price_to_budget = {"$": 10, "$$": 20, "$$$": 30}
    
    for restaurant in MOCK_RESTAURANTS:
        # Check cuisine
        if restaurant["cuisine"].lower() not in [c.lower() for c in cuisines]:
            continue
        
        # Check budget
        restaurant_price = price_to_budget.get(restaurant["price_range"], 20)
        if restaurant_price < min_budget or restaurant_price > max_budget:
            continue
        
        filtered.append(restaurant)
    
    # Shuffle to add randomness
    random.shuffle(filtered)
    return filtered

# API Routes
@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "message": "Eatadakimasu API is running!"}

@app.post("/api/rooms/create")
async def create_room(room_data: RoomCreate):
    room_code = generate_room_code()
    room = {
        "room_code": room_code,
        "mode": room_data.mode,
        "created_at": datetime.utcnow(),
        "status": "waiting",
        "participants": [],
        "preferences": None
    }
    await rooms_collection.insert_one(room)
    return {"room_code": room_code, "mode": room_data.mode}

@app.post("/api/rooms/join")
async def join_room(join_data: RoomJoin):
    room = await rooms_collection.find_one({"room_code": join_data.room_code})
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    return {
        "room_code": room["room_code"],
        "mode": room["mode"],
        "status": room["status"]
    }

@app.get("/api/rooms/{room_code}")
async def get_room(room_code: str):
    room = await rooms_collection.find_one({"room_code": room_code})
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    
    # Convert ObjectId to string for JSON serialization
    room["_id"] = str(room["_id"])
    return room

@app.post("/api/preferences")
async def save_preferences(prefs: PreferencesSave):
    # Update room with preferences
    result = await rooms_collection.update_one(
        {"room_code": prefs.room_code},
        {"$set": {
            "preferences": {
                "location": prefs.location,
                "cuisines": prefs.cuisines,
                "min_budget": prefs.min_budget,
                "max_budget": prefs.max_budget
            },
            "status": "swiping"
        }}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Room not found")
    
    return {"success": True}

@app.post("/api/restaurants")
async def get_restaurants(query: RestaurantQuery):
    """Get filtered restaurants based on preferences"""
    restaurants = filter_restaurants(query.cuisines, query.min_budget, query.max_budget)
    return {"restaurants": restaurants}

@app.post("/api/votes")
async def submit_vote(vote: Vote):
    # Check if vote already exists
    existing = await votes_collection.find_one({
        "room_code": vote.room_code,
        "user_id": vote.user_id,
        "restaurant_id": vote.restaurant_id
    })
    
    if existing:
        # Update existing vote
        await votes_collection.update_one(
            {"_id": existing["_id"]},
            {"$set": {"vote": vote.vote, "updated_at": datetime.utcnow()}}
        )
    else:
        # Create new vote
        vote_doc = {
            "room_code": vote.room_code,
            "user_id": vote.user_id,
            "restaurant_id": vote.restaurant_id,
            "vote": vote.vote,
            "created_at": datetime.utcnow()
        }
        await votes_collection.insert_one(vote_doc)
    
    return {"success": True}

@app.get("/api/results/{room_code}")
async def get_results(room_code: str, mode: str = "solo"):
    """Get voting results for a room"""
    room = await rooms_collection.find_one({"room_code": room_code})
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    
    # Get all yes votes for this room
    votes = await votes_collection.find({"room_code": room_code, "vote": "yes"}).to_list(length=1000)
    
    # Count votes per restaurant
    vote_counts = {}
    for vote in votes:
        rest_id = vote["restaurant_id"]
        vote_counts[rest_id] = vote_counts.get(rest_id, 0) + 1
    
    # Get restaurant details and add vote counts
    results = []
    for rest_id, count in vote_counts.items():
        restaurant = next((r for r in MOCK_RESTAURANTS if r["id"] == rest_id), None)
        if restaurant:
            results.append({
                **restaurant,
                "vote_count": count
            })
    
    # Sort by vote count for group mode
    if mode == "group":
        results.sort(key=lambda x: x["vote_count"], reverse=True)
    
    return {"results": results}

@app.post("/api/ai-recommend")
async def ai_recommend(query: RestaurantQuery):
    """Use Claude AI to provide personalized restaurant recommendations"""
    try:
        # Get filtered restaurants
        restaurants = filter_restaurants(query.cuisines, query.min_budget, query.max_budget)
        
        if not restaurants:
            return {"recommendation": "No restaurants found matching your criteria. Try adjusting your preferences!"}
        
        # Prepare restaurant list for AI
        rest_list = "\n".join([
            f"- {r['name']}: {r['cuisine']} cuisine, rating {r['rating']}, {r['price_range']}"
            for r in restaurants[:5]
        ])
        
        # Create Claude chat instance
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"recommend_{query.location}_{datetime.utcnow().timestamp()}",
            system_message="You are a friendly food recommendation assistant. Provide brief, enthusiastic suggestions."
        ).with_model("anthropic", "claude-4-sonnet-20250514")
        
        # Create prompt
        prompt = f"""Based on these preferences:
- Location: {query.location}
- Cuisines: {', '.join(query.cuisines)}
- Budget: ${query.min_budget} - ${query.max_budget}

Here are some matching restaurants:
{rest_list}

Provide a brief, friendly recommendation (2-3 sentences) suggesting which restaurant to try and why. Be enthusiastic!"""
        
        user_message = UserMessage(text=prompt)
        response = await chat.send_message(user_message)
        
        return {
            "recommendation": response,
            "restaurants": restaurants[:5]
        }
    except Exception as e:
        return {
            "recommendation": f"Oops! Our AI chef is taking a break. Here are some great options based on your preferences!",
            "restaurants": filter_restaurants(query.cuisines, query.min_budget, query.max_budget)[:5]
        }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)