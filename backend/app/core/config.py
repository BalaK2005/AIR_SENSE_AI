"""
Configuration Settings
Manages all application settings and environment variables
"""

from pydantic_settings import BaseSettings
from typing import Optional, List
from functools import lru_cache


class Settings(BaseSettings):
    """
    Application settings loaded from environment variables
    """
    
    # Application Info
    APP_NAME: str = "AirVision API"
    APP_VERSION: str = "1.0.0"
    APP_DESCRIPTION: str = "Hyperlocal Air Quality Monitoring & Policy Platform"
    DEBUG: bool = False
    
    # API Configuration
    API_V1_PREFIX: str = "/api/v1"
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    
    # Security
    SECRET_KEY: str = "your-secret-key-change-this-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    REFRESH_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # CORS Settings
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:8080",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
    ]
    CORS_ALLOW_CREDENTIALS: bool = True
    CORS_ALLOW_METHODS: List[str] = ["*"]
    CORS_ALLOW_HEADERS: List[str] = ["*"]
    
    # Database Configuration
    DATABASE_URL: str = "sqlite:///./airvision.db"
    DATABASE_POOL_SIZE: int = 20
    DATABASE_MAX_OVERFLOW: int = 0
    DATABASE_ECHO: bool = False
    
    # Redis Configuration (for caching)
    REDIS_HOST: str = "localhost"
    REDIS_PORT: int = 6379
    REDIS_DB: int = 0
    REDIS_PASSWORD: Optional[str] = None
    REDIS_URL: Optional[str] = None
    CACHE_TTL: int = 300  # 5 minutes default
    
    # External API Keys
    CPCB_API_KEY: Optional[str] = None
    WEATHER_API_KEY: Optional[str] = None
    GOOGLE_MAPS_API_KEY: Optional[str] = None
    NASA_API_KEY: Optional[str] = None
    
    # Data Collection Settings
    DATA_COLLECTION_INTERVAL: int = 3600  # 1 hour in seconds
    CPCB_BASE_URL: str = "https://api.data.gov.in/resource/3b01bcb8-0b14-4abf-b6f2-c1bfd384ba69"
    WEATHER_API_URL: str = "https://api.openweathermap.org/data/2.5"
    
    # ML Model Paths
    ML_MODELS_PATH: str = "ml-models/trained_models"
    AQI_FORECAST_MODEL: str = "aqi_forecast_lstm.h5"
    SOURCE_ATTRIBUTION_MODEL: str = "source_rf.pkl"
    POLICY_RECOMMENDER_MODEL: str = "policy_recommender.pkl"
    
    # Notification Settings
    ENABLE_PUSH_NOTIFICATIONS: bool = True
    FIREBASE_CREDENTIALS_PATH: Optional[str] = None
    
    # Email Settings (for alerts)
    SMTP_HOST: Optional[str] = None
    SMTP_PORT: int = 587
    SMTP_USER: Optional[str] = None
    SMTP_PASSWORD: Optional[str] = None
    EMAIL_FROM: str = "noreply@airvision.com"
    
    # Alert Thresholds
    ALERT_THRESHOLD_MODERATE: int = 100
    ALERT_THRESHOLD_POOR: int = 200
    ALERT_THRESHOLD_VERY_POOR: int = 300
    ALERT_THRESHOLD_SEVERE: int = 400
    
    # Rate Limiting
    RATE_LIMIT_ENABLED: bool = True
    RATE_LIMIT_REQUESTS: int = 100
    RATE_LIMIT_PERIOD: int = 60  # seconds
    
    # Logging
    LOG_LEVEL: str = "INFO"
    LOG_FORMAT: str = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
    LOG_FILE: str = "logs/airvision.log"
    
    # File Upload Settings
    MAX_UPLOAD_SIZE: int = 10 * 1024 * 1024  # 10 MB
    ALLOWED_UPLOAD_EXTENSIONS: List[str] = [".csv", ".xlsx", ".json"]
    UPLOAD_DIRECTORY: str = "uploads"
    
    # Monitoring & Analytics
    ENABLE_METRICS: bool = True
    METRICS_PORT: int = 9090
    
    # Background Tasks
    ENABLE_SCHEDULER: bool = True
    SCHEDULER_TIMEZONE: str = "Asia/Kolkata"
    
    # Testing
    TESTING: bool = False
    TEST_DATABASE_URL: Optional[str] = None
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True
        extra = "ignore"          # ✅ FIX: ignore unknown env vars like AQICN_TOKEN, CITY_NAME etc.


@lru_cache()
def get_settings() -> Settings:
    """
    Get cached settings instance
    """
    return Settings()


# Convenience function to access settings
settings = get_settings()


# AQI Category Thresholds (Indian AQI Standard)
AQI_CATEGORIES = {
    "Good": (0, 50),
    "Satisfactory": (51, 100),
    "Moderate": (101, 200),
    "Poor": (201, 300),
    "Very Poor": (301, 400),
    "Severe": (401, 500)
}

# AQI Color Codes for UI
AQI_COLORS = {
    "Good": "#00E400",
    "Satisfactory": "#FFFF00",
    "Moderate": "#FF7E00",
    "Poor": "#FF0000",
    "Very Poor": "#8F3F97",
    "Severe": "#7E0023"
}

# Health Recommendations by AQI Category
HEALTH_RECOMMENDATIONS = {
    "Good": {
        "general": "Air quality is good. Ideal for outdoor activities.",
        "sensitive": "No health impacts expected.",
        "action": "Enjoy outdoor activities!"
    },
    "Satisfactory": {
        "general": "Air quality is acceptable.",
        "sensitive": "Sensitive individuals may experience minor breathing discomfort.",
        "action": "Normal activities can continue."
    },
    "Moderate": {
        "general": "People with respiratory diseases may experience health effects.",
        "sensitive": "Reduce prolonged or heavy outdoor exertion.",
        "action": "Consider reducing prolonged outdoor activities if experiencing symptoms."
    },
    "Poor": {
        "general": "Everyone may begin to experience health effects.",
        "sensitive": "People with respiratory or heart diseases should avoid outdoor exertion.",
        "action": "Avoid prolonged outdoor activities. Wear a mask if going outside."
    },
    "Very Poor": {
        "general": "Health alert: everyone may experience serious health effects.",
        "sensitive": "People with respiratory or heart diseases should remain indoors.",
        "action": "Avoid all outdoor activities. Use air purifiers indoors. Wear N95 masks if going out."
    },
    "Severe": {
        "general": "Emergency conditions. Entire population is likely to be affected.",
        "sensitive": "Strict medical advice to remain indoors.",
        "action": "Stay indoors with doors and windows closed. Use air purifiers. Seek medical help if experiencing symptoms."
    }
}

# Pollutant Standards (Indian Standards - µg/m³)
POLLUTANT_STANDARDS = {
    "PM2.5": {
        "good": 30,
        "satisfactory": 60,
        "moderate": 90,
        "poor": 120,
        "very_poor": 250,
        "severe": 250
    },
    "PM10": {
        "good": 50,
        "satisfactory": 100,
        "moderate": 250,
        "poor": 350,
        "very_poor": 430,
        "severe": 430
    },
    "NO2": {
        "good": 40,
        "satisfactory": 80,
        "moderate": 180,
        "poor": 280,
        "very_poor": 400,
        "severe": 400
    },
    "SO2": {
        "good": 40,
        "satisfactory": 80,
        "moderate": 380,
        "poor": 800,
        "very_poor": 1600,
        "severe": 1600
    },
    "CO": {
        "good": 1.0,
        "satisfactory": 2.0,
        "moderate": 10,
        "poor": 17,
        "very_poor": 34,
        "severe": 34
    },
    "O3": {
        "good": 50,
        "satisfactory": 100,
        "moderate": 168,
        "poor": 208,
        "very_poor": 748,
        "severe": 748
    }
}

# Region Configurations
REGIONS = {
    "Delhi": {
        "center": {"lat": 28.7041, "lon": 77.1025},
        "bounds": {
            "north": 28.88,
            "south": 28.40,
            "east": 77.35,
            "west": 76.85
        }
    },
    "Noida": {
        "center": {"lat": 28.5355, "lon": 77.3910},
        "bounds": {
            "north": 28.65,
            "south": 28.45,
            "east": 77.50,
            "west": 77.28
        }
    },
    "Gurgaon": {
        "center": {"lat": 28.4595, "lon": 77.0266},
        "bounds": {
            "north": 28.55,
            "south": 28.35,
            "east": 77.15,
            "west": 76.90
        }
    },
    "Ghaziabad": {
        "center": {"lat": 28.6692, "lon": 77.4538},
        "bounds": {
            "north": 28.75,
            "south": 28.58,
            "east": 77.55,
            "west": 77.35
        }
    },
    "Faridabad": {
        "center": {"lat": 28.4089, "lon": 77.3178},
        "bounds": {
            "north": 28.50,
            "south": 28.30,
            "east": 77.45,
            "west": 77.20
        }
    }
}

# Supported Transport Modes for Route Calculation
TRANSPORT_MODES = ["driving", "walking", "cycling", "transit"]

# Policy Categories
POLICY_CATEGORIES = [
    "traffic_management",
    "industrial_regulation",
    "construction_control",
    "biomass_burning_ban",
    "odd_even_scheme",
    "public_transport",
    "green_zone",
    "emission_standards",
    "waste_management",
    "vehicle_restrictions",
    "emergency_measures"
]

# User Types
USER_TYPES = ["citizen", "policy_maker", "researcher", "admin"]

# Data Source Priorities
DATA_SOURCES = [
    {"name": "CPCB", "priority": 1, "reliability": 0.95},
    {"name": "State Boards", "priority": 2, "reliability": 0.90},
    {"name": "Embassy", "priority": 3, "reliability": 0.85},
    {"name": "Private Sensors", "priority": 4, "reliability": 0.75}
]