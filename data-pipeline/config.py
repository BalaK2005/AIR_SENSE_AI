"""
AirVision Configuration
Centralized settings for the entire project
"""
import os
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables
load_dotenv(dotenv_path=Path(__file__).parent.parent / ".env", override=True)
# Also try loading from current directory
load_dotenv(override=False)

# Project Paths
PROJECT_ROOT = Path(__file__).parent.parent
DATA_DIR = PROJECT_ROOT / "data"
RAW_DATA_DIR = DATA_DIR / "raw"
PROCESSED_DATA_DIR = DATA_DIR / "processed"

# Create directories if they don't exist
RAW_DATA_DIR.mkdir(parents=True, exist_ok=True)
PROCESSED_DATA_DIR.mkdir(parents=True, exist_ok=True)

# API Keys
AQICN_TOKEN = os.getenv('AQICN_TOKEN')
OPENWEATHER_KEY = os.getenv('OPENWEATHER_KEY')

# Target City
CITY_NAME = os.getenv('CITY_NAME', 'Delhi')
LATITUDE = float(os.getenv('LATITUDE', '28.6139'))
LONGITUDE = float(os.getenv('LONGITUDE', '77.2090'))

# API Endpoints
AQICN_BASE_URL = "https://api.waqi.info"
OPENWEATHER_BASE_URL = "https://api.openweathermap.org/data/2.5"

# Data Collection Settings
COLLECTION_INTERVAL = 3600  # 1 hour in seconds
MAX_RETRIES = 3
TIMEOUT = 10  # seconds

# File naming
DATE_FORMAT = "%Y%m%d"
DATETIME_FORMAT = "%Y-%m-%d %H:%M:%S"

print(f"✅ Config loaded for {CITY_NAME}")
print(f"📂 Data directory: {DATA_DIR}")


