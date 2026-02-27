"""
Delhi Weather Data Collector
Collects weather data from OpenWeatherMap API
"""
import requests
import pandas as pd
from datetime import datetime
import sys
from pathlib import Path

# Add parent directory to path
sys.path.append(str(Path(__file__).parent.parent))
from config import (
    OPENWEATHER_KEY, OPENWEATHER_BASE_URL, CITY_NAME,
    LATITUDE, LONGITUDE, RAW_DATA_DIR, TIMEOUT, 
    MAX_RETRIES, DATETIME_FORMAT
)


class WeatherCollector:
    """Collects weather data from OpenWeatherMap API"""
    
    def __init__(self):
        self.api_key = OPENWEATHER_KEY
        self.city = CITY_NAME
        self.lat = LATITUDE
        self.lon = LONGITUDE
        self.base_url = OPENWEATHER_BASE_URL
        
        if not self.api_key or self.api_key == 'your_openweather_key_here':
            raise ValueError("❌ OPENWEATHER_KEY not found in .env file!")
    
    def get_current_weather(self):
        """Fetch current weather data"""
        url = f"{self.base_url}/weather"
        params = {
            'lat': self.lat,
            'lon': self.lon,
            'appid': self.api_key,
            'units': 'metric'  # Celsius
        }
        
        for attempt in range(MAX_RETRIES):
            try:
                print(f"📡 Fetching weather data (attempt {attempt + 1}/{MAX_RETRIES})...")
                response = requests.get(url, params=params, timeout=TIMEOUT)
                
                if response.status_code == 200:
                    data = response.json()
                    return self._parse_weather_data(data)
                else:
                    print(f"⚠️  HTTP {response.status_code}")
                    
            except Exception as e:
                print(f"❌ Error: {e}")
                if attempt < MAX_RETRIES - 1:
                    print("🔄 Retrying...")
                    
        return None
    
    def _parse_weather_data(self, data):
        """Parse weather API response"""
        try:
            weather_data = {
                'timestamp': datetime.now().strftime(DATETIME_FORMAT),
                'city': self.city,
                'temperature': data['main']['temp'],
                'feels_like': data['main']['feels_like'],
                'temp_min': data['main']['temp_min'],
                'temp_max': data['main']['temp_max'],
                'pressure': data['main']['pressure'],
                'humidity': data['main']['humidity'],
                'wind_speed': data['wind']['speed'],
                'wind_direction': data['wind'].get('deg', None),
                'clouds': data['clouds']['all'],
                'visibility': data.get('visibility', None),
                'weather_main': data['weather'][0]['main'],
                'weather_description': data['weather'][0]['description']
            }
            
            print(f"✅ Weather data collected: {weather_data['temperature']}°C")
            return weather_data
            
        except Exception as e:
            print(f"❌ Error parsing data: {e}")
            return None
    
    def save_data(self, data):
        """Save weather data to CSV"""
        if not data:
            print("⚠️  No data to save")
            return False
        
        try:
            date_str = datetime.now().strftime("%Y%m%d")
            filepath = RAW_DATA_DIR / f"weather_{date_str}.csv"
            
            df = pd.DataFrame([data])
            
            if filepath.exists():
                df.to_csv(filepath, mode='a', header=False, index=False)
                print(f"📝 Data appended to {filepath.name}")
            else:
                df.to_csv(filepath, index=False)
                print(f"📝 New file created: {filepath.name}")
            
            return True
            
        except Exception as e:
            print(f"❌ Error saving data: {e}")
            return False
    
    def collect_and_save(self):
        """Main method: collect and save weather data"""
        print("="*50)
        print(f"🌤️  COLLECTING WEATHER DATA FOR {self.city}")
        print("="*50)
        
        data = self.get_current_weather()
        
        if data:
            success = self.save_data(data)
            if success:
                self._print_summary(data)
                return True
        
        print("❌ Data collection failed")
        return False
    
    def _print_summary(self, data):
        """Print weather summary"""
        print("\n" + "="*50)
        print("🌤️  WEATHER SUMMARY")
        print("="*50)
        print(f"🕐 Time: {data['timestamp']}")
        print(f"📍 City: {data['city']}")
        print(f"🌡️  Temperature: {data['temperature']}°C (feels like {data['feels_like']}°C)")
        print(f"💧 Humidity: {data['humidity']}%")
        print(f"🌬️  Wind Speed: {data['wind_speed']} m/s")
        print(f"☁️  Clouds: {data['clouds']}%")
        print(f"🌦️  Conditions: {data['weather_description'].title()}")
        print("="*50)


def main():
    """Run weather collector"""
    collector = WeatherCollector()
    collector.collect_and_save()


if __name__ == "__main__":
    main() 