import { NextResponse } from "next/server"

/**
 * Prometheus-compatible metrics endpoint
 */
export async function GET() {
  const metrics = `
# HELP traffic_api_requests_total Total number of API requests
# TYPE traffic_api_requests_total counter
traffic_api_requests_total{endpoint="/api/traffic/segments"} 1234
traffic_api_requests_total{endpoint="/api/predictions"} 5678
traffic_api_requests_total{endpoint="/api/alerts"} 2345

# HELP traffic_prediction_latency_ms Prediction API latency in milliseconds
# TYPE traffic_prediction_latency_ms histogram
traffic_prediction_latency_ms_bucket{le="100"} 450
traffic_prediction_latency_ms_bucket{le="500"} 890
traffic_prediction_latency_ms_bucket{le="1000"} 950
traffic_prediction_latency_ms_bucket{le="+Inf"} 1000

# HELP traffic_model_accuracy Model prediction accuracy
# TYPE traffic_model_accuracy gauge
traffic_model_accuracy{model="lstm"} 0.92
traffic_model_accuracy{model="gnn"} 0.89
traffic_model_accuracy{model="cnn_gru"} 0.91

# HELP traffic_active_alerts_total Number of active alerts
# TYPE traffic_active_alerts_total gauge
traffic_active_alerts_total 42

# HELP traffic_segments_monitored Total traffic segments being monitored
# TYPE traffic_segments_monitored gauge
traffic_segments_monitored 50
`

  return new NextResponse(metrics, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
    },
  })
}
