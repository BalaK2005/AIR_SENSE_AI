"""
AQI Schemas
Pydantic models for AQI data validation and serialization
"""

from pydantic import BaseModel, Field, validator
from typing import Optional, List
from datetime import datetime


# Base AQI schemas
class AQIBase(BaseModel):
    """Base AQI schema"""
    station_id: str
    station_name: str
    latitude: float
    longitude: float
    aqi: float


class AQIResponse(AQIBase):
    """AQI response schema"""
    category: str
    pm25: Optional[float] = None
    pm10: Optional[float] = None
    co: Optional[float] = None
    no2: Optional[float] = None
    so2: Optional[float] = None
    o3: Optional[float] = None
    prominent_pollutant: Optional[str] = None
    temperature: Optional[float] = None
    humidity: Optional[float] = None
    wind_speed: Optional[float] = None
    timestamp: datetime
    
    class Config:
        from_attributes = True


class AQIHistorical(BaseModel):
    """Historical AQI data point"""
    timestamp: datetime
    aqi: float
    pm25: Optional[float] = None
    pm10: Optional[float] = None
    category: str
    
    class Config:
        from_attributes = True


class AQIByLocation(BaseModel):
    """AQI data grouped by location"""
    location: str
    current_aqi: float
    category: str
    stations_count: int
    avg_pm25: Optional[float] = None
    avg_pm10: Optional[float] = None
    timestamp: datetime


class StationInfo(BaseModel):
    """Station information"""
    station_id: str
    station_name: str
    latitude: float
    longitude: float
    city: Optional[str] = None
    state: Optional[str] = None
    region: Optional[str] = None
    
    class Config:
        from_attributes = True


class HeatmapPoint(BaseModel):
    """Heatmap data point"""
    lat: float
    lng: float
    intensity: float
    aqi: float
    station_name: str


# Source Attribution schemas
class SourceContribution(BaseModel):
    """Individual source contribution"""
    source: str
    percentage: float
    contribution_ug_m3: float
    trend: str = "stable"


class SourceBreakdown(BaseModel):
    """Pollution source breakdown"""
    region: str
    timestamp: datetime
    total_aqi: float
    sources: List[SourceContribution]
    dominant_source: str


class SourceTrend(BaseModel):
    """Temporal source trend"""
    date: datetime
    sources: dict
    total_aqi: float


# Route schemas
class RouteSegment(BaseModel):
    """Route segment with AQI data"""
    start: dict
    end: dict
    avg_aqi: float
    distance_km: float
    category: str


class RouteDetails(BaseModel):
    """Detailed route information"""
    name: str
    distance_km: float
    avg_aqi: float
    category: str
    estimated_time_minutes: int
    health_impact: str
    waypoints: List[tuple]
    segments: List[RouteSegment]


class RouteRecommendation(BaseModel):
    """Safe route recommendation"""
    safest_route: RouteDetails
    alternative_routes: List[RouteDetails]
    travel_mode: str
    timestamp: datetime


# User schemas
class UserBase(BaseModel):
    """Base user schema"""
    email: str
    username: str
    full_name: Optional[str] = None


class UserCreate(UserBase):
    """User creation schema"""
    password: str = Field(..., min_length=8)
    user_type: Optional[str] = "citizen"
    
    @validator('password')
    def validate_password(cls, v):
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters long')
        return v


class UserLogin(BaseModel):
    """User login schema"""
    username: str
    password: str


class UserUpdate(BaseModel):
    """User update schema"""
    email: Optional[str] = None
    full_name: Optional[str] = None
    password: Optional[str] = None
    location: Optional[str] = None
    phone_number: Optional[str] = None


class UserResponse(UserBase):
    """User response schema"""
    id: int
    user_type: str
    is_active: bool
    is_verified: bool = False
    location: Optional[str] = None
    created_at: datetime
    last_login: Optional[datetime] = None
    
    class Config:
        from_attributes = True


class Token(BaseModel):
    """JWT token response"""
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    user: Optional[UserResponse] = None


class TokenData(BaseModel):
    """Token payload data"""
    username: Optional[str] = None
    user_id: Optional[int] = None
    user_type: Optional[str] = None


# Alert schemas
class AlertBase(BaseModel):
    """Base alert schema"""
    title: str
    message: str
    alert_type: str
    severity: str = "info"


class AlertCreate(AlertBase):
    """Alert creation schema"""
    user_id: int
    location: Optional[str] = None
    latitude: Optional[str] = None
    longitude: Optional[str] = None
    aqi_value: Optional[int] = None
    station_id: Optional[str] = None


class AlertResponse(AlertBase):
    """Alert response schema"""
    id: int
    user_id: int
    status: str
    location: Optional[str] = None
    aqi_value: Optional[int] = None
    created_at: datetime
    read_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


class AlertPreferenceUpdate(BaseModel):
    """Alert preference update schema"""
    alerts_enabled: Optional[bool] = None
    aqi_threshold: Optional[int] = None
    threshold_alerts_enabled: Optional[bool] = None
    health_alerts_enabled: Optional[bool] = None
    forecast_alerts_enabled: Optional[bool] = None
    push_notifications: Optional[bool] = None
    email_notifications: Optional[bool] = None


# Saved Location schemas
class SavedLocationBase(BaseModel):
    """Base saved location schema"""
    name: str
    address: Optional[str] = None
    latitude: str
    longitude: str


class SavedLocationCreate(SavedLocationBase):
    """Saved location creation schema"""
    is_home: bool = False
    is_work: bool = False


class SavedLocationResponse(SavedLocationBase):
    """Saved location response schema"""
    id: int
    user_id: int
    is_home: bool
    is_work: bool
    created_at: datetime
    
    class Config:
        from_attributes = True


# Pagination schema
class PaginatedResponse(BaseModel):
    """Generic paginated response"""
    items: List[dict]
    total: int
    page: int
    per_page: int
    pages: int


# Error schema
class ErrorResponse(BaseModel):
    """Error response schema"""
    detail: str
    error_code: Optional[str] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)


# Health check schema
class HealthCheckResponse(BaseModel):
    """Health check response"""
    status: str
    database: str
    cache: str
    version: str
    timestamp: datetime


# Statistics schema
class AQIStatistics(BaseModel):
    """AQI statistics"""
    region: str
    avg_aqi: float
    min_aqi: float
    max_aqi: float
    median_aqi: float
    category: str
    stations_count: int
    data_points: int
    timestamp: datetime


# Comparison schema
class AQIComparison(BaseModel):
    """Compare AQI across locations"""
    locations: List[dict]
    comparison_date: datetime
    summary: dict