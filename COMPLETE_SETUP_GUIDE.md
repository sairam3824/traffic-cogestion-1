# 🚀 COMPLETE SETUP & RUN GUIDE

## Quick Start (Easiest Method)

### **Option 1: One-Click Startup (Windows)**
```bash
# Double-click this file:
RUN_EVERYTHING.bat
```
This opens two windows automatically:
- 🔵 Flask Backend (Port 5000)
- 🔵 Next.js Frontend (Port 3000)

---

## Manual Setup (All Platforms)

### **1️⃣ Install Dependencies**

#### Frontend Dependencies:
```bash
cd e:\traffic-prediction-system
npm install
```

#### Backend Dependencies:
```bash
cd e:\traffic-prediction-system\UCS_Model-main
pip install flask numpy pandas tensorflow scikit-learn joblib
```

Or use requirements file:
```bash
pip install -r requirements_web.txt
```

---

### **2️⃣ Configure Environment**

Create `.env.local` in project root (`e:\traffic-prediction-system\.env.local`):

```env
# Flask Backend
FLASK_API_URL=http://localhost:5000

# Google Maps
GOOGLE_MAPS_API_KEY=your_key_here

# Supabase (Optional)
NEXT_PUBLIC_SUPABASE_URL=your_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
```

---

### **3️⃣ Start Services**

#### **Terminal 1 - Flask Backend:**

**Windows PowerShell:**
```powershell
cd e:\traffic-prediction-system\UCS_Model-main
python traffic_prediction_api.py
```

**Windows CMD:**
```cmd
cd /d e:\traffic-prediction-system\UCS_Model-main
python traffic_prediction_api.py
```

**Mac/Linux:**
```bash
cd ~/traffic-prediction-system/UCS_Model-main
python3 traffic_prediction_api.py
```

**Expected Output:**
```
✅ Model and scalers loaded successfully!
🚀 Starting Traffic Prediction API...
📊 Model loaded and ready for predictions!
🌐 API will be available at: http://localhost:5000
📱 Web interface at: http://localhost:5000
 * Serving Flask app 'traffic_prediction_api'
 * Debug mode: on
 * Running on all addresses (0.0.0.0)
 * Running on http://127.0.0.1:5000
```

#### **Terminal 2 - Next.js Frontend:**

**Any OS:**
```bash
cd e:\traffic-prediction-system
npm run dev
```

**Expected Output:**
```
  ▲ Next.js 16.0.0 (Turbopack)
  - Local:        http://localhost:3000
  - Network:      http://192.168.x.x:3000
  
 ✓ Ready in 2.3s
```

---

### **4️⃣ Verify Everything Works**

#### **Test 1: Flask Backend Health**
```bash
curl http://localhost:5000/api/health
```

**Expected Response:**
```json
{
  "status": "healthy",
  "model_loaded": true,
  "timestamp": "2025-10-25T16:30:00.123456"
}
```

#### **Test 2: Flask UI**
Open browser: http://localhost:5000
- Should see the Flask web interface

#### **Test 3: Next.js App**
Open browser: http://localhost:3000
- Should see the traffic prediction dashboard
- Look for 🟢 green status indicator (bottom-right)

#### **Test 4: Model Info**
```bash
curl http://localhost:3000/api/ucs-model-info
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "modelType": "LSTM-CNN-GRU Ensemble",
    "sequenceLength": 10,
    "features": 32,
    "performance": {
      "rmse": 0.0523,
      "mae": 0.0412,
      "r2": 0.9234
    }
  }
}
```

---

## 🧪 Testing Suite

### **Option 1: Debug Console (Recommended)**
1. Open http://localhost:3000/debug-console.html
2. Click **"Run Full Test Suite"**
3. Check all tests pass ✅

### **Option 2: Test Page**
1. Open http://localhost:3000/test-map.html
2. Click **"Predict Traffic"** button
3. Verify map loads and predictions work

### **Option 3: Manual Browser Testing**
Open http://localhost:3000 and open **Chrome DevTools** (F12):

```javascript
// Test backend status
fetch('/api/ucs-model-info')
  .then(r => r.json())
  .then(d => console.log('✅ Model Info:', d));

// Test prediction
fetch('/api/ucs-predict', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    latitude: 16.5062,
    longitude: 80.6480,
    timestamp: new Date().toISOString()
  })
}).then(r => r.json()).then(d => console.log('✅ Prediction:', d));
```

---

## 🔍 Troubleshooting

### ❌ **Error: Model files not found**

**Symptoms:**
```
❌ Error loading model: [Errno 2] Unable to synchronously open file
```

**Solution:**
```bash
# Check if files exist
cd e:\traffic-prediction-system\UCS_Model-main\models
dir

# Should see:
# traffic_prediction_model.h5    (1.5 MB)
# feature_scaler.pkl
# target_scaler.pkl  
# model_metadata.json
```

**If files are missing:**
```bash
# Train the model using the notebook
cd e:\traffic-prediction-system\UCS_Model-main
jupyter notebook Capstone_LSTM_CNN-GRU_Notebook.ipynb
# Run all cells to generate model files
```

### ❌ **Error: Port 5000 already in use**

**Solution:**
```powershell
# Windows - Find and kill process
netstat -ano | findstr :5000
taskkill /F /PID <process_id>

# Or change port in traffic_prediction_api.py (line 228):
app.run(debug=True, host='0.0.0.0', port=5001)
# Then update .env.local:
FLASK_API_URL=http://localhost:5001
```

### ❌ **Error: TensorFlow not found**

**Solution:**
```bash
pip install tensorflow
# Or for specific version:
pip install tensorflow==2.15.0
```

### ❌ **Error: Connection refused (ECONNREFUSED)**

**Cause:** Flask not running

**Solution:**
1. Start Flask in correct directory:
   ```bash
   cd e:\traffic-prediction-system\UCS_Model-main
   python traffic_prediction_api.py
   ```
2. Wait for "Model loaded" message
3. Refresh Next.js app

### ❌ **Error: Google Maps not loading**

**Solution:**
1. Get API key from [Google Cloud Console](https://console.cloud.google.com/)
2. Enable APIs:
   - Maps JavaScript API
   - Directions API
   - Places API
3. Add to `.env.local`:
   ```env
   GOOGLE_MAPS_API_KEY=AIzaSy...
   ```
4. Restart Next.js

---

## 📊 Project Structure

```
e:\traffic-prediction-system\
│
├── UCS_Model-main/                    ← Flask Backend
│   ├── models/                        ← Model files (MUST EXIST)
│   │   ├── traffic_prediction_model.h5
│   │   ├── feature_scaler.pkl
│   │   ├── target_scaler.pkl
│   │   └── model_metadata.json
│   ├── traffic_prediction_api.py      ← Flask API
│   └── requirements_web.txt
│
├── app/                               ← Next.js Pages
├── components/                        ← React Components
├── public/                            ← Static Files
│   ├── js/
│   │   ├── interactive-map.js         ← Pure JS Map
│   │   └── map-integration.js
│   ├── test-map.html                  ← Test Interface
│   └── debug-console.html             ← Debug Tools
│
├── .env.local                         ← Environment Config
├── package.json                       ← Node Dependencies
├── RUN_EVERYTHING.bat                 ← One-click startup
└── start-flask.bat                    ← Flask only startup
```

---

## ✅ Success Checklist

Before considering setup complete:

- [ ] Flask runs without errors
- [ ] Flask shows "Model loaded successfully"
- [ ] Flask health endpoint returns 200
- [ ] Next.js runs on port 3000
- [ ] Dashboard shows green status indicator 🟢
- [ ] Model Performance section shows metrics
- [ ] Debug console tests all pass
- [ ] Map loads with Google Maps
- [ ] Traffic layer is visible
- [ ] Predictions return valid data

---

## 🎯 URLs Reference

| Service | URL | Description |
|---------|-----|-------------|
| **Main App** | http://localhost:3000 | Full traffic prediction dashboard |
| **Test Page** | http://localhost:3000/test-map.html | Interactive map testing |
| **Debug Console** | http://localhost:3000/debug-console.html | API testing suite |
| **Flask Backend** | http://localhost:5000 | Backend API |
| **Flask UI** | http://localhost:5000/ | Flask web interface |
| **Health Check** | http://localhost:5000/api/health | Backend status |

---

## 🚀 Production Deployment

### Flask (Backend):
```bash
# Install production server
pip install gunicorn

# Run with Gunicorn
cd UCS_Model-main
gunicorn -w 4 -b 0.0.0.0:5000 traffic_prediction_api:app
```

### Next.js (Frontend):
```bash
# Build for production
npm run build

# Start production server
npm start

# Or deploy to Vercel
vercel deploy --prod
```

---

## 📞 Need Help?

1. Check `QUICK_START.md` for common issues
2. Run debug console tests
3. Check Flask terminal for errors
4. Check browser console (F12) for frontend errors
5. Verify all environment variables are set

---

## 🎉 You're Ready!

Run `RUN_EVERYTHING.bat` or follow the manual steps above. Your traffic prediction system should now be fully operational!

**Test URLs:**
- Dashboard: http://localhost:3000
- Test Page: http://localhost:3000/test-map.html  
- Debug Console: http://localhost:3000/debug-console.html

Happy Predicting! 🚗📊
