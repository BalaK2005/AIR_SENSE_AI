"""
Data Viewer
View and explore collected AQI and Weather data
"""
import pandas as pd
import sys
from pathlib import Path
from datetime import datetime

# Add parent directory to path
sys.path.append(str(Path(__file__).parent.parent))
from config import RAW_DATA_DIR


class DataViewer:
    """View collected data"""
    
    def __init__(self):
        self.raw_dir = RAW_DATA_DIR
    
    def list_data_files(self):
        """List all available data files"""
        print("="*60)
        print("📂 AVAILABLE DATA FILES")
        print("="*60)
        
        aqi_files = sorted(self.raw_dir.glob("aqi_*.csv"))
        weather_files = sorted(self.raw_dir.glob("weather_*.csv"))
        
        print(f"\n🌫️  AQI Files ({len(aqi_files)}):")
        for f in aqi_files:
            size = f.stat().st_size
            print(f"   📄 {f.name} ({size} bytes)")
        
        print(f"\n🌤️  Weather Files ({len(weather_files)}):")
        for f in weather_files:
            size = f.stat().st_size
            print(f"   📄 {f.name} ({size} bytes)")
        
        print("\n" + "="*60)
    
    def view_aqi_data(self, date=None):
        """View AQI data for a specific date"""
        if date is None:
            date = datetime.now().strftime("%Y%m%d")
        
        filepath = self.raw_dir / f"aqi_{date}.csv"
        
        if not filepath.exists():
            print(f"❌ No AQI data found for {date}")
            return
        
        df = pd.read_csv(filepath)
        
        print("\n" + "="*60)
        print(f"🌫️  AQI DATA - {date}")
        print("="*60)
        print(f"📊 Total Records: {len(df)}")
        print(f"📅 Date Range: {df['timestamp'].min()} to {df['timestamp'].max()}")
        print("\n" + "-"*60)
        print("LATEST DATA:")
        print("-"*60)
        print(df.tail(1).to_string(index=False))
        print("\n" + "-"*60)
        print("STATISTICS:")
        print("-"*60)
        print(f"🌫️  Average AQI: {df['aqi'].mean():.1f}")
        print(f"📈 Max AQI: {df['aqi'].max():.0f}")
        print(f"📉 Min AQI: {df['aqi'].min():.0f}")
        print(f"💨 Average PM2.5: {df['pm25'].mean():.1f}")
        print(f"💨 Average PM10: {df['pm10'].mean():.1f}")
        print("="*60 + "\n")
    
    def view_weather_data(self, date=None):
        """View weather data for a specific date"""
        if date is None:
            date = datetime.now().strftime("%Y%m%d")
        
        filepath = self.raw_dir / f"weather_{date}.csv"
        
        if not filepath.exists():
            print(f"❌ No weather data found for {date}")
            return
        
        df = pd.read_csv(filepath)
        
        print("\n" + "="*60)
        print(f"🌤️  WEATHER DATA - {date}")
        print("="*60)
        print(f"📊 Total Records: {len(df)}")
        print(f"📅 Date Range: {df['timestamp'].min()} to {df['timestamp'].max()}")
        print("\n" + "-"*60)
        print("LATEST DATA:")
        print("-"*60)
        print(df.tail(1).to_string(index=False))
        print("\n" + "-"*60)
        print("STATISTICS:")
        print("-"*60)
        print(f"🌡️  Average Temp: {df['temperature'].mean():.1f}°C")
        print(f"📈 Max Temp: {df['temperature'].max():.1f}°C")
        print(f"📉 Min Temp: {df['temperature'].min():.1f}°C")
        print(f"💧 Average Humidity: {df['humidity'].mean():.1f}%")
        print(f"🌬️  Average Wind Speed: {df['wind_speed'].mean():.2f} m/s")
        print("="*60 + "\n")
    
    def view_all_today(self):
        """View all today's data"""
        today = datetime.now().strftime("%Y%m%d")
        self.view_aqi_data(today)
        self.view_weather_data(today)


def main():
    """Main function"""
    viewer = DataViewer()
    
    print("\n" + "="*60)
    print("📊 AIRVISION - DATA VIEWER")
    print("="*60 + "\n")
    
    viewer.list_data_files()
    viewer.view_all_today()


if __name__ == "__main__":
    main()