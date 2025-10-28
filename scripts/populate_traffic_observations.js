// Script to populate sample traffic observations
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function populateTrafficObservations() {
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

    // Create traffic observations for each segment
    const observations = []
    const now = new Date()

    segments.forEach(segment => {
      // Create observations for the last few hours
      for (let i = 0; i < 6; i++) {
        const timestamp = new Date(now.getTime() - (i * 30 * 60 * 1000)) // Every 30 minutes
        
        // Simulate realistic traffic patterns
        const hour = timestamp.getHours()
        let baseSpeed = 45
        let baseVolume = 50
        
        // Peak hours: 7-9 AM, 5-7 PM
        if ((hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 19)) {
          baseSpeed = 25 + Math.random() * 15 // 25-40 km/h
          baseVolume = 80 + Math.random() * 20 // 80-100 vehicles
        } else if (hour >= 10 && hour <= 16) {
          baseSpeed = 35 + Math.random() * 20 // 35-55 km/h
          baseVolume = 40 + Math.random() * 30 // 40-70 vehicles
        } else {
          baseSpeed = 50 + Math.random() * 25 // 50-75 km/h
          baseVolume = 20 + Math.random() * 20 // 20-40 vehicles
        }

        const occupancy = Math.min(95, (baseVolume / 100) * 80 + Math.random() * 20)
        let congestionLevel = 'free'
        
        if (occupancy > 70) congestionLevel = 'severe'
        else if (occupancy > 50) congestionLevel = 'heavy'
        else if (occupancy > 30) congestionLevel = 'moderate'

        observations.push({
          segment_id: segment.id,
          timestamp: timestamp.toISOString(),
          speed_kmh: Math.round(baseSpeed * 10) / 10,
          volume_vehicles: Math.round(baseVolume),
          occupancy_percent: Math.round(occupancy * 10) / 10,
          congestion_level: congestionLevel
        })
      }
    })

    console.log('Creating traffic observations:', observations.length)
    
    // Insert in batches to avoid timeout
    const batchSize = 50
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

    console.log('Traffic observations populated successfully!')

  } catch (error) {
    console.error('Error:', error)
  }
}

populateTrafficObservations()