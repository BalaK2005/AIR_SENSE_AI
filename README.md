# AIR_SENSE AI — Hyperlocal NCR Air Quality Monitoring System

Real-time AQI monitoring, 72-hour forecasting, pollution source analysis, and policy simulation for Delhi-NCR powered by live AQICN data, FastAPI backend, and dual React dashboards.

## Live Deployment

| Service | URL |
|---------|-----|
| Citizen App | https://air-sense-ai-1.onrender.com |
| Policy Dashboard | https://airsense-policy.onrender.com |
| Backend API | https://air-sense-ai.onrender.com |
| API Documentation | https://air-sense-ai.onrender.com/docs |

---

## Technology Stack

[![Python](https://img.shields.io/badge/Python-3.11-yellow?logo=python)](https://python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.104-teal?logo=fastapi)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-18-blue?logo=react)](https://react.dev/)
[![SQLite](https://img.shields.io/badge/SQLite-3-blue?logo=sqlite)](https://sqlite.org/)
[![Leaflet](https://img.shields.io/badge/Leaflet-1.9-green?logo=leaflet)](https://leafletjs.com/)
[![Recharts](https://img.shields.io/badge/Recharts-2.x-blue?logo=react)](https://recharts.org/)
[![Render](https://img.shields.io/badge/Deployed-Render-purple?logo=render)](https://render.com/)
[![GitHub](https://img.shields.io/badge/Source-GitHub-black?logo=github)](https://github.com/BalaK2005/AIR_SENSE_AI)

---

## Project Architecture

```
AIR_SENSE/
├── .env                            # API keys and configuration
├── .env.example                    # Template for environment variables
├── render.yaml                     # Render deployment configuration
├── start.ps1                       # Single-command local launcher
│
├── data-pipeline/                  # Python data collection layer
│   ├── config.py                   # Centralized settings, loads .env
│   └── collectors/
│       ├── collect_all.py          # Parallel multi-city AQI + weather collector
│       ├── scheduler.py            # Runs collection every 30 minutes
│       ├── aqi_collector.py        # Single-city AQI collector
│       └── weather_collector.py    # Single-city weather collector
│
├── data/
│   ├── raw/                        # aqi_YYYYMMDD.csv, weather_YYYYMMDD.csv
│   └── processed/                  # Reserved for future aggregation
│
├── backend/                        # FastAPI application (port 8000)
│   ├── main.py                     # App entry point, router registration
│   ├── requirements.txt            # Python dependencies
│   ├── airvision.db                # SQLite database (users, policies)
│   └── app/
│       ├── core/
│       │   ├── config.py           # Pydantic settings model
│       │   └── security.py         # JWT auth, bcrypt password hashing
│       ├── models/
│       │   ├── user.py             # SQLAlchemy User model
│       │   ├── aqi.py              # AQI data models
│       │   └── policy.py           # Policy models
│       ├── services/
│       │   ├── cache_service.py    # Redis cache (graceful fallback if unavailable)
│       │   ├── data_pipeline.py    # Data ingestion service
│       │   ├── weather_service.py  # OpenWeather API integration
│       │   └── notification.py     # Alert notification service
│       └── api/v1/endpoints/
│           ├── csv_aqi_router.py   # /aqi/csv/* — CSV + AQICN API fallback
│           ├── forecast.py         # /forecast/* — ML regression forecast
│           ├── aqi.py              # /aqi/* — station-based AQI queries
│           ├── source.py           # /source/* — pollution source attribution
│           ├── policy.py           # /policy/* — policy simulation and history
│           ├── router.py           # /route/* — safe route recommendations
│           └── auth.py             # /auth/* — JWT register/login/me
│
└── frontend/
    ├── citizen-app/                # React app for citizens (port 3000)
    │   └── src/
    │       ├── App.jsx             # Router, no auth required
    │       ├── services/api.js     # Axios API client with all API modules
    │       └── components/
    │           ├── AQIDashboard.jsx    # Home — live AQI, pollutants, weather
    │           ├── AQIForecast.jsx     # 72-hour forecast chart
    │           ├── AQIMap.jsx          # Interactive Leaflet map, 17 stations
    │           ├── HealthAlerts.jsx    # Health advisories based on live AQI
    │           ├── SafeRoute.jsx       # AQI-optimized route finder
    │           └── Navbar.jsx          # Sticky nav with live AQI pill
    │
    └── policy-dashboard/           # React app for policy makers (port 3001)
        └── src/
            ├── App.jsx             # Router with mobile sidebar support
            ├── services/api.js     # Axios API client with policy endpoints
            ├── components/
            │   ├── Sidebar.jsx         # Collapsible navigation sidebar
            │   ├── Recommendations.jsx # AI policy recommendations
            │   ├── RegionalMap.jsx     # NCR regional AQI map
            │   └── SourceAttribution.jsx # Receptor model visualization
            └── pages/
                ├── Overview.jsx        # Delhi-NCR AQI overview, regional comparison
                ├── SourceAnalysis.jsx  # Pollution source breakdown by sector
                ├── PolicyImpact.jsx    # Historical policy impact analysis
                ├── Simulation.jsx      # Policy intervention simulation
                └── Recommendations.jsx # AI-generated policy recommendations
```

---

## Data Flow

```
External APIs
    │
    ├── AQICN API (api.waqi.info)
    │   └── Real-time AQI, PM2.5, PM10, NO2, O3, SO2, CO per city
    │
    └── OpenWeather API (api.openweathermap.org)
        └── Temperature, humidity, pressure, wind speed, weather description
                │
                ▼
    data-pipeline/collectors/collect_all.py
        - Fetches all 5 NCR cities in parallel using ThreadPoolExecutor
        - Delhi (@10111), Noida (@7021), Gurgaon (@8681),
          Ghaziabad (@8682), Faridabad (@9477)
        - Saves to data/raw/aqi_YYYYMMDD.csv
        - Saves to data/raw/weather_YYYYMMDD.csv
        - Runs every 30 minutes via scheduler.py
                │
                ▼
    data/raw/*.csv  (local storage)
        - One CSV per day, rows appended each collection cycle
        - Columns: timestamp, city, aqi, pm25, pm10, no2, o3, so2, co,
                   temperature, humidity, pressure, wind_speed
                │
                ▼
    backend/app/api/v1/endpoints/csv_aqi_router.py
        - Reads latest CSV row for requested city (default: Delhi)
        - Falls back to AQICN direct API call if no CSV exists (cloud mode)
        - Enriches with weather data from weather CSV or OpenWeather API
        - Exposes: /aqi/csv/live, /aqi/csv/cities, /aqi/csv/history, /aqi/csv/stats
                │
                ▼
    backend/app/api/v1/endpoints/forecast.py
        - Reads last N CSV rows for Delhi
        - Calculates OLS linear regression trend (AQI per hour)
        - Applies Delhi diurnal multipliers (rush hour peaks: 7-9 AM, 6-9 PM)
        - Generates 72 hourly forecasts with confidence decay (95% → 55%)
        - Exposes: /forecast/hourly, /forecast/daily, /forecast/summary, /forecast/stations
                │
                ▼
    React Frontends
        ├── Citizen App (air-sense-ai-1.onrender.com)
        │   ├── Dashboard reads /aqi/csv/live
        │   ├── Forecast reads /forecast/hourly
        │   ├── Map reads /forecast/stations (17 NCR stations)
        │   ├── Alerts derives health advice from live AQI
        │   └── Safe Routes computes route AQI using station data
        │
        └── Policy Dashboard (airsense-policy.onrender.com)
            ├── Overview reads /aqi/csv/live + /aqi/csv/stats
            ├── Source Analysis reads /source/breakdown
            ├── Policy Impact reads /policy/history
            ├── Simulation posts to /policy/simulate
            └── Recommendations reads /policy/recommendations
```

---

## Application Flow

### Citizen App

Users open the app and land directly on the Home dashboard (no login required). The navbar shows a live AQI pill that updates every 5 minutes. From the navbar, users can navigate to five pages.

The **Home** page shows the current Delhi AQI as a large colored number, a full pollutant breakdown (PM2.5, PM10, NO2, O3, SO2, CO) with progress bars and safe/unsafe indicators, current weather conditions (temperature, humidity, wind speed), and an NCR regional comparison card showing all 5 cities.

The **AQI Map** page renders an interactive Leaflet map centered on Delhi with 17 color-coded circle markers representing monitoring stations. Clicking any marker shows a popup with the station's AQI, pollutant values, and a health advisory. Users can toggle between Stations view and Heatmap view, and filter by Good, Moderate, or Poor AQI. A sorted station list below the map provides a quick overview.

The **Forecast** page displays a 72-hour AQI forecast chart built using OLS regression on historical CSV data combined with Delhi-specific diurnal patterns. It shows the best and worst hours of the day, daily summaries, and confidence bands.

The **Alerts** page generates health advisories dynamically from the current AQI, recommending mask use, indoor activity, or outdoor caution based on WHO and CPCB guidelines.

The **Safe Routes** page allows users to enter a starting point and destination from a list of 30+ Delhi-NCR localities. The system calculates the haversine distance, applies AQI zone factors for known pollution hotspots, and returns three route options (Green Corridor via parks, Direct Route, and Highway Express) with AQI exposure, distance, estimated travel time, and health tips for the selected travel mode.

### Policy Dashboard

Policy makers land directly on the Overview page. The sidebar provides navigation to five sections.

The **Overview** page shows the current Delhi AQI with full pollutant breakdown, all-time statistics (average, peak, best), and an NCR regional comparison with color-coded cards.

The **Source Analysis** page uses a receptor model to break down Delhi's pollution into contributing sectors: vehicles, industry, construction, biomass burning, and domestic sources. It shows percentage contributions and trends.

The **Policy Impact** page displays historical data on implemented policies, their AQI before and after, and the measured reduction percentage.

The **Simulation** page allows policy makers to select intervention categories (odd-even vehicle scheme, industrial shutdown, construction ban, etc.), set a duration, and run a simulation that projects the expected AQI reduction with confidence scores and assumptions.

The **AI Recommendations** page generates context-aware policy suggestions based on the current live AQI and trend, categorized by urgency (low, medium, high, critical) with estimated impact, cost, and timeframe.

---

## API Reference

### AQI Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/aqi/csv/live?city=Delhi` | Latest AQI for a city |
| GET | `/api/v1/aqi/csv/cities` | Latest AQI for all 5 NCR cities |
| GET | `/api/v1/aqi/csv/history?days=7&city=Delhi` | Historical AQI readings |
| GET | `/api/v1/aqi/csv/stats?city=Delhi` | AQI statistics (avg, max, min) |
| GET | `/api/v1/aqi/csv/debug` | Debug path and data source info |

### Forecast Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/forecast/hourly?hours=72` | 72-hour hourly AQI forecast |
| GET | `/api/v1/forecast/daily?days=7` | 7-day daily forecast summary |
| GET | `/api/v1/forecast/summary` | 6-hour outlook with trend |
| GET | `/api/v1/forecast/stations` | AQI estimates for 17 NCR stations |

### Auth Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/register` | Register new user |
| POST | `/api/v1/auth/token` | Login, returns JWT token |
| GET | `/api/v1/auth/me` | Get current user info |

### Policy Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/policy/recommendations` | AI policy recommendations |
| POST | `/api/v1/policy/simulate` | Simulate policy intervention |
| GET | `/api/v1/policy/history` | Historical policy implementations |

---

## NCR Monitoring Stations

| City | Station Count | AQICN Feed ID |
|------|--------------|---------------|
| Delhi | 8 | @10111 |
| Noida | 3 | @7021 |
| Gurgaon | 2 | @8681 |
| Ghaziabad | 2 | @8682 |
| Faridabad | 2 | @9477 |

---

## ML Forecasting Model

The forecast engine uses no external ML libraries. It is implemented in pure Python using the following approach:

1. Read the last 12 AQI readings from CSV files for Delhi.
2. Apply Ordinary Least Squares (OLS) linear regression to estimate the trend in AQI per hour.
3. Use the most recent reading as the baseline AQI.
4. Apply Delhi-specific diurnal multipliers derived from traffic and industrial patterns. Peak hours are 7-9 AM (multiplier 1.28-1.35) and 6-9 PM (multiplier 1.18-1.32). Midday hours have the lowest multipliers (0.84-0.88).
5. Add the trend contribution (trend per hour × hour index) to the diurnal-adjusted baseline.
6. Apply confidence decay starting at 95% for hour 1, reducing by ~0.55% per hour to ~55% at hour 72.

When no CSV files are available (cloud deployment), the system uses the AQICN API directly to fetch the current AQI as the baseline, then applies the same diurnal model.

---

## Local Setup

### Prerequisites

- Python 3.11+
- Node.js 18+
- npm

### Environment Setup

```bash
copy .env.example .env
# Edit .env and add your API keys:
# AQICN_TOKEN=your_token_from_aqicn.org
# OPENWEATHER_KEY=your_key_from_openweathermap.org
```

### Install Dependencies

```bash
# Backend
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt

# Citizen App
cd frontend/citizen-app
npm install

# Policy Dashboard
cd frontend/policy-dashboard
npm install
```

### Run Locally (4 terminals)

```powershell
# Terminal 1 - Data Pipeline
cd data-pipeline/collectors
& "..\..\venv\Scripts\Activate.ps1"
python scheduler.py

# Terminal 2 - Backend
cd backend
& ".\venv\Scripts\Activate.ps1"
uvicorn main:app --host 0.0.0.0 --port 8000

# Terminal 3 - Citizen App
cd frontend/citizen-app
$env:PORT='3000'; npm start

# Terminal 4 - Policy Dashboard
cd frontend/policy-dashboard
$env:PORT='3001'; npm start
```

### Local URLs

| Service | URL |
|---------|-----|
| Citizen App | http://localhost:3000 |
| Policy Dashboard | http://localhost:3001 |
| Backend API | http://localhost:8000 |
| API Docs (Swagger) | http://localhost:8000/docs |

---

## Cloud Deployment (Render)

The project deploys three services on Render's free tier using `render.yaml`:

- `airsense-backend` — Python web service running FastAPI with uvicorn
- `airsense-citizen` — Static site serving the built React citizen app
- `airsense-policy` — Static site serving the built React policy dashboard

The backend operates in two modes automatically. When CSV files are present (local), it reads from them. When no CSV files exist (cloud), it calls the AQICN API directly for live data.

Note: Free tier instances spin down after 15 minutes of inactivity. The first request after inactivity takes approximately 50 seconds to wake the server.

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `AQICN_TOKEN` | Yes | API token from aqicn.org |
| `OPENWEATHER_KEY` | Yes | API key from openweathermap.org |
| `SECRET_KEY` | Yes | JWT signing secret |
| `CITY_NAME` | No | Default city (default: Delhi) |
| `LATITUDE` | No | Default latitude (default: 28.6139) |
| `LONGITUDE` | No | Default longitude (default: 77.2090) |
| `DATABASE_URL` | No | SQLite path (default: sqlite:///./airvision.db) |
| `CORS_ORIGINS` | No | Allowed frontend origins |

---

## Known Behaviors

- `Redis connection failed` on startup is expected and harmless. Redis is optional. All caching is gracefully disabled if Redis is unavailable.
- The policy dashboard uses a mock user in cloud mode. Authentication works fully in local mode.
- Historical data and trend-based forecasting improve over time as more CSV data accumulates from the data pipeline.

---

## License

MIT License

---

Built for Delhi-NCR air quality monitoring and policy analysis.
