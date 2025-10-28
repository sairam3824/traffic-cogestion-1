# Environment Variables Setup

Create a `.env.local` file in the root directory with the following variables:

```env
# Flask Backend URL (UCS Model API)
FLASK_API_URL=http://localhost:5000

# Google Maps API Key
GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Getting the API Keys

### Google Maps API Key
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Enable the following APIs:
   - Maps JavaScript API
   - Directions API
   - Places API
   - Geocoding API
3. Create credentials and copy the API key

### Supabase Keys
1. Go to [Supabase Dashboard](https://app.supabase.com/)
2. Select your project
3. Go to Settings → API
4. Copy the Project URL and anon/public key

## Flask Backend Setup

The Flask backend should be running on port 5000 with the UCS model loaded.

Default configuration:
- Host: `localhost`
- Port: `5000`
- Model location: `UCS_Model-main/models/`
