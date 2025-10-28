"use client"

import { useEffect, useState } from "react"
import { CheckCircle, XCircle } from "lucide-react"

export default function BackendStatus() {
  const [flaskStatus, setFlaskStatus] = useState<'checking' | 'online' | 'offline'>('checking')
  const [lastCheck, setLastCheck] = useState<Date | null>(null)

  const checkFlaskStatus = async () => {
    try {
      const response = await fetch('/api/ucs-model-info')
      const result = await response.json()
      
      if (result.success) {
        setFlaskStatus('online')
      } else {
        setFlaskStatus('offline')
      }
    } catch (error) {
      setFlaskStatus('offline')
    }
    setLastCheck(new Date())
  }

  useEffect(() => {
    checkFlaskStatus()
    const interval = setInterval(checkFlaskStatus, 10000) // Check every 10 seconds
    return () => clearInterval(interval)
  }, [])

  if (flaskStatus === 'checking') {
    return null // Don't show while checking initially
  }

  if (flaskStatus === 'offline') {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <div className="bg-red-500/90 backdrop-blur text-white px-4 py-3 rounded-lg shadow-lg flex items-start gap-3 max-w-md">
          <XCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold text-sm">Flask Backend Offline</p>
            <p className="text-xs mt-1 opacity-90">
              Start the backend: <code className="bg-red-600/50 px-1 rounded">start-flask.bat</code>
            </p>
            <button 
              onClick={checkFlaskStatus}
              className="text-xs mt-2 underline hover:no-underline"
            >
              Retry now
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="bg-green-500/90 backdrop-blur text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
        <CheckCircle className="h-4 w-4" />
        <span className="text-xs font-medium">Backend Online</span>
      </div>
    </div>
  )
}
