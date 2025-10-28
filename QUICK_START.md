# Quick Start Guide - UCS Model Integration

## ⚡ Fast Setup (2 minutes)

### 1️⃣ **Start Flask Backend**

**Windows:**
```bash
start-flask.bat
```

**Mac/Linux:**
```bash
cd UCS_Model-main
python3 traffic_prediction_api.py
```

Wait for this message:
```
✅ Model and scalers loaded successfully!
🚀 Starting Traffic Prediction API...
🌐 API will be available at: http://localhost:5000
```

### 2️⃣ **Configure Environment**

Create `.env.local` in the root directory:

```env
FLASK_API_URL=http://localhost:5000
GOOGLE_MAPS_API_KEY=your_api_key_here
```

### 3️⃣ **Start Next.js**

In a **new terminal**:
```bash
npm run dev
```

### 4️⃣ **Test the Integration**

Open in browser:
- **Main App**: http://localhost:3000
- **Test Page**: http://localhost:3000/test-map.html
- **Debug Console**: http://localhost:3000/debug-console.html

---

## 🔍 Troubleshooting Connection Errors

### Error: `ECONNREFUSED` or `fetch failed`

**Cause**: Flask backend is not running

**Fix**:
1. Check if Flask is running in another terminal
2. Test Flask directly: http://localhost:5000/api/health
3. Look for port conflicts (something else using port 5000)

**Check Flask Status:**
```bash
# Windows
netstat -ano | findstr :5000

# Mac/Linux
lsof -i :5000
```

### Error: `Model not loaded`

**Cause**: Model files missing in `UCS_Model-main/models/`

**Required files:**
- `traffic_prediction_model.h5`
- `feature_scaler.pkl`
- `target_scaler.pkl`
- `model_metadata.json`

**Fix**: Ensure all model files are in the `models/` directory

### Error: `API key not configured`

**Fix**: Add Google Maps API key to `.env.local`:
```env
GOOGLE_MAPS_API_KEY=AIza...your_key_here
```

---

## 📊 Verify Everything Works

### Test Flask Backend
```bash
curl http://localhost:5000/api/health
```

Expected response:
```json
{
  "status": "healthy",
  "model_loaded": true,
  "timestamp": "2025-10-25T..."
}
```

### Test Next.js Proxy
```bash
curl http://localhost:3000/api/ucs-model-info
```

### Test in Browser Console
```javascript
fetch('/api/ucs-model-info')
  .then(r => r.json())
  .then(d => console.log('Model Info:', d));
```

---

## 🎯 Quick Test Commands

Run these in your browser console at http://localhost:3000:

### 1. Check Backend Status
```javascript
fetch('http://localhost:5000/api/health')
  .then(r => r.json())
  .then(d => console.log('✅ Flask:', d))
  .catch(e => console.error('❌ Flask offline:', e));
```

### 2. Test Prediction
```javascript
fetch('/api/ucs-predict', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    latitude: 16.5062,
    longitude: 80.6480,
    timestamp: new Date().toISOString()
  })
}).then(r => r.json()).then(console.log);
```

### 3. Test Model Info
```javascript
fetch('/api/ucs-model-info')
  .then(r => r.json())
  .then(console.log);
```

---

## 📝 Development Workflow

### Terminal 1: Flask Backend
```bash
cd UCS_Model-main
python traffic_prediction_api.py
# Keep this running
```

### Terminal 2: Next.js Frontend
```bash
npm run dev
# Keep this running
```

### Terminal 3: Testing
```bash
# Run tests, check logs, etc.
curl http://localhost:5000/api/health
curl http://localhost:3000/api/ucs-model-info
```

---

## 🚨 Common Issues

| Issue | Solution |
|-------|----------|
| `ECONNREFUSED` | Flask not running - run `start-flask.bat` |
| Port 5000 in use | Kill process or change port in Flask & `.env.local` |
| Model files missing | Download/copy model files to `UCS_Model-main/models/` |
| Prediction returns 0 | Check Flask logs for TensorFlow errors |
| Map not loading | Verify Google Maps API key in `.env.local` |

---

## ✅ Success Checklist

Before testing your app, verify:

- [ ] Flask backend running on port 5000
- [ ] Flask returns healthy status
- [ ] Next.js running on port 3000
- [ ] `.env.local` configured with Flask URL
- [ ] Google Maps API key configured
- [ ] Model files present in `models/` directory
- [ ] No console errors in browser DevTools
- [ ] API calls return 200 status codes

---

## 💡 Pro Tips

1. **Keep Flask logs visible** - Watch for prediction requests
2. **Use Debug Console** - http://localhost:3000/debug-console.html
3. **Monitor Network Tab** - Check API response times
4. **Test incrementally** - Start with health check, then predictions
5. **Check both backends** - Ensure Flask AND Next.js are running

---

Need help? Check the full documentation in `UCS_MODEL_INTEGRATION.md`
