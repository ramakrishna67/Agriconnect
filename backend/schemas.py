from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


# Disease Detection
class DiseaseDetectionResponse(BaseModel):
    disease: str
    confidence: float
    crop: str
    severity: str
    description: str
    symptoms: List[str]
    treatment: List[str]
    prevention: List[str]
    model_info: dict


# Market - Price Prediction (LSTM)
class PricePredictionRequest(BaseModel):
    crop: str
    months_ahead: Optional[int] = 3


# Crop Recommendation (Random Forest)
class CropRecommendationRequest(BaseModel):
    nitrogen: float
    phosphorus: float
    potassium: float
    temperature: float
    humidity: float
    ph: float
    rainfall: float


# Equipment
class EquipmentCreate(BaseModel):
    name: str
    type: str
    rate: str
    location: str
    owner: str
    specs: Optional[str] = ""


class BookingCreate(BaseModel):
    user_name: str
    start_date: str
    end_date: str
    contact: str
    notes: Optional[str] = ""


# Community
class PostCreate(BaseModel):
    author: str
    title: str
    content: str
    category: str


class ReplyCreate(BaseModel):
    author: str
    content: str


# Expert
class ConsultationCreate(BaseModel):
    user_name: str
    date: str
    time: str
    topic: str
