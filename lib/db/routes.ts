import { createClient } from "@/lib/supabase/server"

export interface Route {
  id: string
  origin_name: string
  origin_lat: number
  origin_lng: number
  destination_name: string
  destination_lat: number
  destination_lng: number
  distance_km: number
  duration_minutes: number
  route_polyline: string
  created_at: string
  updated_at: string
}

export interface RoutePrediction {
  id: string
  route_id: string
  prediction_time: string
  predicted_duration_minutes: number
  predicted_congestion_level: string
  average_speed_kmh: number
  model_type: string
  confidence_score: number
  created_at: string
}

export async function createRoute(route: Omit<Route, "id" | "created_at" | "updated_at">): Promise<Route> {
  const supabase = await createClient()
  const { data, error } = await supabase.from("routes").insert([route]).select().single()

  if (error) throw error
  return data
}

export async function getRouteById(routeId: string): Promise<Route | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("routes")
    .select("*")
    .eq("id", routeId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null // Not found
    throw error
  }
  return data
}

export async function getRouteHistory(limit = 10): Promise<Route[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("routes")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit)

  if (error) throw error
  return data || []
}

export async function getRoutePredictions(routeId: string): Promise<RoutePrediction[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("route_predictions")
    .select("*")
    .eq("route_id", routeId)
    .order("prediction_time", { ascending: true })

  if (error) throw error
  return data || []
}

export async function createRoutePrediction(
  prediction: Omit<RoutePrediction, "id" | "created_at">,
): Promise<RoutePrediction> {
  const supabase = await createClient()
  const { data, error } = await supabase.from("route_predictions").insert([prediction]).select().single()

  if (error) throw error
  return data
}
