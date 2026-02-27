@echo off
echo ========================================
echo   AirSense AI - Complete Startup
echo ========================================
echo.
echo This will start both Backend and Frontend servers
echo.
echo Backend: http://localhost:8000
echo Frontend: http://localhost:3000
echo API Docs: http://localhost:8000/docs
echo.
echo Press Ctrl+C to stop all servers
echo.
pause

start "AirSense Backend" cmd /k "cd /d %~dp0 && start_backend.bat"
timeout /t 5 /nobreak
start "AirSense Frontend" cmd /k "cd /d %~dp0 && start_frontend.bat"

echo.
echo ========================================
echo   Both servers are starting...
echo ========================================
echo.
echo Backend: http://localhost:8000
echo Frontend: http://localhost:3000
echo.
echo Close this window to keep servers running
echo Or press any key to exit
pause
