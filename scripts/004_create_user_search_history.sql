-- Create user search history table
CREATE TABLE IF NOT EXISTS public.user_search_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  origin_place_id TEXT NOT NULL,
  origin_description TEXT NOT NULL,
  origin_main_text TEXT NOT NULL,
  origin_secondary_text TEXT,
  origin_lat FLOAT NOT NULL,
  origin_lng FLOAT NOT NULL,
  destination_place_id TEXT NOT NULL,
  destination_description TEXT NOT NULL,
  destination_main_text TEXT NOT NULL,
  destination_secondary_text TEXT,
  destination_lat FLOAT NOT NULL,
  destination_lng FLOAT NOT NULL,
  search_count INTEGER DEFAULT 1,
  last_searched_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_user_search_history_user_id 
  ON public.user_search_history(user_id);
CREATE INDEX IF NOT EXISTS idx_user_search_history_last_searched 
  ON public.user_search_history(user_id, last_searched_at DESC);

-- Enable RLS (Row Level Security)
ALTER TABLE public.user_search_history ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to only see their own search history
CREATE POLICY "Users can view own search history" ON public.user_search_history
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own search history" ON public.user_search_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own search history" ON public.user_search_history
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own search history" ON public.user_search_history
  FOR DELETE USING (auth.uid() = user_id);