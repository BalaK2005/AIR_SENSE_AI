"""
Combined Data Collector
Runs both AQI and Weather collectors together
"""
import sys
from pathlib import Path
from datetime import datetime

# Add parent directory to path
sys.path.append(str(Path(__file__).parent.parent))

# Import collectors
from aqi_collector import AQICollector
from weather_collector import WeatherCollector


def collect_all_data():
    """Run all data collectors"""
    print("\n" + "="*60)
    print("🚀 AIRVISION - COMPLETE DATA COLLECTION")
    print("="*60)
    print(f"⏰ Collection Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("="*60 + "\n")
    
    success_count = 0
    total_count = 2
    
    # Collect AQI Data
    print("📊 STEP 1/2: Collecting AQI Data...")
    print("-" * 60)
    try:
        aqi_collector = AQICollector()
        if aqi_collector.collect_and_save():
            success_count += 1
            print("✅ AQI data collected successfully!\n")
        else:
            print("❌ AQI collection failed!\n")
    except Exception as e:
        print(f"❌ AQI Collector Error: {e}\n")
    
    # Collect Weather Data
    print("📊 STEP 2/2: Collecting Weather Data...")
    print("-" * 60)
    try:
        weather_collector = WeatherCollector()
        if weather_collector.collect_and_save():
            success_count += 1
            print("✅ Weather data collected successfully!\n")
        else:
            print("❌ Weather collection failed!\n")
    except Exception as e:
        print(f"❌ Weather Collector Error: {e}\n")
    
    # Summary
    print("="*60)
    print("📊 COLLECTION SUMMARY")
    print("="*60)
    print(f"✅ Successful: {success_count}/{total_count}")
    print(f"❌ Failed: {total_count - success_count}/{total_count}")
    
    if success_count == total_count:
        print("\n🎉 ALL DATA COLLECTED SUCCESSFULLY!")
    elif success_count > 0:
        print("\n⚠️  PARTIAL SUCCESS - Some collectors failed")
    else:
        print("\n❌ ALL COLLECTORS FAILED")
    
    print("="*60 + "\n")
    
    return success_count == total_count


def main():
    """Main function"""
    collect_all_data()


if __name__ == "__main__":
    main()