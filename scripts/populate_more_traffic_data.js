// Script to populate more historical traffic data for better charts
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function populateMoreTrafficData() {
  try {
    // Get existing segments
    const { data: segments, error: segmentError } = await supabase
      .from('traffic_segments')
      .select('id, segment_name')

    if (segmentError || !segments) {
      console.error('Error fetching segments:', segmentError)
      return
    }

    console.log('Found segments:', segments.length)

    // Create traffic observations for the last 12 hours with more data points
    const observations = []
    const now = new Date()

    segments.forEach(segment => {
      // Create observations every 15 minutes for the last 12 hours
      for (let i = 0; i < 48; i++) { // 48 * 15 minutes = 12 hours
        const timestamp = new Date(now.getTime() - (i * 15 * 60 * 1000)) // Every 15 minutes
        
        // Simulate realistic traffic patterns based on time
        const hour = timestamp.getHours()
        const minute = timestamp.getMinutes()
        let baseSpeed = 45
        let baseVolume = 50
        
        // Peak hours: 7-9 AM, 5-7 PM with gradual buildup/reduction
        if ((hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 19)) {
          // Peak hours - vary by minute to show traffic building/reducing
          const peakIntensity = hour === 8 || hour === 18 ? 1.0 : 0.8
          baseSpeed = (20 + Math.random() * 20) * peakIntensity // 20-40 km/h
          baseVolume = (70 + Math.random() * 30) * peakIntensity // 70-100 vehicles
        } else if (hour >= 10 && hour <= 16) {
          // Business hours
          baseSpeed = 35 + Math.random() * 25 // 35-60 km/h
          baseVolume = 35 + Math.random() * 35 // 35-70 vehicles
        } else if (hour >= 22 || hour <= 5) {
          // Night hours
          baseSpeed = 55 + Math.random() * 25 // 55-80 km/h
          baseVolume = 5 + Math.random() * 20 // 5-25 vehicles
        } else {
          // Regular hours
          baseSpeed = 40 + Math.random() * 20 // 40-60 km/h
          baseVolume = 25 + Math.random() * 25 // 25-50 vehicles
        }

        // Add some randomness for different road types
        if (segment.segment_name.includes('NH-16')) {
          // Highway - higher speeds, more volume
          baseSpeed *= 1.2
          baseVolume *= 1.3
        } else if (segment.segment_name.includes('Circle')) {
          // Local roads - lower speeds, less volume
          baseSpeed *= 0.8
          baseVolume *= 0.7
        }

        const occupancy = Math.min(95, (baseVolume / 100) * 80 + Math.random() * 20)
        let congestionLevel = 'free'
        
        if (occupancy > 75) congestionLevel = 'severe'
        else if (occupancy > 55) congestionLevel = 'heavy'
        else if (occupancy > 35) congestionLevel = 'moderate'

        observations.push({
          segment_id: segment.id,
          timestamp: timestamp.toISOString(),
          speed_kmh: Math.round(Math.max(5, baseSpeed) * 10) / 10,
          volume_vehicles: Math.round(Math.max(0, baseVolume)),
          occupancy_percent: Math.round(Math.max(0, Math.min(100, occupancy)) * 10) / 10,
          congestion_level: congestionLevel
        })
      }
    })

    console.log('Creating detailed traffic observations:', observations.length)
    
    // Insert in batches to avoid timeout
    const batchSize = 100
    for (let i = 0; i < observations.length; i += batchSize) {
      const batch = observations.slice(i, i + batchSize)
      const { error } = await supabase
        .from('traffic_observations')
        .insert(batch)

      if (error) {
        console.error('Error inserting batch:', error)
        return
      }
      console.log(`Inserted batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(observations.length/batchSize)}`)
    }

    console.log('Detailed traffic observations populated successfully!')

  } catch (error) {
    console.error('Error:', error)
  }
}

populateMoreTrafficData()