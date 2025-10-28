-- Create routes table to store user route searches and history
CREATE TABLE IF NOT EXISTS routes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  origin_name TEXT NOT NULL,
  origin_lat DOUBLE PRECISION NOT NULL,
  origin_lng DOUBLE PRECISION NOT NULL,
  destination_name TEXT NOT NULL,
  destination_lat DOUBLE PRECISION NOT NULL,
  destination_lng DOUBLE PRECISION NOT NULL,
  distance_km DOUBLE PRECISION,
  duration_minutes INTEGER,
  route_polyline TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create route predictions table to store congestion forecasts for routes
CREATE TABLE IF NOT EXISTS route_predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  route_id UUID REFERENCES routes(id) ON DELETE CASCADE,
  prediction_time TIMESTAMP NOT NULL,
  predicted_duration_minutes INTEGER,
  predicted_congestion_level TEXT,
  average_speed_kmh DOUBLE PRECISION,
  model_type TEXT,
  confidence_score DOUBLE PRECISION,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_routes_created_at ON routes(created_at DESC);
CREATE INDEX idx_route_predictions_route_id ON route_predictions(route_id);
CREATE INDEX idx_route_predictions_prediction_time ON route_predictions(prediction_time);

-- Enable RLS
ALTER TABLE routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE route_predictions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "routes_select_policy" ON routes FOR SELECT USING (true);
CREATE POLICY "routes_insert_policy" ON routes FOR INSERT WITH CHECK (true);
CREATE POLICY "route_predictions_select_policy" ON route_predictions FOR SELECT USING (true);
CREATE POLICY "route_predictions_insert_policy" ON route_predictions FOR INSERT WITH CHECK (true);
