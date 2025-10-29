"use client"

import type React from "react"

import { useState, useRef, useCallback } from "react"
import { Search, MapPin } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import RouteSearchHistory from "@/components/route-search-history"

interface LocationPrediction {
  place_id: string
  description: string
  main_text: string
  secondary_text?: string
  lat: number
  lng: number
}

interface RouteSearchProps {
  onRouteSelect: (origin: LocationPrediction, destination: LocationPrediction) => void
}

// Create a ref to store the history save function
let saveToHistoryRef: ((origin: LocationPrediction, destination: LocationPrediction) => void) | null = null

export default function RouteSearch({ onRouteSelect }: RouteSearchProps) {
  const [originQuery, setOriginQuery] = useState("")
  const [destinationQuery, setDestinationQuery] = useState("")
  const [originPredictions, setOriginPredictions] = useState<LocationPrediction[]>([])
  const [destinationPredictions, setDestinationPredictions] = useState<LocationPrediction[]>([])
  const [selectedOrigin, setSelectedOrigin] = useState<LocationPrediction | null>(null)
  const [selectedDestination, setSelectedDestination] = useState<LocationPrediction | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const originInputRef = useRef<HTMLInputElement>(null)
  const destinationInputRef = useRef<HTMLInputElement>(null)
  const originDebounceRef = useRef<NodeJS.Timeout | undefined>(undefined)
  const destinationDebounceRef = useRef<NodeJS.Timeout | undefined>(undefined)
  const retryCountRef = useRef({ origin: 0, destination: 0 })

  const searchLocations = useCallback(async (query: string, isOrigin: boolean, retryCount = 0) => {
    if (query.length < 2) {
      if (isOrigin) setOriginPredictions([])
      else setDestinationPredictions([])
      return
    }

    try {
      setError(null)
      setLoading(true)
      const response = await fetch(`/api/routes/search?q=${encodeURIComponent(query)}`)
      const data = await response.json()

      if (response.status === 429 && retryCount < 3) {
        const delay = Math.pow(2, retryCount) * 1000
        console.log(`[v0] Rate limited, retrying in ${delay}ms`)
        setTimeout(() => {
          searchLocations(query, isOrigin, retryCount + 1)
        }, delay)
        return
      }

      if (data.success) {
        if (isOrigin) {
          setOriginPredictions(data.data)
        } else {
          setDestinationPredictions(data.data)
        }
      } else {
        setError(data.error || "Failed to search locations")
      }
    } catch (error) {
      console.error("[v0] Error searching locations:", error)
      setError("Network error. Please check your connection.")
    } finally {
      setLoading(false)
    }
  }, [setOriginPredictions, setDestinationPredictions, setError, setLoading])

  const handleOriginChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setOriginQuery(value)
    clearTimeout(originDebounceRef.current)

    if (value.length < 2) {
      setOriginPredictions([])
      return
    }

    originDebounceRef.current = setTimeout(() => {
      searchLocations(value, true, 0)
    }, 500)
  }

  const handleDestinationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setDestinationQuery(value)
    clearTimeout(destinationDebounceRef.current)

    if (value.length < 2) {
      setDestinationPredictions([])
      return
    }

    destinationDebounceRef.current = setTimeout(() => {
      searchLocations(value, false, 0)
    }, 500)
  }

  const handlePlanRoute = () => {
    if (selectedOrigin && selectedDestination) {
      // Save to history before planning route
      if (saveToHistoryRef) {
        saveToHistoryRef(selectedOrigin, selectedDestination)
      }
      onRouteSelect(selectedOrigin, selectedDestination)
    }
  }

  // Handle history selection
  const handleHistorySelect = (origin: LocationPrediction, destination: LocationPrediction) => {
    setSelectedOrigin(origin)
    setSelectedDestination(destination)
    setOriginQuery(origin.description)
    setDestinationQuery(destination.description)
    // Automatically plan the route
    onRouteSelect(origin, destination)
  }

  // Function to register the history save callback
  const registerHistorySave = (saveFunction: (origin: LocationPrediction, destination: LocationPrediction) => void) => {
    saveToHistoryRef = saveFunction
  }

  return (
    <div className="space-y-4">
      <Card className="border-border bg-card/50 backdrop-blur">
        <CardContent className="p-6 space-y-4">
        {/* Origin Search */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">From</label>
          <div className="relative">
            <MapPin className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
            <input
              ref={originInputRef}
              type="text"
              placeholder="Enter starting location in India..."
              value={originQuery}
              onChange={handleOriginChange}
              className="w-full pl-10 pr-4 py-2.5 bg-background border border-input rounded-xl text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-input shadow-sm"
            />
            {originPredictions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 z-50 max-h-64 overflow-y-auto rounded-xl border border-border bg-popover/95 backdrop-blur-sm shadow-xl divide-y divide-border">
                {originPredictions.map((prediction) => (
                  <button
                    key={prediction.place_id}
                    onClick={() => {
                      setSelectedOrigin(prediction)
                      setOriginQuery(prediction.description)
                      setOriginPredictions([])
                    }}
                    className="group flex w-full items-start gap-3 px-4 py-2.5 text-left text-popover-foreground hover:bg-accent/60 hover:text-accent-foreground transition-colors"
                    role="option"
                  >
                    <MapPin className="mt-[2px] h-4 w-4 text-muted-foreground group-hover:text-accent-foreground" />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium">{prediction.main_text}</div>
                      {prediction.secondary_text && (
                        <div className="truncate text-xs text-muted-foreground">{prediction.secondary_text}</div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Destination Search */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">To</label>
          <div className="relative">
            <MapPin className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
            <input
              ref={destinationInputRef}
              type="text"
              placeholder="Enter destination in India..."
              value={destinationQuery}
              onChange={handleDestinationChange}
              className="w-full pl-10 pr-4 py-2.5 bg-background border border-input rounded-xl text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-input shadow-sm"
            />
            {destinationPredictions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 z-50 max-h-64 overflow-y-auto rounded-xl border border-border bg-popover/95 backdrop-blur-sm shadow-xl divide-y divide-border">
                {destinationPredictions.map((prediction) => (
                  <button
                    key={prediction.place_id}
                    onClick={() => {
                      setSelectedDestination(prediction)
                      setDestinationQuery(prediction.description)
                      setDestinationPredictions([])
                    }}
                    className="group flex w-full items-start gap-3 px-4 py-2.5 text-left text-popover-foreground hover:bg-accent/60 hover:text-accent-foreground transition-colors"
                    role="option"
                  >
                    <MapPin className="mt-[2px] h-4 w-4 text-muted-foreground group-hover:text-accent-foreground" />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium">{prediction.main_text}</div>
                      {prediction.secondary_text && (
                        <div className="truncate text-xs text-muted-foreground">{prediction.secondary_text}</div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {error && (
          <div className="rounded-lg border p-3 text-sm bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-300">
            {error}
          </div>
        )}

        {/* Plan Route Button */}
        <button
          onClick={handlePlanRoute}
          disabled={!selectedOrigin || !selectedDestination || loading}
          className="w-full bg-primary hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed text-primary-foreground font-medium py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          <Search className="h-4 w-4" />
          {loading ? "Searching..." : "Plan Route"}
        </button>

        {/* Selected Locations Summary */}
        {selectedOrigin && selectedDestination && (
          <div className="bg-muted rounded-lg p-3 space-y-2 text-sm">
            <div className="flex items-center gap-2 text-foreground">
              <MapPin className="h-4 w-4 text-green-500" />
              <span>{selectedOrigin.main_text}</span>
            </div>
            <div className="flex items-center gap-2 text-foreground">
              <MapPin className="h-4 w-4 text-red-500" />
              <span>{selectedDestination.main_text}</span>
            </div>
          </div>
        )}
        </CardContent>
      </Card>

      {/* Search History */}
      <RouteSearchHistory 
        onHistorySelect={handleHistorySelect}
        onRegisterSave={registerHistorySave}
      />
    </div>
  )
}
