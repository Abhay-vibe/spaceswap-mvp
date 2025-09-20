# 🚨 Supabase Connectivity & Google OAuth Fix - Runbook

## **Issue Summary**
**Problem**: Users clicking "Continue with Google" get browser error: `your-project.supabase.co unexpectedly closed the connection`

**Root Cause**: Production app using placeholder Supabase URLs that don't exist

## **Diagnostic Results**

### **Connectivity Tests Performed**:
```bash
# FAILED - Placeholder URL (current production)
curl -I https://placeholder.supabase.co
# Result: Could not resolve host: placeholder.supabase.co

# FAILED - Example URL from env.example  
curl -I https://your-project-id.supabase.co
# Result: Could not resolve host: your-project-id.supabase.co

# SUCCESS - Working Supabase domain (reference)
curl -I https://supabase.com  
# Result: HTTP/2 200 (proves connectivity works with real domains)
```

### **Configuration Issues Found**:
- ❌ `NEXT_PUBLIC_SUPABASE_URL` using placeholder value
- ❌ Missing real Supabase project credentials in Vercel
- ❌ OAuth redirect URIs not configured
- ❌ Google Cloud Console OAuth not set up

## **Fixes Implemented**

### **1. Code Changes**:
- ✅ Enhanced error handling in GoogleSignInButton
- ✅ Added configuration validation and user guidance
- ✅ Created diagnostic API endpoint (`/api/diagnostic`)
- ✅ Improved configuration status display

### **2. Documentation Created**:
- ✅ `SUPABASE_OAUTH_SETUP.md` - Complete setup guide
- ✅ Step-by-step Vercel environment variable configuration
- ✅ Google Cloud Console OAuth setup instructions
- ✅ Supabase Auth redirect URI configuration

### **3. Diagnostic Tools**:
- ✅ Real-time connectivity testing via `/api/diagnostic`
- ✅ Configuration validation with actionable recommendations
- ✅ Visual status indicators in the UI

## **Required Actions for Production**

### **CRITICAL - Must Do Immediately**:

1. **Get Real Supabase Project Details**:
   - Go to https://app.supabase.com/
   - Select your project or create new one
   - Copy Project URL, Anon Key, Service Key from Settings → API

2. **Update Vercel Environment Variables**:
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=https://[your-actual-project-id].supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=[your-actual-anon-key]
   SUPABASE_SERVICE_KEY=[your-actual-service-key]
   NEXT_PUBLIC_APP_URL=https://[your-vercel-app].vercel.app
   ```

3. **Configure Supabase Auth Redirects**:
   - In Supabase Dashboard → Authentication → Settings
   - Add redirect URLs:
     - `https://[your-vercel-app].vercel.app/auth/callback`
     - `https://[your-vercel-app].vercel.app/`

4. **Set up Google OAuth**:
   - Google Cloud Console → APIs & Services → Credentials
   - Create OAuth 2.0 Client ID
   - Add authorized redirect URIs:
     - `https://[your-project-id].supabase.co/auth/v1/callback`
     - `https://[your-vercel-app].vercel.app/auth/callback`

5. **Enable Google in Supabase**:
   - Supabase Dashboard → Authentication → Providers → Google
   - Add Google Client ID and Client Secret

### **Verification Steps**:

1. **Test Supabase Connectivity**:
   ```bash
   curl -I https://[your-actual-project-id].supabase.co
   # Expected: HTTP/2 200 or similar success response
   ```

2. **Check Configuration Status**:
   - Visit: `https://[your-vercel-app].vercel.app/api/diagnostic`
   - Should show all green/configured status

3. **Test Google OAuth Flow**:
   - Click "Continue with Google" button
   - Should redirect to Google OAuth (not show connection error)
   - Complete sign-in and return to app successfully

## **Deployment Status**

- **Branch**: `fix/frontend-white-screen`
- **Status**: ✅ Ready for merge and deployment
- **Files Changed**:
  - `SUPABASE_OAUTH_SETUP.md` (new setup guide)
  - `components/google-signin-button.tsx` (enhanced error handling)
  - `components/config-status.tsx` (better user guidance)
  - `app/api/diagnostic/route.ts` (new diagnostic endpoint)

## **Success Criteria**

### **Before Fix**:
- ❌ `curl -I https://placeholder.supabase.co` → Connection failed
- ❌ "Continue with Google" → Browser connection error
- ❌ No user guidance on configuration issues

### **After Fix (When Properly Configured)**:
- ✅ `curl -I https://[real-project-id].supabase.co` → HTTP 200 OK
- ✅ "Continue with Google" → Redirects to Google OAuth
- ✅ Complete authentication flow works end-to-end
- ✅ User-friendly error messages with setup guidance

## **Monitoring & Troubleshooting**

### **Quick Health Check**:
```bash
# Test Supabase connectivity
curl -I https://[your-project-id].supabase.co

# Check app diagnostic
curl https://[your-vercel-app].vercel.app/api/diagnostic
```

### **Common Issues After Setup**:

1. **"redirect_uri_mismatch"**:
   - Check Google Cloud Console redirect URIs
   - Ensure exact HTTPS URLs with no trailing slashes

2. **Still getting connection errors**:
   - Verify environment variables are set in Vercel
   - Redeploy after setting env vars
   - Check Supabase project status at https://status.supabase.com/

3. **Authentication fails silently**:
   - Check browser console for specific errors
   - Verify Google OAuth credentials in Supabase
   - Ensure Google provider is enabled in Supabase

## **Support Contacts**

- **Supabase Issues**: https://status.supabase.com/
- **Google OAuth Issues**: https://console.cloud.google.com/
- **Vercel Deployment**: Vercel dashboard logs
- **App Diagnostic**: Visit `/api/diagnostic` endpoint

---

**Last Updated**: September 20, 2025  
**Fix Status**: Ready for production deployment  
**Estimated Fix Time**: 15-30 minutes (environment variable setup)
