# Create Supabase Table for Search History

## Step 1: Go to Supabase Dashboard
1. Open: https://supabase.com/dashboard/project/acxezffpbglztbmbfczc
2. Click on "SQL Editor" in the left sidebar

## Step 2: Run This SQL
Copy and paste this SQL and click "Run":

```sql
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

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_search_history_user_id 
  ON public.user_search_history(user_id);
CREATE INDEX IF NOT EXISTS idx_user_search_history_last_searched 
  ON public.user_search_history(user_id, last_searched_at DESC);

-- Enable Row Level Security
ALTER TABLE public.user_search_history ENABLE ROW LEVEL SECURITY;

-- Create policies for security
CREATE POLICY "Users can view own search history" ON public.user_search_history
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own search history" ON public.user_search_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own search history" ON public.user_search_history
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own search history" ON public.user_search_history
  FOR DELETE USING (auth.uid() = user_id);
```

## Step 3: Verify Table Creation
After running the SQL, you should see:
- ✅ "Success. No rows returned"
- The table will appear in the "Table Editor" section

## Step 4: Test the Application
Once the table is created, the search history will automatically start using Supabase storage and sync across devices!

## What This Enables:
- 🔄 **Cross-device sync**: Search history syncs across all devices
- 🔒 **Secure**: Each user only sees their own search history
- 📊 **Persistent**: Data survives browser clearing, device changes
- ⚡ **Fast**: Indexed for quick retrieval