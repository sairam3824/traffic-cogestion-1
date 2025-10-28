"use client"

import { useEffect, useState } from "react"
import { AlertCircle, CheckCircle } from "lucide-react"

interface AlertsPanelProps {
  selectedSegment: string | null
}

export default function AlertsPanel({ selectedSegment }: AlertsPanelProps) {
  const [alerts, setAlerts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const response = await fetch("/api/alerts?isActive=true")
        const result = await response.json()

        if (result.success) {
          setAlerts(result.data || [])
        }
      } catch (error) {
        console.error("Error fetching alerts:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchAlerts()
    
    // Refresh alerts every 30 seconds
    const interval = setInterval(fetchAlerts, 30000)
    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <div className="bg-card/50 border border-border rounded-lg p-4">
        <p className="text-muted-foreground">Loading alerts...</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold text-foreground">Active Alerts</h3>

      {alerts.length === 0 ? (
        <div className="bg-card/50 border border-border rounded-lg p-4 flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-green-500" />
          <p className="text-foreground">No active alerts</p>
        </div>
      ) : (
        <div className="space-y-2">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className={`border rounded-lg p-3 flex items-start gap-3 ${
                alert.severity === "critical"
                  ? "bg-red-900/20 border-red-700"
                  : alert.severity === "high"
                    ? "bg-orange-900/20 border-orange-700"
                    : "bg-yellow-900/20 border-yellow-700"
              }`}
            >
              <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0 text-red-500" />
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground capitalize">{alert.alert_type}</p>
                <p className="text-xs text-muted-foreground mt-1">{alert.message}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
