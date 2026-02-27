@echo off
echo ========================================
echo   Starting AirSense Backend Server
echo ========================================
echo.

cd backend\app
echo Starting FastAPI server on http://localhost:8000
echo API Documentation: http://localhost:8000/docs
echo.

python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
