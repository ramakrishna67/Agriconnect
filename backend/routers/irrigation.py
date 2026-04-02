from fastapi import APIRouter, Query
import httpx
import os
import google.generativeai as genai
import json

router = APIRouter(prefix="/api/irrigation", tags=["Irrigation"])


async def geocode_location(name: str):
    """Resolve place name to coordinates using Open-Meteo + Gemini fallback"""
    try:
        async with httpx.AsyncClient(timeout=8) as client:
            res = await client.get(
                "https://geocoding-api.open-meteo.com/v1/search",
                params={"name": name, "count": 1, "language": "en", "format": "json"}
            )
            data = res.json()
            if data.get("results"):
                loc = data["results"][0]
                return {
                    "lat": loc["latitude"],
                    "lon": loc["longitude"],
                    "display_name": f"{loc['name']}{', ' + loc.get('admin1', '') if loc.get('admin1') else ''}, {loc.get('country', '')}",
                }
    except Exception:
        pass

    # Fallback: Gemini resolves coordinates
    api_key = os.getenv("GEMINI_API_KEY", "")
    if api_key and api_key != "your_gemini_api_key_here":
        try:
            genai.configure(api_key=api_key)
            model = genai.GenerativeModel("gemini-2.5-flash")
            prompt = f"""Give the latitude and longitude for: "{name}".
Return ONLY raw JSON: {{"lat": 17.05, "lon": 79.26, "display_name": "Full Name, Region, Country"}}"""
            response = model.generate_content(prompt)
            text = response.text.replace("```json", "").replace("```", "").strip()
            return json.loads(text)
        except Exception:
            pass
    return None


@router.get("/schedule")
async def get_irrigation_schedule(
    lat: float = Query(None),
    lon: float = Query(None),
    name: str = Query("Delhi")
):
    # Resolve coordinates if not given
    display_name = name
    if lat is None or lon is None:
        loc = await geocode_location(name)
        if not loc:
            return {"error": f"Could not locate '{name}'. Try a more specific place name."}
        lat, lon = loc["lat"], loc["lon"]
        display_name = loc.get("display_name", name)

    # Fetch live weather
    async with httpx.AsyncClient(timeout=10) as client:
        try:
            res = await client.get(
                "https://api.open-meteo.com/v1/forecast",
                params={
                    "latitude": lat, "longitude": lon,
                    "daily": "temperature_2m_max,temperature_2m_min,precipitation_sum",
                    "current_weather": True, "timezone": "auto",
                }
            )
            data = res.json()
        except Exception as e:
            return {"error": f"Failed to fetch weather data: {str(e)}"}

    current_temp = data.get("current_weather", {}).get("temperature", 30)
    soil_moisture = max(15.0, round(80.0 - ((current_temp - 20) * 2.5), 1))

    forecast_data = {
        "dates": data.get("daily", {}).get("time", [])[:7],
        "max_temps": data.get("daily", {}).get("temperature_2m_max", [])[:7],
        "min_temps": data.get("daily", {}).get("temperature_2m_min", [])[:7],
        "rainfall": data.get("daily", {}).get("precipitation_sum", [])[:7],
    }

    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key or api_key == "your_gemini_api_key_here":
        return {
            "location": display_name,
            "lat": lat, "lon": lon,
            "soil_moisture": f"{soil_moisture}%",
            "schedule": "Gemini API key is not configured. Please add GEMINI_API_KEY to backend/.env",
            "timing": "N/A",
            "water_requirement": "N/A",
            "advice": "Configure your Gemini API key to get AI-powered irrigation schedules.",
            "forecast": forecast_data
        }

    genai.configure(api_key=api_key)
    try:
        model = genai.GenerativeModel("gemini-2.5-flash")
        prompt = f"""You are an expert AI Irrigation Scheduler for AgriConnect.
Location: {display_name} (lat: {lat:.2f}, lon: {lon:.2f})
Current Temperature: {current_temp}°C
Estimated Soil Moisture: {soil_moisture}%
7-Day Forecast:
  Dates: {forecast_data['dates']}
  Max Temps (°C): {forecast_data['max_temps']}
  Min Temps (°C): {forecast_data['min_temps']}
  Rainfall (mm): {forecast_data['rainfall']}

Based on this live weather forecast and soil moisture data for {display_name}:
1. Create a specific 7-day irrigation schedule
2. Recommend the best time of day to water
3. Estimate the weekly total water requirement
4. Give one key actionable farming advice specific to this region's conditions

Return ONLY raw JSON (no markdown, no code blocks):
{{
  "schedule": "Detailed day-by-day schedule...",
  "timing": "Best time to water...",
  "water_requirement": "e.g., 35-40 mm/week or 3500 L/hectare",
  "advice": "Region-specific actionable farming advice..."
}}"""
        response = model.generate_content(prompt)
        text = response.text.replace("```json", "").replace("```", "").strip()
        ai_data = json.loads(text)

        return {
            "location": display_name,
            "lat": lat, "lon": lon,
            "soil_moisture": f"{soil_moisture}%",
            "current_temp": f"{current_temp}°C",
            "schedule": ai_data.get("schedule", "No schedule generated"),
            "timing": ai_data.get("timing", "N/A"),
            "water_requirement": ai_data.get("water_requirement", "N/A"),
            "advice": ai_data.get("advice", "N/A"),
            "forecast": forecast_data
        }
    except Exception as e:
        return {"error": str(e), "message": "Failed to generate irrigation schedule"}
