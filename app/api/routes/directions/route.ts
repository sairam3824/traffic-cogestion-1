import { NextResponse } from "next/server"
import { createRoute } from "@/lib/db/routes"

const FLASK_API_URL = process.env.FLASK_API_URL || "http://localhost:5000"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { origin_lat, origin_lng, destination_lat, destination_lng, origin_name, destination_name } = body

    if (!origin_lat || !origin_lng || !destination_lat || !destination_lng) {
      return NextResponse.json({ success: false, error: "Missing coordinates" }, { status: 400 })
    }

    const apiKey = process.env.GOOGLE_MAPS_API_KEY
    if (!apiKey) {
      return NextResponse.json({ success: false, error: "API key not configured" }, { status: 500 })
    }

    // Get directions from Google Directions API
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/directions/json?origin=${origin_lat},${origin_lng}&destination=${destination_lat},${destination_lng}&key=${apiKey}&traffic_model=best_guess&departure_time=now`,
    )

    const contentType = response.headers.get("content-type")
    if (!contentType?.includes("application/json")) {
      console.error("[v0] Non-JSON response from Directions API - likely rate limited")
      return NextResponse.json(
        { success: false, error: "Service temporarily unavailable. Please try again in a moment." },
        { status: 429 },
      )
    }

    const data = await response.json()

    if (data.status === "OVER_QUERY_LIMIT") {
      console.error("[v0] Google Maps Directions API rate limit exceeded")
      return NextResponse.json(
        { success: false, error: "Too many requests. Please wait a moment and try again." },
        { status: 429 },
      )
    }

    if (data.status !== "OK") {
      throw new Error(data.error_message || "Directions API error")
    }

    const route = data.routes[0]
    const leg = route.legs[0]

    const extractedOriginName = leg.start_address || origin_name
    const extractedDestinationName = leg.end_address || destination_name

    if (!extractedOriginName || !extractedDestinationName) {
      console.error("[v0] Missing location names in directions response")
      return NextResponse.json(
        { success: false, error: "Could not determine location names from route" },
        { status: 400 },
      )
    }

    // Extract polyline and route details
    const routeData = {
      origin_name: extractedOriginName,
      origin_lat,
      origin_lng,
      destination_name: extractedDestinationName,
      destination_lat,
      destination_lng,
      distance_km: leg.distance.value / 1000,
      duration_minutes: Math.round(leg.duration.value / 60),
      duration_in_traffic_minutes: leg.duration_in_traffic ? Math.round(leg.duration_in_traffic.value / 60) : Math.round(leg.duration.value / 60),
      route_polyline: route.overview_polyline.points,
      traffic_density: leg.duration_in_traffic && leg.duration.value ? (leg.duration_in_traffic.value / leg.duration.value > 1.5 ? 'high' : (leg.duration_in_traffic.value / leg.duration.value > 1.2 ? 'medium' : 'low')) : 'unknown'
    }

    const requiredFields = [
      "origin_name",
      "destination_name",
      "origin_lat",
      "origin_lng",
      "destination_lat",
      "destination_lng",
    ]
    const missingFields = requiredFields.filter((field) => !routeData[field as keyof typeof routeData])

    if (missingFields.length > 0) {
      console.error("[v0] Missing required fields:", missingFields)
      return NextResponse.json({ success: false, error: "Invalid route data" }, { status: 400 })
    }

    // Save route to database
    // Only insert columns that actually exist in the Supabase `routes` table
    const { traffic_density, duration_in_traffic_minutes, ...dbInsert } = routeData as any
    const savedRoute = await createRoute(dbInsert)

    // Calculate overall congestion level
    const congestion_level = leg.duration_in_traffic && leg.duration.value 
      ? Math.min(1, Math.max(0, (leg.duration_in_traffic.value - leg.duration.value) / leg.duration.value))
      : 0

    // Enhance steps with UCS model predictions for traffic density
    // Strategy: Sample key steps for ML prediction, use intelligent fallback for others
    
    // First, try to get a few key predictions from Flask to assess current traffic
    const sampleIndices = [0, Math.floor(leg.steps.length / 3), Math.floor(2 * leg.steps.length / 3), leg.steps.length - 1]
    const flaskPredictions = new Map<number, 'low' | 'medium' | 'high'>()
    
    // Try Flask API for sample steps only (to avoid overwhelming the service)
    await Promise.allSettled(
      sampleIndices.map(async (index) => {
        if (index >= leg.steps.length) return
        const step = leg.steps[index]
        try {
          const flaskResponse = await fetch(`${FLASK_API_URL}/api/predict`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              latitude: step.end_location.lat,
              longitude: step.end_location.lng,
              timestamp: new Date().toISOString(),
            }),
            signal: AbortSignal.timeout(2000), // 2 second timeout
          })

          if (flaskResponse.ok) {
            const flaskData = await flaskResponse.json()
            const trafficPrediction = flaskData.prediction // 0-100 scale
            
            let density: 'low' | 'medium' | 'high'
            // Adjusted thresholds to create better distribution
            if (trafficPrediction >= 55) {
              density = 'high'
            } else if (trafficPrediction >= 35) {
              density = 'medium'
            } else {
              density = 'low'
            }
            flaskPredictions.set(index, density)
          }
        } catch (error) {
          // Silent fail - will use fallback
        }
      })
    )

    // Determine base traffic from Google's overall route assessment
    const baseTraffic = routeData.traffic_density as 'low' | 'medium' | 'high' | 'unknown'
    
    // Now process all steps with smart prioritization
    const enhancedSteps = leg.steps.map((step: any, index: number) => {
      let traffic_density: 'low' | 'medium' | 'high' | 'unknown' = baseTraffic
      
      // Priority 1: Use Google's duration_in_traffic data (most accurate)
      if (step.duration_in_traffic && step.duration.value) {
        const ratio = step.duration_in_traffic.value / step.duration.value
        traffic_density = ratio > 1.4 ? 'high' : (ratio > 1.15 ? 'medium' : 'low')
      }
      // Priority 2: Use Flask ML prediction if available AND it differs significantly from base
      else if (flaskPredictions.has(index)) {
        const flaskPrediction = flaskPredictions.get(index)!
        // Only override if Flask shows significantly different from Google's base
        if (baseTraffic === 'low' && flaskPrediction === 'high') {
          traffic_density = 'medium' // Moderate the difference
        } else if (baseTraffic === 'high' && flaskPrediction === 'low') {
          traffic_density = 'medium' // Moderate the difference
        } else {
          traffic_density = flaskPrediction
        }
      }
      // Priority 3: Add some variation based on road characteristics
      else {
        // Highways and major roads (long distance segments) tend to have better flow
        if (step.distance.value > 5000) { // > 5km
          if (traffic_density === 'high') traffic_density = 'medium'
        }
        // City streets (short segments) might have more congestion
        else if (step.distance.value < 500) { // < 0.5km
          if (traffic_density === 'low') traffic_density = 'medium'
        }
      }

      return {
        instruction: step.html_instructions,
        distance_km: step.distance.value / 1000,
        duration_minutes: Math.round(step.duration.value / 60),
        traffic_density,
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        ...savedRoute,
        traffic_density: routeData.traffic_density,
        congestion_level,
        steps: enhancedSteps,
      },
    })
  } catch (error) {
    console.error("[v0] Error getting directions:", error)
    return NextResponse.json({ success: false, error: "Failed to get directions. Please try again." }, { status: 500 })
  }
}
