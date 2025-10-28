"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MapPin, Clock, TrendingUp, AlertTriangle } from "lucide-react"

interface LiveLocationPredictionsProps {
  userLocation: { lat: number; lng: number }
}

interface Prediction {
  prediction: number
  confidence: number
  timestamp: string
  location: { lat: number; lng: number }
  traffic_level: 'low' | 'medium' | 'high'
}

interface NearbyAlert {
  id: string
  alert_type: string
  message: string
  severity: string
  distance: number
}

export default function LiveLocationPredictions({ userLocation }: LiveLocationPredictionsProps) {
  const [currentPrediction, setCurrentPrediction] = useState<Prediction | null>(null)
  const [nearbyAlerts, setNearbyAlerts] = useState<NearbyAlert[]>([])
  const [loading, setLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

  const fetchPrediction = async () => {
    try {
      const response = await fetch("/api/ucs-predict", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          latitude: userLocation.lat,
          longitude: userLocation.lng,
          timestamp: new Date().toISOString(),
        }),
      })

      const result = await response.json()
      if (result.success) {
        setCurrentPrediction(result.data)
        setLastUpdate(new Date())
      }
    } catch (error) {
      console.error("Error fetching prediction:", error)
    }
  }

  const fetchNearbyAlerts = async () => {
    try {
      const response = await fetch("/api/alerts?isActive=true")
      const result = await response.json()
      
      if (result.success && result.data) {
        // Filter and add distance calculation (simplified)
        const alertsWithDistance = result.data.map((alert: any) => ({
          ...alert,
          distance: Math.random() * 5 + 0.5, // Simulate distance in km
        })).filter((alert: any) => alert.distance < 3) // Within 3km
        
        setNearbyAlerts(alertsWithDistance)
      }
    } catch (error) {
      console.error("Error fetching nearby alerts:", error)
    }
  }

  useEffect(() => {
    if (!userLocation) return

    const updateData = async () => {
      setLoading(true)
      await Promise.all([fetchPrediction(), fetchNearbyAlerts()])
      setLoading(false)
    }

    updateData()

    // Update every 30 seconds
    const interval = setInterval(updateData, 30000)
    return () => clearInterval(interval)
  }, [userLocation])

  const getTrafficLevelColor = (level: string) => {
    switch (level) {
      case 'low': return 'bg-green-500/20 text-green-600 border-green-500/30'
      case 'medium': return 'bg-yellow-500/20 text-yellow-600 border-yellow-500/30'
      case 'high': return 'bg-red-500/20 text-red-600 border-red-500/30'
      default: return 'bg-gray-500/20 text-gray-600 border-gray-500/30'
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500/20 text-red-600 border-red-500/30'
      case 'high': return 'bg-orange-500/20 text-orange-600 border-orange-500/30'
      case 'medium': return 'bg-yellow-500/20 text-yellow-600 border-yellow-500/30'
      default: return 'bg-blue-500/20 text-blue-600 border-blue-500/30'
    }
  }

  if (loading) {
    return (
      <Card className="border-border bg-card/50 backdrop-blur">
        <CardHeader>
          <CardTitle className="text-foreground flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Live Traffic Predictions
          </CardTitle>
          <CardDescription>AI predictions for your current location</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <p className="text-muted-foreground">Loading predictions...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-border bg-card/50 backdrop-blur">
      <CardHeader>
        <CardTitle className="text-foreground flex items-center gap-2">
          <MapPin className="w-5 h-5" />
          Live Traffic Predictions
        </CardTitle>
        <CardDescription>AI predictions for your current location</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Prediction */}
        {currentPrediction && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-foreground">Current Traffic Level</h4>
              <Badge className={getTrafficLevelColor(currentPrediction.traffic_level)}>
                {currentPrediction.traffic_level.toUpperCase()}
              </Badge>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="space-y-1">
                <p className="text-muted-foreground">Congestion Score</p>
                <p className="text-2xl font-bold text-foreground">
                  {Math.round(currentPrediction.prediction)}%
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-muted-foreground">Confidence</p>
                <p className="text-2xl font-bold text-foreground">
                  {Math.round(currentPrediction.confidence * 100)}%
                </p>
              </div>
            </div>

            {lastUpdate && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Clock className="w-3 h-3" />
                Last updated: {lastUpdate.toLocaleTimeString()}
              </div>
            )}
          </div>
        )}

        {/* Nearby Alerts */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-foreground" />
            <h4 className="font-medium text-foreground">Nearby Alerts</h4>
          </div>
          
          {nearbyAlerts.length === 0 ? (
            <p className="text-sm text-muted-foreground">No alerts in your area</p>
          ) : (
            <div className="space-y-2">
              {nearbyAlerts.slice(0, 3).map((alert) => (
                <div
                  key={alert.id}
                  className="p-3 rounded-lg border bg-card/30"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge className={getSeverityColor(alert.severity)}>
                          {alert.alert_type}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {alert.distance.toFixed(1)}km away
                        </span>
                      </div>
                      <p className="text-sm text-foreground">{alert.message}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Prediction Trend */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-foreground" />
            <h4 className="font-medium text-foreground">Traffic Trend</h4>
          </div>
          <div className="text-sm text-muted-foreground">
            {currentPrediction && currentPrediction.prediction > 70 
              ? "⚠️ Heavy traffic expected in your area"
              : currentPrediction && currentPrediction.prediction > 40
              ? "⚡ Moderate traffic conditions"
              : "✅ Good traffic conditions"
            }
          </div>
        </div>
      </CardContent>
    </Card>
  )
}