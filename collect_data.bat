@echo off
echo ========================================
echo   AirSense Data Collection
echo ========================================
echo.
echo Collecting AQI and Weather data...
echo.

cd data-pipeline\collectors
python collect_all.py

echo.
echo Data collection complete!
echo Check data/raw/ folder for collected data
echo.
pause
