"""
Multi-City NCR Data Collector
Collects AQI + Weather for all 5 Delhi-NCR cities simultaneously
"""
import sys
import requests
import pandas as pd
from pathlib import Path
from datetime import datetime
from concurrent.futures import ThreadPoolExecutor, as_completed

sys.path.append(str(Path(__file__).parent.parent))
from config import AQICN_TOKEN, OPENWEATHER_KEY, RAW_DATA_DIR, TIMEOUT, DATETIME_FORMAT

# ── NCR Cities config ────────────────────────────────────────────────────────
NCR_CITIES = [
    {"name": "Delhi",     "aqicn": "Delhi",               "lat": 28.6139, "lon": 77.2090},
    {"name": "Noida",     "aqicn": "noida",               "lat": 28.5355, "lon": 77.3910},
    {"name": "Gurgaon",   "aqicn": "gurgaon",             "lat": 28.4595, "lon": 77.0266},
    {"name": "Ghaziabad", "aqicn": "ghaziabad",           "lat": 28.6692, "lon": 77.4538},
    {"name": "Faridabad", "aqicn": "faridabad",           "lat": 28.4089, "lon": 77.3178},
]

AQICN_BASE  = "https://api.waqi.info/feed"
OW_BASE     = "https://api.openweathermap.org/data/2.5/weather"

# ── AQI fetch ────────────────────────────────────────────────────────────────
def fetch_aqi(city: dict) -> dict | None:
    url = f"{AQICN_BASE}/{city['aqicn']}/?token={AQICN_TOKEN}"
    try:
        r = requests.get(url, timeout=TIMEOUT)
        d = r.json()
        if d.get("status") != "ok":
            print(f"  ⚠️  AQICN {city['name']}: {d.get('status')}")
            return None
        data  = d["data"]
        iaqi  = data.get("iaqi", {})
        return {
            "timestamp":   datetime.now().strftime(DATETIME_FORMAT),
            "city":        city["name"],
            "aqi":         data.get("aqi"),
            "pm25":        iaqi.get("pm25", {}).get("v"),
            "pm10":        iaqi.get("pm10", {}).get("v"),
            "o3":          iaqi.get("o3",   {}).get("v"),
            "no2":         iaqi.get("no2",  {}).get("v"),
            "so2":         iaqi.get("so2",  {}).get("v"),
            "co":          iaqi.get("co",   {}).get("v"),
            "temperature": iaqi.get("t",    {}).get("v"),
            "humidity":    iaqi.get("h",    {}).get("v"),
            "pressure":    iaqi.get("p",    {}).get("v"),
            "wind_speed":  iaqi.get("w",    {}).get("v"),
        }
    except Exception as e:
        print(f"  ❌ AQI fetch error {city['name']}: {e}")
        return None

# ── Weather fetch ─────────────────────────────────────────────────────────────
def fetch_weather(city: dict) -> dict | None:
    if not OPENWEATHER_KEY:
        return None
    url = f"{OW_BASE}?lat={city['lat']}&lon={city['lon']}&appid={OPENWEATHER_KEY}&units=metric"
    try:
        r = requests.get(url, timeout=TIMEOUT)
        d = r.json()
        if d.get("cod") != 200:
            return None
        return {
            "timestamp":           datetime.now().strftime(DATETIME_FORMAT),
            "city":                city["name"],
            "temperature":         d["main"]["temp"],
            "feels_like":          d["main"]["feels_like"],
            "humidity":            d["main"]["humidity"],
            "pressure":            d["main"]["pressure"],
            "wind_speed":          d["wind"]["speed"],
            "wind_deg":            d["wind"].get("deg"),
            "clouds":              d["clouds"]["all"],
            "weather_description": d["weather"][0]["description"],
            "visibility":          d.get("visibility"),
        }
    except Exception as e:
        print(f"  ❌ Weather fetch error {city['name']}: {e}")
        return None

# ── Save helpers ──────────────────────────────────────────────────────────────
def save_csv(data: list, prefix: str) -> bool:
    if not data:
        return False
    try:
        RAW_DATA_DIR.mkdir(parents=True, exist_ok=True)
        date_str = datetime.now().strftime("%Y%m%d")
        filepath = RAW_DATA_DIR / f"{prefix}_{date_str}.csv"
        df = pd.DataFrame(data)
        if filepath.exists():
            df.to_csv(filepath, mode="a", header=False, index=False)
            print(f"  📝 Appended {len(data)} rows → {filepath.name}")
        else:
            df.to_csv(filepath, index=False)
            print(f"  📄 Created {filepath.name} with {len(data)} rows")
        return True
    except Exception as e:
        print(f"  ❌ Save error: {e}")
        return False

# ── Main collection ───────────────────────────────────────────────────────────
def collect_all_data():
    print("\n" + "="*60)
    print("🚀 AIRSENSE — MULTI-CITY NCR DATA COLLECTION")
    print("="*60)
    print(f"🕐 Time   : {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"🏙️  Cities : {', '.join(c['name'] for c in NCR_CITIES)}")
    print("="*60 + "\n")

    aqi_results     = []
    weather_results = []
    aqi_ok          = 0
    weather_ok      = 0

    # ── Parallel fetch ────────────────────────────────────────────────────────
    print("📡 Fetching AQI data for all cities...")
    with ThreadPoolExecutor(max_workers=5) as ex:
        futures = {ex.submit(fetch_aqi, city): city for city in NCR_CITIES}
        for future in as_completed(futures):
            city   = futures[future]
            result = future.result()
            if result:
                aqi_results.append(result)
                aqi_ok += 1
                print(f"  ✅ {city['name']:12s} AQI={result['aqi']}")
            else:
                print(f"  ❌ {city['name']:12s} failed")

    print(f"\n🌤️  Fetching weather data for all cities...")
    with ThreadPoolExecutor(max_workers=5) as ex:
        futures = {ex.submit(fetch_weather, city): city for city in NCR_CITIES}
        for future in as_completed(futures):
            city   = futures[future]
            result = future.result()
            if result:
                weather_results.append(result)
                weather_ok += 1
                print(f"  ✅ {city['name']:12s} {result['temperature']}°C  {result['weather_description']}")
            else:
                print(f"  ❌ {city['name']:12s} failed")

    # ── Save ──────────────────────────────────────────────────────────────────
    print(f"\n💾 Saving data...")
    aqi_saved     = save_csv(aqi_results,     "aqi")
    weather_saved = save_csv(weather_results, "weather")

    # ── Summary ───────────────────────────────────────────────────────────────
    print("\n" + "="*60)
    print("📊 COLLECTION SUMMARY")
    print("="*60)
    print(f"  AQI     : {aqi_ok}/{len(NCR_CITIES)} cities  {'✅' if aqi_ok == len(NCR_CITIES) else '⚠️'}")
    print(f"  Weather : {weather_ok}/{len(NCR_CITIES)} cities  {'✅' if weather_ok == len(NCR_CITIES) else '⚠️'}")

    if aqi_results:
        print(f"\n  📈 NCR AQI Snapshot:")
        for r in sorted(aqi_results, key=lambda x: x["aqi"] or 0, reverse=True):
            bar = "█" * min(20, int((r["aqi"] or 0) / 20))
            print(f"     {r['city']:12s} {str(r['aqi']):>4s}  {bar}")

    total_ok = aqi_ok + weather_ok
    total    = len(NCR_CITIES) * 2
    if total_ok == total:
        print("\n🎉 ALL DATA COLLECTED SUCCESSFULLY!")
    elif total_ok > 0:
        print(f"\n⚠️  PARTIAL SUCCESS ({total_ok}/{total})")
    else:
        print("\n❌ ALL COLLECTORS FAILED")
    print("="*60 + "\n")
    return aqi_ok > 0


if __name__ == "__main__":
    collect_all_data()