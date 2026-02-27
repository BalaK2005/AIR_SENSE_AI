# Create sample_data_generator.py
import pandas as pd
import numpy as np
from datetime import datetime, timedelta

# Generate 30 days of hourly data
dates = pd.date_range(end=datetime.now(), periods=30*24, freq='h')

data = {
    'timestamp': dates,
    'aqi': np.random.randint(80, 300, size=len(dates)),
    'pm25': np.random.uniform(40, 200, size=len(dates)),
    'pm10': np.random.uniform(60, 300, size=len(dates)),
    'no2': np.random.uniform(20, 100, size=len(dates)),
    'so2': np.random.uniform(10, 80, size=len(dates)),
    'co': np.random.uniform(0.5, 5, size=len(dates)),
    'o3': np.random.uniform(20, 120, size=len(dates)),
    'temperature': np.random.uniform(15, 35, size=len(dates)),
    'humidity': np.random.uniform(30, 90, size=len(dates)),
    'wind_speed': np.random.uniform(2, 15, size=len(dates)),
    'wind_direction': np.random.uniform(0, 360, size=len(dates)),
    'pressure': np.random.uniform(1000, 1020, size=len(dates)),
    'precipitation': np.random.uniform(0, 5, size=len(dates)),
    'distance_to_industrial': np.random.uniform(5, 50, size=len(dates)),
    'distance_to_highway': np.random.uniform(1, 20, size=len(dates)),
    'traffic_density': np.random.uniform(0.3, 0.9, size=len(dates)),
    'construction_activity': np.random.uniform(0, 1, size=len(dates)),
    'vehicular_contribution': np.random.uniform(20, 45, size=len(dates)),
    'industrial_contribution': np.random.uniform(15, 35, size=len(dates)),
    'construction_contribution': np.random.uniform(10, 25, size=len(dates)),
    'biomass_contribution': np.random.uniform(5, 20, size=len(dates)),
    'dust_contribution': np.random.uniform(3, 15, size=len(dates))
}

df = pd.DataFrame(data)
df.to_csv('data/processed/aqi_historical.csv', index=False)
df.to_csv('data/processed/pollution_sources.csv', index=False)
print("✅ Sample data generated!")