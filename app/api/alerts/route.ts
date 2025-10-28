import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const segmentId = searchParams.get("segmentId")
    const isActive = searchParams.get("isActive") === "true"

    const supabase = await createClient()

    let query = supabase.from("alerts").select("*").order("created_at", { ascending: false })

    if (segmentId) {
      query = query.eq("segment_id", segmentId)
    }

    if (isActive) {
      query = query.eq("is_active", true)
    }

    const { data, error } = await query.limit(100)

    if (error) throw error

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error("Error fetching alerts:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch alerts" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const body = await request.json()

    const { data, error } = await supabase.from("alerts").insert([body]).select().single()

    if (error) throw error

    return NextResponse.json({ success: true, data }, { status: 201 })
  } catch (error) {
    console.error("Error creating alert:", error)
    return NextResponse.json({ success: false, error: "Failed to create alert" }, { status: 500 })
  }
}
