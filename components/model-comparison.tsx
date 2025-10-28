"use client"

import { useEffect, useState } from "react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"

interface ModelComparisonProps {
  segmentId: string
}

export default function ModelComparison({ segmentId }: ModelComparisonProps) {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchComparison = async () => {
      try {
        const response = await fetch(`/api/predictions/compare?segmentId=${segmentId}`)
        const result = await response.json()

        if (result.success && result.data) {
          const { lstm, gnn, cnn_gru } = result.data

          // Combine predictions for comparison
          const comparisonData = lstm.slice(0, 12).map((pred: any, idx: number) => ({
            time: new Date(pred.prediction_timestamp).getHours() + ":00",
            lstm: pred.predicted_speed_kmh,
            gnn: gnn[idx]?.predicted_speed_kmh || 0,
            cnn_gru: cnn_gru[idx]?.predicted_speed_kmh || 0,
          }))

          setData(comparisonData)
        }
      } catch (error) {
        console.error("Error fetching model comparison:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchComparison()
  }, [segmentId])

  if (loading) {
    return <div className="h-80 flex items-center justify-center text-slate-400">Loading comparison...</div>
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
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
        <Bar dataKey="lstm" fill="#3b82f6" name="LSTM" />
        <Bar dataKey="gnn" fill="#8b5cf6" name="GNN" />
        <Bar dataKey="cnn_gru" fill="#ec4899" name="CNN-GRU" />
      </BarChart>
    </ResponsiveContainer>
  )
}
