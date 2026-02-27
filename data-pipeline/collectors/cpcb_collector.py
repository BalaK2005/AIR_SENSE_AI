"""
CPCB Data Collector
Fetches real-time air quality data from Central Pollution Control Board (CPCB) API
"""

import requests
import pandas as pd
from datetime import datetime, timedelta
import json
import time
from typing import List, Dict, Optional
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class CPCBCollector:
    """
    Collector for CPCB Air Quality Data
    
    Data Sources:
    1. CPCB Real-time API
    2. OpenAQ API (alternative)
    3. AirNow API (if available)
    """
    
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key
        
        # CPCB Station Coordinates (Major Delhi-NCR stations)
        self.stations = {
            'Delhi': [
                {'name': 'Anand Vihar', 'lat': 28.6469, 'lon': 77.3161},
                {'name': 'R K Puram', 'lat': 28.5639, 'lon': 77.1746},
                {'name': 'ITO', 'lat': 28.6283, 'lon': 77.2420},
                {'name': 'Punjabi Bagh', 'lat': 28.6692, 'lon': 77.1317},
                {'name': 'Dwarka', 'lat': 28.5921, 'lon': 77.0460},
                {'name': 'Rohini', 'lat': 28.7416, 'lon': 77.0669},
            ],
            'Noida': [
                {'name': 'Sector 62', 'lat': 28.6271, 'lon': 77.3656},
                {'name': 'Sector 125', 'lat': 28.5440, 'lon': 77.3275},
            ],
            'Gurugram': [
                {'name': 'Sector 51', 'lat': 28.4353, 'lon': 77.0674},
                {'name': 'Vikas Sadan', 'lat': 28.4505, 'lon': 77.0260},
            ],
            'Faridabad': [
                {'name': 'Sector 16', 'lat': 28.4089, 'lon': 77.3178},
            ],
            'Ghaziabad': [
                {'name': 'Indirapuram', 'lat': 28.6417, 'lon': 77.3715},
                {'name': 'Vasundhara', 'lat': 28.6600, 'lon': 77.3697},
            ]
        }
        
        # API endpoints
        self.cpcb_api = "https://api.data.gov.in/resource/3b01bcb8-0b14-4abf-b6f2-c1bfd384ba69"
        self.openaq_api = "https://api.openaq.org/v2/measurements"
        
    def fetch_cpcb_data(self, state: str = "Delhi", limit: int = 1000) -> pd.DataFrame:
        """
        Fetch data from CPCB API
        
        Args:
            state: State name
            limit: Number of records to fetch
            
        Returns:
            DataFrame with air quality data
        """
        try:
            params = {
                'api-key': self.api_key or 'YOUR_API_KEY',
                'format': 'json',
                'filters[state]': state,
                'limit': limit
            }
            
            logger.info(f"Fetching CPCB data for {state}...")
            response = requests.get(self.cpcb_api, params=params, timeout=30)
            response.raise_for_status()
            
            data = response.json()
            
            if 'records' in data:
                df = pd.DataFrame(data['records'])
                df['timestamp'] = pd.to_datetime(df.get('last_update', datetime.now()))
                logger.info(f"Fetched {len(df)} records from CPCB")
                return df
            else:
                logger.warning("No records found in CPCB response")
                return pd.DataFrame()
                
        except Exception as e:
            logger.error(f"Error fetching CPCB data: {e}")
            return pd.DataFrame()
    
    def fetch_openaq_data(self, latitude: float, longitude: float, radius: int = 25000) -> pd.DataFrame:
        """
        Fetch data from OpenAQ API (alternative source)
        
        Args:
            latitude: Center latitude
            longitude: Center longitude
            radius: Radius in meters
            
        Returns:
            DataFrame with air quality data
        """
        try:
            params = {
                'coordinates': f"{latitude},{longitude}",
                'radius': radius,
                'limit': 1000,
                'parameter': ['pm25', 'pm10', 'no2', 'so2', 'o3', 'co']
            }
            
            logger.info(f"Fetching OpenAQ data for ({latitude}, {longitude})...")
            response = requests.get(self.openaq_api, params=params, timeout=30)
            response.raise_for_status()
            
            data = response.json()
            
            if 'results' in data:
                records = []
                for result in data['results']:
                    records.append({
                        'location': result.get('location'),
                        'parameter': result.get('parameter'),
                        'value': result.get('value'),
                        'unit': result.get('unit'),
                        'latitude': result.get('coordinates', {}).get('latitude'),
                        'longitude': result.get('coordinates', {}).get('longitude'),
                        'timestamp': result.get('date', {}).get('utc')
                    })
                
                df = pd.DataFrame(records)
                df['timestamp'] = pd.to_datetime(df['timestamp'])
                logger.info(f"Fetched {len(df)} records from OpenAQ")
                return df
            else:
                logger.warning("No results found in OpenAQ response")
                return pd.DataFrame()
                
        except Exception as e:
            logger.error(f"Error fetching OpenAQ data: {e}")
            return pd.DataFrame()
    
    def calculate_aqi(self, pollutant: str, value: float) -> int:
        """
        Calculate AQI for a specific pollutant
        
        Uses Indian AQI calculation method
        """
        # Indian AQI breakpoints
        breakpoints = {
            'pm25': [
                (0, 30, 0, 50),
                (31, 60, 51, 100),
                (61, 90, 101, 200),
                (91, 120, 201, 300),
                (121, 250, 301, 400),
                (251, 380, 401, 500)
            ],
            'pm10': [
                (0, 50, 0, 50),
                (51, 100, 51, 100),
                (101, 250, 101, 200),
                (251, 350, 201, 300),
                (351, 430, 301, 400),
                (431, 550, 401, 500)
            ],
            'no2': [
                (0, 40, 0, 50),
                (41, 80, 51, 100),
                (81, 180, 101, 200),
                (181, 280, 201, 300),
                (281, 400, 301, 400),
                (401, 500, 401, 500)
            ],
            'so2': [
                (0, 40, 0, 50),
                (41, 80, 51, 100),
                (81, 380, 101, 200),
                (381, 800, 201, 300),
                (801, 1600, 301, 400),
                (1601, 2100, 401, 500)
            ],
            'co': [
                (0, 1.0, 0, 50),
                (1.1, 2.0, 51, 100),
                (2.1, 10, 101, 200),
                (10.1, 17, 201, 300),
                (17.1, 34, 301, 400),
                (34.1, 50, 401, 500)
            ],
            'o3': [
                (0, 50, 0, 50),
                (51, 100, 51, 100),
                (101, 168, 101, 200),
                (169, 208, 201, 300),
                (209, 748, 301, 400),
                (749, 1000, 401, 500)
            ]
        }
        
        if pollutant not in breakpoints:
            return 0
        
        for bp_lo, bp_hi, aqi_lo, aqi_hi in breakpoints[pollutant]:
            if bp_lo <= value <= bp_hi:
                aqi = ((aqi_hi - aqi_lo) / (bp_hi - bp_lo)) * (value - bp_lo) + aqi_lo
                return int(aqi)
        
        return 500  # Maximum AQI
    
    def aggregate_station_data(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Aggregate and clean station data
        
        Args:
            df: Raw data from API
            
        Returns:
            Cleaned and aggregated DataFrame
        """
        try:
            # Pivot data to have one row per station per timestamp
            if 'parameter' in df.columns:
                df_pivot = df.pivot_table(
                    index=['location', 'latitude', 'longitude', 'timestamp'],
                    columns='parameter',
                    values='value',
                    aggfunc='mean'
                ).reset_index()
            else:
                df_pivot = df
            
            # Calculate overall AQI (max of all pollutants)
            aqi_columns = []
            for pollutant in ['pm25', 'pm10', 'no2', 'so2', 'co', 'o3']:
                if pollutant in df_pivot.columns:
                    col_name = f'{pollutant}_aqi'
                    df_pivot[col_name] = df_pivot[pollutant].apply(
                        lambda x: self.calculate_aqi(pollutant, x) if pd.notna(x) else 0
                    )
                    aqi_columns.append(col_name)
            
            if aqi_columns:
                df_pivot['aqi'] = df_pivot[aqi_columns].max(axis=1)
            
            # Determine dominant pollutant
            if aqi_columns:
                df_pivot['dominant_pollutant'] = df_pivot[aqi_columns].idxmax(axis=1).str.replace('_aqi', '').str.upper()
            
            return df_pivot
            
        except Exception as e:
            logger.error(f"Error aggregating data: {e}")
            return df
    
    def collect_all_stations(self) -> pd.DataFrame:
        """
        Collect data from all configured stations
        
        Returns:
            Combined DataFrame from all stations
        """
        all_data = []
        
        for city, stations in self.stations.items():
            logger.info(f"Collecting data for {city}...")
            
            for station in stations:
                # Try OpenAQ first (more reliable)
                df = self.fetch_openaq_data(station['lat'], station['lon'], radius=5000)
                
                if not df.empty:
                    df['station_name'] = station['name']
                    df['city'] = city
                    all_data.append(df)
                
                # Rate limiting
                time.sleep(1)
        
        if all_data:
            combined_df = pd.concat(all_data, ignore_index=True)
            aggregated_df = self.aggregate_station_data(combined_df)
            
            logger.info(f"Total records collected: {len(aggregated_df)}")
            return aggregated_df
        else:
            logger.warning("No data collected from any station")
            return pd.DataFrame()
    
    def save_to_csv(self, df: pd.DataFrame, filepath: str):
        """Save collected data to CSV"""
        df.to_csv(filepath, index=False)
        logger.info(f"Data saved to {filepath}")
    
    def save_to_database(self, df: pd.DataFrame, db_connection):
        """
        Save collected data to database
        
        Args:
            df: Data to save
            db_connection: Database connection (SQLAlchemy)
        """
        try:
            df.to_sql('aqi_measurements', db_connection, if_exists='append', index=False)
            logger.info(f"Saved {len(df)} records to database")
        except Exception as e:
            logger.error(f"Error saving to database: {e}")


# Main execution
if __name__ == "__main__":
    # Initialize collector
    collector = CPCBCollector(api_key="YOUR_CPCB_API_KEY")
    
    # Collect data
    logger.info("Starting data collection...")
    data = collector.collect_all_stations()
    
    if not data.empty:
        # Save to CSV
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filepath = f"data/raw/aqi_data_{timestamp}.csv"
        collector.save_to_csv(data, filepath)
        
        # Print summary
        print("\n" + "="*60)
        print("DATA COLLECTION SUMMARY")
        print("="*60)
        print(f"Total Records: {len(data)}")
        print(f"Cities Covered: {data['city'].nunique()}")
        print(f"Stations: {data['station_name'].nunique()}")
        print(f"\nAQI Statistics:")
        print(data['aqi'].describe())
        print(f"\nData saved to: {filepath}")
        print("="*60)
    else:
        logger.error("No data collected!")