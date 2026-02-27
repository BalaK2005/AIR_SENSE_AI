"""
AirVision System Test
End-to-End Test:
Data Collection → Backend API → Frontend
"""

import requests
import time
from datetime import datetime
import sys
from pathlib import Path

# =========================
# Terminal Colors
# =========================
GREEN = '\033[92m'
RED = '\033[91m'
YELLOW = '\033[93m'
BLUE = '\033[94m'
RESET = '\033[0m'

# =========================
# Pretty Print Helpers
# =========================
def print_header(text):
    print(f"\n{BLUE}{'=' * 60}{RESET}")
    print(f"{BLUE}{text.center(60)}{RESET}")
    print(f"{BLUE}{'=' * 60}{RESET}\n")

def print_success(text):
    print(f"{GREEN}✅ {text}{RESET}")

def print_error(text):
    print(f"{RED}❌ {text}{RESET}")

def print_warning(text):
    print(f"{YELLOW}⚠️  {text}{RESET}")

# =========================
# TEST 1: DATA COLLECTION
# =========================
def test_data_collection():
    print_header("TEST 1: DATA COLLECTION")

    try:
        # Add data-pipeline to PYTHONPATH
        ROOT = Path(__file__).parent
        sys.path.append(str(ROOT / "data-pipeline"))

        from collectors.cpcb_collector import CPCBCollector
        from collectors.weather_collector import WeatherCollector

        # AQI Collector
        print("🔄 Testing CPCB AQI Collector...")
        aqi_collector = CPCBCollector()
        aqi_data = aqi_collector.get_current_aqi()

        if aqi_data and "aqi" in aqi_data:
            print_success(f"AQI Collector OK | AQI: {aqi_data['aqi']}")
        else:
            print_error("AQI Collector returned no data")
            return False

        # Weather Collector
        print("🔄 Testing Weather Collector...")
        weather_collector = WeatherCollector()
        weather_data = weather_collector.get_current_weather()

        if weather_data and "temperature" in weather_data:
            print_success(f"Weather Collector OK | Temp: {weather_data['temperature']}°C")
        else:
            print_error("Weather Collector returned no data")
            return False

        return True

    except Exception as e:
        print_error(f"Data Collection Failed: {e}")
        return False

# =========================
# TEST 2: DATA FILES
# =========================
def test_data_files():
    print_header("TEST 2: DATA FILES")

    ROOT = Path(__file__).parent
    data_dir = ROOT / "ml-models" / "data"

    raw_dir = data_dir / "raw"
    processed_dir = data_dir / "processed"

    if not raw_dir.exists():
        print_error(f"Missing directory: {raw_dir}")
        return False
    else:
        print_success(f"Raw data directory exists ({len(list(raw_dir.iterdir()))} files)")

    if not processed_dir.exists():
        print_error(f"Missing directory: {processed_dir}")
        return False
    else:
        print_success(f"Processed data directory exists ({len(list(processed_dir.iterdir()))} files)")

    return True

# =========================
# TEST 3: BACKEND API
# =========================
def test_backend_api():
    print_header("TEST 3: BACKEND API")

    backend_url = "http://localhost:8000"

    # Root endpoint
    print("🔄 Testing backend root...")
    try:
        r = requests.get(backend_url, timeout=5)
        if r.status_code == 200:
            print_success("Backend is running")
        else:
            print_error(f"Backend returned {r.status_code}")
            return False
    except Exception:
        print_error("Backend not reachable")
        print_warning("Run: python backend/app/main.py")
        return False

    # AQI endpoint
    print("🔄 Testing /api/aqi/current...")
    try:
        r = requests.get(f"{backend_url}/api/aqi/current", timeout=5)
        if r.status_code == 200 and r.json().get("status") == "success":
            data = r.json()["data"]
            print_success(f"AQI API OK | {data['city']} AQI: {data['aqi']}")
        else:
            print_error("AQI API failed")
            return False
    except Exception as e:
        print_error(f"AQI API error: {e}")
        return False

    return True

# =========================
# TEST 4: FRONTEND
# =========================
def test_frontend():
    print_header("TEST 4: FRONTEND")

    frontend_url = "http://localhost:3000"

    print("🔄 Testing React frontend...")
    try:
        r = requests.get(frontend_url, timeout=5)
        if r.status_code == 200:
            print_success("Frontend is running")
            return True
        else:
            print_error(f"Frontend returned {r.status_code}")
            return False
    except Exception:
        print_warning("Frontend not running")
        print_warning("Run: cd frontend/citizen-app && npm start")
        return False

# =========================
# MAIN RUNNER
# =========================
def main():
    print(f"\n{BLUE}{'=' * 60}{RESET}")
    print(f"{BLUE}{'AIRVISION SYSTEM TEST SUITE'.center(60)}{RESET}")
    print(f"{BLUE}{datetime.now().strftime('%Y-%m-%d %H:%M:%S').center(60)}{RESET}")
    print(f"{BLUE}{'=' * 60}{RESET}")

    results = {
        "Data Collection": test_data_collection(),
        "Data Files": test_data_files(),
        "Backend API": test_backend_api(),
        "Frontend": test_frontend(),
    }

    print_header("TEST SUMMARY")

    passed = 0
    for name, result in results.items():
        if result:
            print(f"{name:.<40} {GREEN}PASSED{RESET}")
            passed += 1
        else:
            print(f"{name:.<40} {RED}FAILED{RESET}")

    print(f"\n{BLUE}{'=' * 60}{RESET}")
    if passed == len(results):
        print_success(f"ALL TESTS PASSED ({passed}/{len(results)}) 🎉")
    else:
        print_warning(f"SOME TESTS FAILED ({passed}/{len(results)})")
    print(f"{BLUE}{'=' * 60}{RESET}")

    return passed == len(results)

if __name__ == "__main__":
    sys.exit(0 if main() else 1)
