"use client"

import { useEffect, useState } from "react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"

interface PredictionChartProps {
  segmentId: string
}

export default function PredictionChart({ segmentId }: PredictionChartProps) {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState<"24h" | "7d">("24h")

  useEffect(() => {
    const fetchPredictions = async () => {
      try {
        const limit = timeRange === "24h" ? 24 : 168 // 168 hours = 7 days
        const response = await fetch(`/api/predictions?segmentId=${segmentId}&modelType=ucs&limit=${limit}`)
        const result = await response.json()

        if (result.success && result.data) {
          const chartData = result.data.map((pred: any) => {
            const date = new Date(pred.prediction_timestamp)
            const timeLabel =
              timeRange === "24h" ? date.getHours() + ":00" : date.toLocaleDateString() + " " + date.getHours() + ":00"

            return {
              time: timeLabel,
              speed: pred.predicted_speed_kmh,
              volume: pred.predicted_volume,
              timestamp: date.getTime(),
            }
          })
          setData(chartData)
        }
      } catch (error) {
        console.error("Error fetching predictions:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchPredictions()
  }, [segmentId, timeRange])

  if (loading) {
    return <div className="h-80 flex items-center justify-center text-muted-foreground">Loading AI predictions...</div>
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <button
          onClick={() => setTimeRange("24h")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            timeRange === "24h" ? "bg-blue-600 text-white" : "bg-slate-700 text-slate-300 hover:bg-slate-600"
          }`}
        >
          24 Hours
        </button>
        <button
          onClick={() => setTimeRange("7d")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            timeRange === "7d" ? "bg-blue-600 text-white" : "bg-slate-700 text-slate-300 hover:bg-slate-600"
          }`}
        >
          7 Days
        </button>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis dataKey="time" stroke="#94a3b8" />
          <YAxis stroke="#94a3b8" />
          <Tooltip
            contentStyle={{
              backgroundColor: "#1e293b",
              border: "1px solid #475569",
              borderRadius: "8px",
            }}
            labelStyle={{ color: "#e2e8f0" }}
          />
          <Legend />
          <Line type="monotone" dataKey="speed" stroke="#3b82f6" strokeWidth={2} dot={false} name="Speed (km/h)" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
