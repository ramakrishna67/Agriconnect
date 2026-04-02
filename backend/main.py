"""
AgriConnect Backend - FastAPI Application
AI-Powered Smart Farming Platform
Aligned with SDG 8: Decent Work and Economic Growth
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import Base, engine
from routers import disease, market, weather, community, ai, irrigation, decision
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="AgriConnect API",
    description="""
    AI-Powered Smart Farming Platform API
    
    ## Features
    - 🔬 **Disease Detection** - CNN-based crop disease identification (MobileNetV2)
    - 📈 **Market Intelligence** - Price prediction using LSTM neural network
    - 🌾 **Crop Recommendation** - Random Forest based crop suggestions
    - 🚜 **Equipment Sharing** - Farm machinery marketplace
    - 🌤️ **Weather Forecast** - Agricultural weather advisories
    - 💬 **Community Forum** - Knowledge exchange platform
    - 👨‍🔬 **Expert Consultations** - Book agricultural experts
    
    ## ML Models
    - **LSTM**: Time-series crop price forecasting using Long Short-Term Memory network
    - **Random Forest**: Crop recommendation based on soil (N,P,K) and climate data
    - **CNN (MobileNetV2)**: Image-based crop disease detection trained on PlantVillage dataset
    """,
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(disease.router)
app.include_router(market.router)
app.include_router(weather.router)
app.include_router(community.router)
app.include_router(ai.router)
app.include_router(irrigation.router)
app.include_router(decision.router)


@app.get("/")
async def root():
    return {
        "name": "AgriConnect API",
        "version": "1.0.0",
        "description": "AI-Powered Smart Farming Platform",
        "sdg": "SDG 8: Decent Work and Economic Growth",
        "endpoints": {
            "docs": "/docs",
            "disease_detection": "/api/disease/detect",
            "market_prices": "/api/market/prices",
            "price_prediction": "/api/market/predict-price",
            "crop_recommendation": "/api/market/recommend-crop",
            "weather": "/api/weather/{location}",
            "irrigation": "/api/irrigation/schedule/{location}",
            "community": "/api/community/posts",
            "ai_voice": "/api/ai/voice",
        },
        "ml_models": {
            "price_prediction": "LSTM - Long Short-Term Memory (TensorFlow/Keras)",
            "crop_recommendation": "Random Forest Classifier (scikit-learn)",
            "disease_detection": "CNN - MobileNetV2 Transfer Learning (TensorFlow/Keras)",
        }
    }


@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "platform": "AgriConnect"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
