@echo off
echo ========================================
echo   Starting AirSense Frontend
echo ========================================
echo.

cd frontend\citizen-app
echo Installing dependencies...
call npm install
echo.
echo Starting React development server...
echo Frontend will be available at http://localhost:3000
echo.

call npm start
