/**
 * Notification Service
 * Handles sending in-app and push notifications only
 * Email and SMS notifications removed per requirements
 */

export interface NotificationPayload {
  subject: string
  message: string
  alertType: "congestion" | "incident" | "weather"
  severity: "low" | "medium" | "high" | "critical"
  segmentId: string
  timestamp: Date
}

export class NotificationService {
  /**
   * Send push notification
   * Removed email and SMS methods, keeping only push notifications
   */
  async sendPushNotification(payload: NotificationPayload): Promise<boolean> {
    try {
      // In production, integrate with Firebase Cloud Messaging or similar
      console.log(`[PUSH] Sending notification:`, {
        subject: payload.subject,
        message: payload.message,
        severity: payload.severity,
        alertType: payload.alertType,
        segmentId: payload.segmentId,
        timestamp: payload.timestamp,
      })

      // Mock implementation - in production, call push notification service API
      return true
    } catch (error) {
      console.error("Error sending push notification:", error)
      return false
    }
  }

  /**
   * Send in-app notification (stored in database)
   * Added in-app notification method for dashboard display
   */
  async sendInAppNotification(payload: NotificationPayload): Promise<boolean> {
    try {
      // Store notification in database for dashboard display
      console.log(`[IN-APP] Storing notification:`, {
        subject: payload.subject,
        message: payload.message,
        severity: payload.severity,
        alertType: payload.alertType,
      })

      // In production, store in notifications table
      return true
    } catch (error) {
      console.error("Error storing in-app notification:", error)
      return false
    }
  }

  /**
   * Send notification via available channels
   * Updated to use only push and in-app notifications
   */
  async sendNotification(payload: NotificationPayload): Promise<void> {
    const promises = [this.sendPushNotification(payload), this.sendInAppNotification(payload)]

    await Promise.all(promises)
  }

  /**
   * Format alert message
   */
  formatAlertMessage(segmentName: string, speed: number, volume: number, severity: string): string {
    const severityEmoji = {
      low: "⚠️",
      medium: "🟡",
      high: "🔴",
      critical: "🚨",
    }

    return `${severityEmoji[severity as keyof typeof severityEmoji]} ${segmentName}: Speed ${speed.toFixed(1)} km/h, Volume ${volume} vehicles. Severity: ${severity.toUpperCase()}`
  }
}
