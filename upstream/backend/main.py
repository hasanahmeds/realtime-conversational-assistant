import json
import uuid
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Query
from fastapi.middleware.cors import CORSMiddleware
import os
import httpx
import asyncio
from dotenv import load_dotenv

# Load environment variables explicitly from backend/.env file
env_path = os.path.join(os.path.dirname(__file__), ".env")
load_dotenv(dotenv_path=env_path)
load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # Allows all origins — required for Vercel frontend
    allow_methods=["*"],
    allow_headers=["*"],
)

rooms = {}

# --- AI PERSONA CONFIGURATION ---
PERSONAS = {
    "storyteller": {
        "name": "Storyteller (The Chronicler)",
        "emoji": "🎭",
        "prompt": "You are a master chronicler and storyteller. Address the user with whimsical charm, speaking in the style of an ancient bard or a magical adventurer. Craft elaborate, descriptive tales and use dramatic markdown formatting (e.g. *italics* for action, bold headers, and atmospheric descriptions)."
    },
    "professor": {
        "name": "Professor (Dr. Sage)",
        "emoji": "🎓",
        "prompt": "You are Dr. Sage, an esteemed academic professor. Always speak in a highly intellectual, analytical, and polite manner. Structure your explanations with clear bullet points, logical steps, or academic citations where appropriate. Begin your responses with 'Indeed...' or 'Let us examine this...'"
    },
    "travel_guide": {
        "name": "Travel Guide (Atlas)",
        "emoji": "🗺️",
        "prompt": "You are Atlas, a vibrant and seasoned local travel guide. Be extremely enthusiastic, encouraging, and adventurous. Use plenty of emojis related to travel, geography, and nature (✈️, 🏔️, 🌴, 🗺️). Always share packing suggestions, hidden local secrets, or adventurous itineraries based on the context."
    },
    "tech_architect": {
        "name": "Tech Architect (Ada)",
        "emoji": "💻",
        "prompt": "You are Ada, an elite Principal Software Architect. Speak with extreme technical precision, speed, and conciseness. When asked about development, design, or engineering, provide clean, production-ready code snippets with concise comments. Always highlight security, performance scaling, and design patterns."
    }
}

def reload_env():
    env_path = os.path.join(os.path.dirname(__file__), ".env")
    load_dotenv(dotenv_path=env_path, override=True)

def get_openrouter_key():
    reload_env()
    return os.environ.get("OPENROUTER_API_KEY", "").strip()

def get_gemini_key():
    reload_env()
    return os.environ.get("GEMINI_API_KEY", "").strip()

def get_openrouter_model():
    reload_env()
    return os.environ.get("OPENROUTER_MODEL", "nvidia/nemotron-3-ultra-550b-a55b:free").strip()

DEFAULT_BOT_ROLE = os.environ.get("DEFAULT_BOT_ROLE", "You are a helpful and concise assistant.")

print(f"🔑 [AI Config] OpenRouter Key Loaded: {'YES (***' + get_openrouter_key()[-4:] + ')' if get_openrouter_key() else 'NO'}")
print(f"🔑 [AI Config] Gemini Key Loaded: {'YES (***' + get_gemini_key()[-4:] + ')' if get_gemini_key() else 'NO'}")

async def call_openrouter_api(system_prompt: str, user_text: str, chat_history: list) -> str:
    openrouter_key = get_openrouter_key()
    if not openrouter_key:
        return ""
    
    url = "https://openrouter.ai/api/v1/chat/completions"
    
    headers = {
        "Authorization": f"Bearer {openrouter_key}",
        "Content-Type": "application/json",
