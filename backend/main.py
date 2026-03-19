from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.v1.endpoints import aqi, forecast, source, policy, auth
from app.api.v1.endpoints.csv_aqi_router import router as csv_aqi_router
from app.api.v1.endpoints import router as route_module

from fastapi import FastAPI

app = FastAPI()

@app.get("/")
def home():
    return {"message": "Air Sense AI is running 🚀"}

app = FastAPI(
    title="AirVision API",
    description="Hyperlocal Air Quality Monitoring API",
    version="1.0.0"
)

# CORS middleware — must be added before routers
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(csv_aqi_router,         prefix="/api/v1/aqi/csv",  tags=["Live CSV Data"])
app.include_router(auth.router,            prefix="/api/v1/auth",     tags=["Authentication"])
app.include_router(aqi.router,             prefix="/api/v1/aqi",      tags=["AQI Data"])
app.include_router(forecast.router,        prefix="/api/v1/forecast", tags=["Forecast"])
app.include_router(source.router,          prefix="/api/v1/source",   tags=["Source Attribution"])
app.include_router(policy.router,          prefix="/api/v1/policy",   tags=["Policy"])
app.include_router(route_module.router,    prefix="/api/v1/route",    tags=["Safe Routes"])

@app.get("/")
def root():
    return {"message": "AirVision API", "version": "1.0.0", "status": "running"}

@app.get("/health")
def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
