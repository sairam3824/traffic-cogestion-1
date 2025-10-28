"use client"

import { useEffect, useState } from "react"
import { GoogleMap, LoadScript, Polyline, Marker, InfoWindow, TrafficLayer, TransitLayer, BicyclingLayer } from "@react-google-maps/api"
import { useTheme } from "next-themes"

interface TrafficSegment {
  id: string
  segment_name: string
  latitude: number
  longitude: number
  road_type: string
}

interface TrafficMapProps {
  segments: TrafficSegment[]
  selectedSegment: string | null
  onSelectSegment: (id: string) => void
}

export default function TrafficMap({ segments, selectedSegment, onSelectSegment }: TrafficMapProps) {
  const [congestionData, setCongestionData] = useState<Record<string, number>>({})
  const [selectedInfo, setSelectedInfo] = useState<TrafficSegment | null>(null)
  const [mapCenter, setMapCenter] = useState({ lat: 16.5062, lng: 80.648 })
  const [apiKey, setApiKey] = useState<string>("")
  const [showTraffic, setShowTraffic] = useState(true)
  const [showTransit, setShowTransit] = useState(false)
  const [showBicycling, setShowBicycling] = useState(false)
  const [mapType, setMapType] = useState<'roadmap' | 'satellite' | 'hybrid' | 'terrain'>('roadmap')
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [nearbyTrafficPredictions, setNearbyTrafficPredictions] = useState<Array<{
    lat: number;
    lng: number;
    prediction: number;
    trafficLevel: 'low' | 'medium' | 'high';
  }>>([])
  const [isLoadingPredictions, setIsLoadingPredictions] = useState(false)

  const { theme } = useTheme()

  // Function to fetch traffic predictions around a location
  const fetchNearbyTrafficPredictions = async (centerLat: number, centerLng: number) => {
    setIsLoadingPredictions(true)
    const predictions = []
    
    try {
      // Create a grid of points around the user's location (roughly 5km radius)
      const gridSize = 0.02 // Approximately 2km spacing
      const gridRadius = 2 // 2x2 grid around center
      
      for (let i = -gridRadius; i <= gridRadius; i++) {
        for (let j = -gridRadius; j <= gridRadius; j++) {
          const lat = centerLat + (i * gridSize)
          const lng = centerLng + (j * gridSize)
          
          try {
            const response = await fetch('/api/ucs-predict', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                latitude: lat,
                longitude: lng,
                timestamp: new Date().toISOString()
              })
            })
            
            if (response.ok) {
              const result = await response.json()
              if (result.success) {
                const prediction = result.data.prediction
                let trafficLevel: 'low' | 'medium' | 'high'
                
                if (prediction >= 60) trafficLevel = 'high'
                else if (prediction >= 35) trafficLevel = 'medium'
                else trafficLevel = 'low'
                
                predictions.push({
                  lat,
                  lng,
                  prediction,
                  trafficLevel
                })
              }
            }
          } catch (error) {
            console.error('Error fetching prediction for', lat, lng, error)
          }
        }
      }
      
      setNearbyTrafficPredictions(predictions)
      console.log(`Fetched ${predictions.length} traffic predictions around user location`)
    } catch (error) {
      console.error('Error fetching nearby traffic predictions:', error)
    } finally {
      setIsLoadingPredictions(false)
    }
  }

  useEffect(() => {
    const fetchApiKey = async () => {
      try {
        const response = await fetch("/api/config/maps")
        const data = await response.json()
        setApiKey(data.apiKey)
      } catch (error) {
        console.error("Error fetching Google Maps API key:", error)
      }
    }

    fetchApiKey()
  }, [])

  // Auto-get user location on component load
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords
          const userLoc = { lat: latitude, lng: longitude }
          setUserLocation(userLoc)
          setMapCenter(userLoc)
          console.log("User location detected:", userLoc)
          
          // Fetch traffic predictions around user location
          fetchNearbyTrafficPredictions(latitude, longitude)
        },
        (error) => {
          console.log("Geolocation error:", error.message)
          // Fallback to default location (Vijayawada, India)
          const defaultLoc = { lat: 16.5062, lng: 80.648 }
          setMapCenter(defaultLoc)
          fetchNearbyTrafficPredictions(defaultLoc.lat, defaultLoc.lng)
        },
        { 
          enableHighAccuracy: true, 
          timeout: 10000, 
          maximumAge: 300000 // 5 minutes cache
        }
      )
    } else {
      console.log("Geolocation not supported")
      const defaultLoc = { lat: 16.5062, lng: 80.648 }
      setMapCenter(defaultLoc)
      fetchNearbyTrafficPredictions(defaultLoc.lat, defaultLoc.lng)
    }
  }, [])

  useEffect(() => {
    const fetchCongestionData = async () => {
      try {
        const response = await fetch("/api/traffic/observations")
        const result = await response.json()

        if (result.success && result.data) {
          const congestionMap: Record<string, number> = {}
          result.data.forEach((obs: any) => {
            const congestion = Math.max(0, Math.min(1, 1 - obs.speed_kmh / 100))
            congestionMap[obs.segment_id] = congestion
          })
          setCongestionData(congestionMap)
        }
      } catch (error) {
        console.error("Error fetching congestion data:", error)
      }
    }

    fetchCongestionData()
    const interval = setInterval(fetchCongestionData, 30000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (segments.length > 0) {
      const avgLat = segments.reduce((sum, s) => sum + s.latitude, 0) / segments.length
      const avgLng = segments.reduce((sum, s) => sum + s.longitude, 0) / segments.length
      setMapCenter({ lat: avgLat, lng: avgLng })
    }
  }, [segments])

  const getSegmentColor = (segmentId: string) => {
    const congestion = congestionData[segmentId] || 0.3
    if (congestion > 0.7) return "#ef4444" // red
    if (congestion > 0.5) return "#f97316" // orange
    if (congestion > 0.3) return "#eab308" // yellow
    return "#10b981" // green
  }

  const mapContainerStyle = {
    width: "100%",
    height: "400px",
    borderRadius: "0.5rem",
  }

  const mapOptions = {
    zoom: 12,
    mapTypeId: mapType as unknown as google.maps.MapTypeId,
    zoomControl: true,
    mapTypeControl: true,
    streetViewControl: true,
    fullscreenControl: true,
  }

  if (!apiKey) {
    return (
      <div className="w-full h-96 bg-muted rounded-lg border border-border flex items-center justify-center">
        <p className="text-muted-foreground">Loading map...</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <LoadScript googleMapsApiKey={apiKey}>
        <GoogleMap mapContainerStyle={mapContainerStyle} center={mapCenter} zoom={12} options={mapOptions}>
          {showTraffic && <TrafficLayer />}
          {showTransit && <TransitLayer />}
          {showBicycling && <BicyclingLayer />}
          {userLocation && (
            <Marker
              position={userLocation}
              title="Your location"
              icon={{
                path: google.maps.SymbolPath.CIRCLE,
                scale: 8,
                fillColor: "#4285F4",
                fillOpacity: 1,
                strokeColor: "white",
                strokeWeight: 3,
              }}
            />
          )}
          
          {/* Traffic prediction markers around user location */}
          {nearbyTrafficPredictions.map((prediction, index) => {
            const getTrafficColor = (level: string) => {
              switch (level) {
                case 'high': return '#ef4444'
                case 'medium': return '#f97316'
                case 'low': return '#10b981'
                default: return '#6b7280'
              }
            }
            
            return (
              <Marker
                key={`prediction-${index}`}
                position={{ lat: prediction.lat, lng: prediction.lng }}
                title={`Traffic: ${prediction.trafficLevel.toUpperCase()} (${prediction.prediction.toFixed(1)}%)`}
                icon={{
                  path: google.maps.SymbolPath.CIRCLE,
                  scale: 4,
                  fillColor: getTrafficColor(prediction.trafficLevel),
                  fillOpacity: 0.8,
                  strokeColor: "white",
                  strokeWeight: 1,
                }}
                onClick={() => {
                  const infoWindow = new google.maps.InfoWindow({
                    content: `
                      <div style="padding: 8px; min-width: 120px;">
                        <strong style="color: ${getTrafficColor(prediction.trafficLevel)};">
                          ${prediction.trafficLevel.toUpperCase()} TRAFFIC
                        </strong><br/>
                        <span>Congestion: ${prediction.prediction.toFixed(1)}%</span><br/>
                        <span style="font-size: 11px; color: #666;">
                          AI Prediction
                        </span>
                      </div>
                    `,
                    position: { lat: prediction.lat, lng: prediction.lng }
                  })
                  infoWindow.open(mapCenter as any)
                }}
              />
            )
          })}
          {segments.map((segment) => (
            <div key={segment.id}>
              {/* Polyline for segment */}
              <Polyline
                path={[
                  { lat: segment.latitude, lng: segment.longitude },
                  { lat: segment.latitude + 0.01, lng: segment.longitude + 0.01 },
                ]}
                options={{
                  strokeColor: getSegmentColor(segment.id),
                  strokeWeight: selectedSegment === segment.id ? 6 : 4,
                  strokeOpacity: 0.8,
                  clickable: true,
                }}
                onClick={() => {
                  onSelectSegment(segment.id)
                  setSelectedInfo(segment)
                }}
              />

              {/* Marker for segment */}
              <Marker
                position={{ lat: segment.latitude, lng: segment.longitude }}
                title={segment.segment_name}
                onClick={() => {
                  onSelectSegment(segment.id)
                  setSelectedInfo(segment)
                }}
                icon={{
                  path: "M0,-28a28,28 0 0,1 56,0c0,28-28,68-28,68S0,0 0,-28z",
                  fillColor: getSegmentColor(segment.id),
                  fillOpacity: 1,
                  strokeColor: "#fff",
                  strokeWeight: 2,
                  scale: 0.5,
                }}
              />

              {/* Info window for selected segment */}
              {selectedInfo?.id === segment.id && (
                <InfoWindow
                  position={{ lat: segment.latitude, lng: segment.longitude }}
                  onCloseClick={() => setSelectedInfo(null)}
                >
                  <div className="bg-popover text-popover-foreground p-3 rounded text-sm border border-border">
                    <h3 className="font-semibold">{segment.segment_name}</h3>
                    <p className="text-xs text-muted-foreground">Type: {segment.road_type}</p>
                    <p className="text-xs text-muted-foreground">
                      Congestion: {Math.round((congestionData[segment.id] || 0.3) * 100)}%
                    </p>
                  </div>
                </InfoWindow>
              )}
            </div>
          ))}
        </GoogleMap>
      </LoadScript>

      <div className="flex flex-wrap items-center gap-4 mb-2 text-sm">
        <label className="flex items-center gap-2 text-foreground cursor-pointer">
          <input
            type="checkbox"
            checked={showTraffic}
            onChange={(e) => setShowTraffic(e.target.checked)}
            className="accent-primary"
          />
          Traffic
        </label>
        <label className="flex items-center gap-2 text-foreground cursor-pointer">
          <input
            type="checkbox"
            checked={showTransit}
            onChange={(e) => setShowTransit(e.target.checked)}
            className="accent-primary"
          />
          Transit
        </label>
        <label className="flex items-center gap-2 text-foreground cursor-pointer">
          <input
            type="checkbox"
            checked={showBicycling}
            onChange={(e) => setShowBicycling(e.target.checked)}
            className="accent-primary"
          />
          Bicycling
        </label>
        <div className="h-5 w-px bg-border" />
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">Map</span>
          <div className="inline-flex overflow-hidden rounded-md border">
            <button
              className={`px-2 py-1 ${mapType === 'roadmap' ? 'bg-accent text-accent-foreground' : ''}`}
              onClick={() => setMapType('roadmap')}
            >Default</button>
            <button
              className={`px-2 py-1 border-l ${mapType === 'satellite' ? 'bg-accent text-accent-foreground' : ''}`}
              onClick={() => setMapType('satellite')}
            >Satellite</button>
            <button
              className={`px-2 py-1 border-l ${mapType === 'hybrid' ? 'bg-accent text-accent-foreground' : ''}`}
              onClick={() => setMapType('hybrid')}
            >Hybrid</button>
            <button
              className={`px-2 py-1 border-l ${mapType === 'terrain' ? 'bg-accent text-accent-foreground' : ''}`}
              onClick={() => setMapType('terrain')}
            >Terrain</button>
          </div>
        </div>
        <button
          className="ml-auto px-3 py-1 rounded-md border bg-card text-foreground hover:bg-accent hover:text-accent-foreground disabled:opacity-50"
          disabled={isLoadingPredictions}
          onClick={() => {
            if (!navigator.geolocation) return
            navigator.geolocation.getCurrentPosition(
              (pos) => {
                const { latitude, longitude } = pos.coords
                const loc = { lat: latitude, lng: longitude }
                setUserLocation(loc)
                setMapCenter(loc)
                fetchNearbyTrafficPredictions(latitude, longitude)
              },
              () => {},
              { enableHighAccuracy: true, timeout: 10000 },
            )
          }}
        >
          {isLoadingPredictions ? "Loading..." : "My location"}
        </button>
      </div>

      {/* Loading indicator */}
      {isLoadingPredictions && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
          <span>Loading traffic predictions around your location...</span>
        </div>
      )}
      
      {/* Traffic info */}
      {nearbyTrafficPredictions.length > 0 && !isLoadingPredictions && (
        <div className="text-sm text-muted-foreground">
          ✅ Showing {nearbyTrafficPredictions.length} AI traffic predictions around your location
        </div>
      )}

      {/* Legend */}
      <div className="flex gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500"></div>
          <span className="text-foreground">Free</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
          <span className="text-foreground">Moderate</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-orange-500"></div>
          <span className="text-foreground">Heavy</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-red-500"></div>
          <span className="text-foreground">Severe</span>
        </div>
      </div>
    </div>
  )
}
