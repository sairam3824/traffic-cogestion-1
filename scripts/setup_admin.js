// Script to create admin user in Supabase
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials')
  console.log('Required environment variables:')
  console.log('- NEXT_PUBLIC_SUPABASE_URL')
  console.log('- SUPABASE_SERVICE_ROLE_KEY (or NEXT_PUBLIC_SUPABASE_ANON_KEY as fallback)')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function createAdminUser() {
  try {
    console.log('Creating admin user...')
    
    // Create admin user
    const { data, error } = await supabase.auth.admin.createUser({
      email: 'admin@traffic.com',
      password: 'admin123456',
      email_confirm: true,
      user_metadata: {
        full_name: 'System Administrator',
        role: 'admin'
      }
    })

    if (error) {
      if (error.message.includes('already registered')) {
        console.log('✅ Admin user already exists: admin@traffic.com')
      } else {
        console.error('❌ Error creating admin user:', error.message)
      }
      return
    }

    if (data.user) {
      console.log('✅ Admin user created successfully!')
      console.log('📧 Email: admin@traffic.com')
      console.log('🔑 Password: admin123456')
      console.log('🚨 IMPORTANT: Change the password after first login!')
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error.message)
  }
}

async function createDemoUser() {
  try {
    console.log('Creating demo user...')
    
    // Create demo user
    const { data, error } = await supabase.auth.admin.createUser({
      email: 'demo@traffic.com',
      password: 'password123',
      email_confirm: true,
      user_metadata: {
        full_name: 'Demo User',
        role: 'user'
      }
    })

    if (error) {
      if (error.message.includes('already registered')) {
        console.log('✅ Demo user already exists: demo@traffic.com')
      } else {
        console.error('❌ Error creating demo user:', error.message)
      }
      return
    }

    if (data.user) {
      console.log('✅ Demo user created successfully!')
      console.log('📧 Email: demo@traffic.com')
      console.log('🔑 Password: password123')
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error.message)
  }
}

async function main() {
  console.log('🚀 Setting up authentication users...')
  console.log('')
  
  await createAdminUser()
  console.log('')
  await createDemoUser()
  
  console.log('')
  console.log('🎉 Setup complete!')
  console.log('')
  console.log('You can now sign in with:')
  console.log('👑 Admin: admin@traffic.com / admin123456')
  console.log('👤 Demo: demo@traffic.com / password123')
}

main()