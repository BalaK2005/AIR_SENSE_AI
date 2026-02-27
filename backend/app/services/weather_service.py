"""
Weather Service
Integrates weather data for improved AQI forecasting
"""

import requests
import logging
from typing import Dict, Optional
from datetime import datetime

from app.core.config import settings
from app.services.cache_service import cache_get, cache_set

logger = logging.getLogger(__name__)


class WeatherService:
    """
    Service for fetching weather data from external APIs
    """
    
    def __init__(self):
        self.api_key = settings.WEATHER_API_KEY
        self.base_url = settings.WEATHER_API_URL
    
    def get_current_weather(
        self,
        latitude: float,
        longitude: float
    ) -> Optional[Dict]:
        """
        Get current weather for location
        
        Args:
            latitude: Latitude
            longitude: Longitude
            
        Returns:
            Weather data dictionary or None
        """
        # Check cache first
        cache_key = f"weather_current_{latitude}_{longitude}"
        cached_data = cache_get(cache_key)
        if cached_data:
            return cached_data
        
        if not self.api_key:
            logger.warning("Weather API key not configured")
            return None
        
        try:
            url = f"{self.base_url}/weather"
            params = {
                "lat": latitude,
                "lon": longitude,
                "appid": self.api_key,
                "units": "metric"
            }
            
            response = requests.get(url, params=params, timeout=10)
            response.raise_for_status()
            
            data = response.json()
            
            weather_data = {
                "temperature": data["main"]["temp"],
                "feels_like": data["main"]["feels_like"],
                "humidity": data["main"]["humidity"],
                "pressure": data["main"]["pressure"],
                "wind_speed": data["wind"]["speed"],
                "wind_direction": data["wind"]["deg"],
                "clouds": data["clouds"]["all"],
                "visibility": data.get("visibility"),
                "description": data["weather"][0]["description"],
                "icon": data["weather"][0]["icon"],
                "timestamp": datetime.utcnow().isoformat()
            }
            
            # Cache for 30 minutes
            cache_set(cache_key, weather_data, ttl=1800)
            
            return weather_data
            
        except Exception as e:
            logger.error(f"Error fetching current weather: {e}")
            return None
    
    def get_weather_forecast(
        self,
        latitude: float,
        longitude: float,
        hours: int = 48
    ) -> Optional[Dict]:
        """
        Get weather forecast
        
        Args:
            latitude: Latitude
            longitude: Longitude
            hours: Number of hours to forecast
            
        Returns:
            Forecast data or None
        """
        cache_key = f"weather_forecast_{latitude}_{longitude}_{hours}"
        cached_data = cache_get(cache_key)
        if cached_data:
            return cached_data
        
        if not self.api_key:
            logger.warning("Weather API key not configured")
            return None
        
        try:
            url = f"{self.base_url}/forecast"
            params = {
                "lat": latitude,
                "lon": longitude,
                "appid": self.api_key,
                "units": "metric"
            }
            
            response = requests.get(url, params=params, timeout=10)
            response.raise_for_status()
            
            data = response.json()
            
            # Process forecast data
            forecast_list = []
            for item in data["list"][:hours//3]:  # API gives 3-hour intervals
                forecast_list.append({
                    "timestamp": item["dt_txt"],
                    "temperature": item["main"]["temp"],
                    "humidity": item["main"]["humidity"],
                    "pressure": item["main"]["pressure"],
                    "wind_speed": item["wind"]["speed"],
                    "wind_direction": item["wind"]["deg"],
                    "clouds": item["clouds"]["all"],
                    "description": item["weather"][0]["description"]
                })
            
            forecast_data = {
                "location": {
                    "latitude": latitude,
                    "longitude": longitude,
                    "city": data["city"]["name"]
                },
                "forecast": forecast_list,
                "retrieved_at": datetime.utcnow().isoformat()
            }
            
            # Cache for 1 hour
            cache_set(cache_key, forecast_data, ttl=3600)
            
            return forecast_data
            
        except Exception as e:
            logger.error(f"Error fetching weather forecast: {e}")
            return None
    
    def get_air_pollution(
        self,
        latitude: float,
        longitude: float
    ) -> Optional[Dict]:
        """
        Get air pollution data from weather API
        
        Args:
            latitude: Latitude
            longitude: Longitude
            
        Returns:
            Air pollution data or None
        """
        cache_key = f"weather_pollution_{latitude}_{longitude}"
        cached_data = cache_get(cache_key)
        if cached_data:
            return cached_data
        
        if not self.api_key:
            return None
        
        try:
            url = f"{self.base_url}/air_pollution"
            params = {
                "lat": latitude,
                "lon": longitude,
                "appid": self.api_key
            }
            
            response = requests.get(url, params=params, timeout=10)
            response.raise_for_status()
            
            data = response.json()
            
            if "list" in data and len(data["list"]) > 0:
                components = data["list"][0]["components"]
                
                pollution_data = {
                    "aqi": data["list"][0]["main"]["aqi"],
                    "co": components.get("co"),
                    "no": components.get("no"),
                    "no2": components.get("no2"),
                    "o3": components.get("o3"),
                    "so2": components.get("so2"),
                    "pm2_5": components.get("pm2_5"),
                    "pm10": components.get("pm10"),
                    "nh3": components.get("nh3"),
                    "timestamp": datetime.utcnow().isoformat()
                }
                
                # Cache for 30 minutes
                cache_set(cache_key, pollution_data, ttl=1800)
                
                return pollution_data
            
            return None
            
        except Exception as e:
            logger.error(f"Error fetching air pollution data: {e}")
            return None
    
    def get_weather_factors(
        self,
        latitude: float,
        longitude: float
    ) -> Dict:
        """
        Get weather factors that affect air quality
        
        Args:
            latitude: Latitude
            longitude: Longitude
            
        Returns:
            Dictionary of weather factors
        """
        current = self.get_current_weather(latitude, longitude)
        
        if not current:
            return {}
        
        factors = {
            "temperature": current["temperature"],
            "humidity": current["humidity"],
            "wind_speed": current["wind_speed"],
            "wind_direction": current["wind_direction"],
            "pressure": current["pressure"],
            "visibility": current.get("visibility"),
            
            # Derived factors
            "wind_category": self._categorize_wind(current["wind_speed"]),
            "humidity_category": self._categorize_humidity(current["humidity"]),
            "dispersion_potential": self._calculate_dispersion_potential(current),
            "weather_impact": self._assess_weather_impact(current)
        }
        
        return factors
    
    def _categorize_wind(self, wind_speed: float) -> str:
        """Categorize wind speed"""
        if wind_speed < 1:
            return "calm"
        elif wind_speed < 5:
            return "light"
        elif wind_speed < 11:
            return "moderate"
        elif wind_speed < 20:
            return "fresh"
        else:
            return "strong"
    
    def _categorize_humidity(self, humidity: float) -> str:
        """Categorize humidity"""
        if humidity < 30:
            return "low"
        elif humidity < 60:
            return "moderate"
        else:
            return "high"
    
    def _calculate_dispersion_potential(self, weather: Dict) -> str:
        """
        Calculate pollutant dispersion potential based on weather
        
        Args:
            weather: Weather data
            
        Returns:
            Dispersion potential: low, moderate, high
        """
        wind_speed = weather["wind_speed"]
        
        # Higher wind speed = better dispersion
        if wind_speed > 10:
            return "high"
        elif wind_speed > 5:
            return "moderate"
        else:
            return "low"
    
    def _assess_weather_impact(self, weather: Dict) -> str:
        """
        Assess overall weather impact on air quality
        
        Args:
            weather: Weather data
            
        Returns:
            Impact assessment: favorable, neutral, unfavorable
        """
        wind_speed = weather["wind_speed"]
        humidity = weather["humidity"]
        
        # Good conditions: high wind, moderate humidity
        if wind_speed > 8 and 30 < humidity < 70:
            return "favorable"
        
        # Bad conditions: low wind, high humidity
        elif wind_speed < 3 and humidity > 70:
            return "unfavorable"
        
        else:
            return "neutral"
    
    def get_historical_weather(
        self,
        latitude: float,
        longitude: float,
        start_date: datetime,
        end_date: datetime
    ) -> Optional[Dict]:
        """
        Get historical weather data
        
        Args:
            latitude: Latitude
            longitude: Longitude
            start_date: Start date
            end_date: End date
            
        Returns:
            Historical weather data or None
        """
        # This would require a different API endpoint or service
        # Placeholder for now
        logger.info("Historical weather data not yet implemented")
        return None
    
    def check_weather_alerts(
        self,
        latitude: float,
        longitude: float
    ) -> Optional[Dict]:
        """
        Check for weather alerts/warnings
        
        Args:
            latitude: Latitude
            longitude: Longitude
            
        Returns:
            Weather alerts or None
        """
        # Placeholder for weather alerts
        logger.info("Weather alerts check not yet implemented")
        return None


# Singleton instance
_weather_service = None


def get_weather_service() -> WeatherService:
    """
    Get singleton weather service instance
    
    Returns:
        WeatherService instance
    """
    global _weather_service
    if _weather_service is None:
        _weather_service = WeatherService()
    return _weather_service