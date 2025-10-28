"use client"

import { useEffect, useState } from "react"
import { GoogleMap, LoadScript, Polyline, Marker, InfoWindow, TrafficLayer, DirectionsRenderer, BicyclingLayer, TransitLayer } from "@react-google-maps/api"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useTheme } from "next-themes"

interface RouteMapProps {
  origin: { lat: number; lng: number; name: string }
  destination: { lat: number; lng: number; name: string }
  polyline: string
  distance: number
  duration: number
  trafficDensity?: 'low' | 'medium' | 'high' | 'unknown'
}

export default function RouteMap({ origin, destination, polyline, distance, duration, trafficDensity }: RouteMapProps) {
  const [apiKey, setApiKey] = useState<string>("")
  const [selectedMarker, setSelectedMarker] = useState<"origin" | "destination" | null>(null)
  const [decodedPath, setDecodedPath] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [mapInstance, setMapInstance] = useState<google.maps.Map | null>(null)
  const [userHasInteracted, setUserHasInteracted] = useState(false)
  const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null)

  const { theme } = useTheme()
  const [showTraffic, setShowTraffic] = useState(true)
  const [showTransit, setShowTransit] = useState(false)
  const [showBicycling, setShowBicycling] = useState(false)
  const [travelMode, setTravelMode] = useState<'DRIVING' | 'TRANSIT' | 'WALKING' | 'BICYCLING'>('DRIVING')
  const [avoidTolls, setAvoidTolls] = useState(false)
  const [avoidHighways, setAvoidHighways] = useState(false)
  const [avoidFerries, setAvoidFerries] = useState(false)
  const [selectedRouteIndex, setSelectedRouteIndex] = useState(0)
  const [mapType, setMapType] = useState<'roadmap' | 'satellite' | 'hybrid' | 'terrain'>('roadmap')
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)

  useEffect(() => {
    const fetchApiKey = async () => {
      try {
        setIsLoading(true)
        const response = await fetch("/api/config/maps")
        if (!response.ok) {
          throw new Error(`API error: ${response.status}`)
        }
        const data = await response.json()
        if (!data.apiKey) {
          throw new Error("API key not provided")
        }
        console.log("[v0] API key fetched:", data.apiKey.substring(0, 10) + "...")
        setApiKey(data.apiKey)
        setError(null)
      } catch (err) {
        console.error("[v0] Error fetching Google Maps API key:", err)
        setError("Failed to load Google Maps. Please check your API key configuration.")
      } finally {
        setIsLoading(false)
      }
    }

    fetchApiKey()
  }, [])

  useEffect(() => {
    if (polyline && window.google?.maps?.geometry?.encoding) {
      try {
        const decoded = window.google.maps.geometry.encoding.decodePath(polyline)
        setDecodedPath(decoded)
      } catch (error) {
        console.error("Error decoding polyline:", error)
      }
    }
  }, [polyline])

  // Compute route via Google Directions for native rendering
  useEffect(() => {
    if (!mapInstance) return
    if (!origin || !destination) return

    try {
      const svc = new google.maps.DirectionsService()
      svc.route(
        {
          origin: { lat: origin.lat, lng: origin.lng },
          destination: { lat: destination.lat, lng: destination.lng },
          travelMode: travelMode as unknown as google.maps.TravelMode,
          provideRouteAlternatives: true,
          drivingOptions: {
            departureTime: new Date(),
            trafficModel: google.maps.TrafficModel.BEST_GUESS,
          },
          avoidFerries,
          avoidHighways,
          avoidTolls,
          region: "IN",
        },
        (result, status) => {
          if (status === google.maps.DirectionsStatus.OK && result) {
            setSelectedRouteIndex(0)
            setDirections(result)
            try {
              const bounds = result.routes?.[0]?.bounds
              if (bounds) mapInstance.fitBounds(bounds)
            } catch {}
          } else {
            console.warn("[v0] DirectionsService status:", status)
            setDirections(null)
          }
        },
      )
    } catch (e) {
      console.error("[v0] Directions error:", e)
      setDirections(null)
    }
  }, [origin, destination, mapInstance, travelMode, avoidFerries, avoidHighways, avoidTolls])

  const getRouteSummary = (route: google.maps.DirectionsRoute) => {
    const distanceMeters = route.legs.reduce((sum, l) => sum + (l.distance?.value || 0), 0)
    const durationSeconds = route.legs.reduce((sum, l) => sum + (l.duration?.value || 0), 0)
    return {
      distanceKm: distanceMeters / 1000,
      durationMin: Math.round(durationSeconds / 60),
    }
  }

  const getPolylineColor = () => {
    switch (trafficDensity) {
      case 'high':
        return '#ef4444' // red
      case 'medium':
        return '#f97316' // orange
      case 'low':
        return '#10b981' // green
      default:
        return '#3b82f6' // blue
    }
  }

  const getTrafficLabel = () => {
    switch (trafficDensity) {
      case 'high':
        return 'Heavy Traffic'
      case 'medium':
        return 'Moderate Traffic'
      case 'low':
        return 'Light Traffic'
      default:
        return 'Unknown Traffic'
    }
  }

  const resetMapView = () => {
    if (mapInstance) {
      mapInstance.setCenter(mapCenter)
      mapInstance.setZoom(12)
    }
  }

  const mapContainerStyle = {
    width: "100%",
    height: "400px",
    borderRadius: "0.5rem",
  }

  const mapCenter = origin && destination && !userHasInteracted ? {
    lat: (origin.lat + destination.lat) / 2,
    lng: (origin.lng + destination.lng) / 2,
  } : {
    lat: 16.5062,
    lng: 80.6480
  }

  const mapOptions = {
    zoom: 12,
    mapTypeId: mapType,
    zoomControl: true,
    mapTypeControl: true,
    streetViewControl: true,
    fullscreenControl: true,
  }

  const handleLoadScriptError = (error: Error) => {
    console.error("[v0] LoadScript error:", error)
    setError(
      "Google Maps API failed to load. Ensure: 1) API key is valid, 2) Maps JavaScript API is enabled, 3) Places API is enabled, 4) Directions API is enabled in Google Cloud Console.",
    )
  }

  if (error) {
    return (
      <Card className="border-border bg-card/50 backdrop-blur">
        <CardHeader>
          <CardTitle className="text-foreground">Route Map</CardTitle>
          <CardDescription>
            Distance: {distance.toFixed(1)} km | Duration: {duration} min
            {trafficDensity && trafficDensity !== 'unknown' && (
              <span className="ml-2 text-xs px-2 py-1 rounded" style={{ backgroundColor: getPolylineColor(), color: 'white' }}>
                {getTrafficLabel()}
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-96 bg-slate-800 rounded-lg flex items-center justify-center p-4">
            <div className="text-center">
              <p className="text-red-400 font-medium mb-2">{error}</p>
              <div className="text-slate-500 text-sm space-y-1">
                <p>Setup Instructions:</p>
                <ol className="text-left inline-block">
                  <li>
                    1. Go to{" "}
                    <a
                      href="https://console.cloud.google.com"
                      target="_blank"
                      className="text-blue-400 hover:underline"
                      rel="noreferrer"
                    >
                      Google Cloud Console
                    </a>
                  </li>
                  <li>2. Enable: Maps JavaScript API, Places API, Directions API</li>
                  <li>3. Create an API key in Credentials</li>
                  <li>4. Add to environment: GOOGLE_MAPS_API_KEY=your-key</li>
                </ol>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!apiKey || isLoading) {
    return (
      <Card className="border-border bg-card/50 backdrop-blur">
        <CardHeader>
          <CardTitle className="text-foreground">Route Map</CardTitle>
          <CardDescription>
            Distance: {distance.toFixed(1)} km | Duration: {duration} min
            {trafficDensity && trafficDensity !== 'unknown' && (
              <span className="ml-2 text-xs px-2 py-1 rounded" style={{ backgroundColor: getPolylineColor(), color: 'white' }}>
                {getTrafficLabel()}
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-96 bg-slate-800 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
              <p className="text-slate-400">Loading map...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-border bg-card/50 backdrop-blur">
      <CardHeader>
        <CardTitle className="text-foreground">Route Map</CardTitle>
        <CardDescription>
          Distance: {distance.toFixed(1)} km | Duration: {duration} min
          {trafficDensity && trafficDensity !== 'unknown' && (
            <span className="ml-2 text-xs px-2 py-1 rounded" style={{ backgroundColor: getPolylineColor(), color: 'white' }}>
              {getTrafficLabel()}
            </span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <LoadScript
          googleMapsApiKey={apiKey}
          libraries={["geometry"]}
          onLoad={() => console.log("[v0] Google Maps loaded successfully")}
          onError={handleLoadScriptError}
        >
          <GoogleMap
            mapContainerStyle={mapContainerStyle}
            center={mapCenter}
            zoom={12}
            options={mapOptions}
            onLoad={(map) => {
              console.log("[v0] Map initialized successfully")
              setMapInstance(map)
            }}
            onDragStart={() => setUserHasInteracted(true)}
            onZoomChanged={() => setUserHasInteracted(true)}
          >
            {/* Live Traffic Layer */}
            {showTraffic && <TrafficLayer />}

            {/* Optional transit/bicycling layers */}
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

            {/* Directions rendering (preferred) */}
            {directions ? (
              <DirectionsRenderer
                options={{
                  directions,
                  routeIndex: selectedRouteIndex,
                  suppressMarkers: false,
                  preserveViewport: false,
                  polylineOptions: {
                    strokeOpacity: 1,
                    strokeWeight: 6,
                  },
                }}
              />
            ) : (
              <>
                {/* Fallback markers and polyline using provided data */}
                <Marker
                  position={{ lat: origin.lat, lng: origin.lng }}
                  title={origin.name}
                  onClick={() => setSelectedMarker("origin")}
                  icon={{
                    path: "M0,-28a28,28 0 0,1 56,0c0,28-28,68-28,68S0,0 0,-28z",
                    fillColor: "#10b981",
                    fillOpacity: 1,
                    strokeColor: "#fff",
                    strokeWeight: 2,
                    scale: 0.5,
                  }}
                />
                <Marker
                  position={{ lat: destination.lat, lng: destination.lng }}
                  title={destination.name}
                  onClick={() => setSelectedMarker("destination")}
                  icon={{
                    path: "M0,-28a28,28 0 0,1 56,0c0,28-28,68-28,68S0,0 0,-28z",
                    fillColor: "#ef4444",
                    fillOpacity: 1,
                    strokeColor: "#fff",
                    strokeWeight: 2,
                    scale: 0.5,
                  }}
                />
                {/* Route Polyline (fallback only) */}
                {decodedPath.length > 0 && !directions && (
                  <Polyline
                    path={decodedPath}
                    options={{
                      strokeColor: getPolylineColor(),
                      strokeWeight: 5,
                      strokeOpacity: 0.9,
                      geodesic: true,
                    }}
                  />
                )}
              </>
            )}

            

            {/* Origin Info Window */}
            {selectedMarker === "origin" && (
              <InfoWindow position={{ lat: origin.lat, lng: origin.lng }} onCloseClick={() => setSelectedMarker(null)}>
                <div className="bg-popover text-popover-foreground p-3 rounded text-sm border border-border">
                  <h3 className="font-semibold">Origin</h3>
                  <p className="text-xs text-muted-foreground">{origin.name}</p>
                </div>
              </InfoWindow>
            )}

            {/* Destination Info Window */}
            {selectedMarker === "destination" && (
              <InfoWindow
                position={{ lat: destination.lat, lng: destination.lng }}
                onCloseClick={() => setSelectedMarker(null)}
              >
                <div className="bg-popover text-popover-foreground p-3 rounded text-sm border border-border">
                  <h3 className="font-semibold">Destination</h3>
                  <p className="text-xs text-muted-foreground">{destination.name}</p>
                </div>
              </InfoWindow>
            )}
          </GoogleMap>
        </LoadScript>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-4 mb-4 text-sm">
          <label className="flex items-center gap-2 text-foreground">
            <input
              type="checkbox"
              checked={showTraffic}
              onChange={(e) => setShowTraffic(e.target.checked)}
              className="accent-primary"
            />
            Traffic
          </label>
          <label className="flex items-center gap-2 text-foreground">
            <input
              type="checkbox"
              checked={showTransit}
              onChange={(e) => setShowTransit(e.target.checked)}
              className="accent-primary"
            />
            Transit
          </label>
          <label className="flex items-center gap-2 text-foreground">
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
            <span className="text-muted-foreground">Mode:</span>
            <div className="inline-flex overflow-hidden rounded-md border">
              <button
                className={`px-2 py-1 ${travelMode === 'DRIVING' ? 'bg-accent text-accent-foreground' : ''}`}
                onClick={() => setTravelMode('DRIVING')}
              >Driving</button>
              <button
                className={`px-2 py-1 border-l ${travelMode === 'TRANSIT' ? 'bg-accent text-accent-foreground' : ''}`}
                onClick={() => setTravelMode('TRANSIT')}
              >Transit</button>
              <button
                className={`px-2 py-1 border-l ${travelMode === 'WALKING' ? 'bg-accent text-accent-foreground' : ''}`}
                onClick={() => setTravelMode('WALKING')}
              >Walking</button>
              <button
                className={`px-2 py-1 border-l ${travelMode === 'BICYCLING' ? 'bg-accent text-accent-foreground' : ''}`}
                onClick={() => setTravelMode('BICYCLING')}
              >Bicycle</button>
            </div>
          </div>
          <div className="h-5 w-px bg-border" />
          <label className="flex items-center gap-2 text-foreground">
            <input type="checkbox" className="accent-primary" checked={avoidTolls} onChange={(e) => setAvoidTolls(e.target.checked)} />
            Avoid tolls
          </label>
          <label className="flex items-center gap-2 text-foreground">
            <input type="checkbox" className="accent-primary" checked={avoidHighways} onChange={(e) => setAvoidHighways(e.target.checked)} />
            Avoid highways
          </label>
          <label className="flex items-center gap-2 text-foreground">
            <input type="checkbox" className="accent-primary" checked={avoidFerries} onChange={(e) => setAvoidFerries(e.target.checked)} />
            Avoid ferries
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
                  try {
                    mapInstance?.setCenter(loc)
                    mapInstance?.setZoom(14)
                  } catch {}
                },
                () => {},
                { enableHighAccuracy: true, timeout: 10000 },
              )
            }}
          >
            My location
          </button>
        </div>
        {directions && directions.routes?.length > 1 && (
          <div className="mb-2 flex flex-wrap gap-2">
            {directions.routes.map((r, idx) => {
              const { distanceKm, durationMin } = getRouteSummary(r)
              const active = idx === selectedRouteIndex
              return (
                <button
                  key={idx}
                  className={`px-3 py-1 rounded-md border text-sm ${active ? 'bg-primary text-primary-foreground border-primary' : 'bg-card text-foreground border-border hover:bg-accent hover:text-accent-foreground'}`}
                  onClick={() => setSelectedRouteIndex(idx)}
                >
                  {durationMin} min · {distanceKm.toFixed(1)} km {active ? '(Selected)' : ''}
                </button>
              )
            })}
          </div>
        )}
        {/* Traffic Density Legend */}
        <div className="mt-4 flex items-center justify-between gap-4 text-sm">
          <div className="flex gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span className="text-foreground">Light Traffic</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-orange-500"></div>
              <span className="text-foreground">Moderate</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <span className="text-foreground">Heavy</span>
            </div>
          </div>
          <button
            onClick={resetMapView}
            className="flex items-center gap-1 px-3 py-1 text-xs rounded-md bg-secondary hover:bg-secondary/80 text-secondary-foreground transition-colors"
            title="Reset map view"
          >
            🏠 Reset View
          </button>
        </div>
      </CardContent>
    </Card>
  )
}
