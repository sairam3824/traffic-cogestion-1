import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = await createClient()
    
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    // Fetch user's search history
    const { data, error } = await supabase
      .from("user_search_history")
      .select("*")
      .eq("user_id", user.id)
      .order("last_searched_at", { ascending: false })
      .limit(10)

    if (error) {
      console.error("Error fetching search history:", error)
      // If table doesn't exist, return empty array instead of error
      if (error.code === 'PGRST116' || error.code === 'PGRST205' || 
          error.message?.includes('does not exist') || 
          error.message?.includes('user_search_history') ||
          error.message?.includes('schema cache')) {
        console.log('Search history table not found, returning empty array')
        return NextResponse.json({ 
          success: true, 
          data: [], 
          message: "Table not created yet. Please create the user_search_history table in Supabase." 
        })
      }
      return NextResponse.json({ success: false, error: "Failed to fetch search history" }, { status: 500 })
    }

    // Transform data to match the frontend format
    const searchHistory = data.map(item => ({
      id: `${item.origin_place_id}-${item.destination_place_id}`,
      origin: {
        place_id: item.origin_place_id,
        description: item.origin_description,
        main_text: item.origin_main_text,
        secondary_text: item.origin_secondary_text,
        lat: item.origin_lat,
        lng: item.origin_lng
      },
      destination: {
        place_id: item.destination_place_id,
        description: item.destination_description,
        main_text: item.destination_main_text,
        secondary_text: item.destination_secondary_text,
        lat: item.destination_lat,
        lng: item.destination_lng
      },
      timestamp: new Date(item.last_searched_at).getTime(),
      searchCount: item.search_count
    }))

    return NextResponse.json({ success: true, data: searchHistory })
  } catch (error) {
    console.error("Error in search history GET:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { origin, destination } = body

    if (!origin || !destination) {
      return NextResponse.json({ success: false, error: "Origin and destination are required" }, { status: 400 })
    }

    // Check if this search already exists
    const { data: existing, error: existingError } = await supabase
      .from("user_search_history")
      .select("*")
      .eq("user_id", user.id)
      .eq("origin_place_id", origin.place_id)
      .eq("destination_place_id", destination.place_id)
      .single()

    if (existingError && existingError.code !== 'PGRST116') { // PGRST116 = no rows found
      console.error("Error checking existing search:", existingError)
      return NextResponse.json({ success: false, error: "Database error" }, { status: 500 })
    }

    if (existing) {
      // Update existing search
      const { data, error } = await supabase
        .from("user_search_history")
        .update({
          search_count: existing.search_count + 1,
          last_searched_at: new Date().toISOString()
        })
        .eq("id", existing.id)
        .select()
        .single()

      if (error) {
        console.error("Error updating search history:", error)
        // If table doesn't exist, return success but don't save
        if (error.message?.includes('does not exist') || error.message?.includes('user_search_history')) {
          return NextResponse.json({ success: true, data: null, message: "Table not created yet" })
        }
        return NextResponse.json({ success: false, error: "Failed to update search history" }, { status: 500 })
      }

      return NextResponse.json({ success: true, data })
    } else {
      // Create new search history entry
      const { data, error } = await supabase
        .from("user_search_history")
        .insert({
          user_id: user.id,
          origin_place_id: origin.place_id,
          origin_description: origin.description,
          origin_main_text: origin.main_text,
          origin_secondary_text: origin.secondary_text || null,
          origin_lat: origin.lat,
          origin_lng: origin.lng,
          destination_place_id: destination.place_id,
          destination_description: destination.description,
          destination_main_text: destination.main_text,
          destination_secondary_text: destination.secondary_text || null,
          destination_lat: destination.lat,
          destination_lng: destination.lng,
          search_count: 1,
          last_searched_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) {
        console.error("Error creating search history:", error)
        // If table doesn't exist, return success but indicate table needs creation
        if (error.code === 'PGRST205' || 
            error.message?.includes('does not exist') || 
            error.message?.includes('user_search_history') ||
            error.message?.includes('schema cache')) {
          return NextResponse.json({ 
            success: false, 
            error: "Table not found", 
            message: "Please create the user_search_history table in Supabase dashboard" 
          }, { status: 404 })
        }
        return NextResponse.json({ success: false, error: "Failed to save search history" }, { status: 500 })
      }

      return NextResponse.json({ success: true, data }, { status: 201 })
    }
  } catch (error) {
    console.error("Error in search history POST:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const supabase = await createClient()
    
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const searchId = searchParams.get("id")

    if (searchId === "all") {
      // Delete all search history for the user
      const { error } = await supabase
        .from("user_search_history")
        .delete()
        .eq("user_id", user.id)

      if (error) {
        console.error("Error deleting all search history:", error)
        return NextResponse.json({ success: false, error: "Failed to delete search history" }, { status: 500 })
      }

      return NextResponse.json({ success: true, message: "All search history deleted" })
    } else if (searchId) {
      // Delete specific search history item
      const [originPlaceId, destinationPlaceId] = searchId.split("-")
      
      const { error } = await supabase
        .from("user_search_history")
        .delete()
        .eq("user_id", user.id)
        .eq("origin_place_id", originPlaceId)
        .eq("destination_place_id", destinationPlaceId)

      if (error) {
        console.error("Error deleting search history item:", error)
        return NextResponse.json({ success: false, error: "Failed to delete search history item" }, { status: 500 })
      }

      return NextResponse.json({ success: true, message: "Search history item deleted" })
    } else {
      return NextResponse.json({ success: false, error: "Search ID is required" }, { status: 400 })
    }
  } catch (error) {
    console.error("Error in search history DELETE:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}