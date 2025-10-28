@echo off
title Traffic Prediction System - Complete Startup

echo ==========================================
echo   TRAFFIC PREDICTION SYSTEM STARTUP
echo ==========================================
echo.
echo This will start both Flask and Next.js
echo.
echo Press Ctrl+C in any window to stop
echo.
pause

REM Start Flask in new window
start "Flask Backend (Port 5000)" cmd /k "cd /d %~dp0UCS_Model-main && python traffic_prediction_api.py"

echo Waiting for Flask to start...
timeout /t 5 /nobreak >nul

REM Start Next.js in new window
start "Next.js Frontend (Port 3000)" cmd /k "cd /d %~dp0 && npm run dev"

echo.
echo ==========================================
echo   STARTUP COMPLETE
echo ==========================================
echo.
echo Flask Backend:  http://localhost:5000
echo Next.js App:    http://localhost:3000
echo Test Page:      http://localhost:3000/test-map.html
echo Debug Console:  http://localhost:3000/debug-console.html
echo.
echo Two new windows opened:
echo   1. Flask Backend (blue)
echo   2. Next.js Frontend (blue)
echo.
echo Close those windows to stop the servers.
echo.
pause
