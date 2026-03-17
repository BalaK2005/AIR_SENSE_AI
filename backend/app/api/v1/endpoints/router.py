"""
Route Endpoints
Provides safe route recommendations based on AQI levels
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Dict, Optional, Tuple
from datetime import datetime, timedelta
import numpy as np
import math

from app.core.database import get_db
from app.schemas.aqi import RouteRecommendation, RouteSegment
from app.services.cache_service import cache_get, cache_set
from app.core.security import get_current_user

router = APIRouter()


@router.get("/safe-route", response_model=RouteRecommendation)
async def get_safe_route(
    start_lat: float = Query(..., description="Start latitude"),
    start_lon: float = Query(..., description="Start longitude"),
    end_lat: float = Query(..., description="End latitude"),
    end_lon: float = Query(..., description="End longitude"),
    mode: str = Query("driving", description="Transport mode (driving/walking/cycling)"),
    db: Session = Depends(get_db)
):
    """
    Get the safest route recommendation based on AQI levels
    """
    try:
        cache_key = f"safe_route_{start_lat}_{start_lon}_{end_lat}_{end_lon}_{mode}"
        cached_data = cache_get(cache_key)
        if cached_data:
            return cached_data

        # Get current AQI data for all stations
        from app.models.aqi_data import AQIData
        
        stations = db.query(AQIData).filter(
            AQIData.timestamp >= datetime.utcnow() - timedelta(hours=1)
        ).all()

        if not stations:
            raise HTTPException(
                status_code=404,
                detail="No recent AQI data available for route calculation"
            )

        # Calculate multiple route options
        routes = _calculate_routes(
            start=(start_lat, start_lon),
            end=(end_lat, end_lon),
            stations=stations,
            mode=mode
        )

        if not routes:
            raise HTTPException(
                status_code=404,
                detail="No routes found for given coordinates"
            )

        # Select the safest route
        safest_route = min(routes, key=lambda r: r["avg_aqi"])
        alternative_routes = [r for r in routes if r != safest_route][:2]

        # Format response
        result = RouteRecommendation(
            safest_route=_format_route_details(safest_route),
            alternative_routes=[_format_route_details(r) for r in alternative_routes],
            travel_mode=mode,
            timestamp=datetime.utcnow()
        )

        # Cache for 15 minutes
        cache_set(cache_key, result, ttl=900)
        
        return result

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error calculating route: {str(e)}")


@router.get("/route-aqi")
async def get_route_aqi(
    waypoints: List[str] = Query(..., description="List of 'lat,lon' waypoints"),
    db: Session = Depends(get_db)
):
    """
    Get AQI levels along a specific route defined by waypoints
    """
    try:
        # Parse waypoints
        parsed_waypoints = []
        for wp in waypoints:
            try:
                lat, lon = map(float, wp.split(','))
                parsed_waypoints.append((lat, lon))
            except:
                raise HTTPException(
                    status_code=400,
                    detail=f"Invalid waypoint format: {wp}. Use 'lat,lon'"
                )

        if len(parsed_waypoints) < 2:
            raise HTTPException(
                status_code=400,
                detail="At least 2 waypoints required"
            )

        # Get AQI data
        from app.models.aqi_data import AQIData
        
        stations = db.query(AQIData).filter(
            AQIData.timestamp >= datetime.utcnow() - timedelta(hours=1)
        ).all()

        # Calculate AQI for each segment
        segments = []
        total_exposure = 0
        
        for i in range(len(parsed_waypoints) - 1):
            start = parsed_waypoints[i]
            end = parsed_waypoints[i + 1]
            
            # Get AQI levels along this segment
            segment_aqi = _get_segment_aqi(start, end, stations)
            distance = _calculate_distance(start, end)
            
            segments.append({
                "start": {"lat": start[0], "lon": start[1]},
                "end": {"lat": end[0], "lon": end[1]},
                "avg_aqi": segment_aqi,
                "distance_km": distance,
                "category": _get_aqi_category(segment_aqi)
            })
            
            total_exposure += segment_aqi * distance

        total_distance = sum(s["distance_km"] for s in segments)
        avg_aqi = total_exposure / total_distance if total_distance > 0 else 0

        return {
            "segments": segments,
            "overall_avg_aqi": round(avg_aqi, 2),
            "total_distance_km": round(total_distance, 2),
            "health_recommendation": _get_health_recommendation(avg_aqi)
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error analyzing route: {str(e)}")


@router.get("/area-aqi")
async def get_area_aqi(
    center_lat: float = Query(..., description="Center latitude"),
    center_lon: float = Query(..., description="Center longitude"),
    radius_km: float = Query(5.0, description="Radius in kilometers"),
    db: Session = Depends(get_db)
):
    """
    Get AQI levels for an area within specified radius
    """
    try:
        cache_key = f"area_aqi_{center_lat}_{center_lon}_{radius_km}"
        cached_data = cache_get(cache_key)
        if cached_data:
            return cached_data

        from app.models.aqi_data import AQIData
        
        # Get stations within radius
        lat_range = radius_km / 111.0  # 1 degree ≈ 111 km
        lon_range = radius_km / (111.0 * math.cos(math.radians(center_lat)))
        
        stations = db.query(AQIData).filter(
            AQIData.timestamp >= datetime.utcnow() - timedelta(hours=1),
            AQIData.latitude.between(center_lat - lat_range, center_lat + lat_range),
            AQIData.longitude.between(center_lon - lon_range, center_lon + lon_range)
        ).all()

        if not stations:
            raise HTTPException(
                status_code=404,
                detail="No stations found in the specified area"
            )

        # Calculate statistics
        aqi_values = [s.aqi for s in stations]
        
        result = {
            "center": {"lat": center_lat, "lon": center_lon},
            "radius_km": radius_km,
            "stations_count": len(stations),
            "avg_aqi": round(np.mean(aqi_values), 2),
            "min_aqi": min(aqi_values),
            "max_aqi": max(aqi_values),
            "category": _get_aqi_category(np.mean(aqi_values)),
            "stations": [
                {
                    "station_name": s.station_name,
                    "aqi": s.aqi,
                    "distance_km": _calculate_distance(
                        (center_lat, center_lon),
                        (s.latitude, s.longitude)
                    )
                }
                for s in stations
            ]
        }

        # Cache for 10 minutes
        cache_set(cache_key, result, ttl=600)
        
        return result

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error analyzing area: {str(e)}")


@router.get("/outdoor-activity")
async def get_outdoor_activity_recommendation(
    lat: float = Query(..., description="Latitude"),
    lon: float = Query(..., description="Longitude"),
    activity: str = Query(..., description="Activity type (running/cycling/walking)"),
    duration_minutes: int = Query(..., description="Activity duration in minutes"),
    db: Session = Depends(get_db)
):
    """
    Get recommendations for outdoor activities based on current AQI
    """
    try:
        # Get current AQI at location
        from app.models.aqi_data import AQIData
        
        # Find nearest station
        lat_range = 0.1  # ~11 km
        lon_range = 0.1
        
        nearby_stations = db.query(AQIData).filter(
            AQIData.timestamp >= datetime.utcnow() - timedelta(hours=1),
            AQIData.latitude.between(lat - lat_range, lat + lat_range),
            AQIData.longitude.between(lon - lon_range, lon + lon_range)
        ).order_by(AQIData.timestamp.desc()).all()

        if not nearby_stations:
            raise HTTPException(
                status_code=404,
                detail="No AQI data available for this location"
            )

        # Calculate average AQI
        current_aqi = np.mean([s.aqi for s in nearby_stations])
        
        # Get activity-specific recommendation
        recommendation = _get_activity_recommendation(
            aqi=current_aqi,
            activity=activity,
            duration_minutes=duration_minutes
        )

        # Get forecast
        from app.api.v1.endpoints.forecast import get_hourly_forecast
        
        try:
            forecast = await get_hourly_forecast(
                station_id=nearby_stations[0].station_id,
                hours=24,
                db=db
            )
            
            # Find better time windows
            better_times = [
                {
                    "time": f.timestamp,
                    "aqi": f.aqi,
                    "category": f.category
                }
                for f in forecast
                if f.aqi < current_aqi - 20  # At least 20 points better
            ][:3]
        except:
            better_times = []

        return {
            "location": {"lat": lat, "lon": lon},
            "activity": activity,
            "duration_minutes": duration_minutes,
            "current_aqi": round(current_aqi, 2),
            "recommendation": recommendation["recommendation"],
            "safety_level": recommendation["safety_level"],
            "precautions": recommendation["precautions"],
            "better_time_windows": better_times,
            "nearest_station": nearby_stations[0].station_name
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating recommendation: {str(e)}")


@router.get("/compare-routes")
async def compare_multiple_routes(
    routes: List[str] = Query(..., description="List of route waypoints (format: 'lat1,lon1;lat2,lon2')"),
    db: Session = Depends(get_db)
):
    """
    Compare AQI exposure across multiple route options
    """
    try:
        if len(routes) > 5:
            raise HTTPException(
                status_code=400,
                detail="Maximum 5 routes can be compared at once"
            )

        from app.models.aqi_data import AQIData
        
        stations = db.query(AQIData).filter(
            AQIData.timestamp >= datetime.utcnow() - timedelta(hours=1)
        ).all()

        comparisons = []
        
        for idx, route_str in enumerate(routes):
            # Parse route waypoints
            waypoints = []
            for wp in route_str.split(';'):
                try:
                    lat, lon = map(float, wp.split(','))
                    waypoints.append((lat, lon))
                except:
                    continue

            if len(waypoints) < 2:
                continue

            # Calculate route metrics
            total_aqi = 0
            total_distance = 0
            
            for i in range(len(waypoints) - 1):
                segment_aqi = _get_segment_aqi(waypoints[i], waypoints[i + 1], stations)
                segment_distance = _calculate_distance(waypoints[i], waypoints[i + 1])
                
                total_aqi += segment_aqi * segment_distance
                total_distance += segment_distance

            avg_aqi = total_aqi / total_distance if total_distance > 0 else 0

            comparisons.append({
                "route_id": idx + 1,
                "avg_aqi": round(avg_aqi, 2),
                "total_distance_km": round(total_distance, 2),
                "category": _get_aqi_category(avg_aqi),
                "estimated_time_minutes": round(total_distance * 3),  # Rough estimate
                "health_impact_score": _calculate_health_impact(avg_aqi, total_distance)
            })

        # Sort by AQI (safest first)
        comparisons.sort(key=lambda x: x["avg_aqi"])

        return {
            "routes": comparisons,
            "recommended_route_id": comparisons[0]["route_id"] if comparisons else None
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error comparing routes: {str(e)}")


# Helper functions
def _calculate_routes(start: Tuple[float, float], end: Tuple[float, float], stations, mode: str) -> List[Dict]:
    """Calculate multiple route options"""
    routes = []
    
    # Direct route
    direct_route = _create_route(start, end, stations, "direct")
    routes.append(direct_route)
    
    # Alternative routes (simplified - in production, use Google Maps API)
    # Route via slightly north
    mid_lat = (start[0] + end[0]) / 2 + 0.01
    mid_lon = (start[1] + end[1]) / 2
    alt_route_1 = _create_route_with_waypoint(start, (mid_lat, mid_lon), end, stations, "north")
    routes.append(alt_route_1)
    
    # Route via slightly south
    mid_lat = (start[0] + end[0]) / 2 - 0.01
    alt_route_2 = _create_route_with_waypoint(start, (mid_lat, mid_lon), end, stations, "south")
    routes.append(alt_route_2)
    
    return routes


def _create_route(start: Tuple[float, float], end: Tuple[float, float], stations, name: str) -> Dict:
    """Create a single route"""
    distance = _calculate_distance(start, end)
    avg_aqi = _get_segment_aqi(start, end, stations)
    
    return {
        "name": f"{name.capitalize()} Route",
        "waypoints": [start, end],
        "distance_km": distance,
        "avg_aqi": avg_aqi,
        "estimated_time_minutes": round(distance * 3),  # Rough estimate
        "segments": [
            {
                "start": start,
                "end": end,
                "aqi": avg_aqi,
                "distance_km": distance
            }
        ]
    }


def _create_route_with_waypoint(start, waypoint, end, stations, name: str) -> Dict:
    """Create a route with a waypoint"""
    segment1_dist = _calculate_distance(start, waypoint)
    segment2_dist = _calculate_distance(waypoint, end)
    total_distance = segment1_dist + segment2_dist
    
    segment1_aqi = _get_segment_aqi(start, waypoint, stations)
    segment2_aqi = _get_segment_aqi(waypoint, end, stations)
    
    avg_aqi = (segment1_aqi * segment1_dist + segment2_aqi * segment2_dist) / total_distance
    
    return {
        "name": f"Via {name.capitalize()}",
        "waypoints": [start, waypoint, end],
        "distance_km": total_distance,
        "avg_aqi": avg_aqi,
        "estimated_time_minutes": round(total_distance * 3),
        "segments": [
            {
                "start": start,
                "end": waypoint,
                "aqi": segment1_aqi,
                "distance_km": segment1_dist
            },
            {
                "start": waypoint,
                "end": end,
                "aqi": segment2_aqi,
                "distance_km": segment2_dist
            }
        ]
    }


def _get_segment_aqi(start: Tuple[float, float], end: Tuple[float, float], stations) -> float:
    """Calculate average AQI along a route segment"""
    # Get stations near the route
    relevant_stations = []
    
    for station in stations:
        station_point = (station.latitude, station.longitude)
        
        # Check if station is near the line segment
        distance_to_route = _point_to_line_distance(station_point, start, end)
        
        if distance_to_route < 2.0:  # Within 2 km of route
            relevant_stations.append(station)
    
    if not relevant_stations:
        # If no nearby stations, use closest one
        closest = min(stations, key=lambda s: _calculate_distance(start, (s.latitude, s.longitude)))
        return closest.aqi
    
    # Weight by distance
    weighted_aqi = 0
    total_weight = 0
    
    for station in relevant_stations:
        station_point = (station.latitude, station.longitude)
        dist = _point_to_line_distance(station_point, start, end)
        weight = 1 / (dist + 0.1)  # Avoid division by zero
        
        weighted_aqi += station.aqi * weight
        total_weight += weight
    
    return weighted_aqi / total_weight if total_weight > 0 else relevant_stations[0].aqi


def _calculate_distance(point1: Tuple[float, float], point2: Tuple[float, float]) -> float:
    """Calculate distance between two points using Haversine formula"""
    lat1, lon1 = point1
    lat2, lon2 = point2
    
    R = 6371  # Earth's radius in km
    
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    
    a = (math.sin(dlat / 2) ** 2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
         math.sin(dlon / 2) ** 2)
    
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    
    return R * c


def _point_to_line_distance(point: Tuple[float, float], line_start: Tuple[float, float], 
                            line_end: Tuple[float, float]) -> float:
    """Calculate minimum distance from point to line segment"""
    # Simplified version - in production, use proper geometric calculation
    dist_to_start = _calculate_distance(point, line_start)
    dist_to_end = _calculate_distance(point, line_end)
    
    return min(dist_to_start, dist_to_end)


def _format_route_details(route: Dict) -> Dict:
    """Format route for API response"""
    return {
        "name": route["name"],
        "distance_km": round(route["distance_km"], 2),
        "avg_aqi": round(route["avg_aqi"], 2),
        "category": _get_aqi_category(route["avg_aqi"]),
        "estimated_time_minutes": route["estimated_time_minutes"],
        "health_impact": _calculate_health_impact(route["avg_aqi"], route["distance_km"]),
        "waypoints": route["waypoints"],
        "segments": route["segments"]
    }


def _get_aqi_category(aqi: float) -> str:
    """Get AQI category"""
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


def _calculate_health_impact(aqi: float, distance_km: float) -> str:
    """Calculate health impact score"""
    impact_score = (aqi / 100) * distance_km
    
    if impact_score < 5:
        return "Low"
    elif impact_score < 15:
        return "Moderate"
    elif impact_score < 30:
        return "High"
    else:
        return "Very High"


def _get_health_recommendation(aqi: float) -> str:
    """Get health recommendation based on AQI"""
    if aqi <= 50:
        return "Air quality is good. Enjoy outdoor activities!"
    elif aqi <= 100:
        return "Air quality is satisfactory. Sensitive individuals should limit prolonged outdoor exertion."
    elif aqi <= 200:
        return "Moderate air quality. Limit prolonged outdoor activities, especially for sensitive groups."
    elif aqi <= 300:
        return "Poor air quality. Avoid prolonged outdoor activities. Wear a mask if going outside."
    elif aqi <= 400:
        return "Very poor air quality. Minimize outdoor exposure. Use air purifiers indoors."
    else:
        return "Severe air quality. Avoid all outdoor activities. Stay indoors with air purifiers."


def _get_activity_recommendation(aqi: float, activity: str, duration_minutes: int) -> Dict:
    """Get activity-specific recommendation"""
    
    if aqi <= 50:
        return {
            "recommendation": f"Excellent conditions for {activity}! Go ahead and enjoy.",
            "safety_level": "safe",
            "precautions": ["Stay hydrated", "Warm up properly"]
        }
    elif aqi <= 100:
        return {
            "recommendation": f"{activity.capitalize()} is okay, but take breaks if needed.",
            "safety_level": "moderate",
            "precautions": ["Monitor how you feel", "Take breaks if experiencing discomfort"]
        }
    elif aqi <= 200:
        return {
            "recommendation": f"Consider postponing {activity} or reducing intensity.",
            "safety_level": "caution",
            "precautions": ["Wear an N95 mask", "Reduce intensity", "Shorten duration"]
        }
    elif aqi <= 300:
        return {
            "recommendation": f"Not recommended for {activity}. Consider indoor alternatives.",
            "safety_level": "unhealthy",
            "precautions": ["Avoid outdoor exercise", "Use indoor gym", "Wait for better air quality"]
        }
    else:
        return {
            "recommendation": f"Strongly advised against {activity}. Stay indoors.",
            "safety_level": "hazardous",
            "precautions": ["Stay indoors", "Use air purifiers", "Close windows", "Consult doctor if experiencing symptoms"]
        }