import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const segmentId = searchParams.get("segmentId")
    const modelType = searchParams.get("modelType")
    const limit = Number.parseInt(searchParams.get("limit") || "24")

    const supabase = await createClient()

    let query = supabase.from("predictions").select("*").order("prediction_timestamp", { ascending: false })

    if (segmentId) {
      query = query.eq("segment_id", segmentId)
    }

    if (modelType) {
      query = query.eq("model_type", modelType)
    }

    const { data, error } = await query.limit(limit)

    if (error) throw error

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error("Error fetching predictions:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch predictions" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const body = await request.json()

    const { data, error } = await supabase.from("predictions").insert([body]).select().single()

    if (error) throw error

    return NextResponse.json({ success: true, data }, { status: 201 })
  } catch (error) {
    console.error("Error creating prediction:", error)
    return NextResponse.json({ success: false, error: "Failed to create prediction" }, { status: 500 })
  }
}
