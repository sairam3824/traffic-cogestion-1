/**
 * Interactive Traffic Map - Pure JavaScript Implementation
 * Integrated with UCS Model for AI-powered traffic predictions
 */

class TrafficMap {
  constructor(mapElementId, config = {}) {
    this.mapElement = document.getElementById(mapElementId);
    this.map = null;
    this.markers = [];
    this.trafficLayer = null;
    this.selectedSegment = null;
    this.config = {
      center: config.center || { lat: 16.5062, lng: 80.6480 }, // Vijayawada, India
      zoom: config.zoom || 12,
      apiKey: config.apiKey || '',
      ...config
    };
    
    this.init();
  }

  /**
   * Initialize the map
   */
  async init() {
    try {
      // Load Google Maps API
      if (!window.google || !window.google.maps) {
        await this.loadGoogleMapsAPI();
      }
      
      // Create map instance
      this.map = new google.maps.Map(this.mapElement, {
        center: this.config.center,
        zoom: this.config.zoom,
        mapTypeControl: true,
        mapTypeControlOptions: {
          style: google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
          position: google.maps.ControlPosition.TOP_RIGHT,
        },
        zoomControl: true,
        zoomControlOptions: {
          position: google.maps.ControlPosition.RIGHT_CENTER
        },
        streetViewControl: true,
        fullscreenControl: true,
        styles: this.getMapStyles()
      });

      // Initialize traffic layer
      this.trafficLayer = new google.maps.TrafficLayer();
      this.trafficLayer.setMap(this.map);
      
      console.log('✅ Interactive map initialized successfully');
      this.emit('initialized', { map: this.map });
    } catch (error) {
      console.error('❌ Error initializing map:', error);
      this.emit('error', { error });
    }
  }

  /**
   * Load Google Maps API dynamically
   */
  loadGoogleMapsAPI() {
    return new Promise((resolve, reject) => {
      if (window.google && window.google.maps) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${this.config.apiKey}&libraries=visualization`;
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Google Maps API'));
      document.head.appendChild(script);
    });
  }

  /**
   * Add a marker to the map
   */
  addMarker(lat, lng, options = {}) {
    const marker = new google.maps.Marker({
      position: { lat, lng },
      map: this.map,
      title: options.title || '',
      icon: options.icon || this.getMarkerIcon(options.trafficLevel || 'unknown'),
      ...options
    });

    // Add click listener
    if (options.onClick) {
      marker.addListener('click', () => options.onClick(marker));
    }

    this.markers.push(marker);
    return marker;
  }

  /**
   * Add traffic segment with prediction
   */
  async addTrafficSegment(segment) {
    try {
      // Get prediction from UCS model
      const prediction = await this.getPrediction(segment.latitude, segment.longitude);
      
      const marker = this.addMarker(segment.latitude, segment.longitude, {
        title: segment.segment_name || `Segment ${segment.id}`,
        trafficLevel: prediction.traffic_level,
        onClick: (marker) => this.onSegmentClick(segment, prediction)
      });

      marker.segmentData = { ...segment, prediction };
      return marker;
    } catch (error) {
      console.error('Error adding traffic segment:', error);
      return null;
    }
  }

  /**
   * Get prediction from UCS model
   */
  async getPrediction(lat, lng, timestamp = null) {
    try {
      const response = await fetch('/api/ucs-predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          latitude: lat,
          longitude: lng,
          timestamp: timestamp || new Date().toISOString()
        })
      });

      const result = await response.json();
      if (result.success) {
        return result.data;
      }
      throw new Error(result.error || 'Prediction failed');
    } catch (error) {
      console.error('Prediction error:', error);
      return { prediction: 0, traffic_level: 'unknown', confidence: 'low' };
    }
  }

  /**
   * Handle segment click
   */
  onSegmentClick(segment, prediction) {
    this.selectedSegment = segment;
    
    const infoWindow = new google.maps.InfoWindow({
      content: this.createInfoWindowContent(segment, prediction)
    });

    infoWindow.setPosition({ lat: segment.latitude, lng: segment.longitude });
    infoWindow.open(this.map);
    
    this.emit('segmentSelected', { segment, prediction });
  }

  /**
   * Create info window content
   */
  createInfoWindowContent(segment, prediction) {
    const trafficColor = this.getTrafficColor(prediction.traffic_level);
    return `
      <div style="padding: 10px; min-width: 200px;">
        <h3 style="margin: 0 0 10px 0; font-size: 16px; color: #333;">${segment.segment_name || 'Traffic Segment'}</h3>
        <div style="display: flex; align-items: center; margin-bottom: 8px;">
          <span style="display: inline-block; width: 12px; height: 12px; border-radius: 50%; background-color: ${trafficColor}; margin-right: 8px;"></span>
          <span style="font-weight: bold;">${prediction.traffic_level.toUpperCase()} Traffic</span>
        </div>
        <div style="font-size: 14px; color: #666;">
          <p style="margin: 5px 0;"><strong>Occupancy:</strong> ${prediction.prediction.toFixed(1)}%</p>
          <p style="margin: 5px 0;"><strong>Confidence:</strong> ${prediction.confidence}</p>
          <p style="margin: 5px 0;"><strong>Road Type:</strong> ${segment.road_type || 'N/A'}</p>
        </div>
      </div>
    `;
  }

  /**
   * Draw route on map
   */
  drawRoute(polyline, options = {}) {
    const path = google.maps.geometry.encoding.decodePath(polyline);
    
    const route = new google.maps.Polyline({
      path: path,
      geodesic: true,
      strokeColor: options.color || '#2563eb',
      strokeOpacity: options.opacity || 0.8,
      strokeWeight: options.weight || 5
    });

    route.setMap(this.map);
    return route;
  }

  /**
   * Get route predictions
   */
  async getRoutePredictions(waypoints) {
    try {
      const response = await fetch('/api/ucs-predict-route', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ waypoints })
      });

      const result = await response.json();
      if (result.success) {
        return result.data;
      }
      throw new Error(result.error || 'Route prediction failed');
    } catch (error) {
      console.error('Route prediction error:', error);
      return null;
    }
  }

  /**
   * Toggle traffic layer
   */
  toggleTrafficLayer(show = true) {
    if (this.trafficLayer) {
      this.trafficLayer.setMap(show ? this.map : null);
    }
  }

  /**
   * Clear all markers
   */
  clearMarkers() {
    this.markers.forEach(marker => marker.setMap(null));
    this.markers = [];
  }

  /**
   * Get marker icon based on traffic level
   */
  getMarkerIcon(trafficLevel) {
    const colors = {
      low: '#10b981',
      medium: '#f59e0b',
      high: '#ef4444',
      unknown: '#6b7280'
    };
    
    return {
      path: google.maps.SymbolPath.CIRCLE,
      scale: 8,
      fillColor: colors[trafficLevel] || colors.unknown,
      fillOpacity: 0.9,
      strokeColor: '#ffffff',
      strokeWeight: 2
    };
  }

  /**
   * Get traffic color
   */
  getTrafficColor(trafficLevel) {
    const colors = {
      low: '#10b981',
      medium: '#f59e0b',
      high: '#ef4444',
      unknown: '#6b7280'
    };
    return colors[trafficLevel] || colors.unknown;
  }

  /**
   * Get custom map styles
   */
  getMapStyles() {
    return [
      {
        featureType: 'poi',
        elementType: 'labels',
        stylers: [{ visibility: 'off' }]
      }
    ];
  }

  /**
   * Event emitter
   */
  emit(eventName, data) {
    if (this.config.onEvent) {
      this.config.onEvent(eventName, data);
    }
    
    const event = new CustomEvent(`trafficMap:${eventName}`, { detail: data });
    document.dispatchEvent(event);
  }

  /**
   * Recenter map
   */
  recenter(lat, lng, zoom) {
    this.map.setCenter({ lat, lng });
    if (zoom) this.map.setZoom(zoom);
  }

  /**
   * Destroy map instance
   */
  destroy() {
    this.clearMarkers();
    if (this.trafficLayer) {
      this.trafficLayer.setMap(null);
    }
    this.map = null;
  }
}

// Export for use in modules or global scope
if (typeof module !== 'undefined' && module.exports) {
  module.exports = TrafficMap;
} else {
  window.TrafficMap = TrafficMap;
}
