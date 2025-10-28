# 🚀 Complete Setup Guide - Traffic Prediction System with UCS Model

## Prerequisites

- ✅ Python 3.8+ installed
- ✅ Node.js 18+ installed
- ✅ npm or yarn package manager
- ✅ Google Maps API key
- ✅ Supabase account (optional for database features)

---

## 📦 Installation Steps

### 1. Install Dependencies

#### Frontend (Next.js)
```bash
npm install
```

#### Backend (Flask + UCS Model)
```bash
cd UCS_Model-main
pip install -r requirements_web.txt
```

### 2. Configure Environment Variables

Create `.env.local` in the project root:

```env
# Flask Backend URL
FLASK_API_URL=http://localhost:5000

# Google Maps Configuration
GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here

# Supabase Configuration (Optional)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Verify Model Files

Ensure these files exist in `UCS_Model-main/models/`:
- ✅ `traffic_prediction_model.h5`
- ✅ `feature_scaler.pkl`
- ✅ `target_scaler.pkl`
- ✅ `model_metadata.json`

---

## 🎯 Running the Application

### Method 1: Automated (Windows)

#### Start Flask Backend:
```bash
start-flask.bat
```

#### Start Next.js (in another terminal):
```bash
npm run dev
```

### Method 2: Manual

#### Terminal 1 - Flask Backend:
```bash
cd UCS_Model-main
python traffic_prediction_api.py
```

Wait for:
```
✅ Model and scalers loaded successfully!
🚀 Starting Traffic Prediction API...
🌐 API will be available at: http://localhost:5000
```

#### Terminal 2 - Next.js Frontend:
```bash
npm run dev
```

---

## 🧪 Testing the Integration

### 1. Access the Application

| Service | URL | Purpose |
|---------|-----|---------|
| Main App | http://localhost:3000 | Full application |
| Test Page | http://localhost:3000/test-map.html | Interactive map testing |
| Debug Console | http://localhost:3000/debug-console.html | API testing & debugging |
| Flask API | http://localhost:5000 | Backend API |
| Flask Docs | http://localhost:5000/ | API documentation |

### 2. Verify Backend Status

The dashboard will show a status indicator:
- 🟢 **Green** = Flask backend online
- 🔴 **Red** = Flask backend offline (click "Retry" after starting Flask)

### 3. Run Debug Tests

1. Open http://localhost:3000/debug-console.html
2. Click "Run Full Test Suite"
3. Check that all tests pass ✅

### 4. Test Predictions

In browser console at http://localhost:3000:

```javascript
// Test single prediction
fetch('/api/ucs-predict', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    latitude: 16.5062,
    longitude: 80.6480,
    timestamp: new Date().toISOString()
  })
}).then(r => r.json()).then(console.log);

// Expected output:
// {
//   success: true,
//   data: {
//     prediction: 45.2,
//     traffic_level: "medium",
//     confidence: "medium",
//     ...
//   }
// }
```

---

## 🔍 Troubleshooting

### ❌ Error: `ECONNREFUSED` 

**Problem**: Flask backend not running

**Solution**:
```bash
# Check if Flask is running
curl http://localhost:5000/api/health

# If not, start it:
cd UCS_Model-main
python traffic_prediction_api.py
```

### ❌ Error: Port 5000 already in use

**Problem**: Another service using port 5000

**Solution**:
```bash
# Windows - Find process
netstat -ano | findstr :5000

# Kill the process (replace PID)
taskkill /F /PID <PID>

# Or change Flask port in traffic_prediction_api.py:
app.run(debug=True, host='0.0.0.0', port=5001)
# Then update FLASK_API_URL in .env.local
```

### ❌ Error: Model files not found

**Problem**: Model files missing

**Solution**:
1. Check `UCS_Model-main/models/` directory
2. Ensure all 4 model files are present
3. If missing, retrain the model or restore from backup

### ❌ Error: Google Maps not loading

**Problem**: Invalid or missing API key

**Solution**:
1. Get API key from [Google Cloud Console](https://console.cloud.google.com/)
2. Enable required APIs:
   - Maps JavaScript API
   - Directions API
   - Places API
3. Add to `.env.local`:
   ```env
   GOOGLE_MAPS_API_KEY=AIzaSy...
   ```
4. Restart Next.js

### ❌ Error: TensorFlow warnings

**Problem**: TensorFlow compatibility warnings

**Solution**: These are usually harmless. To suppress:
```python
# In traffic_prediction_api.py, add at top:
import warnings
warnings.filterwarnings('ignore')
```

---

## 📊 Architecture Overview

```
┌─────────────────────────────────────────────┐
│           Browser (Client)                   │
│  - Interactive Map (JavaScript)              │
│  - React Components (TypeScript)             │
└──────────────┬──────────────────────────────┘
               │
               ├─────────────────────┐
               │                     │
               ▼                     ▼
┌──────────────────────┐  ┌────────────────────┐
│   Next.js API        │  │  Google Maps API   │
│   (Proxy Layer)      │  │  (Traffic Layer)   │
│  - /api/ucs-predict  │  └────────────────────┘
│  - /api/ucs-model-   │
│    info              │
└──────────┬───────────┘
           │
           ▼
┌────────────────────────┐
│   Flask Backend        │
│   (UCS Model)          │
│  - TensorFlow Model    │
│  - Feature Scaling     │
│  - Predictions         │
└────────────────────────┘
```

---

## 🎨 Features

### ✅ Implemented Features

- **Interactive Traffic Map** with Google Maps integration
- **Real-time Traffic Predictions** using UCS AI model
- **Traffic Layer Visualization** with color-coded indicators
- **Route Planning** with multi-waypoint predictions
- **24-Hour Forecasting** with congestion analysis
- **Model Performance Metrics** (RMSE, MAE, R²)
- **Turn-by-Turn Directions** with traffic density
- **Backend Status Monitoring** with auto-reconnect
- **Debug Console** for API testing
- **Test Interface** for development

### 🎯 Key Improvements Over Old System

| Feature | Old System | New System (UCS) |
|---------|-----------|------------------|
| Models | 3 separate (LSTM, GNN, CNN-GRU) | 1 unified (UCS Ensemble) |
| Frontend | TypeScript only | JavaScript + TypeScript hybrid |
| Performance | Multiple API calls | Single unified API |
| Inference Time | ~2-3 seconds | ~0.5-1 second |
| Accuracy | Variable across models | Consistent, optimized |
| Maintainability | Complex | Simplified |

---

## 📚 Documentation

- **Quick Start**: `QUICK_START.md`
- **Integration Guide**: `UCS_MODEL_INTEGRATION.md`
- **Environment Setup**: `ENV_SETUP.md`
- **API Documentation**: http://localhost:5000/ (when Flask is running)

---

## 🛠️ Development Tools

### VS Code Extensions Recommended:
- ESLint
- Prettier
- Python
- Tailwind CSS IntelliSense

### Chrome Extensions for Testing:
- React Developer Tools
- Redux DevTools (if using Redux)
- JSON Formatter

---

## 📈 Performance Tips

1. **Keep Flask running** during development
2. **Use the test interfaces** to debug quickly
3. **Monitor Network tab** in Chrome DevTools
4. **Check Flask logs** for prediction details
5. **Enable cache** in production

---

## 🔐 Security Notes

- ⚠️ Don't commit `.env.local` to Git
- ⚠️ Use environment variables for all API keys
- ⚠️ Enable CORS only for trusted origins in production
- ⚠️ Use HTTPS in production deployments

---

## 🚀 Deployment

### Flask Backend (Python)
```bash
# Using Gunicorn
gunicorn -w 4 -b 0.0.0.0:5000 traffic_prediction_api:app

# Or using uWSGI
uwsgi --http :5000 --wsgi-file traffic_prediction_api.py --callable app
```

### Next.js Frontend
```bash
npm run build
npm start

# Or deploy to Vercel
vercel deploy
```

---

## 📞 Support

If you encounter issues:

1. Check `QUICK_START.md` for common problems
2. Run the debug console test suite
3. Check Flask logs for errors
4. Verify all environment variables are set
5. Ensure model files are present

---

## ✅ Final Checklist

Before running the app, ensure:

- [ ] Python 3.8+ installed
- [ ] Node.js 18+ installed
- [ ] Dependencies installed (npm + pip)
- [ ] `.env.local` configured
- [ ] Model files in `UCS_Model-main/models/`
- [ ] Google Maps API key valid
- [ ] Flask backend starts without errors
- [ ] Next.js builds successfully
- [ ] Debug console tests pass

---

**Ready to go! 🎉** Run `start-flask.bat` and `npm run dev`, then open http://localhost:3000
