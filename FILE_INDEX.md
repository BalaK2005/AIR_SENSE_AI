# 📁 FILE INDEX - AirSense AI

## 🚀 START HERE (Most Important Files)

1. **START_HERE.txt** ⭐⭐⭐
   - Visual startup guide with ASCII art
   - Read this first!

2. **INSTALL.bat** ⭐⭐⭐
   - Install all dependencies
   - Run this first time only

3. **START_ALL.bat** ⭐⭐⭐
   - Start both backend and frontend
   - One-click startup

4. **COMPLETE_SUMMARY.md** ⭐⭐
   - Complete project summary
   - Everything you need to know

---

## 📚 Documentation Files

- **README.md** - Full documentation with all details
- **QUICKSTART.md** - Quick start guide (5 minutes)
- **PROJECT_OVERVIEW.md** - Detailed project overview
- **HOW_TO_START.txt** - Visual startup instructions
- **FILE_INDEX.md** - This file (navigation guide)

---

## 🔧 Startup Scripts

- **START_ALL.bat** - Start everything (recommended)
- **start_backend.bat** - Start backend only
- **start_frontend.bat** - Start frontend only
- **INSTALL.bat** - Install dependencies
- **collect_data.bat** - Run data collection

---

## 💻 Backend Files (Python/FastAPI)

### Main Files:
- **backend/app/main.py** - Main API server (FastAPI)
- **backend/requirements.txt** - Python dependencies

### API Structure:
- **backend/app/api/v1/** - API version 1 endpoints
- **backend/app/core/** - Core functionality
- **backend/app/models/** - Data models
- **backend/app/services/** - Business logic

---

## 🌐 Frontend Files (React)

### Main Files:
- **frontend/citizen-app/src/App.js** - Main React app
- **frontend/citizen-app/src/index.js** - Entry point
- **frontend/citizen-app/package.json** - Node dependencies

### Components:
- **frontend/citizen-app/src/components/AQIDashboard.jsx** - Main dashboard
- **frontend/citizen-app/src/components/AQIForecast.jsx** - Forecast component
- **frontend/citizen-app/src/components/AQIMap.jsx** - Map component

### Services:
- **frontend/citizen-app/src/services/api.js** - API client

### Styling:
- **frontend/citizen-app/src/index.css** - Global styles (Tailwind)
- **frontend/citizen-app/src/App.css** - App styles
- **frontend/citizen-app/tailwind.config.js** - Tailwind config
- **frontend/citizen-app/postcss.config.js** - PostCSS config

### Configuration:
- **frontend/citizen-app/.env** - Environment variables

---

## 📊 Data Pipeline Files

### Collectors:
- **data-pipeline/collectors/aqi_collector.py** - AQI data collector
- **data-pipeline/collectors/weather_collector.py** - Weather data collector
- **data-pipeline/collectors/collect_all.py** - Collect all data
- **data-pipeline/collectors/scheduler.py** - Automated scheduling

### Configuration:
- **data-pipeline/config.py** - Pipeline configuration

---

## 🤖 Machine Learning Files

### Models:
- **ml-models/trained_models/aqi_forecast_lstm.h5** - LSTM forecast model
- **ml-models/trained_models/aqi_scaler.pkl** - Data scaler
- **ml-models/trained_models/source_attribution/** - Source models

### Scripts:
- **ml-models/scripts/train_aqi_forecast.py** - Train forecast model
- **ml-models/scripts/train_source_attribution.py** - Train attribution model
- **ml-models/scripts/quick_train_all.py** - Train all models

---

## 📁 Data Files

### Raw Data:
- **data/raw/aqi_YYYYMMDD.csv** - Daily AQI data
- **data/raw/weather_YYYYMMDD.csv** - Daily weather data

### Processed Data:
- **data/processed/aqi_historical.csv** - Historical AQI
- **data/processed/pollution_sources.csv** - Source data

---

## ⚙️ Configuration Files

- **.env** - Environment variables (API keys)
- **requirements.txt** - Root Python dependencies
- **frontend/citizen-app/package.json** - Node.js dependencies
- **frontend/citizen-app/tailwind.config.js** - Tailwind CSS config
- **frontend/citizen-app/postcss.config.js** - PostCSS config

---

## 📊 Visualization Files

- **charts/aqi_timeline_YYYYMMDD.png** - AQI timeline chart
- **charts/pollutants_YYYYMMDD.png** - Pollutants chart
- **charts/weather_YYYYMMDD.png** - Weather chart

---

## 🧪 Test Files

- **backend/tests/test_api.py** - API tests
- **backend/tests/test_system.py** - System tests
- **frontend/citizen-app/src/App.test.js** - React tests

---

## 📝 Other Files

- **sa.py** - Source attribution script
- **sample_data_generator.py** - Generate sample data

---

## 🎯 QUICK NAVIGATION

### To Start the App:
1. Read: **START_HERE.txt**
2. Run: **INSTALL.bat** (first time)
3. Run: **START_ALL.bat**
4. Open: http://localhost:3000

### To Understand the Project:
1. Read: **COMPLETE_SUMMARY.md**
2. Read: **PROJECT_OVERVIEW.md**
3. Read: **README.md**

### To Modify Code:
- Backend API: **backend/app/main.py**
- Frontend Dashboard: **frontend/citizen-app/src/components/AQIDashboard.jsx**
- Frontend Forecast: **frontend/citizen-app/src/components/AQIForecast.jsx**
- Frontend Map: **frontend/citizen-app/src/components/AQIMap.jsx**

### To Configure:
- API Keys: **.env**
- Backend Settings: **backend/app/main.py**
- Frontend Settings: **frontend/citizen-app/.env**

---

## 📞 NEED HELP?

1. **Quick Start** → Read QUICKSTART.md
2. **Full Docs** → Read README.md
3. **Troubleshooting** → Check COMPLETE_SUMMARY.md
4. **API Docs** → Visit http://localhost:8000/docs

---

**Total Files Created: 50+**
**Lines of Code: 5000+**
**Ready to Run: YES ✅**

---

🌍 AirSense AI - Complete Air Quality Monitoring System
