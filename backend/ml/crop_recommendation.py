"""
Crop Recommendation Model using Random Forest Classifier
Trained on real Crop_recommendation.csv dataset
Features: Nitrogen, Phosphorus, Potassium, Temperature, Humidity, pH, Rainfall
Target: Recommended crop (22 classes)
"""
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, classification_report
import joblib
import os

BASE_DIR = os.path.dirname(__file__)
MODEL_PATH = os.path.join(BASE_DIR, "models", "crop_recommendation_model.pkl")
ENCODER_PATH = os.path.join(BASE_DIR, "models", "crop_recommendation_encoder.pkl")
DATA_PATH = os.path.join(BASE_DIR, "Crop_recommendation.csv")

# Crop metadata for enriching recommendations
CROP_INFO = {
    'rice':        {'season': 'Kharif', 'duration': '120-150 days', 'water': 'High', 'type': 'Cereal'},
    'maize':       {'season': 'Kharif/Rabi', 'duration': '90-120 days', 'water': 'Medium', 'type': 'Cereal'},
    'chickpea':    {'season': 'Rabi', 'duration': '90-120 days', 'water': 'Low', 'type': 'Pulse'},
    'kidneybeans': {'season': 'Kharif', 'duration': '90-120 days', 'water': 'Medium', 'type': 'Pulse'},
    'pigeonpeas':  {'season': 'Kharif', 'duration': '150-180 days', 'water': 'Low-Medium', 'type': 'Pulse'},
    'mothbeans':   {'season': 'Kharif', 'duration': '75-90 days', 'water': 'Low', 'type': 'Pulse'},
    'mungbean':    {'season': 'Kharif/Summer', 'duration': '60-75 days', 'water': 'Low', 'type': 'Pulse'},
    'blackgram':   {'season': 'Kharif', 'duration': '90-120 days', 'water': 'Low', 'type': 'Pulse'},
    'lentil':      {'season': 'Rabi', 'duration': '90-120 days', 'water': 'Low', 'type': 'Pulse'},
    'pomegranate': {'season': 'Year-round', 'duration': 'Perennial', 'water': 'Low-Medium', 'type': 'Fruit'},
    'banana':      {'season': 'Year-round', 'duration': '12-14 months', 'water': 'High', 'type': 'Fruit'},
    'mango':       {'season': 'Summer', 'duration': 'Perennial', 'water': 'Low-Medium', 'type': 'Fruit'},
    'grapes':      {'season': 'Winter', 'duration': 'Perennial', 'water': 'Medium', 'type': 'Fruit'},
    'watermelon':  {'season': 'Summer', 'duration': '80-110 days', 'water': 'Medium', 'type': 'Fruit'},
    'muskmelon':   {'season': 'Summer', 'duration': '80-110 days', 'water': 'Medium', 'type': 'Fruit'},
    'apple':       {'season': 'Winter', 'duration': 'Perennial', 'water': 'Medium', 'type': 'Fruit'},
    'orange':      {'season': 'Winter', 'duration': 'Perennial', 'water': 'Medium', 'type': 'Fruit'},
    'papaya':      {'season': 'Year-round', 'duration': '10-12 months', 'water': 'Medium', 'type': 'Fruit'},
    'coconut':     {'season': 'Year-round', 'duration': 'Perennial', 'water': 'Medium', 'type': 'Plantation'},
    'cotton':      {'season': 'Kharif', 'duration': '150-180 days', 'water': 'Medium', 'type': 'Cash Crop'},
    'jute':        {'season': 'Kharif', 'duration': '120-150 days', 'water': 'High', 'type': 'Fiber'},
    'coffee':      {'season': 'Year-round', 'duration': 'Perennial', 'water': 'High', 'type': 'Plantation'},
}


def train_model():
    """Train Random Forest crop recommendation model on real CSV data"""
    os.makedirs(os.path.dirname(MODEL_PATH), exist_ok=True)

    print(f"[Crop Recommendation] Loading data from {DATA_PATH}")
    df = pd.read_csv(DATA_PATH)

    # Standardize column names
    df.columns = [c.strip().lower() for c in df.columns]

    print(f"[Crop Recommendation] Dataset shape: {df.shape}")
    print(f"[Crop Recommendation] Crops: {df['label'].nunique()}")

    # Features and target
    feature_cols = ['nitrogen', 'phosphorus', 'potassium', 'temperature', 'humidity', 'ph', 'rainfall']
    X = df[feature_cols].values
    y_raw = df['label'].values

    encoder = LabelEncoder()
    y = encoder.fit_transform(y_raw)

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    print(f"[Crop Recommendation] Training samples: {len(X_train)}")
    print(f"[Crop Recommendation] Test samples: {len(X_test)}")

    model = RandomForestClassifier(
        n_estimators=150,
        max_depth=15,
        min_samples_split=5,
        min_samples_leaf=2,
        random_state=42,
        n_jobs=-1
    )
    model.fit(X_train, y_train)

    y_pred = model.predict(X_test)
    acc = accuracy_score(y_test, y_pred)
    print(f"\n[Crop Recommendation] Random Forest Accuracy: {acc:.4f}")
    print(classification_report(y_test, y_pred, target_names=encoder.classes_))

    # Feature importance
    features = ['Nitrogen', 'Phosphorus', 'Potassium', 'Temperature', 'Humidity', 'pH', 'Rainfall']
    importances = model.feature_importances_
    print("Feature Importance:")
    for f, imp in sorted(zip(features, importances), key=lambda x: -x[1]):
        print(f"  {f}: {imp:.4f}")

    joblib.dump(model, MODEL_PATH)
    joblib.dump(encoder, ENCODER_PATH)
    print(f"\n[Crop Recommendation] Model saved to {MODEL_PATH}")
    print(f"[Crop Recommendation] Trained on: Crop_recommendation.csv")
    return model, encoder, acc


def load_model():
    """Load trained model"""
    if not os.path.exists(MODEL_PATH):
        return train_model()
    model = joblib.load(MODEL_PATH)
    encoder = joblib.load(ENCODER_PATH)
    return model, encoder, None


def recommend_crop(nitrogen: float, phosphorus: float, potassium: float,
                   temperature: float, humidity: float, ph: float, rainfall: float,
                   top_n: int = 5):
    """Recommend crops based on soil and climate conditions"""
    model, encoder, _ = load_model()

    X = np.array([[nitrogen, phosphorus, potassium, temperature, humidity, ph, rainfall]])
    probabilities = model.predict_proba(X)[0]

    # Get top N predictions
    top_indices = np.argsort(probabilities)[::-1][:top_n]
    recommendations = []

    for idx in top_indices:
        crop_name = encoder.inverse_transform([idx])[0]
        prob = float(probabilities[idx])
        if prob < 0.01:
            continue

        info = CROP_INFO.get(crop_name, {})

        # Calculate suitability reasons based on dataset statistics
        reasons = _get_suitability_reasons(crop_name, nitrogen, phosphorus, potassium,
                                           temperature, humidity, ph, rainfall)

        recommendations.append({
            "crop": crop_name.capitalize(),
            "confidence": round(prob * 100, 1),
            "season": info.get('season', 'N/A'),
            "duration": info.get('duration', 'N/A'),
            "water_requirement": info.get('water', 'N/A'),
            "crop_type": info.get('type', 'N/A'),
            "suitability_reasons": reasons[:4],
        })

    # Generate soil analysis
    soil_analysis = {
        "nitrogen": {"value": nitrogen, "status": "High" if nitrogen > 80 else "Medium" if nitrogen > 40 else "Low"},
        "phosphorus": {"value": phosphorus, "status": "High" if phosphorus > 60 else "Medium" if phosphorus > 30 else "Low"},
        "potassium": {"value": potassium, "status": "High" if potassium > 50 else "Medium" if potassium > 25 else "Low"},
        "ph": {"value": ph, "status": "Alkaline" if ph > 7.5 else "Neutral" if ph > 6.5 else "Slightly Acidic" if ph > 5.5 else "Acidic"},
    }

    return {
        "recommendations": recommendations,
        "soil_analysis": soil_analysis,
        "climate_summary": {
            "temperature": f"{temperature}°C",
            "humidity": f"{humidity}%",
            "rainfall": f"{rainfall} mm/month"
        },
        "model": "Random Forest Classifier",
        "dataset": "Crop_recommendation.csv (Real Dataset)",
        "total_crops_analyzed": len(encoder.classes_),
        "features_used": ["Nitrogen (N)", "Phosphorus (P)", "Potassium (K)",
                          "Temperature", "Humidity", "pH", "Rainfall"]
    }


def _get_suitability_reasons(crop, n, p, k, temp, hum, ph, rain):
    """Generate suitability reasons by comparing with dataset ranges"""
    # Approximate optimal ranges from the Crop_recommendation.csv
    OPTIMAL = {
        'rice':        {'N': (60, 100), 'temp': (20, 30), 'humidity': (78, 88), 'ph': (5, 7), 'rainfall': (180, 260)},
        'maize':       {'N': (60, 100), 'temp': (18, 28), 'humidity': (55, 75), 'ph': (5.5, 7), 'rainfall': (60, 110)},
        'chickpea':    {'N': (20, 60), 'temp': (15, 22), 'humidity': (14, 20), 'ph': (6, 8), 'rainfall': (60, 100)},
        'kidneybeans': {'N': (0, 40), 'temp': (15, 22), 'humidity': (18, 24), 'ph': (5, 7), 'rainfall': (60, 140)},
        'pigeonpeas':  {'N': (0, 40), 'temp': (18, 36), 'humidity': (30, 70), 'ph': (4, 8), 'rainfall': (100, 180)},
        'mothbeans':   {'N': (0, 40), 'temp': (24, 32), 'humidity': (40, 70), 'ph': (3, 9), 'rainfall': (30, 75)},
        'mungbean':    {'N': (0, 40), 'temp': (26, 30), 'humidity': (80, 90), 'ph': (5, 8), 'rainfall': (30, 65)},
        'blackgram':   {'N': (20, 50), 'temp': (25, 35), 'humidity': (60, 70), 'ph': (6, 8), 'rainfall': (55, 75)},
        'lentil':      {'N': (0, 30), 'temp': (18, 30), 'humidity': (18, 80), 'ph': (5, 9), 'rainfall': (30, 60)},
        'pomegranate': {'N': (0, 40), 'temp': (18, 26), 'humidity': (85, 95), 'ph': (5, 8), 'rainfall': (100, 120)},
        'banana':      {'N': (80, 120), 'temp': (25, 30), 'humidity': (75, 85), 'ph': (5, 7), 'rainfall': (90, 120)},
        'mango':       {'N': (0, 30), 'temp': (27, 36), 'humidity': (45, 55), 'ph': (4.5, 7), 'rainfall': (90, 110)},
        'grapes':      {'N': (0, 40), 'temp': (8, 42), 'humidity': (78, 82), 'ph': (5, 7), 'rainfall': (60, 75)},
        'watermelon':  {'N': (80, 110), 'temp': (24, 28), 'humidity': (80, 90), 'ph': (6, 7), 'rainfall': (45, 55)},
        'muskmelon':   {'N': (80, 110), 'temp': (27, 30), 'humidity': (90, 95), 'ph': (6, 7), 'rainfall': (20, 30)},
        'apple':       {'N': (0, 40), 'temp': (21, 24), 'humidity': (90, 93), 'ph': (5, 7), 'rainfall': (100, 130)},
        'orange':      {'N': (0, 30), 'temp': (10, 35), 'humidity': (90, 95), 'ph': (6, 8), 'rainfall': (100, 120)},
        'papaya':      {'N': (40, 60), 'temp': (20, 45), 'humidity': (90, 95), 'ph': (6, 7), 'rainfall': (100, 160)},
        'coconut':     {'N': (0, 30), 'temp': (25, 30), 'humidity': (90, 95), 'ph': (5, 7), 'rainfall': (140, 180)},
        'cotton':      {'N': (100, 140), 'temp': (22, 26), 'humidity': (75, 85), 'ph': (6, 8), 'rainfall': (60, 80)},
        'jute':        {'N': (60, 100), 'temp': (23, 28), 'humidity': (80, 90), 'ph': (6, 8), 'rainfall': (150, 200)},
        'coffee':      {'N': (80, 120), 'temp': (23, 28), 'humidity': (50, 70), 'ph': (6, 7), 'rainfall': (140, 180)},
    }

    reasons = []
    opt = OPTIMAL.get(crop, {})
    if not opt:
        return ["✅ Suitable for your conditions"]

    if 'temp' in opt and opt['temp'][0] <= temp <= opt['temp'][1]:
        reasons.append(f"✅ Temperature ({temp}°C) is ideal")
    if 'ph' in opt and opt['ph'][0] <= ph <= opt['ph'][1]:
        reasons.append(f"✅ Soil pH ({ph}) is suitable")
    if 'rainfall' in opt and opt['rainfall'][0] <= rain <= opt['rainfall'][1]:
        reasons.append(f"✅ Rainfall ({rain}mm) matches requirement")
    if 'humidity' in opt and opt['humidity'][0] <= hum <= opt['humidity'][1]:
        reasons.append(f"✅ Humidity ({hum}%) is favorable")
    if 'N' in opt and opt['N'][0] <= n <= opt['N'][1]:
        reasons.append(f"✅ Nitrogen level ({n}) is adequate")

    if not reasons:
        reasons.append("⚠️ Conditions partially match — consider adjustments")

    return reasons


if __name__ == "__main__":
    model, encoder, acc = train_model()
    print(f"\nTest recommendation:")
    result = recommend_crop(90, 42, 43, 25, 80, 6.5, 200)
    for r in result['recommendations']:
        print(f"  {r['crop']}: {r['confidence']}% ({r['season']})")
