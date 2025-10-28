import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get("q")

    if (!query || query.length < 2) {
      return NextResponse.json({ success: false, error: "Query too short" }, { status: 400 })
    }

    const apiKey = process.env.GOOGLE_MAPS_API_KEY
    if (!apiKey) {
      return NextResponse.json({ success: false, error: "API key not configured" }, { status: 500 })
    }

    // Use Google Places API for location search
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(query)}&components=country:in&key=${apiKey}`,
    )

    const contentType = response.headers.get("content-type")
    if (!contentType?.includes("application/json")) {
      console.error("[v0] Non-JSON response from Places API - likely rate limited")
      return NextResponse.json(
        { success: false, error: "Service temporarily unavailable. Please try again in a moment." },
        { status: 429 },
      )
    }

    const data = await response.json()

    if (data.status === "OVER_QUERY_LIMIT") {
      console.error("[v0] Google Maps API rate limit exceeded")
      return NextResponse.json(
        { success: false, error: "Too many requests. Please wait a moment and try again." },
        { status: 429 },
      )
    }

    if (!response.ok || data.status !== "OK") {
      throw new Error(data.error_message || "Places API error")
    }

    // Get place details for each prediction
    const predictions = await Promise.all(
      data.predictions.slice(0, 5).map(async (prediction: any) => {
        try {
          const detailsResponse = await fetch(
            `https://maps.googleapis.com/maps/api/place/details/json?place_id=${prediction.place_id}&fields=geometry,formatted_address&key=${apiKey}`,
          )
          const detailsData = await detailsResponse.json()

          return {
            place_id: prediction.place_id,
            description: prediction.description,
            main_text:
              prediction?.structured_formatting?.main_text ??
              (typeof prediction.description === "string" ? prediction.description.split(",")[0] : ""),
            secondary_text:
              prediction?.structured_formatting?.secondary_text ?? detailsData.result?.formatted_address,
            lat: detailsData.result?.geometry?.location?.lat,
            lng: detailsData.result?.geometry?.location?.lng,
          }
        } catch (error) {
          console.error("[v0] Error fetching place details:", error)
          return null
        }
      }),
    )

    const validPredictions = predictions.filter((p) => p !== null && p.lat && p.lng)

    return NextResponse.json({ success: true, data: validPredictions })
  } catch (error) {
    console.error("[v0] Error searching locations:", error)
    return NextResponse.json(
      { success: false, error: "Failed to search locations. Please try again." },
      { status: 500 },
    )
  }
}
