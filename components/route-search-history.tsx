"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Clock, MapPin, X, Trash2 } from "lucide-react"

interface LocationPrediction {
  place_id: string
  description: string
  main_text: string
  secondary_text?: string
  lat: number
  lng: number
}

interface SearchHistoryItem {
  id: string
  origin: LocationPrediction
  destination: LocationPrediction
  timestamp: number
  searchCount: number
}

interface RouteSearchHistoryProps {
  onHistorySelect: (origin: LocationPrediction, destination: LocationPrediction) => void
  onRegisterSave?: (saveFunction: (origin: LocationPrediction, destination: LocationPrediction) => void) => void
}

export default function RouteSearchHistory({ onHistorySelect, onRegisterSave }: RouteSearchHistoryProps) {
  const [history, setHistory] = useState<SearchHistoryItem[]>([])

  // Load history from localStorage on component mount
  useEffect(() => {
    const savedHistory = localStorage.getItem('route-search-history')
    if (savedHistory) {
      try {
        const parsed = JSON.parse(savedHistory)
        setHistory(parsed)
      } catch (error) {
        console.error('Error parsing search history:', error)
        localStorage.removeItem('route-search-history')
      }
    } else {
      // Add some sample history for demonstration
      const sampleHistory: SearchHistoryItem[] = [
        {
          id: 'sample-1',
          origin: {
            place_id: 'ChIJlfcOXx8XTjoRLJJAgbJqTtI',
            description: 'Vijayawada, Andhra Pradesh, India',
            main_text: 'Vijayawada',
            secondary_text: 'Andhra Pradesh, India',
            lat: 16.5062,
            lng: 80.648
          },
          destination: {
            place_id: 'ChIJ-_tVJHYYTjoRcVJNRtBvGTI',
            description: 'Guntur, Andhra Pradesh, India',
            main_text: 'Guntur',
            secondary_text: 'Andhra Pradesh, India',
            lat: 16.3067,
            lng: 80.4365
          },
          timestamp: Date.now() - 2 * 60 * 60 * 1000, // 2 hours ago
          searchCount: 3
        },
        {
          id: 'sample-2',
          origin: {
            place_id: 'ChIJbU60yXAWrjsR4E9-UejD3_g',
            description: 'Hyderabad, Telangana, India',
            main_text: 'Hyderabad',
            secondary_text: 'Telangana, India',
            lat: 17.3850,
            lng: 78.4867
          },
          destination: {
            place_id: 'ChIJlfcOXx8XTjoRLJJAgbJqTtI',
            description: 'Vijayawada, Andhra Pradesh, India',
            main_text: 'Vijayawada',
            secondary_text: 'Andhra Pradesh, India',
            lat: 16.5062,
            lng: 80.648
          },
          timestamp: Date.now() - 24 * 60 * 60 * 1000, // 1 day ago
          searchCount: 1
        }
      ]
      setHistory(sampleHistory)
      localStorage.setItem('route-search-history', JSON.stringify(sampleHistory))
    }
  }, [])

  // Save a new search to history
  const saveToHistory = (origin: LocationPrediction, destination: LocationPrediction) => {
    const searchKey = `${origin.place_id}-${destination.place_id}`
    
    setHistory(prevHistory => {
      // Check if this route already exists
      const existingIndex = prevHistory.findIndex(item => 
        item.origin.place_id === origin.place_id && 
        item.destination.place_id === destination.place_id
      )

      let newHistory: SearchHistoryItem[]

      if (existingIndex >= 0) {
        // Update existing entry - move to top and increment count
        const existingItem = prevHistory[existingIndex]
        newHistory = [
          {
            ...existingItem,
            timestamp: Date.now(),
            searchCount: existingItem.searchCount + 1
          },
          ...prevHistory.filter((_, index) => index !== existingIndex)
        ]
      } else {
        // Add new entry
        const newItem: SearchHistoryItem = {
          id: searchKey,
          origin,
          destination,
          timestamp: Date.now(),
          searchCount: 1
        }
        newHistory = [newItem, ...prevHistory]
      }

      // Keep only the last 10 searches
      newHistory = newHistory.slice(0, 10)

      // Save to localStorage
      localStorage.setItem('route-search-history', JSON.stringify(newHistory))
      
      return newHistory
    })
  }

  // Remove a specific item from history
  const removeFromHistory = (id: string) => {
    setHistory(prevHistory => {
      const newHistory = prevHistory.filter(item => item.id !== id)
      localStorage.setItem('route-search-history', JSON.stringify(newHistory))
      return newHistory
    })
  }

  // Clear all history
  const clearHistory = () => {
    setHistory([])
    localStorage.removeItem('route-search-history')
  }

  // Handle clicking on a history item
  const handleHistoryClick = (item: SearchHistoryItem) => {
    onHistorySelect(item.origin, item.destination)
    // Update the search count and timestamp
    saveToHistory(item.origin, item.destination)
  }

  // Format timestamp for display
  const formatTimestamp = (timestamp: number) => {
    const now = Date.now()
    const diff = now - timestamp
    const minutes = Math.floor(diff / (1000 * 60))
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    if (days < 7) return `${days}d ago`
    return new Date(timestamp).toLocaleDateString()
  }

  // Register saveToHistory function with parent component
  useEffect(() => {
    if (onRegisterSave) {
      onRegisterSave(saveToHistory)
    }
  }, [onRegisterSave])

  if (history.length === 0) {
    return (
      <Card className="border-border bg-card/50 backdrop-blur">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-foreground flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Recent Searches
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            No recent searches. Your route history will appear here.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-border bg-card/50 backdrop-blur">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-foreground flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Recent Searches
          </CardTitle>
          <button
            onClick={clearHistory}
            className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded"
            title="Clear all history"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {history.map((item) => (
          <div
            key={item.id}
            className="group relative bg-muted/50 rounded-lg p-3 hover:bg-muted transition-colors cursor-pointer"
            onClick={() => handleHistoryClick(item)}
          >
            <button
              onClick={(e) => {
                e.stopPropagation()
                removeFromHistory(item.id)
              }}
              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground p-1 rounded"
              title="Remove from history"
            >
              <X className="w-3 h-3" />
            </button>

            <div className="space-y-2 pr-6">
              {/* Origin */}
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="w-3 h-3 text-green-500 flex-shrink-0" />
                <span className="text-foreground font-medium truncate">
                  {item.origin.main_text}
                </span>
              </div>

              {/* Destination */}
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="w-3 h-3 text-red-500 flex-shrink-0" />
                <span className="text-foreground font-medium truncate">
                  {item.destination.main_text}
                </span>
              </div>

              {/* Metadata */}
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{formatTimestamp(item.timestamp)}</span>
                {item.searchCount > 1 && (
                  <span>{item.searchCount} times</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}