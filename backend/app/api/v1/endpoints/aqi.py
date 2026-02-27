"""
AQI (Air Quality Index) Endpoints
Handles all AQI-related data retrieval and management
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timedelta

from app.core.database import get_db
from app.schemas.aqi import AQIResponse, AQIHistorical, AQIByLocation
from app.models.aqi_data import AQIData
from app.services.cache_service import cache_get, cache_set
from app.core.security import get_current_user

router = APIRouter()


@router.get("/current", response_model=List[AQIResponse])
async def get_current_aqi(
    lat: Optional[float] = Query(None, description="Latitude"),
    lon: Optional[float] = Query(None, description="Longitude"),
    radius: Optional[float] = Query(5.0, description="Radius in km"),
    db: Session = Depends(get_db)
):
    """
    Get current AQI data for a location or all stations
    """
    try:
        # Check cache first
        cache_key = f"aqi_current_{lat}_{lon}_{radius}"
        cached_data = cache_get(cache_key)
        if cached_data:
            return cached_data

        query = db.query(AQIData).filter(
            AQIData.timestamp >= datetime.utcnow() - timedelta(hours=1)
        )

        if lat and lon:
            # Filter by location using Haversine formula
            # For simplicity, using bounding box here
            lat_range = radius / 111.0  # 1 degree ≈ 111 km
            lon_range = radius / (111.0 * abs(lat))
            
            query = query.filter(
                AQIData.latitude.between(lat - lat_range, lat + lat_range),
                AQIData.longitude.between(lon - lon_range, lon + lon_range)
            )

        results = query.order_by(AQIData.timestamp.desc()).limit(50).all()
        
        response_data = [
            AQIResponse(
                station_id=r.station_id,
                station_name=r.station_name,
                latitude=r.latitude,
                longitude=r.longitude,
                aqi=r.aqi,
                category=_get_aqi_category(r.aqi),
                pm25=r.pm25,
                pm10=r.pm10,
                co=r.co,
                no2=r.no2,
                so2=r.so2,
                o3=r.o3,
                timestamp=r.timestamp
            )
            for r in results
        ]

        # Cache for 5 minutes
        cache_set(cache_key, response_data, ttl=300)
        
        return response_data

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching AQI data: {str(e)}")


@router.get("/historical", response_model=List[AQIHistorical])
async def get_historical_aqi(
    station_id: str = Query(..., description="Station ID"),
    start_date: datetime = Query(..., description="Start date"),
    end_date: datetime = Query(..., description="End date"),
    db: Session = Depends(get_db)
):
    """
    Get historical AQI data for a specific station
    """
    try:
        if end_date - start_date > timedelta(days=30):
            raise HTTPException(
                status_code=400, 
                detail="Date range cannot exceed 30 days"
            )

        results = db.query(AQIData).filter(
            AQIData.station_id == station_id,
            AQIData.timestamp.between(start_date, end_date)
        ).order_by(AQIData.timestamp.asc()).all()

        if not results:
            raise HTTPException(
                status_code=404, 
                detail=f"No data found for station {station_id}"
            )

        return [
            AQIHistorical(
                timestamp=r.timestamp,
                aqi=r.aqi,
                pm25=r.pm25,
                pm10=r.pm10,
                category=_get_aqi_category(r.aqi)
            )
            for r in results
        ]

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching historical data: {str(e)}")


@router.get("/stations", response_model=List[dict])
async def get_all_stations(db: Session = Depends(get_db)):
    """
    Get list of all monitoring stations
    """
    try:
        cache_key = "aqi_stations"
        cached_data = cache_get(cache_key)
        if cached_data:
            return cached_data

        # Get unique stations from last 24 hours
        results = db.query(
            AQIData.station_id,
            AQIData.station_name,
            AQIData.latitude,
            AQIData.longitude
        ).filter(
            AQIData.timestamp >= datetime.utcnow() - timedelta(hours=24)
        ).distinct().all()

        stations = [
            {
                "station_id": r.station_id,
                "station_name": r.station_name,
                "latitude": r.latitude,
                "longitude": r.longitude
            }
            for r in results
        ]

        # Cache for 1 hour
        cache_set(cache_key, stations, ttl=3600)
        
        return stations

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching stations: {str(e)}")


@router.get("/heatmap", response_model=List[dict])
async def get_aqi_heatmap(
    db: Session = Depends(get_db)
):
    """
    Get AQI data formatted for heatmap visualization
    """
    try:
        cache_key = "aqi_heatmap"
        cached_data = cache_get(cache_key)
        if cached_data:
            return cached_data

        # Get latest data from each station
        subquery = db.query(
            AQIData.station_id,
            db.func.max(AQIData.timestamp).label('max_timestamp')
        ).group_by(AQIData.station_id).subquery()

        results = db.query(AQIData).join(
            subquery,
            db.and_(
                AQIData.station_id == subquery.c.station_id,
                AQIData.timestamp == subquery.c.max_timestamp
            )
        ).all()

        heatmap_data = [
            {
                "lat": r.latitude,
                "lng": r.longitude,
                "intensity": r.aqi / 500.0,  # Normalize to 0-1
                "aqi": r.aqi,
                "station_name": r.station_name
            }
            for r in results
        ]

        # Cache for 10 minutes
        cache_set(cache_key, heatmap_data, ttl=600)
        
        return heatmap_data

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating heatmap: {str(e)}")


@router.get("/{station_id}", response_model=AQIResponse)
async def get_station_aqi(
    station_id: str,
    db: Session = Depends(get_db)
):
    """
    Get latest AQI data for a specific station
    """
    try:
        result = db.query(AQIData).filter(
            AQIData.station_id == station_id
        ).order_by(AQIData.timestamp.desc()).first()

        if not result:
            raise HTTPException(
                status_code=404,
                detail=f"Station {station_id} not found"
            )

        return AQIResponse(
            station_id=result.station_id,
            station_name=result.station_name,
            latitude=result.latitude,
            longitude=result.longitude,
            aqi=result.aqi,
            category=_get_aqi_category(result.aqi),
            pm25=result.pm25,
            pm10=result.pm10,
            co=result.co,
            no2=result.no2,
            so2=result.so2,
            o3=result.o3,
            timestamp=result.timestamp
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching station data: {str(e)}")


def _get_aqi_category(aqi: float) -> str:
    """Helper function to determine AQI category"""
    if aqi <= 50:
        return "Good"
    elif aqi <= 100:
        return "Satisfactory"
    elif aqi <= 200:
        return "Moderate"
    elif aqi <= 300:
        return "Poor"
    elif aqi <= 400:
        return "Very Poor"
    else:
        return "Severe"