import { NextResponse } from "next/server"

const FLASK_API_URL = process.env.FLASK_API_URL || "http://localhost:5000"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { latitude, longitude, timestamp } = body

    if (!latitude || !longitude || !timestamp) {
      return NextResponse.json(
        { success: false, error: "Missing required fields: latitude, longitude, timestamp" },
        { status: 400 }
      )
    }

    // Call Flask API
    const response = await fetch(`${FLASK_API_URL}/api/predict`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        latitude,
        longitude,
        timestamp,
      }),
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
        prediction: data.prediction,
        confidence: typeof data.confidence === 'string' ? 
          (data.confidence === 'high' ? 0.9 : data.confidence === 'medium' ? 0.7 : 0.5) : 
          data.confidence,
        timestamp: data.timestamp,
        location: data.location,
        traffic_level: data.prediction < 30 ? 'low' : data.prediction < 70 ? 'medium' : 'high'
      },
    })
  } catch (error) {
    console.error("[UCS Model] Error calling Flask API:", error)
    return NextResponse.json(
      { success: false, error: "Failed to connect to prediction service" },
      { status: 500 }
    )
  }
}
