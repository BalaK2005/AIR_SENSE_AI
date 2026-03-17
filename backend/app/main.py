# """
# AirVision FastAPI Backend - Complete API
# """

# from fastapi import FastAPI, HTTPException, Query
# from fastapi.middleware.cors import CORSMiddleware
# from pydantic import BaseModel, Field
# from typing import List, Optional
# from datetime import datetime, timedelta
# from enum import Enum
# from pathlib import Path
# import numpy as np
# from database import Base, engine
# from models.user import User
# from models.saved_location import SavedLocation

# Base.metadata.create_all(bind=engine)


# app = FastAPI(
#     title="AirVision API",
#     description="Air Quality Monitoring System",
#     version="1.0.0"
# )

# # CORS
# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["*"],
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )

# # Global variables for models
# forecast_model = None
# source_models = {}
# forecast_scaler = None

# # ==================== Models ====================

# class AQICategory(str, Enum):
#     GOOD = "Good"
#     SATISFACTORY = "Satisfactory"
#     MODERATE = "Moderate"
#     POOR = "Poor"
#     VERY_POOR = "Very Poor"
#     SEVERE = "Severe"

# class HealthImpact(str, Enum):
#     MINIMAL = "Minimal"
#     MINOR = "Minor"
#     MODERATE = "Moderate"
#     SERIOUS = "Serious"
#     SEVERE = "Severe"
#     EMERGENCY = "Emergency"

# class Location(BaseModel):
#     latitude: float = Field(..., ge=-90, le=90)
#     longitude: float = Field(..., ge=-180, le=180)
#     area_name: Optional[str] = None

# class AQIData(BaseModel):
#     location: Location
#     aqi: int
#     category: AQICategory
#     dominant_pollutant: str
#     pm25: float
#     pm10: float
#     no2: float
#     so2: float
#     co: float
#     o3: float
#     timestamp: datetime
#     health_impact: HealthImpact
#     recommendations: List[str]

# class ForecastData(BaseModel):
#     timestamp: datetime
#     aqi: int
#     category: AQICategory
#     confidence: float

# class AQIForecast(BaseModel):
#     location: Location
#     current_aqi: int
#     forecast_hours: List[ForecastData]
#     generated_at: datetime

# class PollutionSource(BaseModel):
#     source: str
#     percentage: float
#     aqi_contribution: float
#     severity: str
#     recommendation: str

# class SourceAttribution(BaseModel):
#     location: Location
#     total_aqi: int
#     breakdown: List[PollutionSource]
#     dominant_source: str
#     timestamp: datetime

# class HealthAlert(BaseModel):
#     alert_id: str
#     severity: str
#     title: str
#     message: str
#     affected_areas: List[str]
#     recommendations: List[str]
#     valid_until: datetime
#     created_at: datetime

# # ==================== Helper Functions ====================

# def get_aqi_category(aqi: int) -> AQICategory:
#     if aqi <= 50: return AQICategory.GOOD
#     elif aqi <= 100: return AQICategory.SATISFACTORY
#     elif aqi <= 200: return AQICategory.MODERATE
#     elif aqi <= 300: return AQICategory.POOR
#     elif aqi <= 400: return AQICategory.VERY_POOR
#     else: return AQICategory.SEVERE

# def get_health_impact(aqi: int) -> HealthImpact:
#     if aqi <= 50: return HealthImpact.MINIMAL
#     elif aqi <= 100: return HealthImpact.MINOR
#     elif aqi <= 200: return HealthImpact.MODERATE
#     elif aqi <= 300: return HealthImpact.SERIOUS
#     elif aqi <= 400: return HealthImpact.SEVERE
#     else: return HealthImpact.EMERGENCY

# def get_health_recommendations(category: AQICategory) -> List[str]:
#     recs = {
#         AQICategory.GOOD: ["Air quality is good - enjoy outdoor activities!"],
#         AQICategory.SATISFACTORY: ["Air quality is acceptable"],
#         AQICategory.MODERATE: ["Sensitive groups should reduce prolonged outdoor exertion"],
#         AQICategory.POOR: ["Everyone should reduce prolonged outdoor exertion"],
#         AQICategory.VERY_POOR: ["Avoid outdoor activities", "Wear N95 masks"],
#         AQICategory.SEVERE: ["EMERGENCY: Stay indoors at all times"]
#     }
#     return recs.get(category, [])

# def get_current_aqi_data(lat: float, lon: float):
#     """Generate mock AQI data"""
#     base_aqi = np.random.randint(80, 280)
#     return {
#         'aqi': base_aqi,
#         'pm25': base_aqi * 0.6 + np.random.randint(-10, 10),
#         'pm10': base_aqi * 0.8 + np.random.randint(-15, 15),
#         'no2': base_aqi * 0.3 + np.random.randint(-5, 5),
#         'so2': base_aqi * 0.2 + np.random.randint(-5, 5),
#         'co': base_aqi * 0.015 + np.random.uniform(-0.3, 0.3),
#         'o3': base_aqi * 0.25 + np.random.randint(-8, 8)
#     }

# # ==================== API Endpoints ====================

# @app.get("/")
# async def root():
#     return {
#         "message": "AirVision API",
#         "version": "1.0.0",
#         "docs": "/docs"
#     }

# @app.get("/api/v1/aqi/current", response_model=AQIData)
# async def get_current_aqi(
#     latitude: float = Query(..., ge=-90, le=90),
#     longitude: float = Query(..., ge=-180, le=180),
#     area_name: Optional[str] = None
# ):
#     """Get current AQI data"""
#     data = get_current_aqi_data(latitude, longitude)
#     category = get_aqi_category(data['aqi'])
#     health_impact = get_health_impact(data['aqi'])
    
#     pollutants = {
#         'PM2.5': data['pm25'] / 60,
#         'PM10': data['pm10'] / 100,
#         'NO2': data['no2'] / 80,
#         'SO2': data['so2'] / 80,
#         'CO': data['co'] / 4,
#         'O3': data['o3'] / 100
#     }
#     dominant = max(pollutants, key=pollutants.get)
    
#     return AQIData(
#         location=Location(latitude=latitude, longitude=longitude, area_name=area_name),
#         aqi=data['aqi'],
#         category=category,
#         dominant_pollutant=dominant,
#         pm25=data['pm25'],
#         pm10=data['pm10'],
#         no2=data['no2'],
#         so2=data['so2'],
#         co=data['co'],
#         o3=data['o3'],
#         timestamp=datetime.now(),
#         health_impact=health_impact,
#         recommendations=get_health_recommendations(category)
#     )

# @app.get("/api/v1/forecast", response_model=AQIForecast)
# async def get_aqi_forecast(
#     latitude: float = Query(..., ge=-90, le=90),
#     longitude: float = Query(..., ge=-180, le=180),
#     hours: int = Query(72, ge=1, le=72)
# ):
#     """Get AQI forecast"""
#     current = get_current_aqi_data(latitude, longitude)
#     forecast_hours = []
#     base_aqi = current['aqi']
    
#     for i in range(hours):
#         trend = np.sin(i / 12 * np.pi) * 20
#         noise = np.random.randint(-15, 15)
#         predicted_aqi = max(0, min(500, int(base_aqi + trend + noise)))
        
#         forecast_hours.append(ForecastData(
#             timestamp=datetime.now() + timedelta(hours=i+1),
#             aqi=predicted_aqi,
#             category=get_aqi_category(predicted_aqi),
#             confidence=max(60, 95 - i)
#         ))
    
#     return AQIForecast(
#         location=Location(latitude=latitude, longitude=longitude),
#         current_aqi=current['aqi'],
#         forecast_hours=forecast_hours,
#         generated_at=datetime.now()
#     )

# @app.get("/api/v1/source-attribution", response_model=SourceAttribution)
# async def get_source_attribution(
#     latitude: float = Query(..., ge=-90, le=90),
#     longitude: float = Query(..., ge=-180, le=180)
# ):
#     """Get pollution source attribution"""
#     current = get_current_aqi_data(latitude, longitude)
#     aqi = current['aqi']
    
#     sources = [
#         {'source': 'Vehicular Emissions', 'percentage': 35.5, 'severity': 'High'},
#         {'source': 'Industrial Emissions', 'percentage': 28.3, 'severity': 'High'},
#         {'source': 'Construction Dust', 'percentage': 18.7, 'severity': 'Moderate'},
#         {'source': 'Biomass Burning', 'percentage': 12.1, 'severity': 'Moderate'},
#         {'source': 'Road Dust', 'percentage': 5.4, 'severity': 'Low'}
#     ]
    
#     breakdown = []
#     for source in sources:
#         contribution = (source['percentage'] / 100) * aqi
#         breakdown.append(PollutionSource(
#             source=source['source'],
#             percentage=round(source['percentage'], 2),
#             aqi_contribution=round(contribution, 2),
#             severity=source['severity'],
#             recommendation=f"Action needed for {source['source'].lower()}"
#         ))
    
#     return SourceAttribution(
#         location=Location(latitude=latitude, longitude=longitude),
#         total_aqi=aqi,
#         breakdown=breakdown,
#         dominant_source=breakdown[0].source,
#         timestamp=datetime.now()
#     )

# @app.get("/api/v1/alerts", response_model=List[HealthAlert])
# async def get_health_alerts():
#     """Get active health alerts"""
#     alerts = [
#         HealthAlert(
#             alert_id="alert_001",
#             severity="Critical",
#             title="Severe Air Quality Alert",
#             message="AQI levels severe. Stay indoors.",
#             affected_areas=["South Delhi", "Gurugram", "Noida"],
#             recommendations=["Stay indoors", "Use air purifiers"],
#             valid_until=datetime.now() + timedelta(hours=12),
#             created_at=datetime.now()
#         )
#     ]
#     return alerts

# @app.get("/health")
# async def health_check():
#     return {"status": "healthy", "timestamp": datetime.now().isoformat()}

# # ==================== Startup ====================

# @app.on_event("startup")
# async def startup_event():
#     global forecast_model, source_models, forecast_scaler
    
#     print("🚀 Starting AirVision API...")
#     print("📊 Loading ML models...")
    
#     try:
#         import joblib
#         import tensorflow as tf
        
#         # BOTH PATHS NOW USE ../
#         model_path = Path("../ml-models/trained_models/aqi_forecast_lstm.h5")
#         scaler_path = Path("../ml-models/trained_models/aqi_scaler.pkl")
#         source_path = Path("../ml-models/trained_models/source_attribution")
        
#         if model_path.exists():
#             forecast_model = tf.keras.models.load_model(str(model_path))
#             forecast_scaler = joblib.load(str(scaler_path))
#             print("✅ Forecast model loaded")
#         else:
#             print(f"⚠️  Model not found at {model_path}")
        
#         if source_path.exists():
#             for model_file in source_path.glob("*_model.pkl"):
#                 source_name = model_file.stem.replace("_model", "")
#                 source_models[source_name] = joblib.load(str(model_file))
#             print(f"✅ Loaded {len(source_models)} source models")
#         else:
#             print(f"⚠️  Source models not found at {source_path}")
    
#     except Exception as e:
#         print(f"⚠️  Error loading models: {e}")
    
#     print("✅ API Ready!")

# if __name__ == "__main__":
#     import uvicorn
#     uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)  # ✅ fixed

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.v1.endpoints import aqi, forecast, source, policy, auth
from app.api.v1.endpoints.csv_aqi_router import router as csv_aqi_router
from app.api.v1.endpoints import router as route_module

app = FastAPI(
    title="AirVision API",
    description="Hyperlocal Air Quality Monitoring API",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(csv_aqi_router,      prefix="/api/v1/aqi/csv",  tags=["Live CSV Data"])
app.include_router(auth.router,         prefix="/api/v1/auth",     tags=["Authentication"])
app.include_router(aqi.router,          prefix="/api/v1/aqi",      tags=["AQI Data"])
app.include_router(forecast.router,     prefix="/api/v1/forecast", tags=["Forecast"])
app.include_router(source.router,       prefix="/api/v1/source",   tags=["Source Attribution"])
app.include_router(policy.router,       prefix="/api/v1/policy",   tags=["Policy"])
app.include_router(route_module.router, prefix="/api/v1/route",    tags=["Safe Routes"])

@app.get("/")
def root():
    return {"message": "AirVision API", "version": "1.0.0", "status": "running"}

@app.get("/health")
def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)