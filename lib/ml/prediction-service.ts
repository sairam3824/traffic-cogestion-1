import { createClient } from "@/lib/supabase/server"
import type { Prediction } from "@/lib/db/traffic"

export interface PredictionRequest {
  segmentId: string
  modelType: "lstm" | "gnn" | "cnn_gru"
  hoursAhead?: number
}

export interface PredictionResponse {
  segmentId: string
  modelType: string
  predictions: Array<{
    timestamp: string
    predictedSpeed: number
    predictedVolume: number
    congestionLevel: string
    confidence: number
  }>
}

/**
 * Get predictions for a traffic segment
 * In production, this would call the ML service API
 */
export async function getPredictionsForSegment(request: PredictionRequest): Promise<PredictionResponse> {
  const supabase = await createClient()

  // Query predictions from database
  let query = supabase
    .from("predictions")
    .select("*")
    .eq("segment_id", request.segmentId)
    .eq("model_type", request.modelType)
    .order("prediction_timestamp", { ascending: true })

  if (request.hoursAhead) {
    query = query.limit(request.hoursAhead)
  }

  const { data, error } = await query

  if (error) throw error

  return {
    segmentId: request.segmentId,
    modelType: request.modelType,
    predictions: (data || []).map((pred: Prediction) => ({
      timestamp: pred.prediction_timestamp,
      predictedSpeed: pred.predicted_speed_kmh,
      predictedVolume: pred.predicted_volume,
      congestionLevel: pred.predicted_congestion_level,
      confidence: pred.confidence_score,
    })),
  }
}

/**
 * Compare predictions from all three models
 */
export async function compareModelPredictions(segmentId: string): Promise<{
  lstm: PredictionResponse
  gnn: PredictionResponse
  cnnGru: PredictionResponse
}> {
  const [lstm, gnn, cnnGru] = await Promise.all([
    getPredictionsForSegment({ segmentId, modelType: "lstm", hoursAhead: 24 }),
    getPredictionsForSegment({ segmentId, modelType: "gnn", hoursAhead: 24 }),
    getPredictionsForSegment({ segmentId, modelType: "cnn_gru", hoursAhead: 24 }),
  ])

  return { lstm, gnn, cnnGru }
}

/**
 * Get model performance metrics
 */
export async function getModelPerformanceMetrics(): Promise<
  Array<{
    modelType: string
    rmse: number
    mae: number
    mape: number
    evaluationDate: string
  }>
> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("model_performance")
    .select("*")
    .order("evaluation_date", { ascending: false })
    .limit(30)

  if (error) throw error

  // Group by model type and get latest metrics
  const metrics: Record<string, any> = {}
  ;(data || []).forEach((row: any) => {
    if (!metrics[row.model_type]) {
      metrics[row.model_type] = {
        modelType: row.model_type,
        rmse: 0,
        mae: 0,
        mape: 0,
        evaluationDate: row.evaluation_date,
      }
    }

    if (row.metric_name === "rmse") metrics[row.model_type].rmse = row.metric_value
    if (row.metric_name === "mae") metrics[row.model_type].mae = row.metric_value
    if (row.metric_name === "mape") metrics[row.model_type].mape = row.metric_value
  })

  return Object.values(metrics)
}
