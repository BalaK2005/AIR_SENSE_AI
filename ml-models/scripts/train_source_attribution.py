"""
Pollution Source Attribution Model
Identifies contribution of different pollution sources (vehicles, industries, construction, etc.)
"""

import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.metrics import mean_squared_error, r2_score, mean_absolute_error
import joblib
import json
from datetime import datetime

class SourceAttributionModel:
    def __init__(self):
        """Initialize Source Attribution Model"""
        self.models = {}
        self.scaler = StandardScaler()
        self.feature_importance = {}
        
    def load_data(self, filepath):
        """Load pollution source data"""
        df = pd.read_csv(filepath)
        
        # Feature engineering
        df['timestamp'] = pd.to_datetime(df['timestamp'])
        df['hour'] = df['timestamp'].dt.hour
        df['day_of_week'] = df['timestamp'].dt.dayofweek
        df['month'] = df['timestamp'].dt.month
        df['is_weekend'] = df['day_of_week'].isin([5, 6]).astype(int)
        df['is_rush_hour'] = df['hour'].isin([8, 9, 18, 19, 20]).astype(int)
        
        # Seasonal features
        df['season'] = df['month'].apply(lambda x: 
            0 if x in [12, 1, 2] else  # Winter
            1 if x in [3, 4, 5] else   # Spring
            2 if x in [6, 7, 8] else   # Summer
            3)  # Fall
        
        return df
    
    def prepare_features(self, df):
        """Prepare features for model training"""
        feature_cols = [
            # Meteorological features
            'temperature', 'humidity', 'wind_speed', 'wind_direction',
            'pressure', 'precipitation',
            
            # Pollutant concentrations
            'pm25', 'pm10', 'no2', 'so2', 'co', 'o3',
            
            # Temporal features
            'hour', 'day_of_week', 'month', 'season',
            'is_weekend', 'is_rush_hour',
            
            # Spatial features (if available)
            'distance_to_industrial', 'distance_to_highway',
            'traffic_density', 'construction_activity'
        ]
        
        # Only use columns that exist in the dataframe
        available_features = [col for col in feature_cols if col in df.columns]
        
        X = df[available_features]
        
        # Target variables (pollution sources)
        target_sources = {
            'vehicular': 'vehicular_contribution',
            'industrial': 'industrial_contribution',
            'construction': 'construction_contribution',
            'biomass_burning': 'biomass_contribution',
            'dust': 'dust_contribution'
        }
        
        y = {}
        for source, col in target_sources.items():
            if col in df.columns:
                y[source] = df[col]
        
        return X, y, available_features
    
    def train(self, data_path):
        """Train source attribution models"""
        print("Loading data...")
        df = self.load_data(data_path)
        
        # Prepare features and targets
        X, y_dict, feature_names = self.prepare_features(df)
        
        # Scale features
        X_scaled = self.scaler.fit_transform(X)
        X_scaled = pd.DataFrame(X_scaled, columns=feature_names)
        
        print(f"\nTraining models for {len(y_dict)} pollution sources...")
        
        # Train separate model for each pollution source
        for source, y in y_dict.items():
            print(f"\n{'='*60}")
            print(f"Training model for: {source.upper()}")
            print(f"{'='*60}")
            
            # Split data
            X_train, X_test, y_train, y_test = train_test_split(
                X_scaled, y, test_size=0.2, random_state=42
            )
            
            # Train Random Forest model
            model = RandomForestRegressor(
                n_estimators=200,
                max_depth=20,
                min_samples_split=5,
                min_samples_leaf=2,
                max_features='sqrt',
                random_state=42,
                n_jobs=-1
            )
            
            model.fit(X_train, y_train)
            
            # Evaluate
            y_pred = model.predict(X_test)
            
            mse = mean_squared_error(y_test, y_pred)
            mae = mean_absolute_error(y_test, y_pred)
            r2 = r2_score(y_test, y_pred)
            
            print(f"MSE: {mse:.4f}")
            print(f"MAE: {mae:.4f}")
            print(f"R² Score: {r2:.4f}")
            print(f"RMSE: {np.sqrt(mse):.4f}")
            
            # Cross-validation
            cv_scores = cross_val_score(model, X_train, y_train, cv=5, 
                                       scoring='r2', n_jobs=-1)
            print(f"Cross-validation R² scores: {cv_scores}")
            print(f"Average CV R²: {cv_scores.mean():.4f} (+/- {cv_scores.std() * 2:.4f})")
            
            # Store model
            self.models[source] = model
            
            # Store feature importance
            importance_df = pd.DataFrame({
                'feature': feature_names,
                'importance': model.feature_importances_
            }).sort_values('importance', ascending=False)
            
            self.feature_importance[source] = importance_df
            
            print(f"\nTop 10 important features for {source}:")
            print(importance_df.head(10).to_string(index=False))
    
    def predict_source_contributions(self, input_data):
        """
        Predict contribution of each pollution source
        
        Args:
            input_data: DataFrame with current environmental conditions
            
        Returns:
            Dictionary with predicted contribution percentage for each source
        """
        # Scale input
        X_scaled = self.scaler.transform(input_data)
        
        predictions = {}
        for source, model in self.models.items():
            pred = model.predict(X_scaled)[0]
            predictions[source] = max(0, min(100, pred))  # Clip between 0-100%
        
        # Normalize to sum to 100%
        total = sum(predictions.values())
        if total > 0:
            predictions = {k: (v/total)*100 for k, v in predictions.items()}
        
        return predictions
    
    def get_source_breakdown(self, input_data, aqi_value):
        """
        Get detailed breakdown of pollution sources
        
        Args:
            input_data: Current environmental data
            aqi_value: Current AQI value
            
        Returns:
            Dictionary with source contributions and recommendations
        """
        contributions = self.predict_source_contributions(input_data)
        
        # Calculate absolute contribution to AQI
        breakdown = []
        for source, percentage in contributions.items():
            contribution_to_aqi = (percentage / 100) * aqi_value
            
            breakdown.append({
                'source': source,
                'percentage': round(percentage, 2),
                'aqi_contribution': round(contribution_to_aqi, 2),
                'severity': self._get_severity(percentage),
                'recommendation': self._get_recommendation(source, percentage)
            })
        
        # Sort by contribution
        breakdown.sort(key=lambda x: x['percentage'], reverse=True)
        
        return {
            'total_aqi': aqi_value,
            'breakdown': breakdown,
            'dominant_source': breakdown[0]['source'],
            'timestamp': datetime.now().isoformat()
        }
    
    def _get_severity(self, percentage):
        """Classify severity based on contribution percentage"""
        if percentage > 40:
            return 'Critical'
        elif percentage > 25:
            return 'High'
        elif percentage > 15:
            return 'Moderate'
        else:
            return 'Low'
    
    def _get_recommendation(self, source, percentage):
        """Generate policy recommendations based on source contribution"""
        recommendations = {
            'vehicular': {
                'Critical': 'Implement odd-even vehicle restrictions immediately',
                'High': 'Increase public transport frequency, discourage private vehicles',
                'Moderate': 'Promote carpooling and electric vehicles',
                'Low': 'Continue vehicle emission monitoring'
            },
            'industrial': {
                'Critical': 'Temporary shutdown of high-polluting industries',
                'High': 'Enforce stricter emission standards, reduce operating hours',
                'Moderate': 'Increase industrial emission inspections',
                'Low': 'Regular monitoring of industrial zones'
            },
            'construction': {
                'Critical': 'Ban all construction activities immediately',
                'High': 'Limit construction to essential projects only',
                'Moderate': 'Enforce dust control measures strictly',
                'Low': 'Regular construction site inspections'
            },
            'biomass_burning': {
                'Critical': 'Deploy rapid response teams to prevent crop burning',
                'High': 'Increase awareness campaigns and provide alternatives',
                'Moderate': 'Monitor hotspots using satellite data',
                'Low': 'Continue farmer education programs'
            },
            'dust': {
                'Critical': 'Increase water sprinkling on roads and construction sites',
                'High': 'Deploy mechanical sweepers, increase green cover',
                'Moderate': 'Regular road cleaning and maintenance',
                'Low': 'Continue urban greening initiatives'
            }
        }
        
        severity = self._get_severity(percentage)
        return recommendations.get(source, {}).get(severity, 'Monitor regularly')
    
    def save_models(self, base_path='source_attribution'):
        """Save all trained models"""
        import os
        os.makedirs(base_path, exist_ok=True)
        
        # Save each model
        for source, model in self.models.items():
            model_path = f"{base_path}/{source}_model.pkl"
            joblib.dump(model, model_path)
            print(f"Saved {source} model to {model_path}")
        
        # Save scaler
        scaler_path = f"{base_path}/scaler.pkl"
        joblib.dump(self.scaler, scaler_path)
        
        # Save feature importance
        for source, importance_df in self.feature_importance.items():
            importance_df.to_csv(f"{base_path}/{source}_feature_importance.csv", index=False)
        
        # Save metadata
        metadata = {
            'sources': list(self.models.keys()),
            'num_features': self.scaler.n_features_in_,
            'trained_at': datetime.now().isoformat()
        }
        
        with open(f"{base_path}/metadata.json", 'w') as f:
            json.dump(metadata, f, indent=2)
        
        print(f"\n✅ All models saved to {base_path}/")
    
    def load_models(self, base_path='source_attribution'):
        """Load trained models"""
        import os
        
        # Load scaler
        scaler_path = f"{base_path}/scaler.pkl"
        self.scaler = joblib.load(scaler_path)
        
        # Load metadata
        with open(f"{base_path}/metadata.json", 'r') as f:
            metadata = json.load(f)
        
        # Load each model
        for source in metadata['sources']:
            model_path = f"{base_path}/{source}_model.pkl"
            self.models[source] = joblib.load(model_path)
        
        print(f"✅ Loaded models for sources: {', '.join(self.models.keys())}")


# Training script
if __name__ == "__main__":
    # Initialize model
    model = SourceAttributionModel()
    
    # Train models (replace with your actual data path)
    model.train(data_path='data/processed/pollution_sources.csv')
    
    # Save models
    model.save_models()
    
    print("\n✅ Source Attribution Models Training Complete!")