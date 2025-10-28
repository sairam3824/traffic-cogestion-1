import { NextResponse } from "next/server"

export async function GET() {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY

  if (!apiKey) {
    console.error("[v0] GOOGLE_MAPS_API_KEY environment variable is not set")
    return NextResponse.json(
      { error: "Google Maps API key not configured. Please set GOOGLE_MAPS_API_KEY environment variable." },
      { status: 500 },
    )
  }

  if (apiKey.length < 20) {
    console.error("[v0] GOOGLE_MAPS_API_KEY appears to be invalid (too short)")
    return NextResponse.json(
      { error: "Google Maps API key appears invalid. Please verify your API key." },
      { status: 500 },
    )
  }

  console.log("[v0] Returning Google Maps API key (first 10 chars):", apiKey.substring(0, 10) + "...")
  return NextResponse.json({ apiKey })
}
