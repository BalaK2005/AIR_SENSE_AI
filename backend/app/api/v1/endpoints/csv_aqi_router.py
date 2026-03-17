"""
CSV Data Router
Serves real-time AQI data directly from the data pipeline CSV files.
"""

from fastapi import APIRouter
from pathlib import Path
import pandas as pd

router = APIRouter()

DATA_DIR = Path(r"C:\Users\Bala Muruganantham\Desktop\AIR_SENSE\data\raw")

PRIMARY_CITY = "Delhi"


def get_latest_aqi(city: str = PRIMARY_CITY):
    """Get latest AQI row for a specific city, falling back to last row if city not found."""
    files = sorted(DATA_DIR.glob("aqi_*.csv"), reverse=True)
    if not files:
        return None, None

    # Search recent files (today + yesterday) for city match
    for f in files[:3]:
        df = pd.read_csv(f)
        # Try to find city-specific row
        city_rows = df[df["city"].str.contains(city, case=False, na=False)]
        if not city_rows.empty:
            return city_rows.iloc[-1].to_dict(), f.name

    # Fallback: last row of latest file
    df = pd.read_csv(files[0])
    return df.iloc[-1].to_dict(), files[0].name


def get_latest_weather(city: str = PRIMARY_CITY):
    files = sorted(DATA_DIR.glob("weather_*.csv"), reverse=True)
    if not files:
        return None
    for f in files[:3]:
        df = pd.read_csv(f)
        city_rows = df[df["city"].str.contains(city, case=False, na=False)]
        if not city_rows.empty:
            return city_rows.iloc[-1].to_dict()
    df = pd.read_csv(files[0])
    return df.iloc[-1].to_dict()


def get_category(aqi):
    if aqi <= 50:   return "Good",          "Air quality is good. Enjoy outdoor activities!",              "#00c853"
    if aqi <= 100:  return "Satisfactory",   "Acceptable. Sensitive people should limit outdoor activity.", "#ffd600"
    if aqi <= 200:  return "Unhealthy",      "Wear a mask outdoors. Use air purifiers indoors.",            "#ff6d00"
    if aqi <= 300:  return "Very Unhealthy", "Avoid outdoor activities. Keep windows closed.",              "#d50000"
    return                 "Hazardous",      "Stay indoors! Health emergency!",                             "#6a1b9a"


@router.get("/live")
def get_live_aqi(city: str = PRIMARY_CITY):
    """Returns latest real-time AQI for specified city (default: Delhi)"""
    row, filename = get_latest_aqi(city)

    if row is None:
        return {"error": "No AQI data found. Run: python collectors/collect_all.py"}

    aqi_val = float(row.get("aqi", 0))
    category, health_advice, color = get_category(aqi_val)
    weather = get_latest_weather(city) or {}

    return {
        "aqi":                  aqi_val,
        "city":                 row.get("city", city),
        "timestamp":            row.get("timestamp"),
        "pm25":                 row.get("pm25"),
        "pm10":                 row.get("pm10"),
        "no2":                  row.get("no2"),
        "o3":                   row.get("o3"),
        "so2":                  row.get("so2"),
        "co":                   row.get("co"),
        "temperature":          row.get("temperature") or weather.get("temperature"),
        "humidity":             row.get("humidity")    or weather.get("humidity"),
        "pressure":             row.get("pressure")    or weather.get("pressure"),
        "wind_speed":           row.get("wind_speed")  or weather.get("wind_speed"),
        "feels_like":           weather.get("feels_like"),
        "weather_description":  weather.get("weather_description"),
        "clouds":               weather.get("clouds"),
        "visibility":           weather.get("visibility"),
        "category":             category,
        "health_advice":        health_advice,
        "color":                color,
        "data_source":          "AQICN Real-time API",
        "file_used":            filename,
    }


@router.get("/cities")
def get_all_cities_aqi():
    """Returns latest AQI for all 5 NCR cities."""
    cities = ["Delhi", "Noida", "Gurgaon", "Ghaziabad", "Faridabad"]
    result = []
    for city in cities:
        row, filename = get_latest_aqi(city)
        if row:
            aqi_val = float(row.get("aqi", 0))
            cat, advice, color = get_category(aqi_val)
            result.append({
                "city":     city,
                "aqi":      aqi_val,
                "category": cat,
                "color":    color,
                "pm25":     row.get("pm25"),
                "timestamp":row.get("timestamp"),
            })
    return result


@router.get("/history")
def get_aqi_history(days: int = 7, city: str = ""):
    """Returns AQI history. Optionally filter by city."""
    files = sorted(DATA_DIR.glob("aqi_*.csv"), reverse=True)[:days]
    if not files:
        return {"readings": []}

    all_data = []
    for f in files:
        df = pd.read_csv(f)
        if city:
            df = df[df["city"].str.contains(city, case=False, na=False)]
        all_data.append(df)

    combined = pd.concat(all_data, ignore_index=True)
    combined = combined.sort_values("timestamp")
    cols = [c for c in ["timestamp","city","aqi","pm25","pm10","no2","o3","temperature","humidity"] if c in combined.columns]
    return {"readings": combined[cols].fillna(0).to_dict(orient="records")}


@router.get("/stats")
def get_aqi_stats(city: str = PRIMARY_CITY):
    """Returns AQI statistics for a city."""
    files = sorted(DATA_DIR.glob("aqi_*.csv"))
    if not files:
        return {"error": "No data available"}

    df = pd.concat([pd.read_csv(f) for f in files], ignore_index=True)
    if city:
        city_df = df[df["city"].str.contains(city, case=False, na=False)]
        df = city_df if not city_df.empty else df

    return {
        "city":          city,
        "total_records": len(df),
        "date_range":    {"from": df["timestamp"].min(), "to": df["timestamp"].max()},
        "aqi": {
            "current": float(df["aqi"].iloc[-1]),
            "average": round(float(df["aqi"].mean()), 1),
            "max":     int(df["aqi"].max()),
            "min":     int(df["aqi"].min()),
        },
        "pm25_average": round(float(df["pm25"].mean()), 1),
        "pm10_average": round(float(df["pm10"].mean()), 1),
    }


@router.get("/debug")
def debug_path():
    files_aqi     = [f.name for f in sorted(DATA_DIR.glob("aqi_*.csv"),     reverse=True)]
    files_weather = [f.name for f in sorted(DATA_DIR.glob("weather_*.csv"), reverse=True)]
    latest_row = None
    if files_aqi:
        df = pd.read_csv(DATA_DIR / files_aqi[0])
        # Show Delhi row specifically
        delhi_rows = df[df["city"].str.contains("Delhi", case=False, na=False)]
        latest_row = delhi_rows.iloc[-1].to_dict() if not delhi_rows.empty else df.iloc[-1].to_dict()
    return {
        "data_dir":       str(DATA_DIR),
        "exists":         DATA_DIR.exists(),
        "aqi_files":      files_aqi,
        "weather_files":  files_weather,
        "latest_aqi_row": latest_row,
        "cities_in_latest": pd.read_csv(DATA_DIR / files_aqi[0])["city"].tolist() if files_aqi else [],
    }