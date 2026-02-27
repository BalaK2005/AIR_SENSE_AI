"""
Data Pipeline Service
Handles ETL operations for AQI data from various sources
"""

import requests
import logging
from typing import List, Dict, Optional, Any
from datetime import datetime, timedelta
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.aqi_data import AQIData
from app.services.cache_service import cache_set, cache_get

logger = logging.getLogger(__name__)


class DataPipeline:
    """
    Data pipeline for collecting and processing AQI data
    """
    
    def __init__(self, db: Session):
        self.db = db
        self.sources = {
            "cpcb": self._fetch_cpcb_data,
            "state_board": self._fetch_state_board_data,
            "openaq": self._fetch_openaq_data,
        }
    
    def fetch_all_sources(self) -> Dict[str, Any]:
        """
        Fetch data from all configured sources
        
        Returns:
            Dictionary with results from each source
        """
        results = {}
        
        for source_name, fetch_func in self.sources.items():
            try:
                logger.info(f"Fetching data from {source_name}")
                data = fetch_func()
                results[source_name] = {
                    "success": True,
                    "records": len(data) if data else 0,
                    "data": data
                }
            except Exception as e:
                logger.error(f"Error fetching from {source_name}: {e}")
                results[source_name] = {
                    "success": False,
                    "error": str(e)
                }
        
        return results
    
    def _fetch_cpcb_data(self) -> List[Dict]:
        """
        Fetch data from CPCB (Central Pollution Control Board)
        
        Returns:
            List of AQI records
        """
        if not settings.CPCB_API_KEY:
            logger.warning("CPCB API key not configured")
            return []
        
        try:
            url = settings.CPCB_BASE_URL
            headers = {
                "api-key": settings.CPCB_API_KEY,
                "Content-Type": "application/json"
            }
            
            response = requests.get(url, headers=headers, timeout=30)
            response.raise_for_status()
            
            data = response.json()
            records = data.get("records", [])
            
            # Process and standardize records
            processed_records = []
            for record in records:
                processed = self._process_cpcb_record(record)
                if processed:
                    processed_records.append(processed)
            
            logger.info(f"Fetched {len(processed_records)} records from CPCB")
            return processed_records
            
        except Exception as e:
            logger.error(f"Error fetching CPCB data: {e}")
            return []
    
    def _process_cpcb_record(self, record: Dict) -> Optional[Dict]:
        """
        Process and standardize a CPCB record
        
        Args:
            record: Raw CPCB record
            
        Returns:
            Standardized record or None if invalid
        """
        try:
            return {
                "station_id": record.get("station_id") or record.get("id"),
                "station_name": record.get("station") or record.get("station_name"),
                "city": record.get("city"),
                "state": record.get("state"),
                "latitude": float(record.get("latitude", 0)),
                "longitude": float(record.get("longitude", 0)),
                "aqi": float(record.get("aqi", 0)),
                "pm25": float(record.get("pm25")) if record.get("pm25") else None,
                "pm10": float(record.get("pm10")) if record.get("pm10") else None,
                "co": float(record.get("co")) if record.get("co") else None,
                "no2": float(record.get("no2")) if record.get("no2") else None,
                "so2": float(record.get("so2")) if record.get("so2") else None,
                "o3": float(record.get("o3")) if record.get("o3") else None,
                "timestamp": self._parse_timestamp(record.get("last_update")),
                "data_source": "CPCB"
            }
        except Exception as e:
            logger.error(f"Error processing CPCB record: {e}")
            return None
    
    def _fetch_state_board_data(self) -> List[Dict]:
        """
        Fetch data from State Pollution Control Boards
        
        Returns:
            List of AQI records
        """
        # Placeholder for state board data fetching
        # In production, implement specific state board APIs
        logger.info("State board data fetching not yet implemented")
        return []
    
    def _fetch_openaq_data(self) -> List[Dict]:
        """
        Fetch data from OpenAQ API
        
        Returns:
            List of AQI records
        """
        try:
            url = "https://api.openaq.org/v2/latest"
            params = {
                "country": "IN",
                "limit": 1000
            }
            
            response = requests.get(url, params=params, timeout=30)
            response.raise_for_status()
            
            data = response.json()
            results = data.get("results", [])
            
            processed_records = []
            for result in results:
                processed = self._process_openaq_record(result)
                if processed:
                    processed_records.append(processed)
            
            logger.info(f"Fetched {len(processed_records)} records from OpenAQ")
            return processed_records
            
        except Exception as e:
            logger.error(f"Error fetching OpenAQ data: {e}")
            return []
    
    def _process_openaq_record(self, record: Dict) -> Optional[Dict]:
        """
        Process and standardize an OpenAQ record
        
        Args:
            record: Raw OpenAQ record
            
        Returns:
            Standardized record or None if invalid
        """
        try:
            coordinates = record.get("coordinates", {})
            measurements = record.get("measurements", [])
            
            # Extract pollutant values
            pollutants = {}
            for measurement in measurements:
                param = measurement.get("parameter", "").lower()
                value = measurement.get("value")
                if value is not None:
                    pollutants[param] = float(value)
            
            # Calculate AQI (simplified - use proper calculation in production)
            aqi = self._calculate_aqi_from_pollutants(pollutants)
            
            return {
                "station_id": f"openaq_{record.get('location')}",
                "station_name": record.get("location"),
                "city": record.get("city"),
                "state": None,
                "latitude": float(coordinates.get("latitude", 0)),
                "longitude": float(coordinates.get("longitude", 0)),
                "aqi": aqi,
                "pm25": pollutants.get("pm25"),
                "pm10": pollutants.get("pm10"),
                "co": pollutants.get("co"),
                "no2": pollutants.get("no2"),
                "so2": pollutants.get("so2"),
                "o3": pollutants.get("o3"),
                "timestamp": datetime.utcnow(),
                "data_source": "OpenAQ"
            }
        except Exception as e:
            logger.error(f"Error processing OpenAQ record: {e}")
            return None
    
    def _calculate_aqi_from_pollutants(self, pollutants: Dict) -> float:
        """
        Calculate AQI from pollutant concentrations
        
        Args:
            pollutants: Dictionary of pollutant values
            
        Returns:
            Calculated AQI
        """
        # Simplified AQI calculation
        # In production, use proper Indian AQI calculation formula
        
        if "pm25" in pollutants:
            pm25 = pollutants["pm25"]
            if pm25 <= 30:
                return pm25 * 50 / 30
            elif pm25 <= 60:
                return 50 + (pm25 - 30) * 50 / 30
            elif pm25 <= 90:
                return 100 + (pm25 - 60) * 100 / 30
            elif pm25 <= 120:
                return 200 + (pm25 - 90) * 100 / 30
            elif pm25 <= 250:
                return 300 + (pm25 - 120) * 100 / 130
            else:
                return 400 + (pm25 - 250) * 100 / 130
        
        return 0
    
    def _parse_timestamp(self, timestamp_str: Optional[str]) -> datetime:
        """
        Parse timestamp string to datetime
        
        Args:
            timestamp_str: Timestamp string
            
        Returns:
            Parsed datetime
        """
        if not timestamp_str:
            return datetime.utcnow()
        
        try:
            # Try various formats
            formats = [
                "%Y-%m-%dT%H:%M:%S",
                "%Y-%m-%d %H:%M:%S",
                "%Y-%m-%dT%H:%M:%SZ",
                "%Y-%m-%d"
            ]
            
            for fmt in formats:
                try:
                    return datetime.strptime(timestamp_str, fmt)
                except:
                    continue
            
            return datetime.utcnow()
        except:
            return datetime.utcnow()
    
    def save_records(self, records: List[Dict]) -> int:
        """
        Save records to database
        
        Args:
            records: List of processed records
            
        Returns:
            Number of records saved
        """
        saved_count = 0
        
        for record in records:
            try:
                aqi_data = AQIData(
                    station_id=record["station_id"],
                    station_name=record["station_name"],
                    city=record.get("city"),
                    state=record.get("state"),
                    latitude=record["latitude"],
                    longitude=record["longitude"],
                    aqi=record["aqi"],
                    pm25=record.get("pm25"),
                    pm10=record.get("pm10"),
                    co=record.get("co"),
                    no2=record.get("no2"),
                    so2=record.get("so2"),
                    o3=record.get("o3"),
                    timestamp=record["timestamp"],
                    data_source=record.get("data_source"),
                    category=self._get_aqi_category(record["aqi"])
                )
                
                self.db.add(aqi_data)
                saved_count += 1
                
            except Exception as e:
                logger.error(f"Error saving record: {e}")
        
        try:
            self.db.commit()
            logger.info(f"Saved {saved_count} records to database")
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error committing records: {e}")
            saved_count = 0
        
        return saved_count
    
    def _get_aqi_category(self, aqi: float) -> str:
        """Get AQI category"""
        if aqi <= 50:
            return "Good"
        elif aqi <= 100:
            return "Satisfactory"
        elif aqi <= 200:
            return "Moderate"
        elif aqi <= 300:
            return "Poor"
        elif aqi <= 400:
            return "Very Poor"
        else:
            return "Severe"
    
    def run_pipeline(self) -> Dict[str, Any]:
        """
        Run complete data pipeline
        
        Returns:
            Pipeline execution results
        """
        logger.info("Starting data pipeline execution")
        start_time = datetime.utcnow()
        
        # Fetch from all sources
        fetch_results = self.fetch_all_sources()
        
        # Collect all successful records
        all_records = []
        for source, result in fetch_results.items():
            if result.get("success") and result.get("data"):
                all_records.extend(result["data"])
        
        # Save to database
        saved_count = self.save_records(all_records)
        
        # Clear cache after data update
        from app.services.cache_service import cache_delete_pattern
        cache_delete_pattern("aqi_*")
        
        end_time = datetime.utcnow()
        duration = (end_time - start_time).total_seconds()
        
        results = {
            "success": True,
            "start_time": start_time.isoformat(),
            "end_time": end_time.isoformat(),
            "duration_seconds": duration,
            "sources": fetch_results,
            "total_records_fetched": len(all_records),
            "total_records_saved": saved_count
        }
        
        logger.info(f"Pipeline execution completed in {duration:.2f} seconds")
        return results


def run_data_collection(db: Session) -> Dict[str, Any]:
    """
    Convenience function to run data collection
    
    Args:
        db: Database session
        
    Returns:
        Collection results
    """
    pipeline = DataPipeline(db)
    return pipeline.run_pipeline()