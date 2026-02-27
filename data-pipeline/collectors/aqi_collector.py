"""
Delhi AQI Data Collector
Collects real-time air quality data from AQICN
"""
import requests
import pandas as pd
from datetime import datetime
import sys
from pathlib import Path

# Add parent directory to path to import config
sys.path.append(str(Path(__file__).parent.parent))
from config import (
    AQICN_TOKEN, AQICN_BASE_URL, CITY_NAME, 
    RAW_DATA_DIR, TIMEOUT, MAX_RETRIES, DATETIME_FORMAT
)


class AQICollector:
    """Collects AQI data from AQICN API"""
    
    def __init__(self):
        self.token = AQICN_TOKEN
        self.city = CITY_NAME
        self.base_url = AQICN_BASE_URL
        
        if not self.token or self.token == 'your_aqicn_token_here':
            raise ValueError("❌ AQICN_TOKEN not found in .env file! Please add your API token.")
    
    def get_current_aqi(self):
        """
        Fetch current AQI data for Delhi
        Returns: dict with AQI data or None if failed
        """
        url = f"{self.base_url}/feed/{self.city}/?token={self.token}"
        
        for attempt in range(MAX_RETRIES):
            try:
                print(f"📡 Fetching AQI data (attempt {attempt + 1}/{MAX_RETRIES})...")
                response = requests.get(url, timeout=TIMEOUT)
                
                if response.status_code == 200:
                    data = response.json()
                    
                    if data['status'] == 'ok':
                        return self._parse_aqi_data(data['data'])
                    else:
                        print(f"⚠️  API returned status: {data['status']}")
                        return None
                else:
                    print(f"⚠️  HTTP {response.status_code}")
                    
            except Exception as e:
                print(f"❌ Error: {e}")
                if attempt < MAX_RETRIES - 1:
                    print("🔄 Retrying...")
                    
        return None
    
    def _parse_aqi_data(self, data):
        """Parse API response into structured format"""
        try:
            # Extract pollutant data
            iaqi = data.get('iaqi', {})
            
            aqi_data = {
                'timestamp': datetime.now().strftime(DATETIME_FORMAT),
                'city': data.get('city', {}).get('name', self.city),
                'aqi': data.get('aqi', None),
                'pm25': iaqi.get('pm25', {}).get('v', None),
                'pm10': iaqi.get('pm10', {}).get('v', None),
                'o3': iaqi.get('o3', {}).get('v', None),
                'no2': iaqi.get('no2', {}).get('v', None),
                'so2': iaqi.get('so2', {}).get('v', None),
                'co': iaqi.get('co', {}).get('v', None),
                'temperature': iaqi.get('t', {}).get('v', None),
                'humidity': iaqi.get('h', {}).get('v', None),
                'pressure': iaqi.get('p', {}).get('v', None),
                'wind_speed': iaqi.get('w', {}).get('v', None)
            }
            
            print(f"✅ AQI data collected: AQI={aqi_data['aqi']}")
            return aqi_data
            
        except Exception as e:
            print(f"❌ Error parsing data: {e}")
            return None
    
    def save_data(self, data):
        """Save AQI data to CSV file"""
        if not data:
            print("⚠️  No data to save")
            return False
        
        try:
            # File path: data/raw/aqi_YYYYMMDD.csv
            date_str = datetime.now().strftime("%Y%m%d")
            filepath = RAW_DATA_DIR / f"aqi_{date_str}.csv"
            
            # Convert to DataFrame
            df = pd.DataFrame([data])
            
            # Append to file or create new
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
        """Main method: collect and save data"""
        print("="*50)
        print(f"🌫️  COLLECTING AQI DATA FOR {self.city}")
        print("="*50)
        
        data = self.get_current_aqi()
        
        if data:
            success = self.save_data(data)
            if success:
                self._print_summary(data)
                return True
        
        print("❌ Data collection failed")
        return False
    
    def _print_summary(self, data):
        """Print data collection summary"""
        aqi = data['aqi']
        
        # AQI level
        if aqi <= 50:
            level = "Good 🟢"
        elif aqi <= 100:
            level = "Moderate 🟡"
        elif aqi <= 150:
            level = "Unhealthy for Sensitive Groups 🟠"
        elif aqi <= 200:
            level = "Unhealthy 🔴"
        elif aqi <= 300:
            level = "Very Unhealthy 🟣"
        else:
            level = "Hazardous ⚫"
        
        print("\n" + "="*50)
        print("📊 DATA SUMMARY")
        print("="*50)
        print(f"🕐 Time: {data['timestamp']}")
        print(f"📍 City: {data['city']}")
        print(f"🌫️  AQI: {aqi} - {level}")
        print(f"💨 PM2.5: {data['pm25']}")
        print(f"💨 PM10: {data['pm10']}")
        print(f"🌡️  Temperature: {data['temperature']}°C")
        print(f"💧 Humidity: {data['humidity']}%")
        print("="*50)


def main():
    """Run AQI collector"""
    collector = AQICollector()
    collector.collect_and_save()


if __name__ == "__main__":
    main()
# ```

# 5. **Save** the file (Ctrl+S)

# ---

# ## 📂 YOUR PROJECT STRUCTURE NOW:
# ```
# AirVision/
# ├── .env  ✅ (API keys will be added later)
# ├── data/
# │   ├── raw/  ✅ (will be auto-created)
# │   └── processed/  ✅ (will be auto-created)
# ├── data-pipeline/
# │   ├── config.py  ✅ NEW!
# │   └── collectors/
# │       ├── test_api.py  ✅ (already exists)
# │       └── aqi_collector.py  ✅ NEW!
# └── venv/