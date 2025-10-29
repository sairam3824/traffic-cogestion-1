"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Clock, MapPin, X, Trash2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

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
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const supabase = createClient()

  // Get user and load history
  useEffect(() => {
    const initializeHistory = async () => {
      try {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser()
        setUser(user)

        if (user) {
          // Load history from database
          await loadHistoryFromDatabase()
        } else {
          // Load from localStorage for unauthenticated users
          loadHistoryFromLocalStorage()
        }
      } catch (error) {
        console.error('Error initializing history:', error)
        loadHistoryFromLocalStorage()
      } finally {
        setLoading(false)
      }
    }

    initializeHistory()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null)
        if (session?.user) {
          await loadHistoryFromDatabase()
        } else {
          loadHistoryFromLocalStorage()
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [supabase])

  // Load history from database
  const loadHistoryFromDatabase = async () => {
    try {
      const response = await fetch('/api/user/search-history')
      const result = await response.json()

      if (result.success) {
        setHistory(result.data || [])
      } else {
        // If table doesn't exist, fall back to localStorage
        console.log('Database table not ready, using localStorage')
        loadHistoryFromLocalStorage()
      }
    } catch (error) {
      console.error('Error loading search history:', error)
      loadHistoryFromLocalStorage()
    }
  }

  // Load history from localStorage (fallback)
  const loadHistoryFromLocalStorage = () => {
    const savedHistory = localStorage.getItem('route-search-history')
    if (savedHistory) {
      try {
        const parsed = JSON.parse(savedHistory)
        setHistory(parsed)
      } catch (error) {
        console.error('Error parsing search history:', error)
        localStorage.removeItem('route-search-history')
        setHistory([])
      }
    } else {
      setHistory([])
    }
  }

  // Save a new search to history
  const saveToHistory = async (origin: LocationPrediction, destination: LocationPrediction) => {
    if (user) {
      // Save to database for authenticated users
      try {
        const response = await fetch('/api/user/search-history', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ origin, destination }),
        })

        if (response.ok) {
          // Reload history from database
          await loadHistoryFromDatabase()
        } else {
          console.log('Database not ready, saving to localStorage')
          saveToLocalStorage(origin, destination)
        }
      } catch (error) {
        console.error('Error saving search history:', error)
        saveToLocalStorage(origin, destination)
      }
    } else {
      // Save to localStorage for unauthenticated users
      saveToLocalStorage(origin, destination)
    }
  }

  // Save to localStorage (fallback)
  const saveToLocalStorage = (origin: LocationPrediction, destination: LocationPrediction) => {
    const searchKey = `${origin.place_id}-${destination.place_id}`
    
    setHistory(prevHistory => {
      const existingIndex = prevHistory.findIndex(item => 
        item.origin.place_id === origin.place_id && 
        item.destination.place_id === destination.place_id
      )

      let newHistory: SearchHistoryItem[]

      if (existingIndex >= 0) {
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
        const newItem: SearchHistoryItem = {
          id: searchKey,
          origin,
          destination,
          timestamp: Date.now(),
          searchCount: 1
        }
        newHistory = [newItem, ...prevHistory]
      }

      newHistory = newHistory.slice(0, 10)
      localStorage.setItem('route-search-history', JSON.stringify(newHistory))
      return newHistory
    })
  }

  // Remove a specific item from history
  const removeFromHistory = async (id: string) => {
    if (user) {
      try {
        const response = await fetch(`/api/user/search-history?id=${id}`, {
          method: 'DELETE',
        })

        if (response.ok) {
          await loadHistoryFromDatabase()
        } else {
          console.error('Failed to delete search history item')
        }
      } catch (error) {
        console.error('Error deleting search history item:', error)
      }
    } else {
      setHistory(prevHistory => {
        const newHistory = prevHistory.filter(item => item.id !== id)
        localStorage.setItem('route-search-history', JSON.stringify(newHistory))
        return newHistory
      })
    }
  }

  // Clear all history
  const clearHistory = async () => {
    if (user) {
      try {
        const response = await fetch('/api/user/search-history?id=all', {
          method: 'DELETE',
        })

        if (response.ok) {
          setHistory([])
        } else {
          console.error('Failed to clear search history')
        }
      } catch (error) {
        console.error('Error clearing search history:', error)
      }
    } else {
      setHistory([])
      localStorage.removeItem('route-search-history')
    }
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