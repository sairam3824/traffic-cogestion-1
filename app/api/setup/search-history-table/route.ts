import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST() {
  try {
    const supabase = await createClient()
    
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is admin
    if (user.email !== 'admin@traffic.com') {
      return NextResponse.json({ success: false, error: "Admin access required" }, { status: 403 })
    }

    // Create the table using raw SQL
    const createTableSQL = `
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
    `

    const { error } = await supabase.rpc('exec_sql', { sql: createTableSQL })

    if (error) {
      console.error("Error creating table:", error)
      return NextResponse.json({ 
        success: false, 
        error: "Failed to create table. Please create it manually in Supabase dashboard.",
        sql: createTableSQL
      }, { status: 500 })
    }

    // Create policies
    const policiesSQL = `
      -- Drop existing policies if they exist
      DROP POLICY IF EXISTS "Users can view own search history" ON public.user_search_history;
      DROP POLICY IF EXISTS "Users can insert own search history" ON public.user_search_history;
      DROP POLICY IF EXISTS "Users can update own search history" ON public.user_search_history;
      DROP POLICY IF EXISTS "Users can delete own search history" ON public.user_search_history;

      -- Create new policies
      CREATE POLICY "Users can view own search history" ON public.user_search_history
        FOR SELECT USING (auth.uid() = user_id);

      CREATE POLICY "Users can insert own search history" ON public.user_search_history
        FOR INSERT WITH CHECK (auth.uid() = user_id);

      CREATE POLICY "Users can update own search history" ON public.user_search_history
        FOR UPDATE USING (auth.uid() = user_id);

      CREATE POLICY "Users can delete own search history" ON public.user_search_history
        FOR DELETE USING (auth.uid() = user_id);
    `

    const { error: policyError } = await supabase.rpc('exec_sql', { sql: policiesSQL })

    if (policyError) {
      console.error("Error creating policies:", policyError)
      // Don't fail if policies can't be created, table creation is more important
    }

    return NextResponse.json({ 
      success: true, 
      message: "Search history table created successfully!" 
    })

  } catch (error) {
    console.error("Error in table creation:", error)
    return NextResponse.json({ 
      success: false, 
      error: "Internal server error",
      message: "Please create the table manually using the SQL in the setup guide"
    }, { status: 500 })
  }
}