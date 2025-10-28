@echo off
echo ==========================================
echo   TESTING MODEL LOADING FIX
echo ==========================================
echo.

cd /d "%~dp0UCS_Model-main"

echo 🧪 Running model loading test...
echo.
python test_model_loading.py

echo.
echo ==========================================
echo.
if %ERRORLEVEL% EQU 0 (
    echo ✅ TEST PASSED!
    echo.
    echo You can now start Flask:
    echo   python traffic_prediction_api.py
) else (
    echo ❌ TEST FAILED
    echo.
    echo Check the error messages above.
)
echo.
pause
