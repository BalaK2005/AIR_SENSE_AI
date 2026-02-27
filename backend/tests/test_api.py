"""
Test API connection - First AirVision script!
"""
import requests
from datetime import datetime

def test_aqicn_api():
    """
    Test AQICN API (using demo token)
    """
    print("🔄 Testing AQICN API...\n")
    
    # Public demo endpoint (no API key needed for test)
    url = "https://api.waqi.info/feed/delhi/?token=demo"
    
    try:
        print("📡 Fetching data from AQICN...")
        response = requests.get(url, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            
            if data['status'] == 'ok':
                # Extract data
                aqi = data['data']['aqi']
                city = data['data']['city']['name']
                time = data['data']['time']['s']
                
                print(f"\n{'='*50}")
                print(f"✅ API CONNECTION SUCCESSFUL!")
                print(f"{'='*50}")
                print(f"📍 City: {city}")
                print(f"🌫️  Current AQI: {aqi}")
                print(f"🕐 Time: {time}")
                
                # AQI level
                if aqi <= 50:
                    level = "Good 🟢"
                    advice = "Air quality is good. Enjoy outdoor activities!"
                elif aqi <= 100:
                    level = "Moderate 🟡"
                    advice = "Acceptable. Sensitive people should limit prolonged outdoor activity."
                elif aqi <= 200:
                    level = "Unhealthy 🟠"
                    advice = "Wear a mask outdoors. Use air purifiers indoors."
                elif aqi <= 300:
                    level = "Very Unhealthy 🔴"
                    advice = "Avoid outdoor activities. Keep windows closed."
                else:
                    level = "Hazardous ⚫"
                    advice = "Stay indoors! Health alert!"
                
                print(f"📊 Air Quality Level: {level}")
                print(f"💡 Health Advice: {advice}")
                print(f"{'='*50}\n")
                
                return True
            else:
                print(f"❌ API Error: {data}")
                return False
        else:
            print(f"❌ HTTP Error: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Error occurred: {e}")
        return False

def test_packages():
    """
    Test if all packages are imported correctly
    """
    print("🧪 Testing installed packages...\n")
    
    try:
        import pandas
        print(f"✅ pandas {pandas.__version__}")
    except ImportError:
        print("❌ pandas not installed")
    
    try:
        import numpy
        print(f"✅ numpy {numpy.__version__}")
    except ImportError:
        print("❌ numpy not installed")
    
    try:
        import matplotlib
        print(f"✅ matplotlib {matplotlib.__version__}")
    except ImportError:
        print("❌ matplotlib not installed")
    
    print()

if __name__ == "__main__":
    print("="*50)
    print("🚀 AIRVISION - SETUP VERIFICATION")
    print("="*50)
    print()
    
    # Test packages
    test_packages()
    
    # Test API
    test_aqicn_api()
    
    print("="*50)
    print("🎉 SETUP COMPLETE! Ready for Phase 1!")
    print("="*50)