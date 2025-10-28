import { createClient } from "@/lib/supabase/server"

export interface TrafficSegment {
  id: string
  segment_name: string
  latitude: number
  longitude: number
  road_type: string
  length_km: number
  speed_limit: number
}

export interface TrafficObservation {
  id: string
  segment_id: string
  timestamp: string
  speed_kmh: number
  volume_vehicles: number
  occupancy_percent: number
  congestion_level: string
}

export interface Prediction {
  id: string
  segment_id: string
  prediction_timestamp: string
  predicted_speed_kmh: number
  predicted_volume: number
  predicted_congestion_level: string
  model_type: string
  confidence_score: number
}

export async function getTrafficSegments(): Promise<TrafficSegment[]> {
  const supabase = await createClient()
  const { data, error } = await supabase.from("traffic_segments").select("*")

  if (error) throw error
  return data || []
}

export async function getTrafficObservations(segmentId: string, limit = 100): Promise<TrafficObservation[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("traffic_observations")
    .select("*")
    .eq("segment_id", segmentId)
    .order("timestamp", { ascending: false })
    .limit(limit)

  if (error) throw error
  return data || []
}

export async function getPredictions(segmentId: string, modelType?: string): Promise<Prediction[]> {
  const supabase = await createClient()
  let query = supabase
    .from("predictions")
    .select("*")
    .eq("segment_id", segmentId)
    .order("prediction_timestamp", { ascending: false })
    .limit(24)

  if (modelType) {
    query = query.eq("model_type", modelType)
  }

  const { data, error } = await query
  if (error) throw error
  return data || []
}

export async function insertTrafficObservation(
  observation: Omit<TrafficObservation, "id">,
): Promise<TrafficObservation> {
  const supabase = await createClient()
  const { data, error } = await supabase.from("traffic_observations").insert([observation]).select().single()

  if (error) throw error
  return data
}

export async function insertPrediction(prediction: Omit<Prediction, "id">): Promise<Prediction> {
  const supabase = await createClient()
  const { data, error } = await supabase.from("predictions").insert([prediction]).select().single()

  if (error) throw error
  return data
}
