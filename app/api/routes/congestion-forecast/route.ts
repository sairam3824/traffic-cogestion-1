import { NextResponse } from "next/server"
import { getRoutePredictions, createRoutePrediction, getRouteById } from "@/lib/db/routes"

const FLASK_API_URL = process.env.FLASK_API_URL || "http://localhost:5000"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { route_id, prediction_time } = body

    if (!route_id || !prediction_time) {
      return NextResponse.json({ success: false, error: "Missing parameters" }, { status: 400 })
    }

    // Get existing predictions for this route
    const existingPredictions = await getRoutePredictions(route_id)

    // Check if prediction already exists for this time
    const existingPrediction = existingPredictions.find(
      (p) => new Date(p.prediction_time).getTime() === new Date(prediction_time).getTime(),
    )

    if (existingPrediction) {
      return NextResponse.json({ success: true, data: existingPrediction })
    }

    // Get route details
    const route = await getRouteById(route_id)
    if (!route) {
      return NextResponse.json({ success: false, error: "Route not found" }, { status: 404 })
    }

    // Call Flask UCS Model API for real prediction
    // Sample 3 points along the route for more accurate prediction
    let congestionLevel = "low"
    let avgSpeed = 60
    let duration = route.duration_minutes || 30
    let confidence = 0.85

    try {
      // Sample origin, midpoint, and destination
      const samplePoints = [
        { lat: route.origin_lat, lng: route.origin_lng },
        { 
          lat: (route.origin_lat + route.destination_lat) / 2, 
          lng: (route.origin_lng + route.destination_lng) / 2 
        },
        { lat: route.destination_lat, lng: route.destination_lng },
      ]

      const predictions: number[] = []
      
      // Get predictions for each sample point
      for (const point of samplePoints) {
        try {
          const flaskResponse = await fetch(`${FLASK_API_URL}/api/predict`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              latitude: point.lat,
              longitude: point.lng,
              timestamp: prediction_time,
            }),
            signal: AbortSignal.timeout(3000), // 3 second timeout per call
          })

          if (flaskResponse.ok) {
            const flaskData = await flaskResponse.json()
            predictions.push(flaskData.prediction)
          }
        } catch {
          // Skip failed predictions
        }
      }

      if (predictions.length > 0) {
        // Average the predictions
        const trafficPrediction = predictions.reduce((a, b) => a + b, 0) / predictions.length

        // Convert traffic prediction to congestion level and speed
        if (trafficPrediction >= 55) {
          congestionLevel = "high"
          avgSpeed = Math.max(15, Math.round(60 - trafficPrediction * 0.6))
          duration = Math.round(route.duration_minutes * (1.5 + (trafficPrediction - 55) / 100))
        } else if (trafficPrediction >= 35) {
          congestionLevel = "medium"
          avgSpeed = Math.max(30, Math.round(60 - trafficPrediction * 0.5))
          duration = Math.round(route.duration_minutes * (1.2 + (trafficPrediction - 35) / 200))
        } else {
          congestionLevel = "low"
          avgSpeed = Math.max(45, Math.round(65 - trafficPrediction * 0.3))
          duration = Math.round(route.duration_minutes * (0.9 + trafficPrediction / 200))
        }
        
        confidence = 0.92 // Higher confidence for model predictions
      }
    } catch (flaskError) {
      console.warn("Flask API unavailable, using time-based fallback:", flaskError)
      
      // Fallback: time-based prediction if Flask is unavailable
      const predictionDate = new Date(prediction_time)
      const hour = predictionDate.getHours()

      if ((hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 19)) {
        congestionLevel = "high"
        avgSpeed = 30
        duration = Math.round(route.duration_minutes * 1.6)
      } else if ((hour >= 10 && hour <= 16) || (hour >= 20 && hour <= 23)) {
        congestionLevel = "medium"
        avgSpeed = 45
        duration = Math.round(route.duration_minutes * 1.2)
      }
      
      confidence = 0.65 // Lower confidence for fallback
    }

    const prediction = {
      route_id,
      prediction_time,
      predicted_duration_minutes: duration,
      predicted_congestion_level: congestionLevel,
      average_speed_kmh: Math.round(avgSpeed),
      model_type: "ucs-ai",
      confidence_score: confidence,
    }

    const savedPrediction = await createRoutePrediction(prediction)

    return NextResponse.json({ success: true, data: savedPrediction })
  } catch (error) {
    console.error("Error generating congestion forecast:", error)
    return NextResponse.json({ success: false, error: "Failed to generate forecast" }, { status: 500 })
  }
}
