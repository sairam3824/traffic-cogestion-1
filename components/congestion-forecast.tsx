"use client"

import { useState, useEffect, useMemo } from "react"
import { format } from "date-fns"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import DateTimePicker from "@/components/ui/date-time-picker"

interface CongestionForecastProps {
  routeId: string
}

interface ForecastData {
  time: string
  duration: number
  speed: number
  congestion: string
}

export default function CongestionForecast({ routeId }: CongestionForecastProps) {
  const [forecasts, setForecasts] = useState<ForecastData[]>([])
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date())
  const [loading, setLoading] = useState(false)
  
  const now = useMemo(() => new Date(), [])
  const maxDate = useMemo(() => {
    const d = new Date(now)
    d.setDate(d.getDate() + 7)
    return d
  }, [now])

  const handleDateChange = (d: Date | null) => {
    if (!d) {
      if (selectedDate !== null) setSelectedDate(null)
      return
    }
    // Enforce bounds
    if (d < now) {
      if (!selectedDate || selectedDate.getTime() !== now.getTime()) setSelectedDate(now)
      return
    }
    if (d > maxDate) {
      if (!selectedDate || selectedDate.getTime() !== maxDate.getTime()) setSelectedDate(maxDate)
      return
    }
    if (!selectedDate || selectedDate.getTime() !== d.getTime()) setSelectedDate(d)
  }

  const generateForecast = async () => {
    try {
      setLoading(true)
      const forecastData: ForecastData[] = []
      
      // Use selected local date/time, send to API as UTC ISO
      const baseTimeUTC = selectedDate ?? new Date()

      // Generate predictions for next 60 minutes in 10-minute intervals
      for (let minutes = 0; minutes <= 360; minutes += 10) {
        const forecastTime = new Date(baseTimeUTC.getTime() + minutes * 60 * 1000)

        const response = await fetch("/api/routes/congestion-forecast", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            route_id: routeId,
            prediction_time: forecastTime.toISOString(),
          }),
        })

        const data = await response.json()
        if (data.success) {
          const prediction = data.data
          forecastData.push({
            time: format(forecastTime, "p"),
            duration: prediction.predicted_duration_minutes,
            speed: prediction.average_speed_kmh,
            congestion: prediction.predicted_congestion_level,
          })
        }
      }

      setForecasts(forecastData)
    } catch (error) {
      console.error("Error generating forecast:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (routeId) {
      generateForecast()
    }
  }, [routeId, selectedDate])

  const getCongestionColor = (level: string) => {
    switch (level) {
      case "low":
        return "#10b981"
      case "medium":
        return "#f59e0b"
      case "high":
        return "#ef4444"
      default:
        return "#6b7280"
    }
  }

  return (
    <Card className="border-border bg-card/50 backdrop-blur">
      <CardHeader>
        <CardTitle className="text-foreground">6-Hour Traffic Prediction</CardTitle>
        <CardDescription>Real-time UCS AI model predictions for next 6 hours</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Time Selector */}
        <div className="flex items-center gap-2">
          <DateTimePicker value={selectedDate} min={now} max={maxDate} onChange={handleDateChange} />
          <span className="text-xs text-muted-foreground">(Max: 1 week ahead)</span>
        </div>

        {/* Forecast Chart */}
        {forecasts.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={forecasts}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="time" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip
                contentStyle={{ backgroundColor: "#1f2937", border: "1px solid #374151" }}
                labelStyle={{ color: "#f3f4f6" }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="duration"
                stroke="#3b82f6"
                name="Duration (min)"
                strokeWidth={2}
                dot={{ fill: "#3b82f6", r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="speed"
                stroke="#10b981"
                name="Avg Speed (km/h)"
                strokeWidth={2}
                dot={{ fill: "#10b981", r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-64 bg-muted rounded-lg flex items-center justify-center">
            <p className="text-muted-foreground">{loading ? "Generating forecast..." : "No forecast data"}</p>
          </div>
        )}

        {/* Congestion Summary */}
        <div className="grid grid-cols-3 gap-2">
          {forecasts.slice(0, 3).map((forecast, idx) => (
            <div key={idx} className="bg-muted rounded-lg p-3 text-center">
              <div className="text-xs text-muted-foreground">{forecast.time}</div>
              <div
                className="text-sm font-semibold mt-1 capitalize"
                style={{ color: getCongestionColor(forecast.congestion) }}
              >
                {forecast.congestion}
              </div>
              <div className="text-xs text-muted-foreground mt-1">{forecast.duration} min</div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
