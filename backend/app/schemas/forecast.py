"""
Forecast Schemas
Pydantic models for AQI forecast data validation
"""

from pydantic import BaseModel, Field, validator
from typing import Optional, List
from datetime import datetime, date


class ForecastBase(BaseModel):
    """Base forecast schema"""
    station_id: str
    forecasted_aqi: float
    forecast_timestamp: datetime


class ForecastHourly(BaseModel):
    """Hourly forecast data point"""
    timestamp: datetime
    aqi: float
    category: str
    confidence: float = Field(ge=0.0, le=1.0, description="Confidence score 0-1")
    
    class Config:
        from_attributes = True


class ForecastDaily(BaseModel):
    """Daily forecast summary"""
    date: date
    avg_aqi: float
    min_aqi: float
    max_aqi: float
    category: str
    dominant_pollutant: str
    
    class Config:
        from_attributes = True


class ForecastResponse(BaseModel):
    """Complete forecast response"""
    station_id: str
    station_name: str
    location: dict
    current_aqi: float
    hourly_forecast: List[ForecastHourly]
    daily_forecast: Optional[List[ForecastDaily]] = None
    model_info: dict
    timestamp: datetime


class ForecastRequest(BaseModel):
    """Forecast request parameters"""
    station_id: str
    hours: int = Field(default=24, ge=1, le=72, description="Forecast hours (1-72)")
    include_confidence: bool = True


class ForecastAccuracy(BaseModel):
    """Forecast accuracy metrics"""
    station_id: str
    period: str
    mae: float = Field(description="Mean Absolute Error")
    rmse: float = Field(description="Root Mean Square Error")
    accuracy: float = Field(ge=0.0, le=1.0, description="Accuracy percentage")
    data_points: int
    timestamp: datetime


class ForecastComparison(BaseModel):
    """Compare forecast vs actual"""
    timestamp: datetime
    actual_aqi: float
    forecasted_aqi: float
    difference: float
    category_match: bool


class BatchForecastRequest(BaseModel):
    """Batch forecast request"""
    station_ids: List[str]
    hours: int = Field(default=24, ge=1, le=72)


class BatchForecastResponse(BaseModel):
    """Batch forecast response"""
    forecasts: List[dict]
    total_stations: int
    timestamp: datetime


class ForecastAlertThreshold(BaseModel):
    """Forecast alert threshold settings"""
    threshold_aqi: int = Field(ge=0, le=500)
    hours_ahead: int = Field(ge=1, le=72)
    alert_enabled: bool = True


class ModelPerformance(BaseModel):
    """ML model performance metrics"""
    model_name: str
    model_version: str
    accuracy: float
    mae: float
    rmse: float
    r2_score: float
    training_date: datetime
    last_updated: datetime