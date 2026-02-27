"""
Forecast Endpoints
Handles AQI forecasting using ML models
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timedelta
import numpy as np

from app.core.database import get_db
from app.schemas.forecast import ForecastResponse, ForecastHourly, ForecastDaily
from app.services.cache_service import cache_get, cache_set
from app.core.security import get_current_user
import pickle
import tensorflow as tf

router = APIRouter()

# Load ML model (this would be done once at startup in production)
FORECAST_MODEL = None


def load_forecast_model():
    """Load the trained LSTM model"""
    global FORECAST_MODEL
    if FORECAST_MODEL is None:
        try:
            FORECAST_MODEL = tf.keras.models.load_model('ml-models/trained_models/aqi_forecast_lstm.h5')
        except Exception as e:
            print(f"Warning: Could not load forecast model: {e}")
    return FORECAST_MODEL


@router.get("/hourly", response_model=List[ForecastHourly])
async def get_hourly_forecast(
    station_id: str = Query(..., description="Station ID"),
    hours: int = Query(72, ge=1, le=72, description="Forecast hours (max 72)"),
    db: Session = Depends(get_db)
):
    """
    Get hourly AQI forecast for next 72 hours
    """
    try:
        cache_key = f"forecast_hourly_{station_id}_{hours}"
        cached_data = cache_get(cache_key)
        if cached_data:
            return cached_data

        # Load model
        model = load_forecast_model()
        if model is None:
            # Return mock data if model not available
            return _generate_mock_hourly_forecast(station_id, hours)

        # Get historical data for prediction
        from app.models.aqi_data import AQIData
        
        historical = db.query(AQIData).filter(
            AQIData.station_id == station_id
        ).order_by(AQIData.timestamp.desc()).limit(168).all()  # Last 7 days

        if not historical:
            raise HTTPException(
                status_code=404,
                detail=f"No historical data for station {station_id}"
            )

        # Prepare input data
        features = _prepare_forecast_features(historical)
        
        # Generate predictions
        predictions = model.predict(features)
        
        # Format response
        forecast_data = []
        current_time = datetime.utcnow()
        
        for i in range(hours):
            forecast_time = current_time + timedelta(hours=i+1)
            aqi_value = float(predictions[i][0]) if i < len(predictions) else historical[0].aqi
            
            forecast_data.append(
                ForecastHourly(
                    timestamp=forecast_time,
                    aqi=max(0, min(500, aqi_value)),  # Clamp between 0-500
                    category=_get_aqi_category(aqi_value),
                    confidence=_calculate_confidence(i)
                )
            )

        # Cache for 30 minutes
        cache_set(cache_key, forecast_data, ttl=1800)
        
        return forecast_data

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating forecast: {str(e)}")


@router.get("/daily", response_model=List[ForecastDaily])
async def get_daily_forecast(
    station_id: str = Query(..., description="Station ID"),
    days: int = Query(7, ge=1, le=7, description="Forecast days (max 7)"),
    db: Session = Depends(get_db)
):
    """
    Get daily AQI forecast summary
    """
    try:
        cache_key = f"forecast_daily_{station_id}_{days}"
        cached_data = cache_get(cache_key)
        if cached_data:
            return cached_data

        # Get hourly forecast
        hourly_data = await get_hourly_forecast(station_id=station_id, hours=days*24, db=db)
        
        # Aggregate by day
        daily_forecasts = []
        current_date = datetime.utcnow().date()
        
        for day in range(days):
            forecast_date = current_date + timedelta(days=day)
            
            # Get hourly forecasts for this day
            day_start = datetime.combine(forecast_date, datetime.min.time())
            day_end = datetime.combine(forecast_date, datetime.max.time())
            
            day_data = [
                h for h in hourly_data 
                if day_start <= h.timestamp <= day_end
            ]
            
            if day_data:
                aqi_values = [h.aqi for h in day_data]
                daily_forecasts.append(
                    ForecastDaily(
                        date=forecast_date,
                        avg_aqi=np.mean(aqi_values),
                        min_aqi=min(aqi_values),
                        max_aqi=max(aqi_values),
                        category=_get_aqi_category(np.mean(aqi_values)),
                        dominant_pollutant="PM2.5"  # Would be determined by model
                    )
                )

        # Cache for 1 hour
        cache_set(cache_key, daily_forecasts, ttl=3600)
        
        return daily_forecasts

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating daily forecast: {str(e)}")


@router.get("/map", response_model=List[dict])
async def get_forecast_map(
    hours_ahead: int = Query(24, ge=1, le=72, description="Hours ahead"),
    db: Session = Depends(get_db)
):
    """
    Get forecast data for all stations (for map visualization)
    """
    try:
        cache_key = f"forecast_map_{hours_ahead}"
        cached_data = cache_get(cache_key)
        if cached_data:
            return cached_data

        # Get all active stations
        from app.models.aqi_data import AQIData
        
        stations = db.query(
            AQIData.station_id,
            AQIData.station_name,
            AQIData.latitude,
            AQIData.longitude
        ).filter(
            AQIData.timestamp >= datetime.utcnow() - timedelta(hours=24)
        ).distinct().all()

        forecast_map = []
        
        for station in stations:
            try:
                # Get forecast for this station
                hourly_forecast = await get_hourly_forecast(
                    station_id=station.station_id,
                    hours=hours_ahead,
                    db=db
                )
                
                # Get forecast for specified hour
                target_forecast = hourly_forecast[hours_ahead - 1] if hours_ahead <= len(hourly_forecast) else hourly_forecast[-1]
                
                forecast_map.append({
                    "station_id": station.station_id,
                    "station_name": station.station_name,
                    "latitude": station.latitude,
                    "longitude": station.longitude,
                    "forecasted_aqi": target_forecast.aqi,
                    "category": target_forecast.category,
                    "timestamp": target_forecast.timestamp
                })
            except:
                continue

        # Cache for 30 minutes
        cache_set(cache_key, forecast_map, ttl=1800)
        
        return forecast_map

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating forecast map: {str(e)}")


@router.get("/comparison/{station_id}")
async def get_forecast_comparison(
    station_id: str,
    db: Session = Depends(get_db)
):
    """
    Compare forecast accuracy with actual values
    """
    try:
        from app.models.aqi_data import AQIData
        
        # Get actual data from past 24 hours
        actual_data = db.query(AQIData).filter(
            AQIData.station_id == station_id,
            AQIData.timestamp >= datetime.utcnow() - timedelta(hours=24)
        ).order_by(AQIData.timestamp.asc()).all()

        if not actual_data:
            raise HTTPException(
                status_code=404,
                detail="No actual data available for comparison"
            )

        # In production, you would compare with stored forecasts
        # For now, return sample comparison
        comparison = {
            "station_id": station_id,
            "period": "24h",
            "mae": 15.2,  # Mean Absolute Error
            "rmse": 21.5,  # Root Mean Square Error
            "accuracy": 0.87,  # Percentage accuracy
            "data_points": [
                {
                    "timestamp": d.timestamp,
                    "actual_aqi": d.aqi,
                    "forecasted_aqi": d.aqi + np.random.uniform(-20, 20)  # Mock forecast
                }
                for d in actual_data[:24]
            ]
        }

        return comparison

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating comparison: {str(e)}")


# Helper functions
def _prepare_forecast_features(historical_data):
    """Prepare features for ML model"""
    # Extract relevant features (simplified version)
    features = []
    for record in historical_data[:168]:  # Use last 168 hours (7 days)
        features.append([
            record.aqi,
            record.pm25 or 0,
            record.pm10 or 0,
            record.timestamp.hour,
            record.timestamp.weekday()
        ])
    
    return np.array([features])


def _calculate_confidence(hours_ahead):
    """Calculate confidence score based on forecast horizon"""
    # Confidence decreases with time
    base_confidence = 0.95
    decay_rate = 0.01
    return max(0.5, base_confidence - (decay_rate * hours_ahead))


def _get_aqi_category(aqi: float) -> str:
    """Helper function to determine AQI category"""
    if aqi <= 50:
        return "Good"
    elif aqi <= 100:
        return "Satisfactory"
    elif aqi <= 200:
        return "Moderate"
    elif aqi <= 300:
        return "Poor"
    elif aqi <= 400:
        return "Very Poor"
    else:
        return "Severe"


def _generate_mock_hourly_forecast(station_id: str, hours: int) -> List[ForecastHourly]:
    """Generate mock forecast data when model is not available"""
    base_aqi = 150 + np.random.uniform(-30, 30)
    forecast_data = []
    current_time = datetime.utcnow()
    
    for i in range(hours):
        # Add some variation
        variation = np.sin(i * 0.1) * 20 + np.random.uniform(-10, 10)
        aqi_value = base_aqi + variation
        
        forecast_data.append(
            ForecastHourly(
                timestamp=current_time + timedelta(hours=i+1),
                aqi=max(0, min(500, aqi_value)),
                category=_get_aqi_category(aqi_value),
                confidence=_calculate_confidence(i)
            )
        )
    
    return forecast_data