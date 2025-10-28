import { createClient } from "@/lib/supabase/server"

export interface AlertConfig {
  congestionThreshold: number // Speed threshold for congestion (km/h)
  volumeThreshold: number // Vehicle volume threshold
  severityLevels: {
    low: number
    medium: number
    high: number
    critical: number
  }
}

const DEFAULT_CONFIG: AlertConfig = {
  congestionThreshold: 30,
  volumeThreshold: 800,
  severityLevels: {
    low: 40,
    medium: 30,
    high: 20,
    critical: 10,
  },
}

export class AlertService {
  private config: AlertConfig

  constructor(config: Partial<AlertConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
  }

  /**
   * Determine alert severity based on traffic conditions
   */
  determineSeverity(speed: number, volume: number): string {
    if (speed <= this.config.severityLevels.critical && volume > this.config.volumeThreshold) {
      return "critical"
    }
    if (speed <= this.config.severityLevels.high) {
      return "high"
    }
    if (speed <= this.config.severityLevels.medium) {
      return "medium"
    }
    if (speed <= this.config.severityLevels.low) {
      return "low"
    }
    return "low"
  }

  /**
   * Check if congestion alert should be created
   */
  shouldCreateCongestionAlert(speed: number, volume: number): boolean {
    return speed < this.config.congestionThreshold && volume > this.config.volumeThreshold / 2
  }

  /**
   * Create congestion alert
   */
  async createCongestionAlert(segmentId: string, speed: number, volume: number): Promise<void> {
    const supabase = await createClient()
    const severity = this.determineSeverity(speed, volume)

    const { error } = await supabase.from("alerts").insert([
      {
        segment_id: segmentId,
        alert_type: "congestion",
        severity,
        message: `Heavy congestion detected: Speed ${speed.toFixed(1)} km/h, Volume ${volume} vehicles`,
        is_active: true,
      },
    ])

    if (error) {
      console.error("Error creating congestion alert:", error)
    }
  }

  /**
   * Resolve active alerts for a segment
   */
  async resolveAlerts(segmentId: string): Promise<void> {
    const supabase = await createClient()

    const { error } = await supabase
      .from("alerts")
      .update({ is_active: false, resolved_at: new Date().toISOString() })
      .eq("segment_id", segmentId)
      .eq("is_active", true)

    if (error) {
      console.error("Error resolving alerts:", error)
    }
  }

  /**
   * Get active alerts for a segment
   */
  async getActiveAlerts(segmentId: string): Promise<any[]> {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from("alerts")
      .select("*")
      .eq("segment_id", segmentId)
      .eq("is_active", true)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching active alerts:", error)
      return []
    }

    return data || []
  }
}
