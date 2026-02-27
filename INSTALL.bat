@echo off
echo ========================================
echo   AirSense AI - Installation
echo ========================================
echo.
echo This will install all dependencies
echo.

echo [1/3] Installing Python dependencies...
cd backend
pip install -r requirements.txt
cd ..
echo.

echo [2/3] Installing Node.js dependencies...
cd frontend\citizen-app
call npm install
cd ..\..
echo.

echo [3/3] Creating data directories...
if not exist "data\raw" mkdir data\raw
if not exist "data\processed" mkdir data\processed
echo.

echo ========================================
echo   Installation Complete!
echo ========================================
echo.
echo Next steps:
echo 1. Edit .env file with your API keys
echo 2. Run START_ALL.bat to start the application
echo.
pause
