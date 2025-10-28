"use client"

import { useState } from "react"
import RouteSearch from "@/components/route-search"
import RouteMap from "@/components/route-map"
import RouteDetails from "@/components/route-details"
import CongestionForecast from "@/components/congestion-forecast"
import { Card, CardContent } from "@/components/ui/card"

interface LocationPrediction {
  place_id: string
  description: string
  main_text: string
  secondary_text?: string
  lat: number
  lng: number
}

interface RouteStep {
  instruction: string
  distance_km: number
  duration_minutes: number
  traffic_density: 'low' | 'medium' | 'high' | 'unknown'
}

interface RouteData {
  id: string
  distance_km: number
  duration_minutes: number
  route_polyline: string
  traffic_density?: 'low' | 'medium' | 'high' | 'unknown'
  steps?: RouteStep[]
  congestion_level?: number
}

export default function RoutePlannerPage() {
  const [selectedRoute, setSelectedRoute] = useState<RouteData | null>(null)
  const [origin, setOrigin] = useState<LocationPrediction | null>(null)
  const [destination, setDestination] = useState<LocationPrediction | null>(null)
  const [loading, setLoading] = useState(false)
  const [dynamicTrafficLevel, setDynamicTrafficLevel] = useState<'low' | 'medium' | 'high' | 'unknown'>('unknown')

  const handleRouteSelect = async (originLocation: LocationPrediction, destinationLocation: LocationPrediction) => {
    try {
      setLoading(true)
      setOrigin(originLocation)
      setDestination(destinationLocation)

      const response = await fetch("/api/routes/directions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          origin_lat: originLocation.lat,
          origin_lng: originLocation.lng,
          destination_lat: destinationLocation.lat,
          destination_lng: destinationLocation.lng,
          origin_name: originLocation.main_text,
          destination_name: destinationLocation.main_text,
        }),
      })

      const data = await response.json()
      if (data.success) {
        setSelectedRoute(data.data)
      }
    } catch (error) {
      console.error("Error planning route:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-foreground">Route Planner</h1>
          <p className="text-muted-foreground">Plan your route and check real-time congestion predictions</p>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Search */}
          <div className="lg:col-span-1">
            <RouteSearch onRouteSelect={handleRouteSelect} />
          </div>

          {/* Right Column - Map, Details and Forecast */}
          <div className="lg:col-span-2 space-y-6">
            {selectedRoute && origin && destination ? (
              <>
                <RouteMap
                  origin={{ lat: origin.lat, lng: origin.lng, name: origin.main_text }}
                  destination={{ lat: destination.lat, lng: destination.lng, name: destination.main_text }}
                  polyline={selectedRoute.route_polyline}
                  distance={selectedRoute.distance_km}
                  duration={selectedRoute.duration_minutes}
                  trafficDensity={selectedRoute.traffic_density}
                  onTrafficLevelChange={setDynamicTrafficLevel}
                />
                <RouteDetails
                  distance={selectedRoute.distance_km}
                  duration={selectedRoute.duration_minutes}
                  trafficDensity={dynamicTrafficLevel !== 'unknown' ? dynamicTrafficLevel : selectedRoute.traffic_density}
                  steps={selectedRoute.steps || []}
                  congestionLevel={selectedRoute.congestion_level || 0}
                />
                <CongestionForecast routeId={selectedRoute.id} />
              </>
            ) : (
              <Card className="border-border bg-card/50 backdrop-blur">
                <CardContent className="p-12 text-center">
                  <p className="text-muted-foreground">
                    {loading
                      ? "Planning route..."
                      : "Select origin and destination to view route and congestion forecast"}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
