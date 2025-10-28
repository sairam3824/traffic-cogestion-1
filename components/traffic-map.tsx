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

  const { theme } = useTheme()

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
                scale: 6,
                fillColor: "#4285F4",
                fillOpacity: 1,
                strokeColor: "white",
                strokeWeight: 2,
              }}
            />
          )}
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
          className="ml-auto px-3 py-1 rounded-md border bg-card text-foreground hover:bg-accent hover:text-accent-foreground"
          onClick={() => {
            if (!navigator.geolocation) return
            navigator.geolocation.getCurrentPosition(
              (pos) => {
                const { latitude, longitude } = pos.coords
                const loc = { lat: latitude, lng: longitude }
                setUserLocation(loc)
                setMapCenter(loc)
              },
              () => {},
              { enableHighAccuracy: true, timeout: 10000 },
            )
          }}
        >
          My location
        </button>
      </div>

      {/* Legend */}
      <div className="flex gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
          <span className="text-foreground">Free</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
          <span className="text-foreground">Moderate</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-orange-500"></div>
          <span className="text-foreground">Heavy</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500"></div>
          <span className="text-foreground">Severe</span>
        </div>
      </div>
    </div>
  )
}
