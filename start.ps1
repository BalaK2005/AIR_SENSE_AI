# AIR_SENSE — Single-Command Startup Script

$ROOT = "C:\Users\Bala Muruganantham\Desktop\AIR_SENSE"

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "   AIRSENSE AI — Starting All Services" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

# Terminal 1 — Data Pipeline
Write-Host "Starting Data Pipeline..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList @(
    "-NoExit", "-Command",
    "cd '$ROOT\data-pipeline\collectors'; & '$ROOT\venv\Scripts\Activate.ps1'; python scheduler.py"
) -WindowStyle Normal

Start-Sleep -Seconds 2

# Terminal 2 — Backend
Write-Host "Starting Backend API on port 8000..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList @(
    "-NoExit", "-Command",
    "cd '$ROOT\backend'; & '.\venv\Scripts\Activate.ps1'; uvicorn main:app --host 0.0.0.0 --port 8000"
) -WindowStyle Normal

Start-Sleep -Seconds 3

# Terminal 3 — Citizen App
Write-Host "Starting Citizen App on port 3000..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList @(
    "-NoExit", "-Command",
    "cd '$ROOT\frontend\citizen-app'; `$env:PORT='3000'; npm start"
) -WindowStyle Normal

Start-Sleep -Seconds 2

# Terminal 4 — Policy Dashboard
Write-Host "Starting Policy Dashboard on port 3001..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList @(
    "-NoExit", "-Command",
    "cd '$ROOT\frontend\policy-dashboard'; `$env:PORT='3001'; npm start"
) -WindowStyle Normal

Write-Host ""
Write-Host "============================================================" -ForegroundColor Green
Write-Host "   All 4 services launching in separate windows!" -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Green
Write-Host ""
Write-Host "   Citizen App      -> http://localhost:3000" -ForegroundColor White
Write-Host "   Policy Dashboard -> http://localhost:3001" -ForegroundColor White
Write-Host "   Backend API      -> http://localhost:8000" -ForegroundColor White
Write-Host "   API Docs         -> http://localhost:8000/docs" -ForegroundColor White
Write-Host ""
Write-Host "   Wait 30 seconds for all services to fully start." -ForegroundColor Gray
Write-Host ""
