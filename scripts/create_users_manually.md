# Manual User Creation Instructions

Since we don't have the service role key, you can create users manually through the Supabase dashboard or by signing up through the app.

## Admin Account Setup

1. **Go to the sign-up page**: http://localhost:3000/auth/signup

2. **Create the admin account**:
   - Full Name: System Administrator
   - Email: admin@traffic.com
   - Password: admin123456
   - Confirm Password: admin123456

3. **Create a demo account**:
   - Full Name: Demo User
   - Email: demo@traffic.com
   - Password: password123
   - Confirm Password: password123

## How Authentication Works

### **User Flow:**
1. **Unauthenticated users** → Redirected to `/auth/signin`
2. **Regular users** → Access to main app (traffic prediction, route planner)
3. **Admin user** (admin@traffic.com) → Access to `/admin` dashboard + all features

### **Protected Routes:**
- `/admin` - Admin only
- `/monitoring` - Requires authentication
- `/traffic-prediction` - Requires authentication  
- `/route-planner` - Requires authentication

### **Public Routes:**
- `/auth/signin` - Sign in page
- `/auth/signup` - Sign up page
- `/` - Landing page (redirects to traffic prediction if authenticated)

## Admin Features

The admin account (admin@traffic.com) gets access to:
- **Admin Dashboard** (`/admin`) with system statistics
- **User Management** (coming soon)
- **System Monitoring** with enhanced privileges
- **Alert Management** (coming soon)

## Testing the Authentication

1. **Sign up** with any email to create a regular user account
2. **Sign in** with the admin email to access admin features
3. **Try accessing protected routes** without authentication to test middleware
4. **Sign out** and sign back in to test session management

The authentication system uses Supabase Auth with JWT tokens and automatic session management.