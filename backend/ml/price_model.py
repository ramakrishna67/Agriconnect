"""
Price Prediction Model using LSTM (Long Short-Term Memory)
Trained on real market price data from Price_pred.csv
Features: State, Commodity, Arrival_Date, Min_Price, Max_Price, Modal_Price
"""
import numpy as np
import pandas as pd
import os
import json
import joblib
from datetime import datetime

BASE_DIR = os.path.dirname(__file__)
MODEL_PATH = os.path.join(BASE_DIR, "models", "price_lstm_model.keras")
SCALER_PATH = os.path.join(BASE_DIR, "models", "price_scaler.pkl")
COMMODITY_SCALER_PATH = os.path.join(BASE_DIR, "models", "price_commodity_scalers.pkl")
META_PATH = os.path.join(BASE_DIR, "models", "price_meta.json")
DATA_PATH = os.path.join(BASE_DIR, "Price_pred.csv")

SEQUENCE_LENGTH = 12  # 12 time steps lookback


def load_and_preprocess_data():
    """Load and preprocess Price_pred.csv"""
    print(f"[Price LSTM] Loading data from {DATA_PATH}")
    df = pd.read_csv(DATA_PATH)

    # Parse dates
    df['Arrival_Date'] = pd.to_datetime(df['Arrival_Date'], format='%d/%m/%Y', errors='coerce')
    df = df.dropna(subset=['Arrival_Date', 'Modal_Price'])
    df = df[df['Modal_Price'] > 0]

    # Extract time features
    df['Year'] = df['Arrival_Date'].dt.year
    df['Month'] = df['Arrival_Date'].dt.month

    # Aggregate monthly average prices per commodity
    monthly = df.groupby(['Commodity', 'Year', 'Month']).agg(
        Modal_Price=('Modal_Price', 'mean'),
        Min_Price=('Min_Price', 'mean'),
        Max_Price=('Max_Price', 'mean'),
        Count=('Modal_Price', 'count')
    ).reset_index()

    # Sort by commodity and time
    monthly = monthly.sort_values(['Commodity', 'Year', 'Month']).reset_index(drop=True)

    # Filter commodities with sufficient data (at least 24 months)
    commodity_counts = monthly.groupby('Commodity').size()
    valid_commodities = commodity_counts[commodity_counts >= 24].index.tolist()
    monthly = monthly[monthly['Commodity'].isin(valid_commodities)]

    print(f"[Price LSTM] Total records: {len(df)}")
    print(f"[Price LSTM] Monthly aggregated: {len(monthly)}")
    print(f"[Price LSTM] Valid commodities (24+ months): {len(valid_commodities)}")

    return monthly, valid_commodities


def create_sequences(data, seq_length):
    """Create input sequences and targets for LSTM"""
    X, y = [], []
    for i in range(len(data) - seq_length):
        X.append(data[i:i + seq_length])
        y.append(data[i + seq_length])
    return np.array(X), np.array(y)


def train_model(epochs=50, batch_size=32):
    """Train LSTM model on real price data"""
    import tensorflow as tf
    from sklearn.preprocessing import MinMaxScaler

    os.makedirs(os.path.dirname(MODEL_PATH), exist_ok=True)

    monthly, valid_commodities = load_and_preprocess_data()

    # Create per-commodity scalers and sequences
    commodity_scalers = {}
    X_all, y_all = [], []

    for commodity in valid_commodities:
        comm_data = monthly[monthly['Commodity'] == commodity]['Modal_Price'].values

        if len(comm_data) < SEQUENCE_LENGTH + 2:
            continue

        scaler = MinMaxScaler(feature_range=(0, 1))
        scaled = scaler.fit_transform(comm_data.reshape(-1, 1)).flatten()
        commodity_scalers[commodity] = scaler

        X, y = create_sequences(scaled, SEQUENCE_LENGTH)
        if len(X) > 0:
            X_all.append(X)
            y_all.append(y)

    X_train = np.concatenate(X_all)
    y_train = np.concatenate(y_all)

    # Reshape for LSTM: [samples, timesteps, features]
    X_train = X_train.reshape((X_train.shape[0], X_train.shape[1], 1))

    print(f"\n[Price LSTM] Training samples: {X_train.shape[0]}")
    print(f"[Price LSTM] Sequence length: {SEQUENCE_LENGTH}")
    print(f"[Price LSTM] Commodities with scalers: {len(commodity_scalers)}")

    # Build LSTM model
    model = tf.keras.Sequential([
        tf.keras.layers.LSTM(64, return_sequences=True, input_shape=(SEQUENCE_LENGTH, 1)),
        tf.keras.layers.Dropout(0.2),
        tf.keras.layers.LSTM(32, return_sequences=False),
        tf.keras.layers.Dropout(0.2),
        tf.keras.layers.Dense(16, activation='relu'),
        tf.keras.layers.Dense(1)
    ])

    model.compile(
        optimizer=tf.keras.optimizers.Adam(learning_rate=0.001),
        loss='mse',
        metrics=['mae']
    )

    print("\n[Price LSTM] Model architecture:")
    model.summary()

    callbacks = [
        tf.keras.callbacks.EarlyStopping(monitor='val_loss', patience=5, restore_best_weights=True),
        tf.keras.callbacks.ReduceLROnPlateau(monitor='val_loss', factor=0.5, patience=3, min_lr=1e-6),
    ]

    history = model.fit(
        X_train, y_train,
        epochs=epochs,
        batch_size=batch_size,
        validation_split=0.2,
        callbacks=callbacks,
        verbose=1
    )

    val_loss = min(history.history['val_loss'])
    val_mae = min(history.history['val_mae'])
    print(f"\n[Price LSTM] Best Validation Loss (MSE): {val_loss:.6f}")
    print(f"[Price LSTM] Best Validation MAE: {val_mae:.6f}")

    # Save model and artifacts
    model.save(MODEL_PATH)
    joblib.dump(commodity_scalers, COMMODITY_SCALER_PATH)

    # Save metadata
    # Compute average prices for each commodity for reference
    avg_prices = {}
    for commodity in commodity_scalers:
        comm_data = monthly[monthly['Commodity'] == commodity]
        recent = comm_data.tail(3)['Modal_Price'].mean()
        avg_prices[commodity] = round(float(recent), 2)

    meta = {
        'commodities': list(commodity_scalers.keys()),
        'seq_length': SEQUENCE_LENGTH,
        'avg_prices': avg_prices,
        'trained_on': 'Price_pred.csv',
        'total_records': int(len(monthly)),
    }
    with open(META_PATH, 'w') as f:
        json.dump(meta, f, indent=2)

    print(f"\n[Price LSTM] Model saved to {MODEL_PATH}")
    print(f"[Price LSTM] Scalers saved for {len(commodity_scalers)} commodities")
    return model, commodity_scalers, meta


def load_model():
    """Load trained LSTM model and scalers"""
    try:
        import tensorflow as tf
        if os.path.exists(MODEL_PATH) and os.path.exists(COMMODITY_SCALER_PATH):
            model = tf.keras.models.load_model(MODEL_PATH, compile=False)
            model.compile(optimizer='adam', loss='mse', metrics=['mae'])
            commodity_scalers = joblib.load(COMMODITY_SCALER_PATH)
            with open(META_PATH, 'r') as f:
                meta = json.load(f)
            return model, commodity_scalers, meta
        else:
            print("[Price LSTM] No trained model found. Training now...")
            return train_model()
    except ImportError:
        print("[Price LSTM] TensorFlow not available")
        return None, None, None


def predict_price(crop: str, months_ahead: int = 3):
    """Predict future price using LSTM on real data"""
    model, commodity_scalers, meta = load_model()

    if model is None or meta is None:
        return _fallback_prediction(crop, months_ahead)

    # Find matching commodity
    available = meta.get('commodities', [])
    matched_commodity = None

    # Try exact match first, then fuzzy match
    crop_lower = crop.lower()
    for c in available:
        if c.lower() == crop_lower or crop_lower in c.lower() or c.lower() in crop_lower:
            matched_commodity = c
            break

    if matched_commodity is None:
        return {
            "crop": crop,
            "error": f"Crop '{crop}' not found in dataset",
            "available_crops": available[:20],
            "model": "LSTM (Long Short-Term Memory)",
        }

    try:
        # Load the recent data for this commodity
        df = pd.read_csv(DATA_PATH)
        df['Arrival_Date'] = pd.to_datetime(df['Arrival_Date'], format='%d/%m/%Y', errors='coerce')
        df = df.dropna(subset=['Arrival_Date', 'Modal_Price'])
        df = df[df['Modal_Price'] > 0]
        df['Year'] = df['Arrival_Date'].dt.year
        df['Month'] = df['Arrival_Date'].dt.month

        comm_data = df[df['Commodity'] == matched_commodity]
        monthly_prices = comm_data.groupby(['Year', 'Month'])['Modal_Price'].mean().reset_index()
        monthly_prices = monthly_prices.sort_values(['Year', 'Month'])
        prices = monthly_prices['Modal_Price'].values

        if len(prices) < SEQUENCE_LENGTH:
            return _fallback_prediction(crop, months_ahead)

        scaler = commodity_scalers.get(matched_commodity)
        if scaler is None:
            return _fallback_prediction(crop, months_ahead)

        # Scale recent prices
        recent = prices[-SEQUENCE_LENGTH:]
        scaled = scaler.transform(recent.reshape(-1, 1)).flatten()

        # Predict multiple months
        predictions = []
        current_seq = scaled.copy()

        for _ in range(months_ahead):
            input_seq = current_seq[-SEQUENCE_LENGTH:].reshape(1, SEQUENCE_LENGTH, 1)
            pred = model.predict(input_seq, verbose=0)[0][0]
            predictions.append(pred)
            current_seq = np.append(current_seq, pred)

        # Inverse transform
        predicted_prices = scaler.inverse_transform(np.array(predictions).reshape(-1, 1)).flatten()
        current_price = float(prices[-1])

        month_names = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                       'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
        last_year = int(monthly_prices['Year'].iloc[-1])
        last_month = int(monthly_prices['Month'].iloc[-1])

        forecast = []
        for i, price in enumerate(predicted_prices):
            m = (last_month + i) % 12 + 1
            forecast.append({
                "month": month_names[m - 1],
                "predicted_price": round(float(price), 2),
                "change_percent": round(((float(price) - current_price) / current_price) * 100, 1)
            })

        trend = "upward" if predicted_prices[-1] > current_price else "downward" if predicted_prices[-1] < current_price * 0.98 else "stable"

        # Historical summary
        hist_min = round(float(prices.min()), 2)
        hist_max = round(float(prices.max()), 2)
        hist_avg = round(float(prices.mean()), 2)

        return {
            "crop": matched_commodity,
            "current_price": round(current_price, 2),
            "forecast": forecast,
            "trend": trend,
            "model": "LSTM (Long Short-Term Memory)",
            "dataset": "Price_pred.csv (Real Market Data)",
            "sequence_length": SEQUENCE_LENGTH,
            "unit": "₹/quintal",
            "historical": {
                "min_price": hist_min,
                "max_price": hist_max,
                "avg_price": hist_avg,
                "data_points": len(prices)
            },
            "confidence_note": "Predictions based on real historical market price data using LSTM time-series analysis"
        }
    except Exception as e:
        print(f"LSTM prediction error: {e}")
        return _fallback_prediction(crop, months_ahead)


def _fallback_prediction(crop, months_ahead):
    """Fallback when model fails"""
    month_names = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                   'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    now = datetime.now()
    forecast = []
    base = 2000
    for i in range(months_ahead):
        m = (now.month + i) % 12
        price = base + np.random.normal(0, 100)
        forecast.append({
            "month": month_names[m],
            "predicted_price": round(float(price), 2),
            "change_percent": round(((price - base) / base) * 100, 1)
        })
    return {
        "crop": crop, "current_price": base, "forecast": forecast,
        "trend": "stable", "model": "LSTM (Fallback Mode)",
        "sequence_length": SEQUENCE_LENGTH, "unit": "₹/quintal",
        "confidence_note": "Using fallback estimation — real model not available"
    }


def get_available_crops():
    """Get list of available crops from the trained model"""
    if os.path.exists(META_PATH):
        with open(META_PATH, 'r') as f:
            meta = json.load(f)
        return meta.get('commodities', [])
    return []


if __name__ == "__main__":
    print("=" * 60)
    print("LSTM Price Prediction - Training on Price_pred.csv")
    print("=" * 60)
    model, scalers, meta = train_model(epochs=50)
    print(f"\nTrained on {len(meta['commodities'])} commodities")
    print("\nTest prediction for Rice:")
    result = predict_price("Rice", months_ahead=3)
    print(json.dumps(result, indent=2))
