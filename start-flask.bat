@echo off
echo ========================================
echo Starting Flask Backend (UCS Model)
echo ========================================
echo.

cd /d "%~dp0UCS_Model-main"
if not exist "traffic_prediction_api.py" (
    echo ERROR: Cannot find traffic_prediction_api.py
    echo Current directory: %CD%
    pause
    exit /b 1
)

echo Checking Python installation...
python --version
if errorlevel 1 (
    echo ERROR: Python not found!
    echo Please install Python 3.8+ from python.org
    pause
    exit /b 1
)

echo.
echo Checking dependencies...
pip show tensorflow >nul 2>&1
if errorlevel 1 (
    echo Installing required packages...
    pip install -r requirements_web.txt
)

echo.
echo Starting Flask API on http://localhost:5000
echo Press Ctrl+C to stop
echo.
python traffic_prediction_api.py

pause
