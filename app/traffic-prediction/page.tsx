"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import TrafficMap from "@/components/traffic-map"
import PredictionChart from "@/components/prediction-chart"
import AlertsPanel from "@/components/alerts-panel"
import BackendStatus from "@/components/backend-status"
import LiveLocationPredictions from "@/components/live-location-predictions"

export default function TrafficPredictionPage() {
  const [selectedSegment, setSelectedSegment] = useState<string | null>(null)
  const [segments, setSegments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [locationError, setLocationError] = useState<string | null>(null)

  // Get user's live location
  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by this browser")
      return
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords
        setUserLocation({ lat: latitude, lng: longitude })
        setLocationError(null)
      },
      (error) => {
        console.error("Geolocation error:", error)
        setLocationError("Unable to get your location")
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 30000, // Cache for 30 seconds
      }
    )

    return () => navigator.geolocation.clearWatch(watchId)
  }, [])

  useEffect(() => {
    const fetchSegments = async () => {
      try {
        const response = await fetch("/api/traffic/segments")
        const data = await response.json()
        if (data.success) {
          setSegments(data.data)
          if (data.data.length > 0) {
            setSelectedSegment(data.data[0].id)
          }
        }
      } catch (error) {
        console.error("Error fetching segments:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchSegments()
  }, [])

  return (
    <main className="min-h-screen bg-background p-6">
      <BackendStatus />
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-foreground">Traffic Congestion Prediction</h1>
          <p className="text-muted-foreground">Real-time traffic analysis powered by AI-driven predictions</p>
        </div>

        {/* Live Location Status */}
        {locationError && (
          <Card className="border-yellow-500/50 bg-yellow-500/10">
            <CardContent className="pt-6">
              <p className="text-yellow-600 text-sm">⚠️ {locationError}</p>
            </CardContent>
          </Card>
        )}

        {userLocation && (
          <Card className="border-green-500/50 bg-green-500/10">
            <CardContent className="pt-6">
              <p className="text-green-600 text-sm">
                📍 Live location: {userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Traffic Map */}
          <Card className="border-border bg-card/50 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-foreground">Traffic Map</CardTitle>
              <CardDescription>Real-time congestion levels across segments</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="h-96 bg-slate-800 rounded-lg flex items-center justify-center">
                  <p className="text-muted-foreground">Loading map...</p>
                </div>
              ) : (
                <TrafficMap
                  segments={segments}
                  selectedSegment={selectedSegment}
                  onSelectSegment={setSelectedSegment}
                  userLocation={userLocation}
                />
              )}
            </CardContent>
          </Card>

          {/* Live Location Predictions */}
          {userLocation && (
            <LiveLocationPredictions userLocation={userLocation} />
          )}
        </div>

        {/* Alerts Panel */}
        <AlertsPanel selectedSegment={selectedSegment} />

        {/* Prediction Charts */}
        {selectedSegment && (
          <div className="grid grid-cols-1 gap-6">
            {/* Prediction Chart */}
            <Card className="border-border bg-card/50 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-foreground">24-Hour Traffic Prediction</CardTitle>
                <CardDescription>AI-powered traffic forecast for selected segment</CardDescription>
              </CardHeader>
              <CardContent>
                <PredictionChart segmentId={selectedSegment} />
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </main>
  )
}