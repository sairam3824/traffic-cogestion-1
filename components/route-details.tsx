"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Clock, Navigation, TrendingUp, AlertTriangle } from "lucide-react"

interface RouteStep {
  instruction: string
  distance_km: number
  duration_minutes: number
  traffic_density: 'low' | 'medium' | 'high' | 'unknown'
}

interface RouteDetailsProps {
  distance: number
  duration: number
  trafficDensity?: 'low' | 'medium' | 'high' | 'unknown'
  steps?: RouteStep[]
  congestionLevel?: number
}

export default function RouteDetails({ 
  distance, 
  duration, 
  trafficDensity = 'unknown',
  steps = [],
  congestionLevel = 0
}: RouteDetailsProps) {
  
  const getTrafficColor = (density: string) => {
    switch (density) {
      case 'low': return 'text-green-400'
      case 'medium': return 'text-orange-400'
      case 'high': return 'text-red-400'
      default: return 'text-muted-foreground'
    }
  }

  const getTrafficBgColor = (density: string) => {
    switch (density) {
      case 'low': return 'bg-green-500/20 border-green-500/40'
      case 'medium': return 'bg-orange-500/20 border-orange-500/40'
      case 'high': return 'bg-red-500/20 border-red-500/40'
      default: return 'bg-muted border-border'
    }
  }

  const getTrafficLabel = (density: string) => {
    switch (density) {
      case 'low': return 'Light Traffic'
      case 'medium': return 'Moderate Traffic'
      case 'high': return 'Heavy Traffic'
      default: return 'Unknown'
    }
  }

  const getCongestionMessage = () => {
    if (congestionLevel < 0.3) return { text: "Clear roads ahead!", icon: "✅", severity: "low" }
    if (congestionLevel < 0.6) return { text: "Moderate congestion expected", icon: "⚠️", severity: "medium" }
    return { text: "Heavy congestion - consider alternate route", icon: "🚨", severity: "high" }
  }

  const congestionInfo = getCongestionMessage()

  return (
    <Card className="border-border bg-card/50 backdrop-blur">
      <CardHeader>
        <CardTitle className="text-foreground flex items-center gap-2">
          <Navigation className="h-5 w-5 text-primary" />
          Route Details
        </CardTitle>
        <CardDescription>Detailed journey information with traffic conditions</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        
        {/* Summary Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className={`p-4 rounded-lg border ${getTrafficBgColor(trafficDensity)}`}>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <Clock className="h-4 w-4" />
              Duration
            </div>
            <div className="text-2xl font-bold text-foreground">{duration} min</div>
            <div className={`text-xs ${getTrafficColor(trafficDensity)} font-medium mt-1`}>
              {getTrafficLabel(trafficDensity)}
            </div>
          </div>

          <div className="p-4 rounded-lg border bg-card border-border">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <TrendingUp className="h-4 w-4" />
              Distance
            </div>
            <div className="text-2xl font-bold text-foreground">{distance.toFixed(1)} km</div>
            <div className="text-xs text-muted-foreground mt-1">
              ~{Math.round(distance / duration * 60)} km/h avg
            </div>
          </div>
        </div>

        {/* Congestion Alert */}
        <div className={`p-3 rounded-lg border flex items-start gap-3 ${getTrafficBgColor(congestionInfo.severity)}`}>
          <AlertTriangle className={`h-5 w-5 mt-0.5 ${getTrafficColor(congestionInfo.severity)}`} />
          <div>
            <div className="font-medium text-foreground flex items-center gap-2">
              <span>{congestionInfo.icon}</span>
              Traffic Status
            </div>
            <div className="text-sm text-muted-foreground mt-1">
              {congestionInfo.text}
            </div>
          </div>
        </div>

        {/* Step-by-Step Directions */}
        {steps.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-semibold text-sm text-foreground">Turn-by-Turn Directions</h4>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {steps.map((step, index) => (
                <div 
                  key={index} 
                  className="flex gap-3 p-3 rounded-lg border border-border bg-muted/50 hover:bg-muted transition-colors"
                >
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div 
                      className="text-sm text-foreground"
                      dangerouslySetInnerHTML={{ __html: step.instruction }}
                    />
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      <span>{step.distance_km.toFixed(1)} km</span>
                      <span>•</span>
                      <span>{Math.round(step.duration_minutes)} min</span>
                      {step.traffic_density !== 'unknown' && (
                        <>
                          <span>•</span>
                          <span className={getTrafficColor(step.traffic_density)}>
                            {getTrafficLabel(step.traffic_density)}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Traffic Density Distribution */}
        <div className="space-y-3">
          <h4 className="font-semibold text-sm text-foreground flex items-center gap-2">
            <span className="text-primary">📊</span>
            Route Traffic Analysis
          </h4>
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center p-3 rounded-lg bg-green-500/20 border-2 border-green-500/40 hover:bg-green-500/30 transition-colors">
              <div className="text-xs text-green-400 font-medium">Light</div>
              <div className="text-2xl font-bold text-green-400">
                {steps.filter(s => s.traffic_density === 'low').length}
              </div>
              <div className="text-xs text-green-300">segments</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-orange-500/20 border-2 border-orange-500/40 hover:bg-orange-500/30 transition-colors">
              <div className="text-xs text-orange-400 font-medium">Moderate</div>
              <div className="text-2xl font-bold text-orange-400">
                {steps.filter(s => s.traffic_density === 'medium').length}
              </div>
              <div className="text-xs text-orange-300">segments</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-red-500/20 border-2 border-red-500/40 hover:bg-red-500/30 transition-colors">
              <div className="text-xs text-red-400 font-medium">Heavy</div>
              <div className="text-2xl font-bold text-red-400">
                {steps.filter(s => s.traffic_density === 'high').length}
              </div>
              <div className="text-xs text-red-300">segments</div>
            </div>
          </div>
        </div>

      </CardContent>
    </Card>
  )
}
