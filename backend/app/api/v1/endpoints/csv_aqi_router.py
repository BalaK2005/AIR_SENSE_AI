"""
CSV Data Router - with AQICN direct API fallback for cloud deployment
Works both locally (CSV files) and on Render (direct API)
"""
from fastapi import APIRouter
from pathlib import Path
import csv
import os
import requests
from datetime import datetime, timedelta

router = APIRouter()

# ── Config ────────────────────────────────────────────────────────────────────
DATA_DIR    = Path(__file__).parent.parent.parent.parent.parent / "data" / "raw"
AQICN_TOKEN = os.getenv("AQICN_TOKEN", "your_token_here")
OW_KEY      = os.getenv("OPENWEATHER_KEY", "your_key_here")
PRIMARY_CITY = "Delhi"

# ── Helpers ───────────────────────────────────────────────────────────────────
def safe_float(val):
    try:
        return float(val) if val not in (None, '', 'nan', 'None') else None
    except Exception:
        return None

def get_category(aqi):
    aqi = safe_float(aqi) or 0
    if aqi <= 50:   return "Good",          "Air quality is good. Enjoy outdoor activities!",              "#00c853"
    if aqi <= 100:  return "Satisfactory",   "Acceptable. Sensitive people should limit outdoor activity.", "#ffd600"
    if aqi <= 200:  return "Unhealthy",      "Wear a mask outdoors. Use air purifiers indoors.",            "#ff6d00"
    if aqi <= 300:  return "Very Unhealthy", "Avoid outdoor activities. Keep windows closed.",              "#d50000"
    return                 "Hazardous",      "Stay indoors! Health emergency!",                             "#6a1b9a"

# ── CSV helpers ───────────────────────────────────────────────────────────────
def read_csv_rows(filepath):
    rows = []
    try:
        with open(filepath, newline='', encoding='utf-8') as f:
            for row in csv.DictReader(f):
                rows.append(row)
    except Exception:
        pass
    return rows

def csv_available():
    return DATA_DIR.exists() and any(DATA_DIR.glob("aqi_*.csv"))

def get_from_csv(city=PRIMARY_CITY):
    files = sorted(DATA_DIR.glob("aqi_*.csv"), reverse=True)
    for f in files[:3]:
        for row in reversed(read_csv_rows(f)):
            if city.lower() in (row.get("city") or "").lower():
                return row
    files2 = sorted(DATA_DIR.glob("aqi_*.csv"), reverse=True)
    if files2:
        rows = read_csv_rows(files2[0])
        return rows[-1] if rows else None
    return None

def get_weather_csv(city=PRIMARY_CITY):
    files = sorted(DATA_DIR.glob("weather_*.csv"), reverse=True)
    for f in files[:3]:
        for row in reversed(read_csv_rows(f)):
            if city.lower() in (row.get("city") or "").lower():
                return row
    return None

# ── AQICN direct API fallback ─────────────────────────────────────────────────
def fetch_from_aqicn(city=PRIMARY_CITY):
    try:
        url = f"https://api.waqi.info/feed/{city}/?token={AQICN_TOKEN}"
        r = requests.get(url, timeout=10)
        d = r.json()
        if d.get("status") != "ok":
            return None
        data = d["data"]
        iaqi = data.get("iaqi", {})
        return {
            "aqi":         data.get("aqi"),
            "city":        data.get("city", {}).get("name", city),
            "timestamp":   datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
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
    except Exception:
        return None

def fetch_weather_api(city=PRIMARY_CITY):
    COORDS = {"Delhi":(28.6139,77.2090),"Noida":(28.5355,77.3910),"Gurgaon":(28.4595,77.0266),"Ghaziabad":(28.6692,77.4538),"Faridabad":(28.4089,77.3178)}
    lat, lon = COORDS.get(city, (28.6139, 77.2090))
    try:
        url = f"https://api.openweathermap.org/data/2.5/weather?lat={lat}&lon={lon}&appid={OW_KEY}&units=metric"
        r = requests.get(url, timeout=10)
        d = r.json()
        if d.get("cod") != 200:
            return None
        return {
            "temperature":         d["main"]["temp"],
            "feels_like":          d["main"]["feels_like"],
            "humidity":            d["main"]["humidity"],
            "pressure":            d["main"]["pressure"],
            "wind_speed":          d["wind"]["speed"],
            "clouds":              d["clouds"]["all"],
            "weather_description": d["weather"][0]["description"],
        }
    except Exception:
        return None

# ── Endpoints ─────────────────────────────────────────────────────────────────
@router.get("/live")
def get_live_aqi(city: str = PRIMARY_CITY):
    # Try CSV first, fall back to AQICN API
    row = get_from_csv(city) if csv_available() else None
    source = "CSV"
    if row is None:
        row = fetch_from_aqicn(city)
        source = "AQICN API"
    if row is None:
        return {"error": "No data available. Check AQICN_TOKEN environment variable."}

    aqi_val = safe_float(row.get("aqi")) or 0
    category, health_advice, color = get_category(aqi_val)

    # Get weather
    weather = (get_weather_csv(city) if csv_available() else None) or fetch_weather_api(city) or {}

    return {
        "aqi":                  aqi_val,
        "city":                 row.get("city", city),
        "timestamp":            row.get("timestamp", datetime.now().isoformat()),
        "pm25":                 safe_float(row.get("pm25")),
        "pm10":                 safe_float(row.get("pm10")),
        "no2":                  safe_float(row.get("no2")),
        "o3":                   safe_float(row.get("o3")),
        "so2":                  safe_float(row.get("so2")),
        "co":                   safe_float(row.get("co")),
        "temperature":          safe_float(row.get("temperature")) or safe_float(weather.get("temperature")),
        "humidity":             safe_float(row.get("humidity"))    or safe_float(weather.get("humidity")),
        "pressure":             safe_float(row.get("pressure"))    or safe_float(weather.get("pressure")),
        "wind_speed":           safe_float(row.get("wind_speed"))  or safe_float(weather.get("wind_speed")),
        "feels_like":           safe_float(weather.get("feels_like")),
        "weather_description":  weather.get("weather_description"),
        "clouds":               safe_float(weather.get("clouds")),
        "category":             category,
        "health_advice":        health_advice,
        "color":                color,
        "data_source":          source,
    }

@router.get("/cities")
def get_all_cities_aqi():
    cities = ["Delhi","Noida","Gurgaon","Ghaziabad","Faridabad"]
    result = []
    for city in cities:
        row = get_from_csv(city) if csv_available() else None
        if row is None:
            row = fetch_from_aqicn(city)
        if row:
            aqi_val = safe_float(row.get("aqi")) or 0
            cat, _, color = get_category(aqi_val)
            result.append({"city":city,"aqi":aqi_val,"category":cat,"color":color,"pm25":safe_float(row.get("pm25")),"timestamp":row.get("timestamp")})
    return result

@router.get("/history")
def get_aqi_history(days: int = 7, city: str = ""):
    if not csv_available():
        return {"readings": [], "note": "No CSV data on this server. History not available in cloud mode."}
    files = sorted(DATA_DIR.glob("aqi_*.csv"), reverse=True)[:days]
    readings = []
    for f in files:
        for row in read_csv_rows(f):
            if city and city.lower() not in (row.get("city") or "").lower():
                continue
            readings.append({
                "timestamp":   row.get("timestamp"),
                "city":        row.get("city"),
                "aqi":         safe_float(row.get("aqi")),
                "pm25":        safe_float(row.get("pm25")),
                "pm10":        safe_float(row.get("pm10")),
                "no2":         safe_float(row.get("no2")),
                "o3":          safe_float(row.get("o3")),
                "temperature": safe_float(row.get("temperature")),
                "humidity":    safe_float(row.get("humidity")),
            })
    readings.sort(key=lambda x: x.get("timestamp") or "")
    return {"readings": readings}

@router.get("/stats")
def get_aqi_stats(city: str = PRIMARY_CITY):
    if not csv_available():
        # Return stats from live API
        row = fetch_from_aqicn(city)
        if row:
            aqi = safe_float(row.get("aqi")) or 0
            return {"city":city,"total_records":1,"aqi":{"current":aqi,"average":aqi,"max":aqi,"min":aqi},"pm25_average":safe_float(row.get("pm25")) or 0,"pm10_average":safe_float(row.get("pm10")) or 0}
        return {"error": "No data available"}
    files = sorted(DATA_DIR.glob("aqi_*.csv"))
    all_rows = []
    for f in files:
        for row in read_csv_rows(f):
            if city and city.lower() not in (row.get("city") or "").lower():
                continue
            all_rows.append(row)
    if not all_rows:
        return {"error": f"No data for {city}"}
    aqis  = [safe_float(r.get("aqi"))  for r in all_rows if safe_float(r.get("aqi"))]
    pm25s = [safe_float(r.get("pm25")) for r in all_rows if safe_float(r.get("pm25"))]
    pm10s = [safe_float(r.get("pm10")) for r in all_rows if safe_float(r.get("pm10"))]
    return {
        "city": city, "total_records": len(all_rows),
        "aqi": {"current":aqis[-1] if aqis else 0,"average":round(sum(aqis)/len(aqis),1) if aqis else 0,"max":max(aqis) if aqis else 0,"min":min(aqis) if aqis else 0},
        "pm25_average": round(sum(pm25s)/len(pm25s),1) if pm25s else 0,
        "pm10_average": round(sum(pm10s)/len(pm10s),1) if pm10s else 0,
    }

@router.get("/debug")
def debug_path():
    return {
        "data_dir":    str(DATA_DIR),
        "csv_exists":  csv_available(),
        "aqicn_token": AQICN_TOKEN[:8] + "...",
        "mode":        "CSV" if csv_available() else "AQICN API Direct",
    }

