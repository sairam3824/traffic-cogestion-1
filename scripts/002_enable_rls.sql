-- Enable Row Level Security on all tables
ALTER TABLE public.traffic_segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.traffic_observations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weather_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.model_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access (no authentication required for data access)
-- Traffic segments - public read
CREATE POLICY "traffic_segments_select_public" ON public.traffic_segments
  FOR SELECT USING (true);

-- Traffic observations - public read
CREATE POLICY "traffic_observations_select_public" ON public.traffic_observations
  FOR SELECT USING (true);

-- Weather data - public read
CREATE POLICY "weather_data_select_public" ON public.weather_data
  FOR SELECT USING (true);

-- Events - public read
CREATE POLICY "events_select_public" ON public.events
  FOR SELECT USING (true);

-- Predictions - public read
CREATE POLICY "predictions_select_public" ON public.predictions
  FOR SELECT USING (true);

-- Model performance - public read
CREATE POLICY "model_performance_select_public" ON public.model_performance
  FOR SELECT USING (true);

-- Alerts - public read
CREATE POLICY "alerts_select_public" ON public.alerts
  FOR SELECT USING (true);

-- Service role can insert/update/delete (for backend operations)
CREATE POLICY "traffic_segments_insert_service" ON public.traffic_segments
  FOR INSERT WITH CHECK (true);
CREATE POLICY "traffic_observations_insert_service" ON public.traffic_observations
  FOR INSERT WITH CHECK (true);
CREATE POLICY "weather_data_insert_service" ON public.weather_data
  FOR INSERT WITH CHECK (true);
CREATE POLICY "events_insert_service" ON public.events
  FOR INSERT WITH CHECK (true);
CREATE POLICY "predictions_insert_service" ON public.predictions
  FOR INSERT WITH CHECK (true);
CREATE POLICY "model_performance_insert_service" ON public.model_performance
  FOR INSERT WITH CHECK (true);
CREATE POLICY "alerts_insert_service" ON public.alerts
  FOR INSERT WITH CHECK (true);
