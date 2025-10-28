"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Bell, Mail, Phone } from "lucide-react"

export default function AlertManager() {
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage("")

    try {
      const response = await fetch("/api/alerts/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          phone,
          alertTypes: ["congestion", "incident", "weather"],
          minSeverity: "medium",
        }),
      })

      const data = await response.json()

      if (data.success) {
        setMessage("Subscription successful! You will receive alerts.")
        setEmail("")
        setPhone("")
      } else {
        setMessage("Failed to subscribe. Please try again.")
      }
    } catch (error) {
      setMessage("Error subscribing to alerts.")
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="border-slate-700 bg-slate-900/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <Bell className="w-5 h-5" />
          Alert Subscriptions
        </CardTitle>
        <CardDescription>Subscribe to traffic alerts via email or SMS</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubscribe} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Email Address
            </label>
            <Input
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="bg-slate-800 border-slate-700 text-white"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
              <Phone className="w-4 h-4" />
              Phone Number (Optional)
            </label>
            <Input
              type="tel"
              placeholder="+1 (555) 000-0000"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="bg-slate-800 border-slate-700 text-white"
            />
          </div>

          <Button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700">
            {loading ? "Subscribing..." : "Subscribe to Alerts"}
          </Button>

          {message && <p className="text-sm text-center text-slate-300">{message}</p>}
        </form>
      </CardContent>
    </Card>
  )
}
