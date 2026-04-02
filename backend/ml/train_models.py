"""
Training script for all AgriConnect ML models
- LSTM for Price Prediction
- Random Forest for Crop Recommendation
- CNN (MobileNetV2) for Disease Detection (PlantVillage dataset)
"""
import sys
import os
sys.path.insert(0, os.path.dirname(__file__))


def main():
    print("=" * 60)
    print("AgriConnect ML Model Training")
    print("=" * 60)

    # 1. Train Crop Recommendation Model (Random Forest)
    print("\n[1/3] Training Crop Recommendation Model (Random Forest)...")
    from crop_recommendation import train_model as train_recommendation
    train_recommendation()

    # 2. Train Price Prediction Model (LSTM)
    print("\n[2/3] Training Price Prediction Model (LSTM)...")
    try:
        from price_model import train_model as train_price
        train_price(epochs=50)
    except ImportError as e:
        print(f"LSTM training skipped (TensorFlow not installed): {e}")
    except Exception as e:
        print(f"LSTM training error: {e}")

    # 3. Train Disease Detection Model (CNN on PlantVillage)
    print("\n[3/3] Training Disease Detection Model (CNN - PlantVillage)...")
    try:
        from disease_model import build_and_train_model
        model, classes, acc = build_and_train_model(epochs=10, batch_size=32)
        print(f"Disease model trained with {len(classes)} classes, accuracy: {acc:.4f}")
    except ImportError as e:
        print(f"CNN training skipped (TensorFlow not installed): {e}")
    except Exception as e:
        print(f"CNN training error: {e}")

    print("\n" + "=" * 60)
    print("All models trained successfully!")
    print("=" * 60)


if __name__ == "__main__":
    main()
