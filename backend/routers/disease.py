from fastapi import APIRouter, UploadFile, File
import os, json, base64
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/disease", tags=["Disease Detection"])


@router.post("/detect")
async def detect_crop_disease(file: UploadFile = File(...)):
    """Upload crop image for AI-powered disease detection — CNN first, Gemini fallback"""
    image_bytes = await file.read()

    # Try CNN model first (MobileNetV2 trained on PlantVillage)
    try:
        from ml.disease_model import detect_disease
        logger.info("[Disease] Attempting CNN (MobileNetV2) prediction...")
        result = detect_disease(image_bytes)
        if result and not result.get("error"):
            logger.info(f"[Disease] CNN prediction successful: {result.get('disease')} ({result.get('confidence')}%)")
            return result
        else:
            logger.warning(f"[Disease] CNN returned no result or error, falling back to Gemini. Result: {result}")
    except Exception as e:
        logger.warning(f"[Disease] CNN model failed: {e}, falling back to Gemini Vision")

    # Fallback: Gemini Vision Analysis
    logger.info("[Disease] Using Gemini Vision AI fallback...")
    try:
        import google.generativeai as genai
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            return {"error": "No ML model or Gemini API key configured.", "disease": "Unknown", "confidence": 0,
                    "severity": "Unknown", "description": "CNN model unavailable and no Gemini API key found.",
                    "symptoms": [], "treatment": [], "prevention": [],
                    "model_info": {"model": "Error - No model available"}}

        genai.configure(api_key=api_key)
        model = genai.GenerativeModel("gemini-2.5-flash")
        img_b64 = base64.b64encode(image_bytes).decode()
        content_type = file.content_type or "image/jpeg"
        prompt = """You are an expert agricultural plant pathologist AI.
Analyze this crop image carefully and return a JSON diagnosis.
Return ONLY raw JSON (no markdown/code blocks) with exactly these keys:
{
  "disease": "disease name or 'Healthy'",
  "crop": "detected crop type",
  "confidence": 85.5,
  "severity": "None/Low/Medium/High",
  "description": "1-2 sentence description of the disease",
  "symptoms": ["symptom1", "symptom2", "symptom3", "symptom4"],
  "treatment": ["step1", "step2", "step3", "step4"],
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
        logger.error(f"[Disease] Gemini Vision also failed: {e}")
        return {"error": str(e), "disease": "Analysis failed", "confidence": 0, "severity": "Unknown",
                "description": "Could not analyze image.", "symptoms": [], "treatment": [], "prevention": [],
                "model_info": {"model": "Error"}}


@router.get("/classes")
async def get_disease_classes():
    """Get all detectable disease classes"""
    try:
        from ml.disease_model import get_class_names
        classes = get_class_names()
        return {
            "classes": classes,
            "total": len(classes),
            "model": "CNN MobileNetV2 (primary) + Gemini Vision AI (fallback)",
            "input_size": "224x224 RGB (CNN) / Any resolution (Gemini)",
        }
    except Exception:
        return {
            "classes": ["Powered by CNN MobileNetV2 + Gemini Vision AI"],
            "model": "CNN MobileNetV2 (primary) + Gemini Vision AI (fallback)",
            "input_size": "Any resolution",
        }

