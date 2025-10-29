"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Users, MapPin, AlertTriangle, Activity, LogOut, Shield } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

interface AdminStats {
  totalUsers: number
  totalSegments: number
  activeAlerts: number
  totalObservations: number
}

export default function AdminPage() {
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    totalSegments: 0,
    activeAlerts: 0,
    totalObservations: 0
  })
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      
      if (!user || user.email !== 'admin@traffic.com') {
        router.push('/')
        return
      }
    }

    const fetchStats = async () => {
      try {
        // Fetch various statistics
        const [segmentsRes, alertsRes, observationsRes] = await Promise.all([
          fetch('/api/traffic/segments'),
          fetch('/api/alerts?isActive=true'),
          fetch('/api/traffic/observations')
        ])

        const segments = await segmentsRes.json()
        const alerts = await alertsRes.json()
        const observations = await observationsRes.json()

        setStats({
          totalUsers: 5, // Mock data since we don't have user count API
          totalSegments: segments.success ? segments.data.length : 0,
          activeAlerts: alerts.success ? alerts.data.length : 0,
          totalObservations: observations.success ? observations.data.length : 0
        })
      } catch (error) {
        console.error('Error fetching admin stats:', error)
      } finally {
        setLoading(false)
      }
    }

    getUser()
    fetchStats()
  }, [supabase, router])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/auth/signin')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-white">Loading admin dashboard...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Shield className="w-8 h-8 text-blue-500" />
              <h1 className="text-4xl font-bold text-white">Admin Dashboard</h1>
            </div>
            <p className="text-slate-400">System administration and monitoring</p>
            {user && (
              <Badge variant="outline" className="text-blue-400 border-blue-400">
                {user.email}
              </Badge>
            )}
          </div>
          <Button
            onClick={handleSignOut}
            variant="outline"
            className="border-slate-600 text-slate-300 hover:bg-slate-800"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-slate-700 bg-slate-900/50 backdrop-blur">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-300 flex items-center gap-2">
                <Users className="w-4 h-4" />
                Total Users
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats.totalUsers}</div>
              <p className="text-xs text-slate-400">Registered accounts</p>
            </CardContent>
          </Card>

          <Card className="border-slate-700 bg-slate-900/50 backdrop-blur">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-300 flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Traffic Segments
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats.totalSegments}</div>
              <p className="text-xs text-slate-400">Monitored locations</p>
            </CardContent>
          </Card>

          <Card className="border-slate-700 bg-slate-900/50 backdrop-blur">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-300 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Active Alerts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats.activeAlerts}</div>
              <p className="text-xs text-slate-400">Current incidents</p>
            </CardContent>
          </Card>

          <Card className="border-slate-700 bg-slate-900/50 backdrop-blur">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-300 flex items-center gap-2">
                <Activity className="w-4 h-4" />
                Observations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats.totalObservations}</div>
              <p className="text-xs text-slate-400">Data points collected</p>
            </CardContent>
          </Card>
        </div>

        {/* Admin Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="border-slate-700 bg-slate-900/50 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-white">System Management</CardTitle>
              <CardDescription className="text-slate-400">
                Core system administration tools
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                onClick={() => router.push('/monitoring')}
                className="w-full justify-start bg-blue-600 hover:bg-blue-700"
              >
                <Activity className="w-4 h-4 mr-2" />
                System Monitoring
              </Button>
              <Button
                onClick={() => router.push('/traffic-prediction')}
                className="w-full justify-start bg-green-600 hover:bg-green-700"
              >
                <MapPin className="w-4 h-4 mr-2" />
                Traffic Prediction
              </Button>
              <Button
                onClick={() => router.push('/route-planner')}
                className="w-full justify-start bg-purple-600 hover:bg-purple-700"
              >
                <MapPin className="w-4 h-4 mr-2" />
                Route Planner
              </Button>
            </CardContent>
          </Card>

          <Card className="border-slate-700 bg-slate-900/50 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-white">Admin Tools</CardTitle>
              <CardDescription className="text-slate-400">
                Administrative functions and utilities
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                onClick={() => alert('User management coming soon')}
                variant="outline"
                className="w-full justify-start border-slate-600 text-slate-300 hover:bg-slate-800"
              >
                <Users className="w-4 h-4 mr-2" />
                Manage Users
              </Button>
              <Button
                onClick={() => alert('Alert management coming soon')}
                variant="outline"
                className="w-full justify-start border-slate-600 text-slate-300 hover:bg-slate-800"
              >
                <AlertTriangle className="w-4 h-4 mr-2" />
                Manage Alerts
              </Button>
              <Button
                onClick={() => alert('System settings coming soon')}
                variant="outline"
                className="w-full justify-start border-slate-600 text-slate-300 hover:bg-slate-800"
              >
                <Activity className="w-4 h-4 mr-2" />
                System Settings
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card className="border-slate-700 bg-slate-900/50 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-white">Recent Activity</CardTitle>
            <CardDescription className="text-slate-400">
              Latest system events and user actions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-slate-300">System health check completed</span>
                </div>
                <span className="text-xs text-slate-400">2 minutes ago</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-slate-300">New traffic data processed</span>
                </div>
                <span className="text-xs text-slate-400">5 minutes ago</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  <span className="text-slate-300">Alert generated for NH-16</span>
                </div>
                <span className="text-xs text-slate-400">15 minutes ago</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}