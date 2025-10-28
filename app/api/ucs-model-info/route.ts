import { NextResponse } from "next/server"

const FLASK_API_URL = process.env.FLASK_API_URL || "http://localhost:5000"

export async function GET() {
  try {
    // Check if Flask URL is configured
    if (!FLASK_API_URL) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Flask API URL not configured. Please set FLASK_API_URL in .env.local" 
        },
        { status: 500 }
      )
    }

    const response = await fetch(`${FLASK_API_URL}/api/model_info`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      // Add timeout to fail fast
      signal: AbortSignal.timeout(5000)
    })

    if (!response.ok) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Flask API returned ${response.status}. Ensure Flask backend is running.` 
        },
        { status: response.status }
      )
    }

    const data = await response.json()
    
    return NextResponse.json({
      success: true,
      data: {
        modelType: data.model_type || "UCS Ensemble",
        sequenceLength: data.sequence_length,
        features: data.n_features,
        performance: {
          rmse: data.model_performance?.rmse || 0,
          mae: data.model_performance?.mae || 0,
          r2: data.model_performance?.r2 || 0,
        },
        trainingDate: data.training_date,
      },
    })
  } catch (error: any) {
    console.error("[UCS Model] Error fetching model info:", error)
    
    // Provide specific error messages
    let errorMessage = "Failed to fetch model information"
    
    if (error.code === 'ECONNREFUSED') {
      errorMessage = "Cannot connect to Flask backend. Please start Flask: cd UCS_Model-main && python traffic_prediction_api.py"
    } else if (error.name === 'AbortError') {
      errorMessage = "Flask backend timeout. Check if it's running on port 5000"
    } else if (error.cause?.code === 'ECONNREFUSED') {
      errorMessage = "Flask backend not running. Start it with: python UCS_Model-main/traffic_prediction_api.py"
    }
    
    return NextResponse.json(
      { 
        success: false, 
        error: errorMessage,
        hint: "Run 'start-flask.bat' or check QUICK_START.md for setup instructions"
      },
      { status: 500 }
    )
  }
}
