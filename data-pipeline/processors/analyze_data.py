"""
Data Analyzer
Comprehensive analysis of AQI and Weather data
"""
import pandas as pd
import numpy as np
import sys
from pathlib import Path
from datetime import datetime

# Add parent directory to path
sys.path.append(str(Path(__file__).parent.parent))
from config import RAW_DATA_DIR


class DataAnalyzer:
    """Analyze collected AQI and Weather data"""
    
    def __init__(self):
        self.raw_dir = RAW_DATA_DIR
    
    def load_all_data(self):
        """Load all available data"""
        aqi_files = sorted(self.raw_dir.glob("aqi_*.csv"))
        weather_files = sorted(self.raw_dir.glob("weather_*.csv"))
        
        aqi_dfs = []
        weather_dfs = []
        
        for f in aqi_files:
            df = pd.read_csv(f)
            df['timestamp'] = pd.to_datetime(df['timestamp'])
            aqi_dfs.append(df)
        
        for f in weather_files:
            df = pd.read_csv(f)
            df['timestamp'] = pd.to_datetime(df['timestamp'])
            weather_dfs.append(df)
        
        aqi_df = pd.concat(aqi_dfs, ignore_index=True) if aqi_dfs else None
        weather_df = pd.concat(weather_dfs, ignore_index=True) if weather_dfs else None
        
        return aqi_df, weather_df
    
    def get_aqi_category(self, aqi):
        """Get AQI category name"""
        if aqi <= 50:
            return "Good 🟢"
        elif aqi <= 100:
            return "Moderate 🟡"
        elif aqi <= 150:
            return "Unhealthy (Sensitive) 🟠"
        elif aqi <= 200:
            return "Unhealthy 🔴"
        elif aqi <= 300:
            return "Very Unhealthy 🟣"
        else:
            return "Hazardous ⚫"
    
    def analyze_aqi(self, aqi_df):
        """Analyze AQI data"""
        if aqi_df is None or len(aqi_df) == 0:
            print("❌ No AQI data available")
            return
        
        print("\n" + "="*60)
        print("🌫️  AQI ANALYSIS")
        print("="*60)
        
        print(f"\n📊 OVERALL STATISTICS:")
        print(f"   Total Records: {len(aqi_df)}")
        print(f"   Date Range: {aqi_df['timestamp'].min()} to {aqi_df['timestamp'].max()}")
        
        print(f"\n📈 AQI METRICS:")
        print(f"   Current AQI: {aqi_df['aqi'].iloc[-1]:.0f} - {self.get_aqi_category(aqi_df['aqi'].iloc[-1])}")
        print(f"   Average AQI: {aqi_df['aqi'].mean():.1f}")
        print(f"   Highest AQI: {aqi_df['aqi'].max():.0f}")
        print(f"   Lowest AQI: {aqi_df['aqi'].min():.0f}")
        print(f"   Std Deviation: {aqi_df['aqi'].std():.1f}")
        
        print(f"\n💨 POLLUTANT LEVELS:")
        print(f"   PM2.5 Average: {aqi_df['pm25'].mean():.1f} μg/m³")
        print(f"   PM10 Average: {aqi_df['pm10'].mean():.1f} μg/m³")
        print(f"   NO2 Average: {aqi_df['no2'].mean():.1f} ppb")
        print(f"   O3 Average: {aqi_df['o3'].mean():.1f} ppb")
        
        current_aqi = aqi_df['aqi'].iloc[-1]
        print(f"\n💡 HEALTH RECOMMENDATIONS:")
        if current_aqi <= 50:
            print("   ✅ Air quality is good. Enjoy outdoor activities!")
        elif current_aqi <= 100:
            print("   ⚠️  Acceptable. Sensitive individuals should limit prolonged outdoor exertion.")
        elif current_aqi <= 150:
            print("   🟠 Unhealthy for sensitive groups. Limit prolonged outdoor activities.")
        elif current_aqi <= 200:
            print("   🔴 Unhealthy. Everyone should limit outdoor activities.")
            print("   💊 Wear masks outdoors. Use air purifiers indoors.")
        elif current_aqi <= 300:
            print("   🟣 Very Unhealthy. Avoid outdoor activities.")
            print("   🏠 Stay indoors. Keep windows closed.")
        else:
            print("   ⚫ HAZARDOUS! Health alert - stay indoors!")
            print("   🚨 Emergency conditions. Avoid all outdoor activities.")
        
        print("="*60)
    
    def analyze_weather(self, weather_df):
        """Analyze weather data"""
        if weather_df is None or len(weather_df) == 0:
            print("❌ No weather data available")
            return
        
        print("\n" + "="*60)
        print("🌤️  WEATHER ANALYSIS")
        print("="*60)
        
        print(f"\n📊 OVERALL STATISTICS:")
        print(f"   Total Records: {len(weather_df)}")
        print(f"   Date Range: {weather_df['timestamp'].min()} to {weather_df['timestamp'].max()}")
        
        print(f"\n🌡️  TEMPERATURE:")
        print(f"   Current: {weather_df['temperature'].iloc[-1]:.1f}°C")
        print(f"   Average: {weather_df['temperature'].mean():.1f}°C")
        print(f"   Highest: {weather_df['temperature'].max():.1f}°C")
        print(f"   Lowest: {weather_df['temperature'].min():.1f}°C")
        print(f"   Feels Like: {weather_df['feels_like'].iloc[-1]:.1f}°C")
        
        print(f"\n💧 HUMIDITY:")
        print(f"   Current: {weather_df['humidity'].iloc[-1]:.0f}%")
        print(f"   Average: {weather_df['humidity'].mean():.1f}%")
        
        print(f"\n🌬️  WIND:")
        print(f"   Current Speed: {weather_df['wind_speed'].iloc[-1]:.2f} m/s")
        print(f"   Average Speed: {weather_df['wind_speed'].mean():.2f} m/s")
        
        print(f"\n☁️  CURRENT CONDITIONS:")
        print(f"   Weather: {weather_df['weather_main'].iloc[-1]}")
        print(f"   Description: {weather_df['weather_description'].iloc[-1].title()}")
        print(f"   Cloud Cover: {weather_df['clouds'].iloc[-1]:.0f}%")
        print(f"   Visibility: {weather_df['visibility'].iloc[-1]:.0f} meters")
        
        print("="*60)
    
    def analyze_correlations(self, aqi_df, weather_df):
        """Analyze correlations between AQI and weather"""
        if aqi_df is None or weather_df is None:
            print("\n⚠️  Cannot analyze correlations - missing data")
            return
        
        aqi_df = aqi_df.copy()
        weather_df = weather_df.copy()
        
        aqi_df['date'] = aqi_df['timestamp'].dt.date
        weather_df['date'] = weather_df['timestamp'].dt.date
        
        # ✅ FIX: Select only needed columns BEFORE merging to avoid _x/_y conflicts
        aqi_keep = [c for c in ['date', 'aqi', 'pm25', 'pm10', 'no2', 'o3'] if c in aqi_df.columns]
        weather_keep = [c for c in ['date', 'temperature', 'humidity', 'wind_speed', 'pressure'] if c in weather_df.columns]
        
        aqi_grouped = aqi_df[aqi_keep].groupby('date').mean()
        weather_grouped = weather_df[weather_keep].groupby('date').mean()
        
        merged = pd.merge(aqi_grouped, weather_grouped, on='date', how='inner')
        
        if len(merged) < 2:
            print("\n⚠️  Need more data points for correlation analysis")
            print("   (Collect data over multiple days to see correlations)")
            return
        
        print("\n" + "="*60)
        print("🔗 CORRELATION ANALYSIS")
        print("="*60)
        print(f"\n📊 Correlation between AQI and Weather:")
        
        for col, label in [('temperature', 'Temperature'), ('humidity', 'Humidity  '),
                           ('wind_speed', 'Wind Speed'), ('pressure', 'Pressure  ')]:
            if col in merged.columns:
                print(f"   AQI vs {label}: {merged['aqi'].corr(merged[col]):.3f}")
        
        print("\n💡 INSIGHTS:")
        wind_corr = merged['aqi'].corr(merged['wind_speed']) if 'wind_speed' in merged.columns else 0
        humidity_corr = merged['aqi'].corr(merged['humidity']) if 'humidity' in merged.columns else 0
        
        if wind_corr < -0.3:
            print("   🌬️  Higher wind speeds tend to reduce AQI (good!)")
        elif wind_corr < -0.1:
            print("   🌬️  Slight negative correlation between wind speed and AQI")
        
        if humidity_corr > 0.3:
            print("   💧 Higher humidity tends to increase AQI")
        elif humidity_corr > 0.1:
            print("   💧 Slight positive correlation between humidity and AQI")
        
        if abs(wind_corr) < 0.1 and abs(humidity_corr) < 0.1:
            print("   📊 No strong correlations detected yet")
            print("   💡 Collect more data over several days for better insights")
        
        print("="*60)
    
    def generate_report(self):
        """Generate comprehensive analysis report"""
        print("\n" + "="*60)
        print("📊 AIRVISION - COMPREHENSIVE DATA ANALYSIS")
        print("="*60)
        print(f"🕐 Report Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print("="*60)
        
        aqi_df, weather_df = self.load_all_data()
        
        self.analyze_aqi(aqi_df)
        self.analyze_weather(weather_df)
        self.analyze_correlations(aqi_df, weather_df)
        
        print("\n" + "="*60)
        print("✅ ANALYSIS COMPLETE")
        print("="*60 + "\n")


def main():
    """Main function"""
    analyzer = DataAnalyzer()
    analyzer.generate_report()


if __name__ == "__main__":
    main()