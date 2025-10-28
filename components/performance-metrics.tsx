"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function PerformanceMetrics() {
  const [metrics, setMetrics] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const response = await fetch("/api/ucs-model-info")
        const result = await response.json()

        if (result.success && result.data) {
          setMetrics([result.data])
        }
      } catch (error) {
        console.error("Error fetching metrics:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchMetrics()
  }, [])

  if (loading) {
    return <div className="text-muted-foreground">Loading metrics...</div>
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-foreground">AI Model Performance</h3>

      {metrics.length === 0 ? (
        <Card className="border-border bg-card/50">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-muted-foreground text-sm mb-2">⚠️ Model data unavailable</p>
              <p className="text-xs text-muted-foreground">
                Start Flask backend: <code className="bg-muted px-2 py-1 rounded">python UCS_Model-main/traffic_prediction_api.py</code>
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        metrics.map((metric) => (
          <Card key={metric.modelType} className="border-border bg-card/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base capitalize text-foreground">{metric.modelType}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">RMSE</span>
                <span className="text-sm font-semibold text-blue-400">{metric.performance?.rmse?.toFixed(4) || "N/A"}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">MAE</span>
                <span className="text-sm font-semibold text-purple-400">
                  {metric.performance?.mae?.toFixed(4) || "N/A"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">R²</span>
                <span className="text-sm font-semibold text-green-400">
                  {metric.performance?.r2?.toFixed(4) || "N/A"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Features</span>
                <span className="text-sm font-semibold text-orange-400">
                  {metric.features || "N/A"}
                </span>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  )
}
