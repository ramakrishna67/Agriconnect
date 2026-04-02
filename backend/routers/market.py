from fastapi import APIRouter
from schemas import PricePredictionRequest, CropRecommendationRequest
from ml.price_model import predict_price, get_available_crops
from ml.crop_recommendation import recommend_crop
import google.generativeai as genai
import os
import json
from pydantic import BaseModel

class DemandForecastRequest(BaseModel):
    crop: str
    current_price: float
    trend: str
    months_ahead: int

router = APIRouter(prefix="/api/market", tags=["Market Intelligence"])


@router.get("/prices")
async def get_live_market_prices():
    """Fetch live approximate crop market prices using Gemini AI"""
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key or api_key == "your_gemini_api_key_here":
        # Return realistic static fallback if no API key
        return {"prices": [
            {"crop": "Rice", "price": 2450, "change": 3.2, "unit": "₹/quintal"},
            {"crop": "Wheat", "price": 2275, "change": -1.5, "unit": "₹/quintal"},
            {"crop": "Tomato", "price": 1850, "change": 5.8, "unit": "₹/quintal"},
            {"crop": "Potato", "price": 1200, "change": -2.1, "unit": "₹/quintal"},
            {"crop": "Onion", "price": 1680, "change": 4.3, "unit": "₹/quintal"},
        ], "source": "cached"}

    genai.configure(api_key=api_key)
    try:
        from datetime import date
        today = date.today().strftime("%B %Y")
        model = genai.GenerativeModel("gemini-2.5-flash")
        prompt = f"""You are an Indian agricultural market data expert.
For {today}, give realistic approximate wholesale market prices for these crops in India: Rice, Wheat, Tomato, Potato, Onion.
Prices should be in ₹/quintal and realistic for current Indian mandi rates.
Also estimate a % change from last week (can be negative or positive, realistic).
Return ONLY raw JSON array (no markdown/code blocks):
[
  {{"crop": "Rice", "price": 2450, "change": 2.1, "unit": "₹/quintal"}},
  ...
]"""
        response = model.generate_content(prompt)
        text = response.text.replace("```json", "").replace("```", "").strip()
        prices = json.loads(text)
        return {"prices": prices, "source": "live"}
    except Exception as e:
        return {"prices": [
            {"crop": "Rice", "price": 2450, "change": 3.2, "unit": "₹/quintal"},
            {"crop": "Wheat", "price": 2275, "change": -1.5, "unit": "₹/quintal"},
            {"crop": "Tomato", "price": 1850, "change": 5.8, "unit": "₹/quintal"},
            {"crop": "Potato", "price": 1200, "change": -2.1, "unit": "₹/quintal"},
            {"crop": "Onion", "price": 1680, "change": 4.3, "unit": "₹/quintal"},
        ], "source": "cached", "error": str(e)}



@router.get("/crops")
async def get_crops_list():
    """Get list of available crops for price prediction"""
    return {"crops": get_available_crops()}


@router.post("/predict-price")
async def predict_crop_price(request: PricePredictionRequest):
    """Predict crop price using LSTM model trained on Price_pred.csv"""
    result = predict_price(
        crop=request.crop,
        months_ahead=int(request.months_ahead) if request.months_ahead else 3
    )
    return result


@router.post("/recommend-crop")
async def recommend_crops(request: CropRecommendationRequest):
    """Recommend crops using Random Forest trained on Crop_recommendation.csv"""
    result = recommend_crop(
        nitrogen=request.nitrogen,
        phosphorus=request.phosphorus,
        potassium=request.potassium,
        temperature=request.temperature,
        humidity=request.humidity,
        ph=request.ph,
        rainfall=request.rainfall
    )
    return result


@router.post("/demand-forecast")
async def generate_demand_forecast(request: DemandForecastRequest):
    """Use Gemini to forecast demand and provide selling strategy based on prices"""
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key or api_key == "your_gemini_api_key_here":
        return {
            "demand_outlook": "N/A (API Key Missing)",
            "best_time_to_sell": "N/A",
            "selling_strategy": "Please configure your Gemini API key in the backend to access intelligent market insights."
        }
        
    genai.configure(api_key=api_key)
    try:
        model = genai.GenerativeModel('gemini-2.5-flash')
        prompt = f"""
You are an expert Agricultural Economist.
Crop: {request.crop}
Current Price (per quintal): ₹{request.current_price}
Market Trend for next {request.months_ahead} months: {request.trend}

Based on this market data:
1. Provide a 'Demand Outlook' (High, Medium, Low) with a 1 sentence explanation.
2. Tell the farmer the 'Best Time to Sell'.
3. Provide a brief 'Selling Strategy' (2-3 sentences max).

Return ONLY raw JSON with keys: demand_outlook, best_time_to_sell, selling_strategy
"""
        response = model.generate_content(prompt)
        text = response.text.replace('```json', '').replace('```', '').strip()
        data = json.loads(text)
        return data
    except Exception as e:
        return {"error": str(e), "demand_outlook": "Error", "best_time_to_sell": "Error", "selling_strategy": "Failed to generate insights"}
