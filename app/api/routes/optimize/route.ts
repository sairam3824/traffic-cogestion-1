import { NextResponse } from "next/server"

const FLASK_API_URL = process.env.FLASK_API_URL || "http://localhost:5001"

interface RouteOptimizationRequest {
  origin: { lat: number; lng: number }
  destination: { lat: number; lng: number }
  departureTime?: string
  preferences?: {
    avoidTolls?: boolean
    avoidHighways?: boolean
    prioritizeTime?: boolean
    prioritizeTraffic?: boolean
  }
}

export async function POST(request: Request) {
  try {
    const body: RouteOptimizationRequest = await request.json()
    const { origin, destination, departureTime, preferences = {} } = body

    if (!origin?.lat || !origin?.lng || !destination?.lat || !destination?.lng) {
      return NextResponse.json(
        { success: false, error: "Origin and destination coordinates required" },
        { status: 400 }
      )
    }

    const apiKey = process.env.GOOGLE_MAPS_API_KEY
    if (!apiKey) {
      return NextResponse.json({ success: false, error: "API key not configured" }, { status: 500 })
    }

    // Get multiple route alternatives from Google Directions
    const directionsUrl = new URL("https://maps.googleapis.com/maps/api/directions/json")
    directionsUrl.searchParams.set("origin", `${origin.lat},${origin.lng}`)
    directionsUrl.searchParams.set("destination", `${destination.lat},${destination.lng}`)
    directionsUrl.searchParams.set("key", apiKey)
    directionsUrl.searchParams.set("alternatives", "true")
    directionsUrl.searchParams.set("traffic_model", "best_guess")
    
    if (departureTime) {
      directionsUrl.searchParams.set("departure_time", Math.floor(new Date(departureTime).getTime() / 1000).toString())
    } else {
      directionsUrl.searchParams.set("departure_time", "now")
    }

    if (preferences.avoidTolls) directionsUrl.searchParams.set("avoid", "tolls")
    if (preferences.avoidHighways) directionsUrl.searchParams.set("avoid", "highways")

    const directionsResponse = await fetch(directionsUrl.toString())
    const directionsData = await directionsResponse.json()

    if (directionsData.status !== "OK") {
      return NextResponse.json(
        { success: false, error: "Failed to get route alternatives" },
        { status: 500 }
      )
    }

    // Analyze each route with UCS model predictions
    const routeAnalysis = await Promise.all(
      directionsData.routes.map(async (route: any, index: number) => {
        const leg = route.legs[0]
        const steps = leg.steps
        
        // Sample key points for traffic analysis
        const samplePoints = []
        const sampleInterval = Math.max(1, Math.floor(steps.length / 8)) // Sample 8 points max
        
        for (let i = 0; i < steps.length; i += sampleInterval) {
          const step = steps[i]
          samplePoints.push({
            lat: step.start_location.lat,
            lng: step.start_location.lng
          })
        }

        // Get traffic predictions for sample points
        let totalTraffic = 0
        let validPredictions = 0
        
        for (const point of samplePoints) {
          try {
            const predictionResponse = await fetch(`${FLASK_API_URL}/api/predict`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                latitude: point.lat,
                longitude: point.lng,
                timestamp: departureTime || new Date().toISOString(),
              }),
              signal: AbortSignal.timeout(3000), // 3 second timeout
            })

            if (predictionResponse.ok) {
              const predictionData = await predictionResponse.json()
              totalTraffic += predictionData.prediction || 50
              validPredictions++
            } else {
              totalTraffic += 50 // Default moderate traffic
              validPredictions++
            }
          } catch (error) {
            totalTraffic += 50 // Fallback
            validPredictions++
          }
        }

        const avgTraffic = validPredictions > 0 ? totalTraffic / validPredictions : 50
        const distanceKm = leg.distance.value / 1000
        const durationMin = leg.duration.value / 60
        const durationInTrafficMin = leg.duration_in_traffic?.value ? leg.duration_in_traffic.value / 60 : durationMin

        // Calculate optimization score (lower is better)
        let score = 0
        
        if (preferences.prioritizeTraffic) {
          score = avgTraffic * 0.7 + (durationInTrafficMin / durationMin) * 30
        } else if (preferences.prioritizeTime) {
          score = durationInTrafficMin * 0.6 + avgTraffic * 0.4
        } else {
          // Balanced scoring
          score = avgTraffic * 0.5 + (durationInTrafficMin / durationMin) * 25 + (distanceKm / 100) * 25
        }

        // Generate recommendations
        let recommendation = ""
        let severity = "info"
        
        if (avgTraffic < 30) {
          recommendation = "Excellent route with light traffic"
          severity = "success"
        } else if (avgTraffic < 50) {
          recommendation = "Good route with moderate traffic"
          severity = "success"
        } else if (avgTraffic < 70) {
          recommendation = "Fair route with heavy traffic - consider alternatives"
          severity = "warning"
        } else {
          recommendation = "Poor route with severe traffic - strongly recommend alternative"
          severity = "error"
        }

        return {
          routeIndex: index,
          score,
          avgTraffic,
          distanceKm,
          durationMin,
          durationInTrafficMin,
          trafficDelayMin: durationInTrafficMin - durationMin,
          recommendation,
          severity,
          polyline: route.overview_polyline.points,
          bounds: route.bounds,
        }
      })
    )

    // Sort routes by score (best first)
    routeAnalysis.sort((a, b) => a.score - b.score)
    
    // Generate time-based suggestions
    const currentHour = new Date().getHours()
    const timeSuggestions = []
    
    if (routeAnalysis[0].avgTraffic > 60) {
      if (currentHour >= 7 && currentHour <= 9) {
        timeSuggestions.push("Consider leaving before 7 AM or after 10 AM to avoid morning rush")
      } else if (currentHour >= 17 && currentHour <= 19) {
        timeSuggestions.push("Consider leaving before 5 PM or after 8 PM to avoid evening rush")
      } else {
        timeSuggestions.push("Traffic is unusually heavy - consider postponing travel if possible")
      }
    }

    // Generate route-specific suggestions
    const routeSuggestions = []
    
    if (routeAnalysis.length > 1) {
      const bestRoute = routeAnalysis[0]
      const worstRoute = routeAnalysis[routeAnalysis.length - 1]
      
      if (worstRoute.avgTraffic - bestRoute.avgTraffic > 20) {
        routeSuggestions.push(`Route ${bestRoute.routeIndex + 1} has ${(worstRoute.avgTraffic - bestRoute.avgTraffic).toFixed(0)}% less traffic than Route ${worstRoute.routeIndex + 1}`)
      }
      
      if (bestRoute.trafficDelayMin > 15) {
        routeSuggestions.push(`Even the best route has ${bestRoute.trafficDelayMin.toFixed(0)} minutes of traffic delay`)
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        routes: routeAnalysis,
        recommendedRouteIndex: routeAnalysis[0].routeIndex,
        timeSuggestions,
        routeSuggestions,
        analysisTimestamp: new Date().toISOString(),
        totalRoutesAnalyzed: routeAnalysis.length,
      },
    })
  } catch (error) {
    console.error("[Route Optimization] Error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to optimize routes" },
      { status: 500 }
    )
  }
}