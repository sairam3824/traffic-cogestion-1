import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase.from("traffic_segments").select("*").order("segment_name")

    if (error) throw error

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error("Error fetching segments:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch segments" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const body = await request.json()

    const { data, error } = await supabase.from("traffic_segments").insert([body]).select().single()

    if (error) throw error

    return NextResponse.json({ success: true, data }, { status: 201 })
  } catch (error) {
    console.error("Error creating segment:", error)
    return NextResponse.json({ success: false, error: "Failed to create segment" }, { status: 500 })
  }
}
