"""
Quick Start Training Script
Trains both models with minimal configuration for quick testing
"""

import os
import sys
import warnings
warnings.filterwarnings('ignore')

print("=" * 70)
print("🚀 AirVision Quick Model Training")
print("=" * 70)

# Check if data exists
data_file = "../../data/processed/aqi_historical.csv"
if not os.path.exists(data_file):
    print("\n❌ ERROR: Data file not found!")
    print(f"   Looking for: {data_file}")
    print("\n💡 Solution: Run sample_data_generator.py first!")
    print("   cd ../..")
    print("   python sample_data_generator.py")
    sys.exit(1)

print("\n✅ Data file found!")
print("\n" + "=" * 70)
print("STEP 1: Training AQI Forecasting Model")
print("=" * 70)

try:
    import numpy as np
    import pandas as pd
    import tensorflow as tf
    from tensorflow import keras
    from sklearn.preprocessing import MinMaxScaler
    from sklearn.model_selection import train_test_split
    import joblib
    
    # Create output directory
    os.makedirs("../trained_models", exist_ok=True)
    
    # Load data
    print("\n📊 Loading data...")
    df = pd.read_csv(data_file)
    print(f"   Loaded {len(df)} records")
    
    # Simple feature selection
    features = ['aqi', 'pm25', 'pm10', 'temperature', 'humidity', 'wind_speed']
    X = df[features].values
    
    # Scale data
    scaler = MinMaxScaler()
    X_scaled = scaler.fit_transform(X)
    
    # Create simple sequences
    sequence_length = 24
    forecast_horizon = 72
    
    X_seq, y_seq = [], []
    for i in range(len(X_scaled) - sequence_length - forecast_horizon):
        X_seq.append(X_scaled[i:i+sequence_length])
        # Predict only AQI (first column) for next 72 hours
        y_seq.append(X_scaled[i+sequence_length:i+sequence_length+forecast_horizon, 0])
    
    X_seq = np.array(X_seq)
    y_seq = np.array(y_seq)
    
    print(f"\n📈 Created {len(X_seq)} training sequences")
    print(f"   Input shape: {X_seq.shape}")
    print(f"   Output shape: {y_seq.shape}")
    
    # Split data
    X_train, X_test, y_train, y_test = train_test_split(X_seq, y_seq, test_size=0.2, shuffle=False)
    
    # Build simple LSTM model
    print("\n🏗️  Building model...")
    model = keras.Sequential([
        keras.layers.LSTM(64, return_sequences=True, input_shape=(sequence_length, len(features))),
        keras.layers.Dropout(0.2),
        keras.layers.LSTM(32),
        keras.layers.Dropout(0.2),
        keras.layers.Dense(forecast_horizon)
    ])
    
    model.compile(optimizer='adam', loss='mse', metrics=['mae'])
    
    print("\n🎓 Training (this may take 5-10 minutes)...")
    history = model.fit(
        X_train, y_train,
        epochs=20,  # Reduced epochs for faster training
        batch_size=32,
        validation_split=0.2,
        verbose=1
    )
    
    # Evaluate
    test_loss, test_mae = model.evaluate(X_test, y_test, verbose=0)
    print(f"\n📊 Test Results:")
    print(f"   MAE: {test_mae:.4f}")
    print(f"   RMSE: {np.sqrt(test_loss):.4f}")
    
    # Save
    model.save("../trained_models/aqi_forecast_lstm.h5")
    joblib.dump(scaler, "../trained_models/aqi_scaler.pkl")
    
    print("\n✅ Forecasting model saved!")
    
except Exception as e:
    print(f"\n❌ Error training forecasting model: {e}")
    import traceback
    traceback.print_exc()

# ============================================================
print("\n" + "=" * 70)
print("STEP 2: Training Source Attribution Models")
print("=" * 70)

try:
    from sklearn.ensemble import RandomForestRegressor
    
    # Create output directory
    os.makedirs("../trained_models/source_attribution", exist_ok=True)
    
    # Load source data
    print("\n📊 Loading source data...")
    source_file = "../../data/processed/pollution_sources.csv"
    df_source = pd.read_csv(source_file)
    print(f"   Loaded {len(df_source)} records")
    
    # Features for source attribution
    feature_cols = ['pm25', 'pm10', 'no2', 'so2', 'temperature', 'humidity', 
                   'wind_speed', 'traffic_density']
    
    X = df_source[feature_cols]
    
    # Train model for each source
    sources = ['vehicular_contribution', 'industrial_contribution', 
               'construction_contribution', 'biomass_contribution', 'dust_contribution']
    
    for source in sources:
        source_name = source.replace('_contribution', '')
        print(f"\n🔧 Training {source_name} model...")
        
        y = df_source[source]
        
        # Split
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
        
        # Train
        model = RandomForestRegressor(n_estimators=100, max_depth=10, random_state=42, n_jobs=-1)
        model.fit(X_train, y_train)
        
        # Evaluate
        score = model.score(X_test, y_test)
        print(f"   R² Score: {score:.4f}")
        
        # Save
        joblib.dump(model, f"../trained_models/source_attribution/{source_name}_model.pkl")
    
    # Save scaler for source models
    scaler_source = MinMaxScaler()
    scaler_source.fit(X)
    joblib.dump(scaler_source, "../trained_models/source_attribution/scaler.pkl")
    
    print("\n✅ All source attribution models saved!")
    
except Exception as e:
    print(f"\n❌ Error training source models: {e}")
    import traceback
    traceback.print_exc()

# ============================================================
print("\n" + "=" * 70)
print("🎉 TRAINING COMPLETE!")
print("=" * 70)

print("\n📁 Created Models:")
print("   ✅ aqi_forecast_lstm.h5")
print("   ✅ aqi_scaler.pkl")
print("   ✅ vehicular_model.pkl")
print("   ✅ industrial_model.pkl")
print("   ✅ construction_model.pkl")
print("   ✅ biomass_burning_model.pkl")
print("   ✅ dust_model.pkl")
print("   ✅ source_attribution/scaler.pkl")

print("\n🚀 Next Steps:")
print("   1. Go back to root: cd ../..")
print("   2. Setup backend: cd backend")
print("   3. Copy backend_main.py to backend/app/main.py")
print("   4. Install backend deps: pip install fastapi uvicorn")
print("   5. Start server: python -m uvicorn app.main:app --reload")

print("\n" + "=" * 70)