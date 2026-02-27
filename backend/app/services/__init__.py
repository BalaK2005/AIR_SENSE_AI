# Services module
"""
Services Module
Business logic and external service integrations
"""

from app.services.cache_service import (
    cache_get,
    cache_set,
    cache_delete,
    cache_delete_pattern,
    cache_exists,
    cache_clear,
    cache_info,
    cache_health_check,
    cached
)

from app.services.data_pipeline import (
    DataPipeline,
    run_data_collection
)

from app.services.notification import (
    NotificationService
)

from app.services.weather_service import (
    WeatherService,
    get_weather_service
)

__all__ = [
    # Cache service
    "cache_get",
    "cache_set",
    "cache_delete",
    "cache_delete_pattern",
    "cache_exists",
    "cache_clear",
    "cache_info",
    "cache_health_check",
    "cached",
    
    # Data pipeline
    "DataPipeline",
    "run_data_collection",
    
    # Notification service
    "NotificationService",
    
    # Weather service
    "WeatherService",
    "get_weather_service",
]