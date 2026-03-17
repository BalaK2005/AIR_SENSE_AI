"""
CSV Data Router - No pandas dependency (uses built-in csv module)
"""
from fastapi import APIRouter
from pathlib import Path
import csv
from datetime import datetime, timedelta

router = APIRouter()

DATA_DIR = Path(r"C:\Users\Bala Muruganantham\Desktop\AIR_SENSE\data\raw")
PRIMARY_CITY = "Delhi"

def read_csv_file(filepath):
    rows = []
    try:
        with open(filepath, newline='', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                rows.append(row)
    except Exception:
        pass
    return rows

def get_latest_aqi(city=PRIMARY_CITY):
    files = sorted(DATA_DIR.glob("aqi_*.csv"), reverse=True)
    if not files:
        return None, None
    for f in files[:3]:
        rows = read_csv_file(f)
        for row in reversed(rows):
            if city.lower() in (row.get("city") or "").lower():
                return row, f.name
    # fallback
    rows = read_csv_file(files[0])
    return (rows[-1] if rows else None), files[0].name

def get_latest_weather(city=PRIMARY_CITY):
    files = sorted(DATA_DIR.glob("weather_*.csv"), reverse=True)
    if not files:
        return None
    for f in files[:3]:
        rows = read_csv_file(f)
        for row in reversed(rows):
            if city.lower() in (row.get("city") or "").lower():
                return row
    rows = read_csv_file(files[0])
    return rows[-1] if rows else None

def safe_float(val):
    try:
        return float(val) if val not in (None, '', 'nan') else None
    except:
        return None

def get_category(aqi):
    aqi = safe_float(aqi) or 0
    if aqi <= 50:   return "Good",          "Air quality is good. Enjoy outdoor activities!",              "#00c853"
    if aqi <= 100:  return "Satisfactory",   "Acceptable. Sensitive people should limit outdoor activity.", "#ffd600"
    if aqi <= 200:  return "Unhealthy",      "Wear a mask outdoors. Use air purifiers indoors.",            "#ff6d00"
    if aqi <= 300:  return "Very Unhealthy", "Avoid outdoor activities. Keep windows closed.",              "#d50000"
    return                 "Hazardous",      "Stay indoors! Health emergency!",                             "#6a1b9a"

@router.get("/live")
def get_live_aqi(city: str = PRIMARY_CITY):
    row, filename = get_latest_aqi(city)
    if row is None:
        return {"error": "No AQI data found. Run: python collectors/collect_all.py"}
    aqi_val = safe_float(row.get("aqi")) or 0
    category, health_advice, color = get_category(aqi_val)
    weather = get_latest_weather(city) or {}
    return {
        "aqi":                  aqi_val,
        "city":                 row.get("city", city),
        "timestamp":            row.get("timestamp"),
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
        "data_source":          "AQICN Real-time API",
        "file_used":            filename,
    }

@router.get("/cities")
def get_all_cities_aqi():
    cities = ["Delhi","Noida","Gurgaon","Ghaziabad","Faridabad"]
    result = []
    for city in cities:
        row, filename = get_latest_aqi(city)
        if row:
            aqi_val = safe_float(row.get("aqi")) or 0
            cat, advice, color = get_category(aqi_val)
            result.append({"city":city,"aqi":aqi_val,"category":cat,"color":color,"pm25":safe_float(row.get("pm25")),"timestamp":row.get("timestamp")})
    return result

@router.get("/history")
def get_aqi_history(days: int = 7, city: str = ""):
    files = sorted(DATA_DIR.glob("aqi_*.csv"), reverse=True)[:days]
    if not files:
        return {"readings": []}
    readings = []
    cutoff = datetime.now() - timedelta(days=days)
    for f in files:
        for row in read_csv_file(f):
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
    files = sorted(DATA_DIR.glob("aqi_*.csv"))
    if not files:
        return {"error": "No data available"}
    all_rows = []
    for f in files:
        for row in read_csv_file(f):
            if city and city.lower() not in (row.get("city") or "").lower():
                continue
            all_rows.append(row)
    if not all_rows:
        return {"error": f"No data for {city}"}
    aqis = [safe_float(r.get("aqi")) for r in all_rows if safe_float(r.get("aqi"))]
    pm25s = [safe_float(r.get("pm25")) for r in all_rows if safe_float(r.get("pm25"))]
    pm10s = [safe_float(r.get("pm10")) for r in all_rows if safe_float(r.get("pm10"))]
    return {
        "city":          city,
        "total_records": len(all_rows),
        "date_range":    {"from": all_rows[0].get("timestamp"), "to": all_rows[-1].get("timestamp")},
        "aqi": {
            "current": aqis[-1] if aqis else 0,
            "average": round(sum(aqis)/len(aqis), 1) if aqis else 0,
            "max":     max(aqis) if aqis else 0,
            "min":     min(aqis) if aqis else 0,
        },
        "pm25_average": round(sum(pm25s)/len(pm25s), 1) if pm25s else 0,
        "pm10_average": round(sum(pm10s)/len(pm10s), 1) if pm10s else 0,
    }

@router.get("/debug")
def debug_path():
    files_aqi     = [f.name for f in sorted(DATA_DIR.glob("aqi_*.csv"), reverse=True)]
    files_weather = [f.name for f in sorted(DATA_DIR.glob("weather_*.csv"), reverse=True)]
    latest_row = None
    if files_aqi:
        rows = read_csv_file(DATA_DIR / files_aqi[0])
        delhi_rows = [r for r in rows if "delhi" in (r.get("city") or "").lower()]
        latest_row = delhi_rows[-1] if delhi_rows else (rows[-1] if rows else None)
    return {
        "data_dir":       str(DATA_DIR),
        "exists":         DATA_DIR.exists(),
        "aqi_files":      files_aqi,
        "weather_files":  files_weather,
        "latest_aqi_row": latest_row,
    }
