# Models module
"""
Models Module
Database models for AirVision application
"""

from app.models.user import User, UserType, SavedLocation
from app.models.aqi_data import AQIData, AQIForecast, AQIHistory
from app.models.alert import (
    Alert,
    AlertType,
    AlertSeverity,
    AlertStatus,
    AlertPreference,
    AlertTemplate,
    NotificationLog
)
from app.models.policy import (
    Policy,
    PolicyCategory,
    PolicyStatus,
    PolicyImpactLevel,
    PolicyLog,
    PolicyRecommendation,
    PolicySimulation,
    PolicyFeedback
)

__all__ = [
    # User models
    "User",
    "UserType",
    "SavedLocation",
    
    # AQI models
    "AQIData",
    "AQIForecast",
    "AQIHistory",
    
    # Alert models
    "Alert",
    "AlertType",
    "AlertSeverity",
    "AlertStatus",
    "AlertPreference",
    "AlertTemplate",
    "NotificationLog",
    
    # Policy models
    "Policy",
    "PolicyCategory",
    "PolicyStatus",
    "PolicyImpactLevel",
    "PolicyLog",
    "PolicyRecommendation",
    "PolicySimulation",
    "PolicyFeedback",
]