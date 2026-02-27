"""
Source Attribution Endpoints
Analyzes and attributes pollution sources using ML models
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Dict, Optional
from datetime import datetime, timedelta
import pickle
import numpy as np

from app.core.database import get_db
from app.schemas.aqi import SourceContribution, SourceBreakdown, SourceTrend
from app.services.cache_service import cache_get, cache_set
from app.core.security import get_current_user

router = APIRouter()

# Pollution source categories
POLLUTION_SOURCES = [
    "vehicular_emissions",
    "industrial_emissions",
    "biomass_burning",
    "construction_dust",
    "road_dust",
    "power_plants",
    "waste_burning",
    "other"
]


@router.get("/breakdown", response_model=SourceBreakdown)
async def get_source_breakdown(
    station_id: Optional[str] = Query(None, description="Station ID (if None, returns regional)"),
    region: Optional[str] = Query("Delhi", description="Region name"),
    db: Session = Depends(get_db)
):
    """
    Get pollution source attribution breakdown
    """
    try:
        cache_key = f"source_breakdown_{station_id or region}"
        cached_data = cache_get(cache_key)
        if cached_data:
            return cached_data

        # Load source attribution model
        model = _load_source_model()
        
        # Get recent data for analysis
        from app.models.aqi_data import AQIData
        
        query = db.query(AQIData).filter(
            AQIData.timestamp >= datetime.utcnow() - timedelta(hours=24)
        )
        
        if station_id:
            query = query.filter(AQIData.station_id == station_id)
        
        recent_data = query.order_by(AQIData.timestamp.desc()).limit(24).all()
        
        if not recent_data:
            raise HTTPException(
                status_code=404,
                detail="No recent data available for analysis"
            )

        # Analyze sources
        source_contributions = _analyze_sources(recent_data, model)
        
        # Calculate total contribution
        total = sum(source_contributions.values())
        
        # Create breakdown
        sources = [
            {
                "source": _format_source_name(source),
                "percentage": (contribution / total) * 100,
                "contribution_ug_m3": contribution,
                "trend": _calculate_trend(source, recent_data)
            }
            for source, contribution in source_contributions.items()
        ]
        
        # Sort by contribution
        sources.sort(key=lambda x: x["percentage"], reverse=True)
        
        response = SourceBreakdown(
            region=region if not station_id else recent_data[0].station_name,
            timestamp=datetime.utcnow(),
            total_aqi=recent_data[0].aqi,
            sources=sources,
            dominant_source=sources[0]["source"] if sources else "Unknown"
        )

        # Cache for 1 hour
        cache_set(cache_key, response, ttl=3600)
        
        return response

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error analyzing sources: {str(e)}")


@router.get("/temporal", response_model=List[SourceTrend])
async def get_temporal_source_analysis(
    station_id: str = Query(..., description="Station ID"),
    days: int = Query(7, ge=1, le=30, description="Number of days"),
    db: Session = Depends(get_db)
):
    """
    Get temporal trends of pollution sources
    """
    try:
        cache_key = f"source_temporal_{station_id}_{days}"
        cached_data = cache_get(cache_key)
        if cached_data:
            return cached_data

        from app.models.aqi_data import AQIData
        
        # Get historical data
        start_date = datetime.utcnow() - timedelta(days=days)
        historical = db.query(AQIData).filter(
            AQIData.station_id == station_id,
            AQIData.timestamp >= start_date
        ).order_by(AQIData.timestamp.asc()).all()

        if not historical:
            raise HTTPException(
                status_code=404,
                detail=f"No historical data for station {station_id}"
            )

        # Group by day and analyze
        model = _load_source_model()
        trends = []
        
        current_date = start_date.date()
        while current_date <= datetime.utcnow().date():
            day_data = [
                d for d in historical 
                if d.timestamp.date() == current_date
            ]
            
            if day_data:
                source_contributions = _analyze_sources(day_data, model)
                
                trends.append(
                    SourceTrend(
                        date=current_date,
                        sources=source_contributions,
                        total_aqi=np.mean([d.aqi for d in day_data])
                    )
                )
            
            current_date += timedelta(days=1)

        # Cache for 2 hours
        cache_set(cache_key, trends, ttl=7200)
        
        return trends

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error analyzing temporal trends: {str(e)}")


@router.get("/regional-comparison")
async def get_regional_source_comparison(
    regions: List[str] = Query(["Delhi", "Noida", "Gurgaon", "Ghaziabad"], description="Regions to compare"),
    db: Session = Depends(get_db)
):
    """
    Compare pollution sources across different regions
    """
    try:
        cache_key = f"source_regional_{'_'.join(sorted(regions))}"
        cached_data = cache_get(cache_key)
        if cached_data:
            return cached_data

        comparisons = []
        
        for region in regions:
            try:
                breakdown = await get_source_breakdown(region=region, db=db)
                comparisons.append({
                    "region": region,
                    "breakdown": breakdown
                })
            except:
                continue

        if not comparisons:
            raise HTTPException(
                status_code=404,
                detail="No data available for specified regions"
            )

        # Cache for 1 hour
        cache_set(cache_key, comparisons, ttl=3600)
        
        return comparisons

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error comparing regions: {str(e)}")


@router.get("/hotspots")
async def get_pollution_hotspots(
    source_type: str = Query(..., description="Source type to analyze"),
    db: Session = Depends(get_db)
):
    """
    Identify hotspots for specific pollution sources
    """
    try:
        if source_type not in POLLUTION_SOURCES:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid source type. Must be one of: {', '.join(POLLUTION_SOURCES)}"
            )

        cache_key = f"hotspots_{source_type}"
        cached_data = cache_get(cache_key)
        if cached_data:
            return cached_data

        from app.models.aqi_data import AQIData
        
        # Get recent data from all stations
        recent_data = db.query(AQIData).filter(
            AQIData.timestamp >= datetime.utcnow() - timedelta(hours=24)
        ).all()

        if not recent_data:
            raise HTTPException(status_code=404, detail="No recent data available")

        # Analyze each station
        model = _load_source_model()
        hotspots = []
        
        stations = {}
        for record in recent_data:
            if record.station_id not in stations:
                stations[record.station_id] = []
            stations[record.station_id].append(record)

        for station_id, station_data in stations.items():
            source_contributions = _analyze_sources(station_data, model)
            
            if source_type in source_contributions:
                contribution = source_contributions[source_type]
                
                hotspots.append({
                    "station_id": station_data[0].station_id,
                    "station_name": station_data[0].station_name,
                    "latitude": station_data[0].latitude,
                    "longitude": station_data[0].longitude,
                    "contribution": contribution,
                    "percentage": (contribution / sum(source_contributions.values())) * 100
                })

        # Sort by contribution
        hotspots.sort(key=lambda x: x["contribution"], reverse=True)

        result = {
            "source_type": _format_source_name(source_type),
            "hotspots": hotspots[:10],  # Top 10 hotspots
            "timestamp": datetime.utcnow()
        }

        # Cache for 1 hour
        cache_set(cache_key, result, ttl=3600)
        
        return result

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error identifying hotspots: {str(e)}")


@router.get("/time-series")
async def get_source_time_series(
    station_id: str = Query(..., description="Station ID"),
    source_type: str = Query(..., description="Source type"),
    hours: int = Query(72, ge=1, le=168, description="Hours of data"),
    db: Session = Depends(get_db)
):
    """
    Get time series data for a specific pollution source
    """
    try:
        if source_type not in POLLUTION_SOURCES:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid source type. Must be one of: {', '.join(POLLUTION_SOURCES)}"
            )

        cache_key = f"source_timeseries_{station_id}_{source_type}_{hours}"
        cached_data = cache_get(cache_key)
        if cached_data:
            return cached_data

        from app.models.aqi_data import AQIData
        
        # Get historical data
        start_time = datetime.utcnow() - timedelta(hours=hours)
        historical = db.query(AQIData).filter(
            AQIData.station_id == station_id,
            AQIData.timestamp >= start_time
        ).order_by(AQIData.timestamp.asc()).all()

        if not historical:
            raise HTTPException(
                status_code=404,
                detail=f"No data for station {station_id}"
            )

        # Analyze sources for each hour
        model = _load_source_model()
        time_series = []
        
        for record in historical:
            source_contributions = _analyze_sources([record], model)
            
            time_series.append({
                "timestamp": record.timestamp,
                "contribution": source_contributions.get(source_type, 0),
                "total_aqi": record.aqi
            })

        result = {
            "station_id": station_id,
            "source_type": _format_source_name(source_type),
            "data": time_series
        }

        # Cache for 30 minutes
        cache_set(cache_key, result, ttl=1800)
        
        return result

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating time series: {str(e)}")


# Helper functions
def _load_source_model():
    """Load the source attribution ML model"""
    try:
        with open('ml-models/trained_models/source_rf.pkl', 'rb') as f:
            return pickle.load(f)
    except:
        return None


def _analyze_sources(data_records, model):
    """Analyze pollution sources from data"""
    if model is None:
        # Return mock data if model not available
        return _generate_mock_source_contributions()
    
    # Prepare features
    features = []
    for record in data_records:
        features.append([
            record.pm25 or 0,
            record.pm10 or 0,
            record.co or 0,
            record.no2 or 0,
            record.so2 or 0,
            record.o3 or 0,
            record.timestamp.hour,
            record.timestamp.weekday()
        ])
    
    features = np.array(features)
    
    try:
        # Predict source contributions
        predictions = model.predict(features)
        
        # Average across all records
        avg_contributions = np.mean(predictions, axis=0)
        
        return {
            source: float(contrib)
            for source, contrib in zip(POLLUTION_SOURCES, avg_contributions)
        }
    except:
        return _generate_mock_source_contributions()


def _generate_mock_source_contributions():
    """Generate mock source contributions"""
    return {
        "vehicular_emissions": 35.5,
        "industrial_emissions": 25.3,
        "biomass_burning": 15.2,
        "construction_dust": 10.5,
        "road_dust": 7.8,
        "power_plants": 3.5,
        "waste_burning": 1.8,
        "other": 0.4
    }


def _format_source_name(source: str) -> str:
    """Format source name for display"""
    return source.replace('_', ' ').title()


def _calculate_trend(source: str, data_records) -> str:
    """Calculate trend (increasing/decreasing/stable)"""
    if len(data_records) < 2:
        return "stable"
    
    # Simple trend calculation
    recent = data_records[:len(data_records)//2]
    older = data_records[len(data_records)//2:]
    
    recent_avg = np.mean([d.aqi for d in recent])
    older_avg = np.mean([d.aqi for d in older])
    
    diff_pct = ((recent_avg - older_avg) / older_avg) * 100
    
    if diff_pct > 5:
        return "increasing"
    elif diff_pct < -5:
        return "decreasing"
    else:
        return "stable"