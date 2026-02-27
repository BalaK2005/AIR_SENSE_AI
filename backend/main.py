from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.v1.endpoints import aqi, forecast, source, policy, route, auth

app = FastAPI(
    title="AirVision API",
    description="Hyperlocal Air Quality Monitoring API",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api/v1/auth", tags=["Authentication"])
app.include_router(aqi.router, prefix="/api/v1/aqi", tags=["AQI Data"])
app.include_router(forecast.router, prefix="/api/v1/forecast", tags=["Forecast"])
app.include_router(source.router, prefix="/api/v1/source", tags=["Source Attribution"])
app.include_router(policy.router, prefix="/api/v1/policy", tags=["Policy"])
app.include_router(route.router, prefix="/api/v1/route", tags=["Safe Routes"])

@app.get("/")
def root():
    return {"message": "AirVision API", "version": "1.0.0", "status": "running"}

@app.get("/health")
def health_check():
    return {"status": "healthy", "database": "connected", "cache": "connected"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)