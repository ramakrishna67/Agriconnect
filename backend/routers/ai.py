from fastapi import APIRouter
from pydantic import BaseModel
import google.generativeai as genai
import os
import json

router = APIRouter(prefix="/api/ai", tags=["AI Assistant"])

class VoiceRequest(BaseModel):
    text: str
    language: str = "en-US"

class GeocodeRequest(BaseModel):
    location: str

@router.post("/geocode")
async def geocode_location(request: GeocodeRequest):
    """Use Gemini to resolve any place name to coordinates, including rural areas and local names"""
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key or api_key == "your_gemini_api_key_here":
        return {"error": "Gemini API key not configured", "lat": None, "lon": None}

    genai.configure(api_key=api_key)
    try:
        model = genai.GenerativeModel("gemini-2.5-flash")
        prompt = f"""You are a world geography expert with access to comprehensive location data.
Find the exact geographic coordinates (latitude and longitude) for this place: "{request.location}"
This could be any location in the world — a city, village, rural district, hill, river, landmark, or local name.

Return ONLY raw JSON with no markdown:
{{
  "name": "canonical place name in English",
  "fullName": "place name, state/region, country",
  "lat": 28.6139,
  "lon": 77.2090,
  "country": "India",
  "found": true
}}
If the place genuinely cannot be identified, set "found": false and lat/lon to null."""
        response = model.generate_content(prompt)
        text = response.text.replace("```json", "").replace("```", "").strip()
        data = json.loads(text)
        return data
    except Exception as e:
        return {"error": str(e), "lat": None, "lon": None, "found": False}


@router.post("/voice")
async def process_voice(request: VoiceRequest):
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key or api_key == "your_gemini_api_key_here":
        return {"response": "I am sorry, but the AI module is not configured. Please add the Gemini API Key to the backend configuration."}
    
    genai.configure(api_key=api_key)
    try:
        model = genai.GenerativeModel('gemini-2.5-flash')
        
        prompt = f"""
You are AgriConnect AI, a highly intelligent smart farming assistant.
The user is asking a question via a voice interface.
User Query: "{request.text}"
Language: "{request.language}"

Instructions:
1. Answer the query concisely but thoroughly as an agricultural expert.
2. Provide actionable advice if applicable.
3. CRITICALLY IMPORTANT: You MUST reply in the exact same language the user used. If they spoke Hindi, reply in Hindi. If Telugu, reply in Telugu.
4. Do not use markdown that cannot be spoken (like bolding, or extremely complex tables), keep it conversational.
"""
        response = model.generate_content(prompt)
        return {"response": response.text.replace('*', '').strip()}
    except Exception as e:
        return {"error": str(e), "response": f"Sorry, I am facing an issue connecting to my brain. Error: {str(e)}"}

