import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const segmentId = searchParams.get("segmentId")
    const limit = Number.parseInt(searchParams.get("limit") || "100")

    const supabase = await createClient()

    let query = supabase.from("traffic_observations").select("*").order("timestamp", { ascending: false })

    if (segmentId) {
      query = query.eq("segment_id", segmentId)
    }

    const { data, error } = await query.limit(limit)

    if (error) throw error

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error("Error fetching observations:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch observations" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const body = await request.json()

    const { data, error } = await supabase.from("traffic_observations").insert([body]).select().single()

    if (error) throw error

    return NextResponse.json({ success: true, data }, { status: 201 })
  } catch (error) {
    console.error("Error creating observation:", error)
    return NextResponse.json({ success: false, error: "Failed to create observation" }, { status: 500 })
  }
}
