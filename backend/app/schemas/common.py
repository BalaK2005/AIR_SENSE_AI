"""
Common Schemas
Shared Pydantic models used across the application
"""

from pydantic import BaseModel, Field, validator
from typing import Optional, List, Dict, Any, Generic, TypeVar
from datetime import datetime
from enum import Enum


# Generic type for pagination
T = TypeVar('T')


class PaginationParams(BaseModel):
    """Pagination query parameters"""
    page: int = Field(default=1, ge=1, description="Page number")
    per_page: int = Field(default=20, ge=1, le=100, description="Items per page")
    sort_by: Optional[str] = None
    sort_order: Optional[str] = Field(default="desc", regex="^(asc|desc)$")


class PaginatedResponse(BaseModel, Generic[T]):
    """Generic paginated response"""
    items: List[T]
    total: int
    page: int
    per_page: int
    pages: int
    has_next: bool
    has_prev: bool


class LocationBase(BaseModel):
    """Base location schema"""
    latitude: float = Field(ge=-90, le=90)
    longitude: float = Field(ge=-180, le=180)
    
    @validator('latitude')
    def validate_latitude(cls, v):
        if not -90 <= v <= 90:
            raise ValueError('Latitude must be between -90 and 90')
        return v
    
    @validator('longitude')
    def validate_longitude(cls, v):
        if not -180 <= v <= 180:
            raise ValueError('Longitude must be between -180 and 180')
        return v


class LocationWithName(LocationBase):
    """Location with name"""
    name: str
    address: Optional[str] = None


class Coordinates(BaseModel):
    """Simple coordinates"""
    lat: float
    lon: float


class BoundingBox(BaseModel):
    """Geographic bounding box"""
    north: float
    south: float
    east: float
    west: float


class DateRange(BaseModel):
    """Date range filter"""
    start_date: datetime
    end_date: datetime
    
    @validator('end_date')
    def validate_date_range(cls, v, values):
        if 'start_date' in values and v < values['start_date']:
            raise ValueError('end_date must be after start_date')
        return v


class TimeRange(BaseModel):
    """Time range (hours)"""
    start_hour: int = Field(ge=0, le=23)
    end_hour: int = Field(ge=0, le=23)


class FilterParams(BaseModel):
    """Generic filter parameters"""
    search: Optional[str] = None
    category: Optional[str] = None
    status: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    min_value: Optional[float] = None
    max_value: Optional[float] = None


class SuccessResponse(BaseModel):
    """Standard success response"""
    success: bool = True
    message: str
    data: Optional[Dict[str, Any]] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class ErrorResponse(BaseModel):
    """Standard error response"""
    success: bool = False
    error: str
    error_code: Optional[str] = None
    details: Optional[Dict[str, Any]] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class MessageResponse(BaseModel):
    """Simple message response"""
    message: str
    detail: Optional[str] = None


class StatusResponse(BaseModel):
    """Status response"""
    status: str
    healthy: bool
    components: Dict[str, str]
    version: str
    timestamp: datetime


class FileUpload(BaseModel):
    """File upload information"""
    filename: str
    content_type: str
    size: int
    uploaded_at: datetime


class ExportRequest(BaseModel):
    """Data export request"""
    format: str = Field(regex="^(csv|json|xlsx|pdf)$")
    filters: Optional[Dict[str, Any]] = None
    include_fields: Optional[List[str]] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None


class ImportRequest(BaseModel):
    """Data import request"""
    source: str
    file_url: Optional[str] = None
    mapping: Optional[Dict[str, str]] = None
    validate_only: bool = False


class BatchOperation(BaseModel):
    """Batch operation request"""
    operation: str
    items: List[int]
    parameters: Optional[Dict[str, Any]] = None


class BatchResult(BaseModel):
    """Batch operation result"""
    total: int
    successful: int
    failed: int
    errors: Optional[List[Dict[str, Any]]] = None


class NotificationPreference(BaseModel):
    """Notification preferences"""
    push_enabled: bool = True
    email_enabled: bool = True
    sms_enabled: bool = False
    frequency: str = Field(default="realtime", regex="^(realtime|hourly|daily)$")


class SearchRequest(BaseModel):
    """Search request"""
    query: str = Field(min_length=1)
    filters: Optional[Dict[str, Any]] = None
    limit: int = Field(default=20, ge=1, le=100)


class SearchResult(BaseModel):
    """Search result item"""
    id: int
    type: str
    title: str
    description: Optional[str] = None
    relevance_score: float
    metadata: Optional[Dict[str, Any]] = None


class SearchResponse(BaseModel):
    """Search response"""
    query: str
    results: List[SearchResult]
    total: int
    took_ms: int


class AggregationType(str, Enum):
    """Aggregation types"""
    HOURLY = "hourly"
    DAILY = "daily"
    WEEKLY = "weekly"
    MONTHLY = "monthly"


class AggregationRequest(BaseModel):
    """Aggregation request"""
    aggregation_type: AggregationType
    start_date: datetime
    end_date: datetime
    group_by: Optional[List[str]] = None


class TimeSeriesPoint(BaseModel):
    """Time series data point"""
    timestamp: datetime
    value: float
    metadata: Optional[Dict[str, Any]] = None


class TimeSeriesData(BaseModel):
    """Time series data"""
    label: str
    data: List[TimeSeriesPoint]
    unit: Optional[str] = None
    aggregation: Optional[str] = None


class ChartData(BaseModel):
    """Chart data for visualizations"""
    chart_type: str
    title: str
    labels: List[str]
    datasets: List[Dict[str, Any]]
    options: Optional[Dict[str, Any]] = None


class MetricValue(BaseModel):
    """Single metric value"""
    name: str
    value: float
    unit: Optional[str] = None
    change: Optional[float] = None
    trend: Optional[str] = None


class Dashboard(BaseModel):
    """Dashboard data"""
    title: str
    metrics: List[MetricValue]
    charts: List[ChartData]
    last_updated: datetime


class APIKeyCreate(BaseModel):
    """API key creation request"""
    name: str
    description: Optional[str] = None
    expires_in_days: Optional[int] = Field(None, ge=1, le=365)


class APIKeyResponse(BaseModel):
    """API key response"""
    id: int
    name: str
    key: str
    created_at: datetime
    expires_at: Optional[datetime] = None
    is_active: bool


class WebhookCreate(BaseModel):
    """Webhook creation"""
    url: str = Field(regex="^https?://")
    events: List[str]
    secret: Optional[str] = None
    is_active: bool = True


class WebhookResponse(BaseModel):
    """Webhook response"""
    id: int
    url: str
    events: List[str]
    is_active: bool
    created_at: datetime
    last_triggered: Optional[datetime] = None


class SystemInfo(BaseModel):
    """System information"""
    version: str
    environment: str
    uptime_seconds: int
    total_requests: int
    active_connections: int
    database_status: str
    cache_status: str


class RateLimitInfo(BaseModel):
    """Rate limit information"""
    limit: int
    remaining: int
    reset_at: datetime


class HealthCheck(BaseModel):
    """Health check response"""
    status: str
    checks: Dict[str, str]
    version: str
    timestamp: datetime