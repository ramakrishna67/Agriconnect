"""
AI-Based Decision Support System
Aggregates weather, soil, disease detection, price prediction, crop recommendation
and generates a comprehensive farming decision using Gemini AI.
"""
from fastapi import APIRouter, UploadFile, File, Form
from typing import Optional
import os
import json
import base64
import httpx
import google.generativeai as genai

router = APIRouter(prefix="/api/decision", tags=["AI Decision Support"])


async def _geocode(area_name: str):
    """Resolve area name to lat/lon"""
    # Try Open-Meteo geocoding first
    try:
        async with httpx.AsyncClient(timeout=8) as client:
            res = await client.get(
                "https://geocoding-api.open-meteo.com/v1/search",
                params={"name": area_name, "count": 1, "language": "en", "format": "json"}
            )
            data = res.json()
            if data.get("results"):
                loc = data["results"][0]
                return {
                    "lat": loc["latitude"],
                    "lon": loc["longitude"],
                    "name": f"{loc['name']}{', ' + loc.get('admin1', '') if loc.get('admin1') else ''}, {loc.get('country', '')}",
                }
    except Exception:
        pass

    # Fallback: Gemini
    api_key = os.getenv("GEMINI_API_KEY", "")
    if api_key:
        try:
            genai.configure(api_key=api_key)
            model = genai.GenerativeModel("gemini-2.5-flash")
            prompt = f'Give latitude and longitude for: "{area_name}". Return ONLY raw JSON: {{"lat": 28.61, "lon": 77.20, "name": "Full Place Name, Country"}}'
            response = model.generate_content(prompt)
            text = response.text.replace("```json", "").replace("```", "").strip()
            return json.loads(text)
        except Exception:
            pass
    return None


async def _get_weather(lat: float, lon: float):
    """Fetch weather from Open-Meteo"""
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            res = await client.get(
                "https://api.open-meteo.com/v1/forecast",
                params={
                    "latitude": lat, "longitude": lon,
                    "daily": "temperature_2m_max,temperature_2m_min,precipitation_sum,windspeed_10m_max,weathercode",
                    "current_weather": True, "timezone": "auto",
                }
            )
            return res.json()
    except Exception as e:
        return {"error": str(e)}


def _run_disease_detection(image_bytes):
    """Try CNN first, then Gemini fallback"""
    # Try CNN
    try:
        from ml.disease_model import detect_disease
        result = detect_disease(image_bytes)
        if result and not result.get("error"):
            return result
    except Exception:
        pass
    return None


async def _gemini_disease_detection(image_bytes, content_type="image/jpeg"):
    """Fallback disease detection using Gemini Vision"""
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        return None
    genai.configure(api_key=api_key)
    try:
        model = genai.GenerativeModel("gemini-2.5-flash")
        img_b64 = base64.b64encode(image_bytes).decode()
        prompt = """You are an expert agricultural plant pathologist AI.
Analyze this crop image carefully and return a JSON diagnosis.
Return ONLY raw JSON (no markdown/code blocks) with exactly these keys:
{
  "disease": "disease name or 'Healthy'",
  "crop": "detected crop type",
  "confidence": 85.5,
  "severity": "None/Low/Medium/High",
  "description": "1-2 sentence description of the disease",
  "symptoms": ["symptom1", "symptom2", "symptom3"],
  "treatment": ["step1", "step2", "step3"],
  "prevention": ["tip1", "tip2", "tip3"],
  "model_info": {"model": "Gemini Vision AI", "dataset": "Google Gemini", "classes": "unlimited", "input_size": "dynamic"}
}"""
        response = model.generate_content([
            {"role": "user", "parts": [
                {"inline_data": {"mime_type": content_type, "data": img_b64}},
                {"text": prompt}
            ]}
        ])
        text = response.text.replace("```json", "").replace("```", "").strip()
        return json.loads(text)
    except Exception as e:
        return {"error": str(e), "disease": "Analysis failed", "confidence": 0}


def _predict_price(crop_name: str):
    """Get price prediction for a crop"""
    try:
        from ml.price_model import predict_price
        return predict_price(crop=crop_name, months_ahead=3)
    except Exception as e:
        return {"error": str(e)}


def _recommend_crops(temperature, humidity, rainfall, ph=6.5, nitrogen=50, phosphorus=40, potassium=40):
    """Get crop recommendations"""
    try:
        from ml.crop_recommendation import recommend_crop
        return recommend_crop(
            nitrogen=nitrogen, phosphorus=phosphorus, potassium=potassium,
            temperature=temperature, humidity=humidity, ph=ph, rainfall=rainfall,
            top_n=5
        )
    except Exception as e:
        return {"error": str(e)}


async def _gemini_estimate_soil(area_name: str, lat: float, lon: float):
    """Use Gemini to estimate soil parameters for a region"""
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        return {"nitrogen": 50, "phosphorus": 40, "potassium": 40, "ph": 6.5}
    genai.configure(api_key=api_key)
    try:
        model = genai.GenerativeModel("gemini-2.5-flash")
        prompt = f"""You are a soil science expert. For the agricultural region near "{area_name}" (lat: {lat}, lon: {lon}), 
estimate typical soil parameters. Return ONLY raw JSON:
{{"nitrogen": 60, "phosphorus": 45, "potassium": 40, "ph": 6.5, "soil_type": "Alluvial", "soil_description": "brief description"}}
Use realistic values based on the actual geographic region's soil characteristics."""
        response = model.generate_content(prompt)
        text = response.text.replace("```json", "").replace("```", "").strip()
        return json.loads(text)
    except Exception:
        return {"nitrogen": 50, "phosphorus": 40, "potassium": 40, "ph": 6.5, "soil_type": "Unknown"}


async def _gemini_final_decision(
    area_name, crop_type, weather_data, soil_data, disease_data,
    price_data, recommendation_data, language="en"
):
    """Generate comprehensive AI decision using all collected data"""
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        return {"error": "Gemini API key not configured"}
    genai.configure(api_key=api_key)
    try:
        model = genai.GenerativeModel("gemini-2.5-flash")

        # Build context
        current_weather = weather_data.get("current_weather", {})
        daily = weather_data.get("daily", {})

        prompt = f"""You are an expert Agricultural Decision Support AI for Indian farmers.

FARMER'S INPUT:
- Area: {area_name}
- Crop they want to grow: {crop_type}

COLLECTED DATA:
1. WEATHER: Temperature={current_weather.get('temperature', 'N/A')}°C, 
   Max forecast={daily.get('temperature_2m_max', ['N/A'])[0] if daily.get('temperature_2m_max') else 'N/A'}°C,
   Precipitation={daily.get('precipitation_sum', ['N/A'])[0] if daily.get('precipitation_sum') else 'N/A'}mm,
   Wind={daily.get('windspeed_10m_max', ['N/A'])[0] if daily.get('windspeed_10m_max') else 'N/A'}km/h

2. SOIL: Type={soil_data.get('soil_type', 'N/A')}, N={soil_data.get('nitrogen', 'N/A')}, 
   P={soil_data.get('phosphorus', 'N/A')}, K={soil_data.get('potassium', 'N/A')}, pH={soil_data.get('ph', 'N/A')}

3. DISEASE DETECTION: {json.dumps(disease_data) if disease_data else 'No image provided'}

4. PRICE PREDICTION for {crop_type}: {json.dumps(price_data) if price_data else 'Not available'}

5. AI CROP RECOMMENDATIONS (based on soil/climate): {json.dumps(recommendation_data.get('recommendations', [])[:3]) if recommendation_data and not recommendation_data.get('error') else 'Not available'}

Based on ALL this data, provide a comprehensive farming decision.
Return ONLY raw JSON (no markdown):
{{
  "overall_verdict": "RECOMMENDED" or "CHANGE CROP" or "PROCEED WITH CAUTION",
  "verdict_reason": "2-3 sentence explanation of the verdict",
  "crop_analysis": {{
    "farmer_crop": "{crop_type}",
    "is_suitable": true/false,
    "suitability_score": 75,
    "reasons_for": ["reason1", "reason2"],
    "reasons_against": ["reason1", "reason2"],
    "expected_yield_quality": "High/Medium/Low",
    "risk_level": "Low/Medium/High"
  }},
  "suggested_crops": [
    {{
      "crop": "crop name",
      "why": "1-2 sentence reason",
      "expected_profit": "High/Medium/Low",
      "benefits": ["benefit1", "benefit2", "benefit3"]
    }}
  ],
  "farmer_crop_benefits": ["benefit1 of growing {crop_type}", "benefit2", "benefit3", "benefit4"],
  "weather_advisory": "1-2 sentence weather advice for farming",
  "soil_advisory": "1-2 sentence soil advice",
  "disease_advisory": "1-2 sentence advice based on disease detection if image was provided, else general advice",
  "market_advisory": "1-2 sentence market/price advice",
  "action_plan": ["step1 the farmer should do", "step2", "step3", "step4", "step5"],
  "local_language_summary": "Complete summary of the decision translated to the local language of {area_name}. If the area is in India, use the regional language (Hindi for North India, Telugu for Andhra/Telangana, Tamil for Tamil Nadu, Kannada for Karnataka, etc). This should be a complete 4-5 sentence summary a farmer can understand."
}}"""

        response = model.generate_content(prompt)
        text = response.text.replace("```json", "").replace("```", "").strip()
        return json.loads(text)
    except Exception as e:
        return {"error": str(e), "overall_verdict": "ERROR"}


@router.post("/analyze")
async def analyze_decision(
    area_name: str = Form(...),
    crop_type: str = Form(...),
    language: str = Form("en"),
    file: Optional[UploadFile] = File(None)
):
    """
    AI-Based Decision Support System
    Takes area name, crop type, optional crop image
    Returns comprehensive farming decision with voice-ready output
    """
    result = {
        "area_name": area_name,
        "crop_type": crop_type,
        "stages": {}
    }

    # Stage 1: Geocode
    geo = await _geocode(area_name)
    if not geo:
        return {"error": f"Could not find location: {area_name}"}
    result["location"] = geo
    result["stages"]["geocode"] = "done"

    # Stage 2: Weather
    weather = await _get_weather(geo["lat"], geo["lon"])
    result["weather"] = weather
    result["stages"]["weather"] = "done"

    # Stage 3: Soil estimation
    soil = await _gemini_estimate_soil(area_name, geo["lat"], geo["lon"])
    result["soil"] = soil
    result["stages"]["soil"] = "done"

    # Stage 4: Disease detection (if image provided)
    disease_result = None
    if file:
        image_bytes = await file.read()
        # Try CNN first
        disease_result = _run_disease_detection(image_bytes)
        if not disease_result:
            # Fallback to Gemini
            disease_result = await _gemini_disease_detection(
                image_bytes, file.content_type or "image/jpeg"
            )
    result["disease"] = disease_result
    result["stages"]["disease"] = "done" if file else "skipped"

    # Stage 5: Price prediction
    price = _predict_price(crop_type)
    result["price_prediction"] = price
    result["stages"]["price"] = "done"

    # Stage 6: Crop recommendation
    current_weather = weather.get("current_weather", {})
    daily = weather.get("daily", {})
    temp = current_weather.get("temperature", 25)
    # Estimate humidity and rainfall from weather data
    precip_today = daily.get("precipitation_sum", [0])[0] if daily.get("precipitation_sum") else 0
    avg_rainfall = precip_today * 30  # rough monthly estimate
    humidity = 70  # default estimate; can be refined

    recommendations = _recommend_crops(
        temperature=temp,
        humidity=humidity,
        rainfall=avg_rainfall if avg_rainfall > 0 else 100,
        ph=soil.get("ph", 6.5),
        nitrogen=soil.get("nitrogen", 50),
        phosphorus=soil.get("phosphorus", 40),
        potassium=soil.get("potassium", 40)
    )
    result["crop_recommendations"] = recommendations
    result["stages"]["recommendations"] = "done"

    # Stage 7: Final AI Decision
    decision = await _gemini_final_decision(
        area_name=area_name,
        crop_type=crop_type,
        weather_data=weather,
        soil_data=soil,
        disease_data=disease_result,
        price_data=price,
        recommendation_data=recommendations,
        language=language
    )
    result["decision"] = decision
    result["stages"]["decision"] = "done"

    return result
