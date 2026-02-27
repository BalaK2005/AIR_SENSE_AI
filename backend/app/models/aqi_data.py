"""
AQI Data Model
Database model for air quality index measurements
"""

from sqlalchemy import Column, Integer, String, Float, DateTime, Text, Index
from datetime import datetime

from app.core.database import Base


class AQIData(Base):
    """
    AQI Data model for storing air quality measurements
    """
    __tablename__ = "aqi_data"

    id = Column(Integer, primary_key=True, index=True)
    
    # Station information
    station_id = Column(String(100), nullable=False, index=True)
    station_name = Column(String(255), nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    
    # Location details
    city = Column(String(100), nullable=True)
    state = Column(String(100), nullable=True)
    region = Column(String(100), nullable=True)
    
    # AQI and pollutants
    aqi = Column(Float, nullable=False, index=True)
    category = Column(String(50), nullable=True)
    
    # Individual pollutant measurements (µg/m³)
    pm25 = Column(Float, nullable=True)  # PM2.5
    pm10 = Column(Float, nullable=True)  # PM10
    co = Column(Float, nullable=True)    # Carbon Monoxide
    no2 = Column(Float, nullable=True)   # Nitrogen Dioxide
    so2 = Column(Float, nullable=True)   # Sulfur Dioxide
    o3 = Column(Float, nullable=True)    # Ozone
    nh3 = Column(Float, nullable=True)   # Ammonia
    
    # Sub-indices for each pollutant
    pm25_subindex = Column(Float, nullable=True)
    pm10_subindex = Column(Float, nullable=True)
    co_subindex = Column(Float, nullable=True)
    no2_subindex = Column(Float, nullable=True)
    so2_subindex = Column(Float, nullable=True)
    o3_subindex = Column(Float, nullable=True)
    
    # Prominent pollutant
    prominent_pollutant = Column(String(50), nullable=True)
    
    # Weather data (if available)
    temperature = Column(Float, nullable=True)  # Celsius
    humidity = Column(Float, nullable=True)     # Percentage
    wind_speed = Column(Float, nullable=True)   # km/h
    wind_direction = Column(String(10), nullable=True)
    pressure = Column(Float, nullable=True)     # hPa
    
    # Data quality
    data_quality = Column(String(20), nullable=True)  # good, moderate, poor
    data_source = Column(String(100), nullable=True)  # CPCB, State Board, etc.
    
    # Timestamps
    timestamp = Column(DateTime, nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Additional metadata
    notes = Column(Text, nullable=True)
    is_verified = Column(Integer, default=1)  # 1 for verified, 0 for unverified
    
    # Create composite indexes for common queries
    __table_args__ = (
        Index('idx_station_timestamp', 'station_id', 'timestamp'),
        Index('idx_location_timestamp', 'latitude', 'longitude', 'timestamp'),
        Index('idx_aqi_timestamp', 'aqi', 'timestamp'),
        Index('idx_region_timestamp', 'region', 'timestamp'),
    )
    
    def __repr__(self):
        return f"<AQIData(id={self.id}, station='{self.station_name}', aqi={self.aqi}, timestamp={self.timestamp})>"
    
    def to_dict(self):
        """Convert model to dictionary"""
        return {
            "id": self.id,
            "station_id": self.station_id,
            "station_name": self.station_name,
            "latitude": self.latitude,
            "longitude": self.longitude,
            "city": self.city,
            "state": self.state,
            "region": self.region,
            "aqi": self.aqi,
            "category": self.category,
            "pm25": self.pm25,
            "pm10": self.pm10,
            "co": self.co,
            "no2": self.no2,
            "so2": self.so2,
            "o3": self.o3,
            "prominent_pollutant": self.prominent_pollutant,
            "temperature": self.temperature,
            "humidity": self.humidity,
            "wind_speed": self.wind_speed,
            "timestamp": self.timestamp.isoformat() if self.timestamp else None
        }
    
    def get_aqi_category(self):
        """Get AQI category based on value"""
        if self.aqi <= 50:
            return "Good"
        elif self.aqi <= 100:
            return "Satisfactory"
        elif self.aqi <= 200:
            return "Moderate"
        elif self.aqi <= 300:
            return "Poor"
        elif self.aqi <= 400:
            return "Very Poor"
        else:
            return "Severe"


class AQIForecast(Base):
    """
    AQI Forecast model for storing predicted air quality
    """
    __tablename__ = "aqi_forecasts"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Station information
    station_id = Column(String(100), nullable=False, index=True)
    station_name = Column(String(255), nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    
    # Forecast data
    forecasted_aqi = Column(Float, nullable=False)
    forecasted_category = Column(String(50), nullable=True)
    confidence_score = Column(Float, nullable=True)  # 0-1 scale
    
    # Forecast horizon
    forecast_timestamp = Column(DateTime, nullable=False, index=True)
    hours_ahead = Column(Integer, nullable=False)
    
    # Model information
    model_version = Column(String(50), nullable=True)
    model_type = Column(String(50), nullable=True)  # LSTM, RandomForest, etc.
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    
    __table_args__ = (
        Index('idx_station_forecast', 'station_id', 'forecast_timestamp'),
    )
    
    def __repr__(self):
        return f"<AQIForecast(id={self.id}, station='{self.station_name}', aqi={self.forecasted_aqi})>"


class AQIHistory(Base):
    """
    Aggregated historical AQI data (for faster queries)
    """
    __tablename__ = "aqi_history"
    
    id = Column(Integer, primary_key=True, index=True)
    
    station_id = Column(String(100), nullable=False, index=True)
    station_name = Column(String(255), nullable=False)
    
    # Aggregation period
    date = Column(DateTime, nullable=False, index=True)
    aggregation_type = Column(String(20), nullable=False)  # hourly, daily, weekly, monthly
    
    # Aggregated values
    avg_aqi = Column(Float, nullable=False)
    min_aqi = Column(Float, nullable=False)
    max_aqi = Column(Float, nullable=False)
    
    # Pollutant averages
    avg_pm25 = Column(Float, nullable=True)
    avg_pm10 = Column(Float, nullable=True)
    avg_co = Column(Float, nullable=True)
    avg_no2 = Column(Float, nullable=True)
    avg_so2 = Column(Float, nullable=True)
    avg_o3 = Column(Float, nullable=True)
    
    # Statistics
    data_points_count = Column(Integer, nullable=False)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    __table_args__ = (
        Index('idx_station_date', 'station_id', 'date'),
        Index('idx_date_aggregation', 'date', 'aggregation_type'),
    )
    
    def __repr__(self):
        return f"<AQIHistory(station='{self.station_name}', date={self.date}, avg_aqi={self.avg_aqi})>"