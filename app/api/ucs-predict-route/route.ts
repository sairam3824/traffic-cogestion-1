import { NextResponse } from "next/server"

const FLASK_API_URL = process.env.FLASK_API_URL || "http://localhost:5000"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { waypoints } = body

    if (!waypoints || !Array.isArray(waypoints) || waypoints.length < 2) {
      return NextResponse.json(
        { success: false, error: "At least 2 waypoints required" },
        { status: 400 }
      )
    }

    // Call Flask API
    const response = await fetch(`${FLASK_API_URL}/api/predict_route`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ waypoints }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: "Unknown error" }))
      return NextResponse.json(
        { success: false, error: errorData.error || "Flask API error" },
        { status: response.status }
      )
    }

    const data = await response.json()
    
    return NextResponse.json({
      success: true,
      data: {
        route_predictions: data.route_predictions,
        summary: data.summary,
      },
    })
  } catch (error) {
    console.error("[UCS Model] Error calling Flask API for route:", error)
    return NextResponse.json(
      { success: false, error: "Failed to connect to prediction service" },
      { status: 500 }
    )
  }
}
