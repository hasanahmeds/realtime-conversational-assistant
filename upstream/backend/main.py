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
        "HTTP-Referer": "http://localhost:5173",
        "X-Title": "Realtime ChatApp AI Studio"
    }
    
    messages = [{"role": "system", "content": system_prompt}]
    
    for msg in chat_history[-6:]:
        messages.append({
            "role": "user" if msg["role"] == "user" else "assistant",
            "content": msg["text"]
        })
        
    messages.append({"role": "user", "content": user_text})
    
    payload = {
        "model": get_openrouter_model(),
        "messages": messages
    }
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(url, json=payload, headers=headers, timeout=10.0)
            if response.status_code == 200:
                resp_data = response.json()
                choices = resp_data.get("choices", [])
                if choices:
                    content = choices[0].get("message", {}).get("content", "")
                    if content:
                        print("🤖 [AI Success] Response generated via OpenRouter API!")
                        return content
            print(f"⚠️ OpenRouter API status {response.status_code}: {response.text}")
    except Exception as e:
        print(f"⚠️ OpenRouter API timeout/error: {e}")
    return ""

async def call_gemini_api(system_prompt: str, user_text: str, chat_history: list) -> str:
    gemini_key = get_gemini_key()
    if not gemini_key:
        return ""
    
    gemini_model = os.environ.get("GEMINI_MODEL", "gemini-2.0-flash").strip()
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{gemini_model}:generateContent?key={gemini_key}"
    
    contents = []
    # Chat history is passed as a list of {"role": "user"|"model", "text": "..."}
    for msg in chat_history[-6:]:  # Only keep last 6 turns of history for token efficiency
        contents.append({
            "role": "user" if msg["role"] == "user" else "model",
            "parts": [{"text": msg["text"]}]
        })
    
    contents.append({
        "role": "user",
        "parts": [{"text": user_text}]
    })
    
    payload = {
        "systemInstruction": {
            "parts": [{"text": system_prompt}]
        },
        "contents": contents
    }
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(url, json=payload, timeout=10.0)
            if response.status_code == 200:
                resp_data = response.json()
                candidates = resp_data.get("candidates", [])
                if candidates:
                    parts = candidates[0].get("content", {}).get("parts", [])
                    if parts:
                        content = parts[0].get("text", "")
                        if content:
                            print("🤖 [AI Success] Response generated via Gemini API!")
                            return content
            print(f"⚠️ Gemini API returned status {response.status_code}: {response.text}")
    except Exception as e:
        print(f"⚠️ Error calling Gemini API: {e}")
    return ""

async def stream_openrouter_api(system_prompt: str, user_text: str, chat_history: list):
    openrouter_key = get_openrouter_key()
    if not openrouter_key:
        return

    url = "https://openrouter.ai/api/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {openrouter_key}",
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:5173",
        "X-Title": "Realtime ChatApp AI Studio"
    }

    messages = [{"role": "system", "content": system_prompt}]
    for msg in chat_history[-6:]:
        messages.append({
            "role": "user" if msg["role"] == "user" else "assistant",
            "content": msg["text"]
        })
    messages.append({"role": "user", "content": user_text})

    payload = {
        "model": get_openrouter_model(),
        "messages": messages,
        "stream": True
    }

    try:
        async with httpx.AsyncClient() as client:
            async with client.stream("POST", url, json=payload, headers=headers, timeout=30.0) as response:
                if response.status_code == 200:
                    async for line in response.aiter_lines():
                        if line.startswith("data: "):
                            data_str = line[6:].strip()
                            if data_str == "[DONE]":
                                break
                            try:
                                json_obj = json.loads(data_str)
                                choices = json_obj.get("choices", [])
                                if choices:
                                    delta = choices[0].get("delta", {})
                                    chunk = delta.get("content", "")
                                    if chunk:
                                        yield chunk
                            except Exception:
                                continue
                else:
                    print(f"⚠️ OpenRouter Streaming status {response.status_code}")
    except Exception as e:
        print(f"⚠️ OpenRouter Streaming error: {e}")

async def stream_gemini_api(system_prompt: str, user_text: str, chat_history: list):
    gemini_key = get_gemini_key()
    if not gemini_key:
        return

    gemini_model = os.environ.get("GEMINI_MODEL", "gemini-2.0-flash").strip()
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{gemini_model}:streamGenerateContent?key={gemini_key}&alt=sse"

    contents = []
    for msg in chat_history[-6:]:
        contents.append({
            "role": "user" if msg["role"] == "user" else "model",
            "parts": [{"text": msg["text"]}]
        })
    contents.append({
        "role": "user",
        "parts": [{"text": user_text}]
    })

    payload = {
        "systemInstruction": {
            "parts": [{"text": system_prompt}]
        },
        "contents": contents
    }

    try:
        async with httpx.AsyncClient() as client:
            async with client.stream("POST", url, json=payload, timeout=30.0) as response:
                if response.status_code == 200:
                    async for line in response.aiter_lines():
                        if line.startswith("data: "):
                            data_str = line[6:].strip()
                            try:
                                json_obj = json.loads(data_str)
                                candidates = json_obj.get("candidates", [])
                                if candidates:
                                    parts = candidates[0].get("content", {}).get("parts", [])
                                    if parts:
                                        text = parts[0].get("text", "")
                                        if text:
                                            yield text
                            except Exception:
                                continue
                else:
                    print(f"⚠️ Gemini Streaming status {response.status_code}")
    except Exception as e:
        print(f"⚠️ Error calling Gemini Streaming API: {e}")

async def stream_mock_response(full_text: str):
    words = full_text.split(" ")
    for i, word in enumerate(words):
        chunk = word + (" " if i < len(words) - 1 else "")
        yield chunk
        await asyncio.sleep(0.02)

async def stream_ai_response(
    websocket: WebSocket,
    system_prompt: str,
    text_payload: str,
    chat_history: list,
    persona_id: str,
    custom_instruction: str,
    time_payload: str
) -> str:
    message_id = str(uuid.uuid4())

    await websocket.send_json({
        "type": "stream_start",
        "id": message_id,
        "username": "AI Chatbot",
        "time": time_payload
    })

    await websocket.send_json({
        "type": "typing",
        "username": "AI Chatbot",
        "status": False
    })

    full_response = ""
    stream_started = False

    if get_openrouter_key():
        async for chunk in stream_openrouter_api(system_prompt, text_payload, chat_history):
            stream_started = True
            full_response += chunk
            await websocket.send_json({
                "type": "stream_chunk",
                "id": message_id,
                "chunk": chunk
            })

    if not stream_started and get_gemini_key():
        async for chunk in stream_gemini_api(system_prompt, text_payload, chat_history):
            stream_started = True
            full_response += chunk
            await websocket.send_json({
                "type": "stream_chunk",
                "id": message_id,
                "chunk": chunk
            })

    if not stream_started:
        mock_text = generate_mock_ai_response(persona_id, custom_instruction or "", text_payload)
        async for chunk in stream_mock_response(mock_text):
            full_response += chunk
            await websocket.send_json({
                "type": "stream_chunk",
                "id": message_id,
                "chunk": chunk
            })

    await websocket.send_json({
        "type": "stream_end",
        "id": message_id
    })

    return full_response

def generate_mock_ai_response(persona_id: str, custom_instruction: str, user_text: str) -> str:
    text_lower = user_text.lower()
    
    if persona_id == "storyteller":
        if "hello" in text_lower or "hi" in text_lower:
            return "✨ *Ah, traveler! Gather 'round the hearth.* ✨\n\nIndeed, the winds of fate blow strong today, whispering your name across the forgotten valleys of Eloria. What grand quest or forgotten lore brings you to my tavern tonight? Speak, and let us weave a tale that shall echo through the ages! 📖⚔️"
        elif "quest" in text_lower or "adventure" in text_lower or "game" in text_lower:
            return "🐉 *The dragon's shadow falls across the stone archway!* 🐉\n\nYou grip your sword, its blade glowing with faint blue runes. Before you lies a branching path: to the left, the whispers of the *Dreadwood Forest*; to the right, the sulfurous warmth of the *Crag of Ash*. \n\nWhat do you choose, brave adventurer? The story awaits your command!"
        else:
            return f"🌌 *A marvelous prompt, traveler!* Let the scroll of time record this:\n\nIn response to your query about *\"{user_text}\"*, the elders whisper of a ancient truth. Long ago, before the sky was torn asunder, sages would speak of such matters. It is a tale of courage, of mystery, and of stardust. \n\n*The stars align, awaiting your next chapter!*"
            
    elif persona_id == "professor":
        if "hello" in text_lower or "hi" in text_lower:
            return "Indeed. Let us begin our academic inquiry.\n\nWelcome! I am Dr. Sage. I am delighted to engage in scholarly dialogue with you today. Please present your inquiry, and we shall dissect it with rigorous logical investigation. What subject shall we explore?"
        elif "explain" in text_lower or "what is" in text_lower or "why" in text_lower:
            return f"Indeed. Let us examine the mechanics behind this subject.\n\nTo understand your question concerning *\"{user_text}\"*, we must isolate three primary pillars:\n\n1. **Theoretical Foundation**: The underlying premise that governs this phenomenon.\n2. **Empirical Correlation**: Observed practical applications and case studies.\n3. **Practical Implications**: How this knowledge reshapes our contemporary understanding.\n\nLet me know which of these vectors you wish to investigate further."
        else:
            return f"Indeed. Your observation regarding *\"{user_text}\"* presents a fascinating scholarly paradigm.\n\nLet us analyze this with academic rigor:\n* **First Principle**: All inquiries must be grounded in verified axioms.\n* **Logical Deduction**: Following this thread leads to a refined conclusion.\n\nI suggest we cross-reference this with contemporary literature in the field. What are your hypotheses on this?"

    elif persona_id == "travel_guide":
        if "hello" in text_lower or "hi" in text_lower:
            return "✈️ **Hey there, fellow explorer! Atlas here!** 🗺️\n\nI'm so stoked you're planning your next epic journey! Whether you want to climb misty mountain peaks 🏔️, lounge on turquoise beaches 🏖️, or explore vibrant neon-lit street food markets 🍜, I've got the ultimate local secrets for you!\n\nWhere are we heading next? Tell me your dream destination!"
        elif "recommend" in text_lower or "where" in text_lower or "trip" in text_lower:
            return "🌴 **Oh, I have the PERFECT itinerary for you!** ✈️\n\nIf you want an unforgettable escape, here is my top recommendation:\n*   **Destination**: The hidden valleys of *Sapa, Vietnam* or the sun-drenched coast of *Amalfi, Italy*!\n*   **Local Secret**: Skip the main tourist trails and head to the family-owned taverns at sunset for the freshest local delicacies!\n*   **Packing Tip**: Always bring a reliable light rain jacket and a solid pair of broken-in hiking boots.\n\nAre you looking for high-adrenaline adventure or pure relaxation? Let me tailor this!"
        else:
            return f"🏔️ **Adventure is calling! Regarding your inquiry about \"{user_text}\":** 🎒\n\nThat sounds like an amazing exploration point! When traveling through this concept, keep these local tips in mind:\n1. **Embrace the Unexpected**: The best views come after the hardest climbs.\n2. **Eat Local**: Always try the street food—it's where the culture truly lives.\n\nLet me know if you want me to build a customized 3-day travel itinerary for this! 🗺️"

    elif persona_id == "tech_architect":
