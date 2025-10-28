# 🔧 Troubleshooting Guide

## Common Errors & Solutions

---

### ❌ **Error: Model Metric Compatibility**

**Error Message:**
```
❌ Error loading model: Could not locate function 'mse'. 
Make sure custom classes are decorated with @keras.saving.register_keras_serializable()
```

**Cause:** 
TensorFlow/Keras version mismatch between model training and runtime

**Solution:**
✅ **Already Fixed!** The updated `traffic_prediction_api.py` now loads the model with `compile=False` and manually compiles it.

**Test the fix:**
```bash
cd e:\traffic-prediction-system\UCS_Model-main
python test_model_loading.py
```

---

### ❌ **Error: Model Files Not Found**

**Error Message:**
```
❌ Error loading model: [Errno 2] Unable to synchronously open file
(unable to open file: name = 'models/traffic_prediction_model.h5')
```

**Cause:** 
Running Flask from wrong directory OR model files missing

**Solution 1: Fix Directory**
```bash
# WRONG ❌
python e:/traffic-prediction-system/UCS_Model-main/traffic_prediction_api.py

# CORRECT ✅
cd e:\traffic-prediction-system\UCS_Model-main
python traffic_prediction_api.py
```

**Solution 2: Verify Files Exist**
```bash
cd e:\traffic-prediction-system\UCS_Model-main\models
dir

# Should see:
# traffic_prediction_model.h5  (1.5+ MB)
# feature_scaler.pkl
# target_scaler.pkl
# model_metadata.json
```

**Solution 3: Test Loading**
```bash
cd e:\traffic-prediction-system\UCS_Model-main
python test_model_loading.py
```

---

### ❌ **Error: ECONNREFUSED**

**Error Message:**
```
[UCS Model] Error fetching model info: TypeError: fetch failed
code: 'ECONNREFUSED'
```

**Cause:** 
Flask backend not running

**Solution:**
```bash
# Terminal 1 - Start Flask
cd e:\traffic-prediction-system\UCS_Model-main
python traffic_prediction_api.py

# Wait for: ✅ Model and scalers loaded successfully!

# Test Flask is running:
curl http://localhost:5000/api/health
```

---

### ❌ **Error: Port Already in Use**

**Error Message:**
```
OSError: [WinError 10048] Only one usage of each socket address 
(protocol/network address/port) is normally permitted
```

**Cause:** 
Port 5000 already in use by another process

**Solution:**

**Option 1: Kill the process (Windows)**
```powershell
# Find process on port 5000
netstat -ano | findstr :5000

# Kill it (replace <PID> with actual number)
taskkill /F /PID <PID>
```

**Option 2: Change Flask port**
```python
# Edit traffic_prediction_api.py line 228:
app.run(debug=True, host='0.0.0.0', port=5001)
```

Then update `.env.local`:
```env
FLASK_API_URL=http://localhost:5001
```

---

### ❌ **Error: TensorFlow Not Installed**

**Error Message:**
```
ModuleNotFoundError: No module named 'tensorflow'
```

**Solution:**
```bash
pip install tensorflow

# Or specific version:
pip install tensorflow==2.15.0

# Or install all requirements:
cd UCS_Model-main
pip install -r requirements_web.txt
```

---

### ❌ **Error: Google Maps Not Loading**

**Symptoms:**
- Map shows gray box
- Console error: "Google Maps JavaScript API error"

**Solution:**

1. **Get API Key:**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create/select project
   - Enable APIs:
     - Maps JavaScript API ✅
     - Directions API ✅
     - Places API ✅
   - Create credentials → API Key

2. **Add to .env.local:**
   ```env
   GOOGLE_MAPS_API_KEY=AIzaSy...your_key_here
   ```

3. **Restart Next.js:**
   ```bash
   # Stop Next.js (Ctrl+C)
   npm run dev
   ```

---

### ❌ **Error: Prediction Returns 0 or NaN**

**Symptoms:**
- Predictions always return 0
- Console shows NaN warnings

**Causes & Solutions:**

**1. Model not properly loaded**
```bash
# Check Flask terminal for errors
# Should see: ✅ Model and scalers loaded successfully!
```

**2. Feature scaling issue**
```bash
# Test model loading:
cd UCS_Model-main
python test_model_loading.py
```

**3. Input data format mismatch**
```javascript
// Verify input format in console:
fetch('/api/ucs-predict', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    latitude: 16.5062,        // Must be number
    longitude: 80.6480,       // Must be number  
    timestamp: new Date().toISOString()  // ISO format
  })
}).then(r => r.json()).then(console.log);
```

---

### ❌ **Error: npm run dev fails**

**Error Message:**
```
Error: Cannot find module 'next'
```

**Solution:**
```bash
# Install dependencies
cd e:\traffic-prediction-system
npm install

# If still fails, clear cache:
rm -rf node_modules
rm package-lock.json
npm install
```

---

### ❌ **Error: Backend Status Shows Red 🔴**

**Symptoms:**
- Dashboard shows red notification
- "Flask backend offline"

**Solution Checklist:**

1. **Start Flask:**
   ```bash
   cd e:\traffic-prediction-system\UCS_Model-main
   python traffic_prediction_api.py
   ```

2. **Verify Flask is running:**
   ```bash
   curl http://localhost:5000/api/health
   ```

3. **Check .env.local:**
   ```env
   FLASK_API_URL=http://localhost:5000
   ```

4. **Click "Retry" button** on red notification

5. **Check browser console** for errors (F12)

---

## 🧪 Testing Tools

### **1. Model Loading Test**
```bash
cd e:\traffic-prediction-system\UCS_Model-main
python test_model_loading.py
```
✅ Verifies all model files and loading process

### **2. Debug Console**
```
http://localhost:3000/debug-console.html
```
- Click "Run Full Test Suite"
- All tests should pass ✅

### **3. Test Page**
```
http://localhost:3000/test-map.html
```
- Interactive map testing
- Manual prediction testing

### **4. Manual API Test**
```bash
# Test Flask directly
curl http://localhost:5000/api/health

# Test prediction
curl -X POST http://localhost:5000/api/predict \
  -H "Content-Type: application/json" \
  -d '{"latitude":16.5062,"longitude":80.6480,"timestamp":"2025-10-25T12:00:00"}'

# Test via Next.js proxy
curl http://localhost:3000/api/ucs-model-info
```

---

## 📋 Health Check Checklist

Before considering the system "working":

- [ ] Flask starts without errors
- [ ] Flask shows "✅ Model and scalers loaded successfully!"
- [ ] `curl http://localhost:5000/api/health` returns 200
- [ ] Next.js starts on port 3000
- [ ] Dashboard shows 🟢 green indicator
- [ ] Model Performance section shows metrics
- [ ] Map loads with Google Maps
- [ ] Debug console tests pass
- [ ] Predictions return valid numbers (not 0 or NaN)

---

## 🔍 Diagnostic Commands

```bash
# Check Flask is running
curl http://localhost:5000/api/health

# Check Flask API key
curl http://localhost:3000/api/config/maps

# Check model info
curl http://localhost:3000/api/ucs-model-info

# Check prediction
curl -X POST http://localhost:3000/api/ucs-predict \
  -H "Content-Type: application/json" \
  -d '{"latitude":16.5062,"longitude":80.6480,"timestamp":"2025-10-25T12:00:00"}'

# Check Next.js is running
curl http://localhost:3000

# Check for processes on port 5000
netstat -ano | findstr :5000

# Check for processes on port 3000
netstat -ano | findstr :3000
```

---

## 🆘 Still Having Issues?

### **Step 1: Run Diagnostics**
```bash
cd e:\traffic-prediction-system\UCS_Model-main
python test_model_loading.py
```

### **Step 2: Check Debug Console**
```
http://localhost:3000/debug-console.html
```
Click "Run Full Test Suite"

### **Step 3: Check Both Terminals**
- Flask terminal should show successful model loading
- Next.js terminal should show no errors

### **Step 4: Check Browser Console**
- Open Chrome DevTools (F12)
- Look for errors in Console tab
- Check Network tab for failed requests

### **Step 5: Verify File Structure**
```
e:\traffic-prediction-system\
├── UCS_Model-main/
│   ├── models/                    ← All 4 files must exist
│   │   ├── traffic_prediction_model.h5
│   │   ├── feature_scaler.pkl
│   │   ├── target_scaler.pkl
│   │   └── model_metadata.json
│   ├── traffic_prediction_api.py  ← Updated with compile=False fix
│   └── test_model_loading.py      ← Test script
├── .env.local                      ← Environment config
└── package.json
```

---

## 📞 Quick Reference

| Issue | Quick Fix |
|-------|-----------|
| Model metric error | ✅ Already fixed in updated `traffic_prediction_api.py` |
| Model not found | `cd UCS_Model-main` before running |
| Connection refused | Start Flask: `python traffic_prediction_api.py` |
| Port in use | Kill process or change port |
| Map not loading | Add Google Maps API key to `.env.local` |
| Red indicator | Start Flask, then click "Retry" |

---

**Remember:** Always run Flask from the `UCS_Model-main` directory!

```bash
cd e:\traffic-prediction-system\UCS_Model-main
python traffic_prediction_api.py
```
