"""
AQI Forecasting Model - LSTM Implementation
Predicts AQI for next 72 hours based on historical data
"""

import numpy as np
import pandas as pd
import tensorflow as tf
from tensorflow import keras
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import LSTM, Dense, Dropout
from tensorflow.keras.callbacks import EarlyStopping, ModelCheckpoint
from sklearn.preprocessing import MinMaxScaler
from sklearn.model_selection import train_test_split
import joblib
import json
from datetime import datetime, timedelta

class AQIForecaster:
    def __init__(self, sequence_length=24):
        """
        Initialize AQI Forecaster
        
        Args:
            sequence_length: Number of past hours to use for prediction
        """
        self.sequence_length = sequence_length
        self.model = None
        self.scaler = MinMaxScaler(feature_range=(0, 1))
        
    def load_data(self, filepath):
        """Load and preprocess AQI data"""
        df = pd.read_csv(filepath)
        
        # Convert timestamp to datetime
        df['timestamp'] = pd.to_datetime(df['timestamp'])
        df = df.sort_values('timestamp')
        
        # Feature engineering
        df['hour'] = df['timestamp'].dt.hour
        df['day_of_week'] = df['timestamp'].dt.dayofweek
        df['month'] = df['timestamp'].dt.month
        
        # Add lag features
        for lag in [1, 3, 6, 12, 24]:
            df[f'aqi_lag_{lag}'] = df['aqi'].shift(lag)
        
        # Add rolling statistics
        df['aqi_rolling_mean_6h'] = df['aqi'].rolling(window=6).mean()
        df['aqi_rolling_std_6h'] = df['aqi'].rolling(window=6).std()
        df['aqi_rolling_mean_24h'] = df['aqi'].rolling(window=24).mean()
        
        # Drop NaN values created by lag and rolling
        df = df.dropna()
        
        return df
    
    def create_sequences(self, data, target_col='aqi'):
        """Create sequences for LSTM training"""
        X, y = [], []
        
        for i in range(len(data) - self.sequence_length - 72):  # Predict 72 hours ahead
            # Input sequence
            X.append(data[i:(i + self.sequence_length)])
            # Target: next 72 hours of AQI
            y.append(data[i + self.sequence_length:i + self.sequence_length + 72, 
                         data.columns.get_loc(target_col)])
        
        return np.array(X), np.array(y)
    
    def build_model(self, input_shape, output_shape):
        """Build LSTM model architecture"""
        model = Sequential([
            LSTM(128, return_sequences=True, input_shape=input_shape),
            Dropout(0.2),
            LSTM(64, return_sequences=True),
            Dropout(0.2),
            LSTM(32, return_sequences=False),
            Dropout(0.2),
            Dense(64, activation='relu'),
            Dense(output_shape, activation='linear')
        ])
        
        model.compile(
            optimizer=keras.optimizers.Adam(learning_rate=0.001),
            loss='mean_squared_error',
            metrics=['mae', 'mse']
        )
        
        return model
    
    def train(self, data_path, epochs=100, batch_size=32, validation_split=0.2):
        """Train the forecasting model"""
        print("Loading data...")
        df = self.load_data(data_path)
        
        # Select features
        feature_cols = ['aqi', 'pm25', 'pm10', 'temperature', 'humidity', 
                       'wind_speed', 'hour', 'day_of_week', 'month',
                       'aqi_lag_1', 'aqi_lag_3', 'aqi_lag_6', 'aqi_lag_12', 'aqi_lag_24',
                       'aqi_rolling_mean_6h', 'aqi_rolling_std_6h', 'aqi_rolling_mean_24h']
        
        # Scale features
        scaled_data = self.scaler.fit_transform(df[feature_cols])
        scaled_df = pd.DataFrame(scaled_data, columns=feature_cols)
        
        # Create sequences
        print("Creating sequences...")
        X, y = self.create_sequences(scaled_df.values)
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, shuffle=False
        )
        
        print(f"Training samples: {X_train.shape[0]}")
        print(f"Testing samples: {X_test.shape[0]}")
        print(f"Input shape: {X_train.shape[1:]}")
        print(f"Output shape: {y_train.shape[1]}")
        
        # Build model
        print("Building model...")
        self.model = self.build_model(
            input_shape=(X_train.shape[1], X_train.shape[2]),
            output_shape=y_train.shape[1]
        )
        
        # Callbacks
        callbacks = [
            EarlyStopping(monitor='val_loss', patience=10, restore_best_weights=True),
            ModelCheckpoint('aqi_forecast_best.h5', save_best_only=True, monitor='val_loss')
        ]
        
        # Train
        print("Training model...")
        history = self.model.fit(
            X_train, y_train,
            epochs=epochs,
            batch_size=batch_size,
            validation_split=validation_split,
            callbacks=callbacks,
            verbose=1
        )
        
        # Evaluate
        print("\nEvaluating model...")
        test_loss, test_mae, test_mse = self.model.evaluate(X_test, y_test)
        print(f"Test Loss: {test_loss:.4f}")
        print(f"Test MAE: {test_mae:.4f}")
        print(f"Test RMSE: {np.sqrt(test_mse):.4f}")
        
        return history
    
    def predict(self, recent_data):
        """
        Predict AQI for next 72 hours
        
        Args:
            recent_data: DataFrame with last 'sequence_length' hours of data
            
        Returns:
            Array of predicted AQI values for next 72 hours
        """
        # Prepare input
        feature_cols = ['aqi', 'pm25', 'pm10', 'temperature', 'humidity', 
                       'wind_speed', 'hour', 'day_of_week', 'month',
                       'aqi_lag_1', 'aqi_lag_3', 'aqi_lag_6', 'aqi_lag_12', 'aqi_lag_24',
                       'aqi_rolling_mean_6h', 'aqi_rolling_std_6h', 'aqi_rolling_mean_24h']
        
        scaled_input = self.scaler.transform(recent_data[feature_cols])
        X_input = scaled_input.reshape(1, self.sequence_length, len(feature_cols))
        
        # Predict
        scaled_prediction = self.model.predict(X_input, verbose=0)
        
        # Inverse transform only the AQI column
        # Create dummy array with same shape as original features
        dummy = np.zeros((scaled_prediction.shape[1], len(feature_cols)))
        dummy[:, 0] = scaled_prediction[0]  # AQI is first column
        
        prediction = self.scaler.inverse_transform(dummy)[:, 0]
        
        return prediction
    
    def save_model(self, model_path='aqi_forecast_lstm.h5', scaler_path='aqi_scaler.pkl'):
        """Save trained model and scaler"""
        self.model.save(model_path)
        joblib.dump(self.scaler, scaler_path)
        
        # Save metadata
        metadata = {
            'sequence_length': self.sequence_length,
            'model_path': model_path,
            'scaler_path': scaler_path,
            'trained_at': datetime.now().isoformat()
        }
        
        with open('aqi_model_metadata.json', 'w') as f:
            json.dump(metadata, f, indent=2)
        
        print(f"Model saved to {model_path}")
        print(f"Scaler saved to {scaler_path}")
    
    def load_model(self, model_path='aqi_forecast_lstm.h5', scaler_path='aqi_scaler.pkl'):
        """Load trained model and scaler"""
        self.model = keras.models.load_model(model_path)
        self.scaler = joblib.load(scaler_path)
        print("Model loaded successfully")


# Training script
if __name__ == "__main__":
    # Initialize forecaster
    forecaster = AQIForecaster(sequence_length=24)
    
    # Train model (replace with your actual data path)
    history = forecaster.train(
        data_path='data/processed/aqi_historical.csv',
        epochs=50,
        batch_size=32
    )
    
    # Save model
    forecaster.save_model()
    
    print("\n✅ AQI Forecasting Model Training Complete!")