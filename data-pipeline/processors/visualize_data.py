"""
Data Visualizer
Create charts and graphs for AQI and Weather data
"""
import pandas as pd
import matplotlib.pyplot as plt
import sys
from pathlib import Path
from datetime import datetime

# Add parent directory to path
sys.path.append(str(Path(__file__).parent.parent))
from config import RAW_DATA_DIR, PROJECT_ROOT


class DataVisualizer:
    """Create visualizations for collected data"""
    
    def __init__(self):
        self.raw_dir = RAW_DATA_DIR
        self.charts_dir = PROJECT_ROOT / "charts"
        self.charts_dir.mkdir(exist_ok=True)
    
    def load_data(self, date=None):
        """Load AQI and Weather data for a date"""
        if date is None:
            date = datetime.now().strftime("%Y%m%d")
        
        aqi_file = self.raw_dir / f"aqi_{date}.csv"
        weather_file = self.raw_dir / f"weather_{date}.csv"
        
        aqi_df = None
        weather_df = None
        
        if aqi_file.exists():
            aqi_df = pd.read_csv(aqi_file)
            aqi_df['timestamp'] = pd.to_datetime(aqi_df['timestamp'])
        
        if weather_file.exists():
            weather_df = pd.read_csv(weather_file)
            weather_df['timestamp'] = pd.to_datetime(weather_df['timestamp'])
        
        return aqi_df, weather_df
    
    def plot_aqi_timeline(self, date=None):
        """Plot AQI over time"""
        aqi_df, _ = self.load_data(date)
        
        if aqi_df is None or len(aqi_df) == 0:
            print("❌ No AQI data available")
            return
        
        plt.figure(figsize=(12, 6))
        
        # Plot AQI
        plt.plot(aqi_df['timestamp'], aqi_df['aqi'], 
                marker='o', linewidth=2, markersize=8, 
                color='#e74c3c', label='AQI')
        
        # AQI level zones
        plt.axhspan(0, 50, alpha=0.2, color='green', label='Good')
        plt.axhspan(50, 100, alpha=0.2, color='yellow', label='Moderate')
        plt.axhspan(100, 150, alpha=0.2, color='orange', label='Unhealthy (Sensitive)')
        plt.axhspan(150, 200, alpha=0.2, color='red', label='Unhealthy')
        plt.axhspan(200, 300, alpha=0.2, color='purple', label='Very Unhealthy')
        plt.axhspan(300, 500, alpha=0.2, color='maroon', label='Hazardous')
        
        plt.xlabel('Time', fontsize=12, fontweight='bold')
        plt.ylabel('AQI', fontsize=12, fontweight='bold')
        plt.title('Delhi Air Quality Index (AQI) Timeline', 
                 fontsize=14, fontweight='bold')
        plt.grid(True, alpha=0.3)
        plt.xticks(rotation=45)
        plt.legend(loc='upper right')
        plt.tight_layout()
        
        # Save
        filename = self.charts_dir / f"aqi_timeline_{date or datetime.now().strftime('%Y%m%d')}.png"
        plt.savefig(filename, dpi=300, bbox_inches='tight')
        print(f"✅ Chart saved: {filename.name}")
        plt.close()
    
    def plot_pollutants(self, date=None):
        """Plot individual pollutants"""
        aqi_df, _ = self.load_data(date)
        
        if aqi_df is None or len(aqi_df) == 0:
            print("❌ No AQI data available")
            return
        
        fig, axes = plt.subplots(2, 2, figsize=(14, 10))
        fig.suptitle('Delhi Pollutant Levels', fontsize=16, fontweight='bold')
        
        # PM2.5
        axes[0, 0].plot(aqi_df['timestamp'], aqi_df['pm25'], 
                       marker='o', color='#e74c3c', linewidth=2)
        axes[0, 0].axhline(y=50, color='orange', linestyle='--', label='Safe Limit')
        axes[0, 0].set_title('PM2.5 (Fine Particles)', fontweight='bold')
        axes[0, 0].set_ylabel('μg/m³')
        axes[0, 0].grid(True, alpha=0.3)
        axes[0, 0].legend()
        
        # PM10
        axes[0, 1].plot(aqi_df['timestamp'], aqi_df['pm10'], 
                       marker='o', color='#3498db', linewidth=2)
        axes[0, 1].axhline(y=100, color='orange', linestyle='--', label='Safe Limit')
        axes[0, 1].set_title('PM10 (Coarse Particles)', fontweight='bold')
        axes[0, 1].set_ylabel('μg/m³')
        axes[0, 1].grid(True, alpha=0.3)
        axes[0, 1].legend()
        
        # NO2
        axes[1, 0].plot(aqi_df['timestamp'], aqi_df['no2'], 
                       marker='o', color='#9b59b6', linewidth=2)
        axes[1, 0].set_title('NO2 (Nitrogen Dioxide)', fontweight='bold')
        axes[1, 0].set_ylabel('ppb')
        axes[1, 0].grid(True, alpha=0.3)
        
        # O3
        axes[1, 1].plot(aqi_df['timestamp'], aqi_df['o3'], 
                       marker='o', color='#27ae60', linewidth=2)
        axes[1, 1].set_title('O3 (Ozone)', fontweight='bold')
        axes[1, 1].set_ylabel('ppb')
        axes[1, 1].grid(True, alpha=0.3)
        
        # Format x-axis
        for ax in axes.flat:
            ax.tick_params(axis='x', rotation=45)
        
        plt.tight_layout()
        
        # Save
        filename = self.charts_dir / f"pollutants_{date or datetime.now().strftime('%Y%m%d')}.png"
        plt.savefig(filename, dpi=300, bbox_inches='tight')
        print(f"✅ Chart saved: {filename.name}")
        plt.close()
    
    def plot_weather(self, date=None):
        """Plot weather conditions"""
        _, weather_df = self.load_data(date)
        
        if weather_df is None or len(weather_df) == 0:
            print("❌ No weather data available")
            return
        
        fig, axes = plt.subplots(2, 2, figsize=(14, 10))
        fig.suptitle('Delhi Weather Conditions', fontsize=16, fontweight='bold')
        
        # Temperature
        axes[0, 0].plot(weather_df['timestamp'], weather_df['temperature'], 
                       marker='o', color='#e74c3c', linewidth=2, label='Actual')
        axes[0, 0].plot(weather_df['timestamp'], weather_df['feels_like'], 
                       marker='s', color='#95a5a6', linewidth=2, label='Feels Like')
        axes[0, 0].set_title('Temperature', fontweight='bold')
        axes[0, 0].set_ylabel('°C')
        axes[0, 0].grid(True, alpha=0.3)
        axes[0, 0].legend()
        
        # Humidity
        axes[0, 1].plot(weather_df['timestamp'], weather_df['humidity'], 
                       marker='o', color='#3498db', linewidth=2)
        axes[0, 1].set_title('Humidity', fontweight='bold')
        axes[0, 1].set_ylabel('%')
        axes[0, 1].grid(True, alpha=0.3)
        
        # Wind Speed
        axes[1, 0].plot(weather_df['timestamp'], weather_df['wind_speed'], 
                       marker='o', color='#27ae60', linewidth=2)
        axes[1, 0].set_title('Wind Speed', fontweight='bold')
        axes[1, 0].set_ylabel('m/s')
        axes[1, 0].grid(True, alpha=0.3)
        
        # Pressure
        axes[1, 1].plot(weather_df['timestamp'], weather_df['pressure'], 
                       marker='o', color='#9b59b6', linewidth=2)
        axes[1, 1].set_title('Atmospheric Pressure', fontweight='bold')
        axes[1, 1].set_ylabel('hPa')
        axes[1, 1].grid(True, alpha=0.3)
        
        # Format x-axis
        for ax in axes.flat:
            ax.tick_params(axis='x', rotation=45)
        
        plt.tight_layout()
        
        # Save
        filename = self.charts_dir / f"weather_{date or datetime.now().strftime('%Y%m%d')}.png"
        plt.savefig(filename, dpi=300, bbox_inches='tight')
        print(f"✅ Chart saved: {filename.name}")
        plt.close()
    
    def create_all_charts(self, date=None):
        """Create all visualization charts"""
        print("\n" + "="*60)
        print("📊 CREATING VISUALIZATIONS")
        print("="*60 + "\n")
        
        self.plot_aqi_timeline(date)
        self.plot_pollutants(date)
        self.plot_weather(date)
        
        print("\n" + "="*60)
        print(f"✅ All charts saved in: {self.charts_dir}")
        print("="*60 + "\n")


def main():
    """Main function"""
    visualizer = DataVisualizer()
    visualizer.create_all_charts()


if __name__ == "__main__":
    main()