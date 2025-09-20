# Google OAuth Setup Guide

This guide walks you through setting up Google OAuth authentication for SpaceSwap using Supabase Auth.

## Prerequisites

- Supabase project created
- Google Cloud Console account
- Domain or localhost for testing

## Step 1: Google Cloud Console Setup

1. **Go to Google Cloud Console**
   - Visit [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select an existing one

2. **Enable Google+ API**
   - Go to "APIs & Services" > "Library"
   - Search for "Google+ API" and enable it

3. **Configure OAuth Consent Screen**
   - Go to "APIs & Services" > "OAuth consent screen"
   - Choose "External" for user type (unless using Google Workspace)
   - Fill in required fields:
     - App name: `SpaceSwap`
     - User support email: Your email
     - Developer contact information: Your email
   - Add scopes: `email`, `profile`, `openid`
   - Add test users if needed (for development)

4. **Create OAuth 2.0 Credentials**
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth 2.0 Client IDs"
   - Application type: "Web application"
   - Name: `SpaceSwap Web Client`
   - Authorized JavaScript origins:
     - `http://localhost:3000` (for development)
     - `https://your-domain.com` (for production)
   - Authorized redirect URIs:
     - `https://your-supabase-project.supabase.co/auth/v1/callback`
     - `http://localhost:3000/auth/callback` (for development)

5. **Copy Credentials**
   - Save the Client ID and Client Secret for the next step

## Step 2: Supabase Configuration

1. **Go to Supabase Dashboard**
   - Visit [Supabase Dashboard](https://app.supabase.com/)
   - Select your project

2. **Enable Google Provider**
   - Go to "Authentication" > "Providers"
   - Find "Google" and toggle it on
   - Enter your Google OAuth credentials:
     - Client ID: `your-client-id.apps.googleusercontent.com`
     - Client Secret: `your-client-secret`

3. **Configure Redirect URLs**
   - In the same Google provider settings
   - Add redirect URLs:
     - `http://localhost:3000/auth/callback` (development)
     - `https://your-vercel-app.vercel.app/auth/callback` (production)

## Step 3: Run Database Migrations

Run the following SQL migrations in your Supabase SQL Editor:

```sql
-- 1. Run migration 002_add_profiles_table.sql
-- This creates the profiles table and policies

-- 2. Run migration 003_add_logs_table.sql  
-- This creates the logs table for error tracking
```

## Step 4: Environment Variables

Add these to your `.env.local` file:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key

# App Configuration  
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Google OAuth (Optional - only needed if using server-side)
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
```

## Step 5: Deploy and Configure Production

### For Vercel Deployment:

1. **Set Environment Variables in Vercel**
   - Go to your Vercel project settings
   - Add all environment variables from `.env.local`
   - Update `NEXT_PUBLIC_APP_URL` to your production domain

2. **Update Google OAuth Settings**
   - Add your production domain to authorized origins
   - Add production callback URL: `https://your-app.vercel.app/auth/callback`

3. **Update Supabase Google Provider**
   - Add production callback URL in Supabase Google provider settings

## Step 6: Testing

### Local Testing:

1. Start your development server: `npm run dev`
2. Go to `http://localhost:3000`
3. Click "Continue with Google"
4. Complete OAuth flow
5. Check Supabase profiles table for new user entry

### Production Testing:

1. Deploy to Vercel
2. Test Google OAuth on production domain
3. Verify user profiles are created in Supabase
4. Check logs table for any errors

## Troubleshooting

### Common Issues:

1. **"redirect_uri_mismatch" error**
   - Verify redirect URIs in Google Console match exactly
   - Check for trailing slashes or http/https mismatches

2. **"invalid_client" error**
   - Verify Client ID and Client Secret in Supabase
   - Ensure Google+ API is enabled

3. **User profile not created**
   - Check browser console for errors
   - Verify `/api/auth/sync` is being called
   - Check Supabase logs table for sync errors

4. **RLS Policy errors**
   - Verify profiles table policies allow authenticated users
   - Check service role key is correct in environment variables

### Debugging:

1. **Check Browser Console**
   - Look for authentication errors
   - Verify API calls to `/api/auth/sync`

2. **Check Supabase Logs**
   - Go to Supabase Dashboard > Logs
   - Look for authentication and API errors

3. **Check Application Logs**
   - Query the `logs` table for error entries:
   ```sql
   SELECT * FROM logs WHERE level = 'error' ORDER BY created_at DESC LIMIT 10;
   ```

## Security Considerations

1. **Environment Variables**
   - Never commit real credentials to Git
   - Use different credentials for development/production

2. **CORS Settings**
   - Configure proper origins in Google Console
   - Verify Supabase CORS settings

3. **RLS Policies**
   - Review profiles table policies
   - Ensure users can only access their own data and matched users

## Support

If you encounter issues:

1. Check the troubleshooting section above
2. Review Supabase and Google OAuth documentation
3. Check application logs table for specific error messages
