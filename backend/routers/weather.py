from fastapi import APIRouter, Query
import httpx
import os
import json
import google.generativeai as genai

router = APIRouter(prefix="/api/weather", tags=["Weather"])


async def geocode_location(name: str):
    """Try Open-Meteo geocoding first, then Gemini fallback"""
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
                    "source": "geocoding"
                }
    except Exception:
        pass

    # Fallback: Gemini resolves the place name
    api_key = os.getenv("GEMINI_API_KEY", "")
    if api_key and api_key != "your_gemini_api_key_here":
        try:
            genai.configure(api_key=api_key)
            model = genai.GenerativeModel("gemini-2.5-flash")
            prompt = f"""Give the latitude and longitude for this location: "{name}".
Return ONLY raw JSON: {{"lat": 28.61, "lon": 77.20, "display_name": "Full Place Name, Country"}}"""
            response = model.generate_content(prompt)
            text = response.text.replace("```json", "").replace("```", "").strip()
            coords = json.loads(text)
            coords["source"] = "gemini"
            return coords
        except Exception:
            pass
    return None


@router.get("/")
async def get_weather(lat: float = Query(None), lon: float = Query(None), name: str = Query("Delhi")):
    """Get weather forecast by coordinates or place name"""
    # If no coords, resolve from name
    if lat is None or lon is None:
        loc = await geocode_location(name)
        if not loc:
            return {"error": f"Could not find location: {name}"}
        lat, lon = loc["lat"], loc["lon"]
        display_name = loc["display_name"]
    else:
        display_name = name

    async with httpx.AsyncClient(timeout=10) as client:
        try:
            res = await client.get(
                "https://api.open-meteo.com/v1/forecast",
                params={
                    "latitude": lat, "longitude": lon,
                    "daily": "temperature_2m_max,temperature_2m_min,precipitation_sum,windspeed_10m_max,weathercode",
                    "current_weather": True, "timezone": "auto",
                }
            )
            data = res.json()

            # Add advisories
            advisories = []
            daily = data.get("daily", {})
            if daily.get("precipitation_sum", [0])[0] > 10:
                advisories.append({"type": "warning", "text": "Heavy rainfall expected. Delay spraying and irrigation."})
            if daily.get("temperature_2m_max", [0])[0] > 38:
                advisories.append({"type": "danger", "text": "Extreme heat! Provide shade and increase watering."})
            if daily.get("temperature_2m_max", [0])[0] < 32 and daily.get("precipitation_sum", [0])[0] < 5:
                advisories.append({"type": "success", "text": "Good weather for field operations and harvesting."})

            data["advisories"] = advisories
            data["location"] = display_name
            data["lat"] = lat
            data["lon"] = lon
            return data
        except Exception as e:
            return {"error": str(e), "location": display_name}


@router.get("/locations/list")
async def list_locations():
    return {"message": "Enter any location name — fully dynamic worldwide support"}
