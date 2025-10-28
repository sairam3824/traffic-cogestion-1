import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export interface AlertSubscription {
  alertTypes: ("congestion" | "incident" | "weather")[]
  minSeverity: "low" | "medium" | "high" | "critical"
  segmentIds?: string[]
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const body: AlertSubscription = await request.json()

    // Validate input
    if (!body.alertTypes || body.alertTypes.length === 0) {
      return NextResponse.json({ success: false, error: "Alert types are required" }, { status: 400 })
    }

    // In production, store subscription in database
    // For now, return success
    console.log("Alert subscription:", body)

    return NextResponse.json({
      success: true,
      message: "Subscription created successfully",
      subscription: body,
    })
  } catch (error) {
    console.error("Error creating subscription:", error)
    return NextResponse.json({ success: false, error: "Failed to create subscription" }, { status: 500 })
  }
}
