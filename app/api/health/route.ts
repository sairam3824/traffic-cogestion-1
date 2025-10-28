import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = await createClient()

    // Check database connection
    const { data, error } = await supabase.from("traffic_segments").select("count", { count: "exact" }).limit(1)

    if (error) {
      return NextResponse.json(
        {
          status: "unhealthy",
          timestamp: new Date().toISOString(),
          checks: {
            database: "failed",
            error: error.message,
          },
        },
        { status: 503 },
      )
    }

    return NextResponse.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      checks: {
        database: "ok",
        api: "ok",
      },
      version: "1.0.0",
    })
  } catch (error) {
    console.error("Health check error:", error)
    return NextResponse.json(
      {
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        error: "Internal server error",
      },
      { status: 503 },
    )
  }
}
