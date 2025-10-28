/**
 * Map Integration Helper
 * Bridges JavaScript map with React components
 */

class MapIntegrationHelper {
  constructor() {
    this.map = null;
    this.listeners = [];
  }

  /**
   * Initialize map with Google Maps API key
   */
  async initializeMap(elementId, apiKey) {
    try {
      // Fetch API key from backend if not provided
      if (!apiKey) {
        const response = await fetch('/api/config/maps');
        const result = await response.json();
        if (result.success && result.data) {
          apiKey = result.data.apiKey;
        }
      }

      // Create map instance
      this.map = new TrafficMap(elementId, {
        apiKey: apiKey,
        center: { lat: 16.5062, lng: 80.6480 }, // Vijayawada
        zoom: 12,
        onEvent: (eventName, data) => this.handleMapEvent(eventName, data)
      });

      return this.map;
    } catch (error) {
      console.error('Map initialization error:', error);
      throw error;
    }
  }

  /**
   * Load traffic segments
   */
  async loadTrafficSegments() {
    try {
      const response = await fetch('/api/traffic/segments');
      const result = await response.json();
      
      if (result.success && result.data) {
        const segments = result.data;
        
        // Add each segment to map
        for (const segment of segments) {
          await this.map.addTrafficSegment(segment);
        }
        
        return segments;
      }
      
      return [];
    } catch (error) {
      console.error('Error loading traffic segments:', error);
      return [];
    }
  }

  /**
   * Predict traffic for location
   */
  async predictTraffic(lat, lng, timestamp = null) {
    return await this.map.getPrediction(lat, lng, timestamp);
  }

  /**
   * Predict traffic for route
   */
  async predictRoute(waypoints) {
    return await this.map.getRoutePredictions(waypoints);
  }

  /**
   * Handle map events
   */
  handleMapEvent(eventName, data) {
    console.log(`Map event: ${eventName}`, data);
    
    // Dispatch custom events for React components
    window.dispatchEvent(new CustomEvent('trafficMapEvent', {
      detail: { eventName, data }
    }));
  }

  /**
   * Add event listener
   */
  on(eventName, callback) {
    document.addEventListener(`trafficMap:${eventName}`, (e) => {
      callback(e.detail);
    });
  }

  /**
   * Get model information
   */
  async getModelInfo() {
    try {
      const response = await fetch('/api/ucs-model-info');
      const result = await response.json();
      
      if (result.success) {
        return result.data;
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching model info:', error);
      return null;
    }
  }

  /**
   * Toggle traffic layer visibility
   */
  toggleTrafficLayer(visible) {
    if (this.map) {
      this.map.toggleTrafficLayer(visible);
    }
  }

  /**
   * Recenter map
   */
  recenterMap(lat, lng, zoom) {
    if (this.map) {
      this.map.recenter(lat, lng, zoom);
    }
  }

  /**
   * Clean up
   */
  destroy() {
    if (this.map) {
      this.map.destroy();
      this.map = null;
    }
  }
}

// Create global instance
window.mapIntegration = new MapIntegrationHelper();

// Export for ES6 modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MapIntegrationHelper;
}
