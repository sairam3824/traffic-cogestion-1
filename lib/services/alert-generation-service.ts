import { createClient } from "@/lib/supabase/server"
import { AlertService } from "./alert-service"
import { NotificationService } from "./notification-service"

export class AlertGenerationService {
  private alertService: AlertService
  private notificationService: NotificationService

  constructor() {
    this.alertService = new AlertService()
    this.notificationService = new NotificationService()
  }

  /**
   * Check predictions and generate alerts
   */
  async checkPredictionsAndGenerateAlerts(): Promise<void> {
    try {
      const supabase = await createClient()

      // Get all traffic segments
      const { data: segments, error: segmentsError } = await supabase.from("traffic_segments").select("*")

      if (segmentsError || !segments) {
        console.error("Error fetching segments:", segmentsError)
        return
      }

      // Check each segment
      for (const segment of segments) {
        await this.checkSegmentPredictions(segment)
      }
    } catch (error) {
      console.error("Error in alert generation:", error)
    }
  }

  /**
   * Check predictions for a specific segment
   */
  private async checkSegmentPredictions(segment: any): Promise<void> {
    try {
      const supabase = await createClient()

      // Get latest predictions from LSTM model
      const { data: predictions, error } = await supabase
        .from("predictions")
        .select("*")
        .eq("segment_id", segment.id)
        .eq("model_type", "lstm")
        .order("prediction_timestamp", { ascending: false })
        .limit(1)

      if (error || !predictions || predictions.length === 0) {
        return
      }

      const prediction = predictions[0]

      // Check if alert should be created
      if (this.alertService.shouldCreateCongestionAlert(prediction.predicted_speed_kmh, prediction.predicted_volume)) {
        const severity = this.alertService.determineSeverity(
          prediction.predicted_speed_kmh,
          prediction.predicted_volume,
        )

        // Check if alert already exists
        const { data: existingAlerts } = await supabase
          .from("alerts")
          .select("*")
          .eq("segment_id", segment.id)
          .eq("is_active", true)
          .eq("alert_type", "congestion")

        if (!existingAlerts || existingAlerts.length === 0) {
          // Create new alert
          await this.alertService.createCongestionAlert(
            segment.id,
            prediction.predicted_speed_kmh,
            prediction.predicted_volume,
          )

          // Send notification
          const message = this.notificationService.formatAlertMessage(
            segment.segment_name,
            prediction.predicted_speed_kmh,
            prediction.predicted_volume,
            severity,
          )

          await this.notificationService.sendNotification({
            subject: `Traffic Alert: ${segment.segment_name}`,
            message,
            alertType: "congestion",
            severity: severity as any,
            segmentId: segment.id,
            timestamp: new Date(),
          })
        }
      } else {
        // Resolve active alerts if conditions improve
        const { data: activeAlerts } = await supabase
          .from("alerts")
          .select("*")
          .eq("segment_id", segment.id)
          .eq("is_active", true)
          .eq("alert_type", "congestion")

        if (activeAlerts && activeAlerts.length > 0) {
          await this.alertService.resolveAlerts(segment.id)
        }
      }
    } catch (error) {
      console.error(`Error checking segment ${segment.id}:`, error)
    }
  }

  /**
   * Check for incident-based alerts
   */
  async checkIncidentAlerts(): Promise<void> {
    try {
      const supabase = await createClient()

      // Get recent events
      const { data: events, error } = await supabase
        .from("events")
        .select("*")
        .gte("start_time", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .eq("event_type", "accident")

      if (error || !events) {
        return
      }

      // Create alerts for incidents
      for (const event of events) {
        const { data: existingAlerts } = await supabase
          .from("alerts")
          .select("*")
          .eq("segment_id", event.segment_id)
          .eq("alert_type", "incident")
          .eq("is_active", true)

        if (!existingAlerts || existingAlerts.length === 0) {
          const { error: insertError } = await supabase.from("alerts").insert([
            {
              segment_id: event.segment_id,
              alert_type: "incident",
              severity: event.severity,
              message: `Incident: ${event.description}`,
              is_active: true,
            },
          ])

          if (!insertError) {
            await this.notificationService.sendNotification({
              subject: `Incident Alert`,
              message: `Incident detected: ${event.description}`,
              alertType: "incident",
              severity: event.severity,
              segmentId: event.segment_id,
              timestamp: new Date(),
            })
          }
        }
      }
    } catch (error) {
      console.error("Error checking incident alerts:", error)
    }
  }

  /**
   * Check for weather-based alerts
   */
  async checkWeatherAlerts(): Promise<void> {
    try {
      const supabase = await createClient()

      // Get latest weather data
      const { data: weatherData, error } = await supabase
        .from("weather_data")
        .select("*")
        .order("timestamp", { ascending: false })
        .limit(1)

      if (error || !weatherData || weatherData.length === 0) {
        return
      }

      const weather = weatherData[0]

      // Check for severe weather conditions
      if (weather.weather_condition === "snowy" || weather.precipitation_mm > 10) {
        const { data: segments } = await supabase.from("traffic_segments").select("id")

        if (segments) {
          for (const segment of segments) {
            const { data: existingAlerts } = await supabase
              .from("alerts")
              .select("*")
              .eq("segment_id", segment.id)
              .eq("alert_type", "weather")
              .eq("is_active", true)

            if (!existingAlerts || existingAlerts.length === 0) {
              const message =
                weather.weather_condition === "snowy"
                  ? "Snow detected - expect reduced visibility and traction"
                  : `Heavy precipitation (${weather.precipitation_mm}mm) - exercise caution`

              await supabase.from("alerts").insert([
                {
                  segment_id: segment.id,
                  alert_type: "weather",
                  severity: "high",
                  message,
                  is_active: true,
                },
              ])
            }
          }
        }
      }
    } catch (error) {
      console.error("Error checking weather alerts:", error)
    }
  }
}
