// Script to populate sample traffic data
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function populateData() {
  try {
    // Create sample traffic segments around Vijayawada
    const segments = [
      {
        segment_name: 'NH-16 Vijayawada East',
        latitude: 16.5062,
        longitude: 80.648,
        road_type: 'highway',
        length_km: 5.2,
        speed_limit: 80
      },
      {
        segment_name: 'Bandar Road',
        latitude: 16.5150,
        longitude: 80.6320,
        road_type: 'arterial',
        length_km: 3.1,
        speed_limit: 60
      },
      {
        segment_name: 'Eluru Road Junction',
        latitude: 16.5180,
        longitude: 80.6180,
        road_type: 'arterial',
        length_km: 2.8,
        speed_limit: 50
      },
      {
        segment_name: 'Governorpet Circle',
        latitude: 16.5070,
        longitude: 80.6210,
        road_type: 'local',
        length_km: 1.5,
        speed_limit: 40
      }
    ]

    console.log('Creating traffic segments...')
    const { data: segmentData, error: segmentError } = await supabase
      .from('traffic_segments')
      .insert(segments)
      .select()

    if (segmentError) {
      console.error('Error creating segments:', segmentError)
      return
    }

    console.log('Created segments:', segmentData.length)

    // Create sample alerts
    const alerts = [
      {
        segment_id: segmentData[0].id,
        alert_type: 'heavy_traffic',
        severity: 'high',
        message: 'Heavy traffic congestion on NH-16 due to ongoing construction work',
        is_active: true
      },
      {
        segment_id: segmentData[1].id,
        alert_type: 'incident',
        severity: 'medium',
        message: 'Minor accident reported on Bandar Road, expect delays',
        is_active: true
      }
    ]

    console.log('Creating alerts...')
    const { data: alertData, error: alertError } = await supabase
      .from('alerts')
      .insert(alerts)
      .select()

    if (alertError) {
      console.error('Error creating alerts:', alertError)
      return
    }

    console.log('Created alerts:', alertData.length)
    console.log('Sample data populated successfully!')

  } catch (error) {
    console.error('Error:', error)
  }
}

populateData()