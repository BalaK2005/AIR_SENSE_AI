"""
Schemas Module
Pydantic models for request/response validation and serialization
"""

# AQI Schemas
from app.schemas.aqi import (
    AQIBase,
    AQIResponse,
    AQIHistorical,
    AQIByLocation,
    StationInfo,
    HeatmapPoint,
    SourceContribution,
    SourceBreakdown,
    SourceTrend,
    RouteSegment,
    RouteDetails,
    RouteRecommendation,
    AQIStatistics,
    AQIComparison
)

# User Schemas
from app.schemas.aqi import (
    UserBase,
    UserCreate,
    UserLogin,
    UserUpdate,
    UserResponse,
    Token,
    TokenData
)

# Alert Schemas
from app.schemas.aqi import (
    AlertBase,
    AlertCreate,
    AlertResponse,
    AlertPreferenceUpdate
)

# Saved Location Schemas
from app.schemas.aqi import (
    SavedLocationBase,
    SavedLocationCreate,
    SavedLocationResponse
)

# Forecast Schemas
from app.schemas.forecast import (
    ForecastBase,
    ForecastHourly,
    ForecastDaily,
    ForecastResponse,
    ForecastRequest,
    ForecastAccuracy,
    ForecastComparison,
    BatchForecastRequest,
    BatchForecastResponse,
    ForecastAlertThreshold,
    ModelPerformance
)

# Policy Schemas
from app.schemas.policy import (
    PolicyBase,
    PolicyCreate,
    PolicyUpdate,
    PolicyResponse,
    PolicyImpact,
    PolicyRecommendation,
    SimulationRequest,
    PolicySimulation,
    PolicyLogCreate,
    PolicyLogUpdate,
    PolicyLogResponse,
    PolicyEffectiveness,
    PolicyComparison,
    PolicyFeedbackCreate,
    PolicyFeedbackResponse,
    PolicyRecommendationCreate,
    PolicyRecommendationResponse,
    PolicyAnalytics,
    PolicyTrend,
    PolicyCostBenefit
)

# Common Schemas
from app.schemas.common import (
    PaginationParams,
    PaginatedResponse,
    LocationBase,
    LocationWithName,
    Coordinates,
    BoundingBox,
    DateRange,
    TimeRange,
    FilterParams,
    SuccessResponse,
    ErrorResponse,
    MessageResponse,
    StatusResponse,
    FileUpload,
    ExportRequest,
    ImportRequest,
    BatchOperation,
    BatchResult,
    NotificationPreference,
    SearchRequest,
    SearchResult,
    SearchResponse,
    AggregationType,
    AggregationRequest,
    TimeSeriesPoint,
    TimeSeriesData,
    ChartData,
    MetricValue,
    Dashboard,
    APIKeyCreate,
    APIKeyResponse,
    WebhookCreate,
    WebhookResponse,
    SystemInfo,
    RateLimitInfo,
    HealthCheck
)

__all__ = [
    # AQI
    "AQIBase",
    "AQIResponse",
    "AQIHistorical",
    "AQIByLocation",
    "StationInfo",
    "HeatmapPoint",
    "SourceContribution",
    "SourceBreakdown",
    "SourceTrend",
    "RouteSegment",
    "RouteDetails",
    "RouteRecommendation",
    "AQIStatistics",
    "AQIComparison",
    
    # User
    "UserBase",
    "UserCreate",
    "UserLogin",
    "UserUpdate",
    "UserResponse",
    "Token",
    "TokenData",
    
    # Alert
    "AlertBase",
    "AlertCreate",
    "AlertResponse",
    "AlertPreferenceUpdate",
    
    # Location
    "SavedLocationBase",
    "SavedLocationCreate",
    "SavedLocationResponse",
    
    # Forecast
    "ForecastBase",
    "ForecastHourly",
    "ForecastDaily",
    "ForecastResponse",
    "ForecastRequest",
    "ForecastAccuracy",
    "ForecastComparison",
    "BatchForecastRequest",
    "BatchForecastResponse",
    "ForecastAlertThreshold",
    "ModelPerformance",
    
    # Policy
    "PolicyBase",
    "PolicyCreate",
    "PolicyUpdate",
    "PolicyResponse",
    "PolicyImpact",
    "PolicyRecommendation",
    "SimulationRequest",
    "PolicySimulation",
    "PolicyLogCreate",
    "PolicyLogUpdate",
    "PolicyLogResponse",
    "PolicyEffectiveness",
    "PolicyComparison",
    "PolicyFeedbackCreate",
    "PolicyFeedbackResponse",
    "PolicyRecommendationCreate",
    "PolicyRecommendationResponse",
    "PolicyAnalytics",
    "PolicyTrend",
    "PolicyCostBenefit",
    
    # Common
    "PaginationParams",
    "PaginatedResponse",
    "LocationBase",
    "LocationWithName",
    "Coordinates",
    "BoundingBox",
    "DateRange",
    "TimeRange",
    "FilterParams",
    "SuccessResponse",
    "ErrorResponse",
    "MessageResponse",
    "StatusResponse",
    "FileUpload",
    "ExportRequest",
    "ImportRequest",
    "BatchOperation",
    "BatchResult",
    "NotificationPreference",
    "SearchRequest",
    "SearchResult",
    "SearchResponse",
    "AggregationType",
    "AggregationRequest",
    "TimeSeriesPoint",
    "TimeSeriesData",
    "ChartData",
    "MetricValue",
    "Dashboard",
    "APIKeyCreate",
    "APIKeyResponse",
    "WebhookCreate",
    "WebhookResponse",
    "SystemInfo",
    "RateLimitInfo",
    "HealthCheck",
]