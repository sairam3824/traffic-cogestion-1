"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Shield } from "lucide-react"

export default function MainNav() {
  const [user, setUser] = useState<any>(null)
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    }

    getUser()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null)
      }
    )

    return () => subscription.unsubscribe()
  }, [supabase])

  const isAdmin = user?.email === 'admin@traffic.com'

  return (
    <div className="flex gap-4">
      <a href="/route-planner" className="text-muted-foreground hover:text-foreground transition-colors text-sm">
        Route Planner
      </a>
      <a href="/monitoring" className="text-muted-foreground hover:text-foreground transition-colors text-sm">
        Monitoring
      </a>
      {isAdmin && (
        <a href="/admin" className="text-blue-400 hover:text-blue-300 transition-colors text-sm flex items-center gap-1">
          <Shield className="w-3 h-3" />
          Admin
        </a>
      )}
    </div>
  )
}