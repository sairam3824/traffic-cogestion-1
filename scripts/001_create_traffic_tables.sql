-- Create traffic_segments table
CREATE TABLE IF NOT EXISTS public.traffic_segments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  segment_name TEXT NOT NULL,
  latitude FLOAT NOT NULL,
  longitude FLOAT NOT NULL,
  road_type TEXT NOT NULL, -- 'highway', 'arterial', 'local'
  length_km FLOAT NOT NULL,
  speed_limit INT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create traffic_observations table (historical data)
CREATE TABLE IF NOT EXISTS public.traffic_observations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  segment_id UUID NOT NULL REFERENCES public.traffic_segments(id) ON DELETE CASCADE,
  timestamp TIMESTAMP NOT NULL,
  speed_kmh FLOAT NOT NULL,
  volume_vehicles INT NOT NULL,
  occupancy_percent FLOAT NOT NULL,
  congestion_level TEXT NOT NULL, -- 'free', 'moderate', 'heavy', 'severe'
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create weather_data table
CREATE TABLE IF NOT EXISTS public.weather_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp TIMESTAMP NOT NULL,
  temperature_celsius FLOAT NOT NULL,
  precipitation_mm FLOAT NOT NULL,
  visibility_km FLOAT NOT NULL,
  wind_speed_kmh FLOAT NOT NULL,
  weather_condition TEXT NOT NULL, -- 'clear', 'rainy', 'foggy', 'snowy'
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create events table (accidents, construction, etc.)
CREATE TABLE IF NOT EXISTS public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  segment_id UUID NOT NULL REFERENCES public.traffic_segments(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL, -- 'accident', 'construction', 'event', 'incident'
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP,
  severity TEXT NOT NULL, -- 'low', 'medium', 'high'
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create predictions table
CREATE TABLE IF NOT EXISTS public.predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  segment_id UUID NOT NULL REFERENCES public.traffic_segments(id) ON DELETE CASCADE,
  prediction_timestamp TIMESTAMP NOT NULL,
  predicted_speed_kmh FLOAT NOT NULL,
  predicted_volume INT NOT NULL,
  predicted_congestion_level TEXT NOT NULL,
  model_type TEXT NOT NULL, -- 'lstm', 'gnn', 'cnn_gru'
  confidence_score FLOAT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create model_performance table
CREATE TABLE IF NOT EXISTS public.model_performance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_type TEXT NOT NULL,
  metric_name TEXT NOT NULL, -- 'rmse', 'mae', 'mape'
  metric_value FLOAT NOT NULL,
  evaluation_date TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create alerts table
CREATE TABLE IF NOT EXISTS public.alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  segment_id UUID NOT NULL REFERENCES public.traffic_segments(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL, -- 'congestion', 'incident', 'weather'
  severity TEXT NOT NULL, -- 'low', 'medium', 'high', 'critical'
  message TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  resolved_at TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_traffic_observations_segment_timestamp 
  ON public.traffic_observations(segment_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_traffic_observations_timestamp 
  ON public.traffic_observations(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_predictions_segment_timestamp 
  ON public.predictions(segment_id, prediction_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_weather_data_timestamp 
  ON public.weather_data(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_events_segment_time 
  ON public.events(segment_id, start_time DESC);
CREATE INDEX IF NOT EXISTS idx_alerts_segment_active 
  ON public.alerts(segment_id, is_active);
