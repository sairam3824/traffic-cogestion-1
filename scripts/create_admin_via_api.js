// Script to create admin user via the signup API
const fetch = require('node-fetch')

async function createAdminUser() {
  try {
    console.log('🚀 Creating admin user via signup API...')
    
    const response = await fetch('http://localhost:3000/auth/signup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@traffic.com',
        password: 'admin123456',
        fullName: 'System Administrator'
      })
    })

    if (response.ok) {
      console.log('✅ Admin user created successfully!')
      console.log('')
      console.log('🔑 Admin Credentials:')
      console.log('📧 Username: admin@traffic.com')
      console.log('🔒 Password: admin123456')
      console.log('')
      console.log('🌐 Sign in at: http://localhost:3000/auth/signin')
      console.log('👑 Admin dashboard: http://localhost:3000/admin')
    } else {
      console.log('ℹ️  User might already exist or there was an issue.')
      console.log('Try signing in with the credentials above.')
    }

  } catch (error) {
    console.log('ℹ️  Could not create via API. Please create manually:')
    console.log('')
    console.log('1. Go to: http://localhost:3000/auth/signup')
    console.log('2. Use these credentials:')
    console.log('   📧 Email: admin@traffic.com')
    console.log('   🔒 Password: admin123456')
    console.log('   👤 Name: System Administrator')
  }
}

createAdminUser()