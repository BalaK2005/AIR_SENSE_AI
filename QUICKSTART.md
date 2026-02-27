# 🚀 QUICK START GUIDE

## Start the Application in 3 Steps:

### Step 1: Install Dependencies
Double-click: `INSTALL.bat`

### Step 2: Start All Servers
Double-click: `START_ALL.bat`

### Step 3: Open Browser
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000/docs

---

## Manual Start (Alternative)

### Terminal 1 - Backend:
```bash
cd backend\app
python -m uvicorn main:app --reload
```

### Terminal 2 - Frontend:
```bash
cd frontend\citizen-app
npm start
```

---

## Features Available:

✅ Real-time AQI Dashboard
✅ 72-hour Forecast
✅ Interactive Map
✅ Pollutant Breakdown
✅ Health Recommendations
✅ Source Attribution

---

## Troubleshooting:

**Backend Error?**
```bash
cd backend
pip install -r requirements.txt
```

**Frontend Error?**
```bash
cd frontend\citizen-app
npm install
```

**Port Conflict?**
- Backend uses port 8000
- Frontend uses port 3000
- Close other applications using these ports

---

## API Endpoints:

- GET /api/v1/aqi/current
- GET /api/v1/forecast
- GET /api/v1/source-attribution
- GET /api/v1/alerts
- GET /health

Full API docs: http://localhost:8000/docs

---

**Need Help?** Check README.md for detailed documentation
