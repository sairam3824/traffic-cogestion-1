import { createClient } from "@/lib/supabase/server"

export interface PredictionInput {
  segmentId: string
  historicalData: Array<{
    speed: number
    volume: number
    occupancy: number
  }>
  timestamp: Date
}

export class PredictionService {
  /**
   * Generate mock predictions (in production, call ML service)
   * Extended to support both 24-hour and 7-day predictions
   */
  async generatePredictions(input: PredictionInput, hoursAhead = 24): Promise<void> {
    const supabase = await createClient()

    // Generate predictions for specified hours
    const predictions = []
    const baseTime = new Date(input.timestamp)

    for (let i = 1; i <= hoursAhead; i++) {
      const predTime = new Date(baseTime.getTime() + i * 60 * 60 * 1000)

      // Simple prediction logic (in production, use trained models)
      const avgSpeed = input.historicalData.reduce((sum, d) => sum + d.speed, 0) / input.historicalData.length
      const predictedSpeed = avgSpeed + Math.random() * 10 - 5

      predictions.push({
        segment_id: input.segmentId,
        prediction_timestamp: predTime.toISOString(),
        predicted_speed_kmh: Math.max(10, predictedSpeed),
        predicted_volume: Math.floor(Math.random() * 1000),
        predicted_congestion_level: predictedSpeed < 30 ? "heavy" : "moderate",
        model_type: "lstm",
        confidence_score: 0.85 + Math.random() * 0.1,
      })
    }

    // Insert predictions
    const { error } = await supabase.from("predictions").insert(predictions)

    if (error) {
      console.error("Error inserting predictions:", error)
    }
  }

  /**
   * Get latest predictions for a segment
   * Added support for different time ranges
   */
  async getLatestPredictions(segmentId: string, modelType: string, limit = 24): Promise<any[]> {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from("predictions")
      .select("*")
      .eq("segment_id", segmentId)
      .eq("model_type", modelType)
      .order("prediction_timestamp", { ascending: true })
      .limit(limit)

    if (error) {
      console.error("Error fetching predictions:", error)
      return []
    }

    return data || []
  }

  /**
   * Compare predictions from all models
   */
  async comparePredictions(segmentId: string): Promise<Record<string, any[]>> {
    const [lstm, gnn, cnnGru] = await Promise.all([
      this.getLatestPredictions(segmentId, "lstm"),
      this.getLatestPredictions(segmentId, "gnn"),
      this.getLatestPredictions(segmentId, "cnn_gru"),
    ])

    return { lstm, gnn, cnn_gru: cnnGru }
  }
}
