"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import TrafficMap from "@/components/traffic-map"
import PredictionChart from "@/components/prediction-chart"
import AlertsPanel from "@/components/alerts-panel"
import PerformanceMetrics from "@/components/performance-metrics"
import BackendStatus from "@/components/backend-status"

export default function Dashboard() {
  const [selectedSegment, setSelectedSegment] = useState<string | null>(null)
  const [segments, setSegments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

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

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Map and Alerts */}
          <div className="lg:col-span-2 space-y-6">
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
                  />
                )}
              </CardContent>
            </Card>

            {/* Alerts Panel */}
            <AlertsPanel selectedSegment={selectedSegment} />
          </div>

          {/* Right Column - Metrics */}
          <div className="space-y-6">
            {/* Performance Metrics */}
            <PerformanceMetrics />
          </div>
        </div>

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
