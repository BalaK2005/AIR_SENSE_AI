# 🌍 AirSense AI - Air Quality Monitoring System

A complete, dynamic air quality monitoring system with real-time data, forecasting, and interactive maps.

## 🚀 Quick Start

### Option 1: Start Everything at Once (Recommended)
```bash
# Double-click this file:
START_ALL.bat
```

### Option 2: Start Separately

**Backend Server:**
```bash
start_backend.bat
```

**Frontend App:**
```bash
start_frontend.bat
```

## 📋 Prerequisites

1. **Python 3.9+** - [Download](https://www.python.org/downloads/)
2. **Node.js 16+** - [Download](https://nodejs.org/)
3. **Git** (optional)

## 🔧 Installation

### 1. Install Python Dependencies
```bash
cd backend
pip install -r requirements.txt
```

### 2. Install Node Dependencies
```bash
cd frontend/citizen-app
npm install
```

## 🌐 Access the Application

Once started:

- **Frontend (Website):** http://localhost:3000
- **Backend API:** http://localhost:8000
- **API Documentation:** http://localhost:8000/docs

## 📁 Project Structure

```
AIR_SENSE/
├── backend/                    # FastAPI Backend
│   ├── app/
│   │   ├── main.py            # Main API server
│   │   ├── api/               # API endpoints
│   │   ├── core/              # Core functionality
│   │   ├── models/            # Data models
│   │   └── services/          # Business logic
│   └── requirements.txt       # Python dependencies
│
├── frontend/                   # React Frontend
│   └── citizen-app/
│       ├── src/
│       │   ├── components/    # React components
│       │   │   ├── AQIDashboard.jsx
│       │   │   ├── AQIForecast.jsx
│       │   │   └── AQIMap.jsx
│       │   ├── App.js
│       │   └── index.js
│       └── package.json       # Node dependencies
│
├── data-pipeline/             # Data Collection
│   ├── collectors/
│   │   ├── aqi_collector.py
│   │   └── weather_collector.py
│   └── config.py
│
├── ml-models/                 # Machine Learning
│   ├── trained_models/
│   └── scripts/
│
├── data/                      # Data Storage
│   ├── raw/
│   └── processed/
│
├── .env                       # Environment variables
├── START_ALL.bat             # Master startup script
├── start_backend.bat         # Backend startup
└── start_frontend.bat        # Frontend startup
```

## ✨ Features

### 🎯 Current Features
- ✅ Real-time AQI monitoring
- ✅ 72-hour air quality forecast
- ✅ Interactive map with multiple monitoring points
- ✅ Pollutant breakdown (PM2.5, PM10, NO2, SO2, CO, O3)
- ✅ Health recommendations
- ✅ Source attribution analysis
- ✅ Weather integration
- ✅ Responsive design
- ✅ Auto-refresh data

### 📊 Dashboard Components
1. **Current AQI Card** - Real-time air quality index
2. **Pollutant Details** - Individual pollutant levels
3. **Weather Info** - Temperature and humidity
4. **24-Hour Forecast** - Predictive chart
5. **Interactive Map** - Hyperlocal AQI data
6. **Health Alerts** - Safety recommendations

## 🔌 API Endpoints

### Get Current AQI
```
GET /api/v1/aqi/current?latitude=28.6139&longitude=77.2090
```

### Get Forecast
```
GET /api/v1/forecast?latitude=28.6139&longitude=77.2090&hours=72
```

### Get Source Attribution
```
GET /api/v1/source-attribution?latitude=28.6139&longitude=77.2090
```

### Get Health Alerts
```
GET /api/v1/alerts
```

## 🛠️ Configuration

Edit `.env` file for API keys and settings:

```env
AQICN_TOKEN=your_token_here
OPENWEATHER_KEY=your_key_here
CITY_NAME=Delhi
LATITUDE=28.6139
LONGITUDE=77.2090
```

## 🐛 Troubleshooting

### Backend won't start
```bash
cd backend
pip install --upgrade -r requirements.txt
python app/main.py
```

### Frontend won't start
```bash
cd frontend/citizen-app
npm install --force
npm start
```

### Port already in use
- Backend: Change port in `backend/app/main.py` (line: `uvicorn.run(app, port=8000)`)
- Frontend: Set `PORT=3001` in `frontend/citizen-app/.env`

### CORS errors
- Ensure backend is running on port 8000
- Check CORS settings in `backend/app/main.py`

## 📦 Dependencies

### Backend (Python)
- FastAPI - Web framework
- Uvicorn - ASGI server
- TensorFlow - ML models
- Pandas - Data processing
- NumPy - Numerical computing

### Frontend (React)
- React 19 - UI framework
- Recharts - Charts
- Leaflet - Maps
- Axios - HTTP client
- Tailwind CSS - Styling

## 🚀 Deployment

### Backend (Heroku/AWS)
```bash
cd backend
# Add Procfile
echo "web: uvicorn app.main:app --host 0.0.0.0 --port $PORT" > Procfile
```

### Frontend (Vercel/Netlify)
```bash
cd frontend/citizen-app
npm run build
# Deploy 'build' folder
```

## 📝 Development

### Run in Development Mode
```bash
# Backend with auto-reload
cd backend/app
uvicorn main:app --reload

# Frontend with hot-reload
cd frontend/citizen-app
npm start
```

### Run Tests
```bash
# Backend tests
cd backend
pytest

# Frontend tests
cd frontend/citizen-app
npm test
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License.

## 👥 Team

Built with ❤️ for cleaner air

## 🔗 Links

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [React Documentation](https://react.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Leaflet Maps](https://leafletjs.com/)

## 📞 Support

For issues and questions:
- Open an issue on GitHub
- Check API documentation at http://localhost:8000/docs

---

**Made with 🌍 AirSense AI**
# 🌬️ AIR_SENSE — Hyperlocal NCR Air Quality Monitoring System

> Real-time AQI monitoring, forecasting, and policy analysis for Delhi-NCR powered by live AQICN data, Python ML pipeline, and React dashboards.

---

## 🏗️ Architecture

```
AIR_SENSE/
├── data-pipeline/          # Python data collection (5 NCR cities, every 30 min)
│   ├── collectors/
│   │   ├── collect_all.py  # Multi-city parallel collector ← MAIN
│   │   ├── scheduler.py    # Auto-runs every 30 minutes
│   │   ├── aqi_collector.py
│   │   └── weather_collector.py
│   └── config.py
├── data/raw/               # CSV files (aqi_YYYYMMDD.csv, weather_YYYYMMDD.csv)
├── backend/                # FastAPI (port 8000)
│   ├── main.py
│   └── app/api/v1/endpoints/
│       ├── csv_aqi_router.py   # /aqi/csv/* — live CSV data
│       ├── forecast.py         # /forecast/* — ML regression forecast
│       └── ...
└── frontend/
    ├── citizen-app/        # React citizen app (port 3000)
    │   └── src/            # Dashboard, Forecast, Alerts, Safe Routes
    └── policy-dashboard/   # React policy dashboard (port 3001)
        └── src/            # Overview, Source Analysis, Simulation, Recommendations
```

---

## ⚡ Quick Start

### 1. Prerequisites
```
Node.js 18+    Python 3.11+    npm
```

### 2. Environment Setup
```bash
# Copy and fill in your API keys
copy .env.example .env
```

### 3. Start Everything (4 terminals)

**Terminal 1 — Data Pipeline:**
```powershell
cd "AIR_SENSE\data-pipeline\collectors"
& "AIR_SENSE\venv\Scripts\Activate.ps1"
python scheduler.py
```

**Terminal 2 — Backend API:**
```powershell
cd "AIR_SENSE\backend"
& ".\venv\Scripts\Activate.ps1"
uvicorn main:app --host 0.0.0.0 --port 8000
```

**Terminal 3 — Citizen App:**
```powershell
cd "AIR_SENSE\frontend\citizen-app"
npm start        # → http://localhost:3000
```

**Terminal 4 — Policy Dashboard:**
```powershell
cd "AIR_SENSE\frontend\policy-dashboard"
npm start        # → http://localhost:3001
```

---

## 🌐 Live Endpoints

| URL | Description |
|-----|-------------|
| `http://localhost:3000` | Citizen App — Dashboard, Forecast, Alerts, Safe Routes |
| `http://localhost:3001` | Policy Dashboard — Overview, Source Analysis, Simulation |
| `http://localhost:8000/docs` | FastAPI Swagger UI |
| `http://localhost:8000/api/v1/aqi/csv/live` | Live Delhi AQI (JSON) |
| `http://localhost:8000/api/v1/forecast/summary` | 6-hour forecast summary |
| `http://localhost:8000/api/v1/forecast/hourly?hours=72` | 72-hour hourly forecast |
| `http://localhost:8000/api/v1/forecast/stations` | All 17 NCR stations |

---

## 🔑 API Keys Required

| Key | Source | Used For |
|-----|--------|----------|
| `AQICN_TOKEN` | https://aqicn.org/data-platform/token/ | Real-time AQI data |
| `OPENWEATHER_KEY` | https://openweathermap.org/api | Weather data |

---

## 📊 Data Flow

```
AQICN API ──────────────────────────────────────────────────────────────┐
OpenWeather API ──────────────────────────────────────────────────────┐ │
                                                                       ↓ ↓
                                        data-pipeline/collectors/ → data/raw/*.csv
                                                                            │
                                                                            ↓
                                                    backend/app/api/v1/endpoints/
                                                    csv_aqi_router.py (live data)
                                                    forecast.py (ML regression)
                                                                            │
                                                        ┌───────────────────┤
                                                        ↓                   ↓
                                              citizen-app          policy-dashboard
                                           (port 3000)              (port 3001)
```

---

## 🗺️ NCR Cities Monitored

| City | AQICN Feed | Stations |
|------|-----------|---------|
| Delhi | `Delhi` | 8 stations |
| Noida | `noida` | 3 stations |
| Gurgaon | `gurgaon` | 2 stations |
| Ghaziabad | `ghaziabad` | 2 stations |
| Faridabad | `faridabad` | 2 stations |

---

## 🤖 ML Forecasting

The `/forecast/*` endpoints use:
- **Weighted moving average** of last 12 CSV readings as baseline
- **OLS linear regression** to detect rising/falling trend
- **Delhi diurnal multipliers** (rush hour peaks at 7-9 AM and 6-9 PM)
- **72-hour ahead** forecasting with confidence decay (95% → 55%)

No TensorFlow or database required — pure Python on your CSV files.

---

## ⚠️ Known Non-Issues

- `Redis connection failed` — harmless, caching is disabled but everything works
- Pydantic `model_info` warnings — harmless version mismatch warnings
- bcrypt warning from passlib — harmless after the 4.0.1 fix