import { AlertGenerationService } from "@/lib/services/alert-generation-service"
import { NextResponse } from "next/server"

/**
 * Endpoint to trigger alert generation
 * Can be called by a cron job or manually
 */
export async function POST() {
  try {
    const alertService = new AlertGenerationService()

    // Run all alert checks
    await Promise.all([
      alertService.checkPredictionsAndGenerateAlerts(),
      alertService.checkIncidentAlerts(),
      alertService.checkWeatherAlerts(),
    ])

    return NextResponse.json({
      success: true,
      message: "Alert generation completed",
    })
  } catch (error) {
    console.error("Error in alert generation endpoint:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to generate alerts",
      },
      { status: 500 },
    )
  }
}
