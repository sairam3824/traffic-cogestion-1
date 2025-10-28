"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { AlertCircle, CheckCircle, TrendingUp } from "lucide-react"

interface HealthStatus {
  status: "healthy" | "unhealthy"
  timestamp: string
  checks: Record<string, string>
  version?: string
}

interface MetricsData {
  requests: Array<{ endpoint: string; count: number }>
  latency: Array<{ bucket: string; count: number }>
  accuracy: Array<{ model: string; accuracy: number }>
  alerts: number
  segments: number
}

export default function MonitoringPage() {
  const [health, setHealth] = useState<HealthStatus | null>(null)
  const [metrics, setMetrics] = useState<MetricsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

  useEffect(() => {
    const fetchMonitoringData = async () => {
      try {
        const [healthRes, metricsRes] = await Promise.all([fetch("/api/health"), fetch("/api/metrics")])

        const healthData = await healthRes.json()
        setHealth(healthData)

        // Parse Prometheus metrics
        const metricsText = await metricsRes.text()
        const parsedMetrics = parsePrometheusMetrics(metricsText)
        setMetrics(parsedMetrics)
        setLastUpdate(new Date())
      } catch (error) {
        console.error("Error fetching monitoring data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchMonitoringData()
    const interval = setInterval(fetchMonitoringData, 30000) // Refresh every 30 seconds

    return () => clearInterval(interval)
  }, [])

  const parsePrometheusMetrics = (text: string): MetricsData => {
    const lines = text.split("\n")
    const requests: Array<{ endpoint: string; count: number }> = []
    const latency: Array<{ bucket: string; count: number }> = []
    const accuracy: Array<{ model: string; accuracy: number }> = []
    let alerts = 0
    let segments = 0

    lines.forEach((line) => {
      if (line.includes("traffic_api_requests_total{endpoint=")) {
        const match = line.match(/endpoint="([^"]+)"\}\s+(\d+)/)
        if (match) requests.push({ endpoint: match[1], count: Number.parseInt(match[2]) })
      }
      if (line.includes("traffic_prediction_latency_ms_bucket{le=")) {
        const match = line.match(/le="([^"]+)"\}\s+(\d+)/)
        if (match && match[1] !== "+Inf") latency.push({ bucket: `${match[1]}ms`, count: Number.parseInt(match[2]) })
      }
      if (line.includes("traffic_model_accuracy{model=")) {
        const match = line.match(/model="([^"]+)"\}\s+([\d.]+)/)
        if (match) accuracy.push({ model: match[1].toUpperCase(), accuracy: Number.parseFloat(match[2]) })
      }
      if (line.includes("traffic_active_alerts_total")) {
        const match = line.match(/traffic_active_alerts_total\s+(\d+)/)
        if (match) alerts = Number.parseInt(match[1])
      }
      if (line.includes("traffic_segments_monitored")) {
        const match = line.match(/traffic_segments_monitored\s+(\d+)/)
        if (match) segments = Number.parseInt(match[1])
      }
    })

    return { requests, latency, accuracy, alerts, segments }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6">
        <div className="max-w-7xl mx-auto">
          <p className="text-slate-400">Loading monitoring data...</p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-white">System Monitoring</h1>
          <p className="text-slate-400">
            Real-time system health and performance metrics
            {lastUpdate && ` • Last updated: ${lastUpdate.toLocaleTimeString()}`}
          </p>
        </div>

        {/* Health Status */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-slate-700 bg-slate-900/50 backdrop-blur">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-300">System Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                {health?.status === "healthy" ? (
                  <CheckCircle className="w-8 h-8 text-green-500" />
                ) : (
                  <AlertCircle className="w-8 h-8 text-red-500" />
                )}
                <div>
                  <p className="text-2xl font-bold text-white capitalize">{health?.status}</p>
                  <p className="text-xs text-slate-400">All systems operational</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-700 bg-slate-900/50 backdrop-blur">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-300">Active Alerts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <AlertCircle className="w-8 h-8 text-yellow-500" />
                <div>
                  <p className="text-2xl font-bold text-white">{metrics?.alerts || 0}</p>
                  <p className="text-xs text-slate-400">Currently active</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-700 bg-slate-900/50 backdrop-blur">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-300">Segments Monitored</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <TrendingUp className="w-8 h-8 text-blue-500" />
                <div>
                  <p className="text-2xl font-bold text-white">{metrics?.segments || 0}</p>
                  <p className="text-xs text-slate-400">Traffic segments</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* API Requests */}
          <Card className="border-slate-700 bg-slate-900/50 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-white">API Request Volume</CardTitle>
              <CardDescription>Requests by endpoint</CardDescription>
            </CardHeader>
            <CardContent>
              {metrics?.requests && metrics.requests.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={metrics.requests}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                    <XAxis dataKey="endpoint" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" />
                    <Tooltip contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #475569" }} />
                    <Bar dataKey="count" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-slate-400">No data available</p>
              )}
            </CardContent>
          </Card>

          {/* Model Accuracy */}
          <Card className="border-slate-700 bg-slate-900/50 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-white">Model Accuracy</CardTitle>
              <CardDescription>Prediction accuracy by model</CardDescription>
            </CardHeader>
            <CardContent>
              {metrics?.accuracy && metrics.accuracy.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={metrics.accuracy}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                    <XAxis dataKey="model" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" domain={[0, 1]} />
                    <Tooltip contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #475569" }} />
                    <Bar dataKey="accuracy" fill="#10b981" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-slate-400">No data available</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Latency Distribution */}
        <Card className="border-slate-700 bg-slate-900/50 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-white">Prediction Latency Distribution</CardTitle>
            <CardDescription>API response time buckets</CardDescription>
          </CardHeader>
          <CardContent>
            {metrics?.latency && metrics.latency.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={metrics.latency}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                  <XAxis dataKey="bucket" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #475569" }} />
                  <Line type="monotone" dataKey="count" stroke="#8b5cf6" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-slate-400">No data available</p>
            )}
          </CardContent>
        </Card>

        {/* System Checks */}
        <Card className="border-slate-700 bg-slate-900/50 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-white">System Checks</CardTitle>
            <CardDescription>Component health status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {health?.checks &&
                Object.entries(health.checks).map(([check, status]) => (
                  <div key={check} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                    <span className="text-slate-300 capitalize">{check}</span>
                    <div className="flex items-center gap-2">
                      {status === "ok" ? (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-red-500" />
                      )}
                      <span className={status === "ok" ? "text-green-500" : "text-red-500"}>{status}</span>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
