# 🚨 CRITICAL: Supabase & Google OAuth Setup Guide

## **ISSUE IDENTIFIED**
The production app is using placeholder Supabase URLs (`placeholder.supabase.co`) which don't exist, causing "connection closed" errors when users click "Continue with Google".

## **ROOT CAUSE**
- Environment variables not set in Vercel production
- Using fallback placeholder URLs instead of real Supabase project URL
- Missing OAuth redirect URI configuration

---

## **🔧 IMMEDIATE FIXES REQUIRED**

### **Step 1: Get Your Real Supabase Project Details**

1. **Go to Supabase Dashboard**: https://app.supabase.com/
2. **Select your project** (or create one if needed)
3. **Go to Settings → API**
4. **Copy these values**:
   ```
   Project URL: https://[your-project-id].supabase.co
   Anon key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.[your-anon-key]
   Service key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.[your-service-key]
   ```

### **Step 2: Update Vercel Environment Variables**

1. **Go to Vercel Dashboard** → Your Project → Settings → Environment Variables
2. **Add/Update these variables**:
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=https://xpbwtvldqksiwzgusrra.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhwYnd0dmxkcWtzaXd6Z3VzcnJhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgwNzg2NjgsImV4cCI6MjA3MzY1NDY2OH0.EMppsSURIe58tdNalzUEC_lHwbTzztQqUDKfbQkY8b4
   SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.[your-service-key]
   NEXT_PUBLIC_APP_URL=https://spaceswap-fpaonzmzd-abhays-projects-a72cd374.vercel.app/
   ```
3. **Set Environment**: Production, Preview, Development (all)
4. **Click "Save"**

### **Step 3: Configure Supabase Authentication**

1. **In Supabase Dashboard** → Authentication → Settings
2. **Site URL**: Set to `https://spaceswap-fpaonzmzd-abhays-projects-a72cd374.vercel.app/`
3. **Redirect URLs**: Add these URLs:
   ```
   https://[your-vercel-app].vercel.app/auth/callback
   https://[your-vercel-app].vercel.app/
   http://localhost:3000/auth/callback
   http://localhost:3000/
   ```

### **Step 4: Enable Google OAuth in Supabase**

1. **In Supabase Dashboard** → Authentication → Providers
2. **Find "Google"** and toggle it ON
3. **You'll need Google OAuth credentials** (next step)

### **Step 5: Configure Google Cloud Console**

1. **Go to Google Cloud Console**: https://console.cloud.google.com/
2. **Create/Select Project**
3. **Enable Google+ API**:
   - APIs & Services → Library
   - Search "Google+ API" → Enable
4. **Configure OAuth Consent Screen**:
   - APIs & Services → OAuth consent screen
   - External user type
   - App name: "SpaceSwap"
   - User support email: your email
   - Scopes: email, profile, openid
5. **Create OAuth 2.0 Credentials**:
   - APIs & Services → Credentials
   - Create Credentials → OAuth 2.0 Client IDs
   - Application type: Web application
   - Name: "SpaceSwap Production"
   - **Authorized JavaScript origins**:
     ```
     https://[your-vercel-app].vercel.app
     https://[your-project-id].supabase.co
     ```
   - **Authorized redirect URIs**:
     ```
     https://[your-project-id].supabase.co/auth/v1/callback
     https://[your-vercel-app].vercel.app/auth/callback
     ```

### **Step 6: Connect Google to Supabase**

1. **Copy Google OAuth credentials** from Google Cloud Console
2. **In Supabase** → Authentication → Providers → Google
3. **Paste**:
   - Client ID: `[your-client-id].apps.googleusercontent.com`
   - Client Secret: `[your-client-secret]`
4. **Save**

### **Step 7: Deploy and Test**

1. **Redeploy your Vercel app** (environment variables will trigger rebuild)
2. **Test connectivity**:
   ```bash
   curl -I https://[your-project-id].supabase.co
   # Should return HTTP/2 200 or similar success response
   ```
3. **Test Google OAuth**: Click "Continue with Google" in your app

---

## **🔍 TROUBLESHOOTING**

### **If you get "Could not resolve host"**:
- Double-check your Supabase project URL
- Ensure it's in format: `https://abcdef123456.supabase.co`
- Test with: `curl -I https://[your-project-id].supabase.co`

### **If you get "redirect_uri_mismatch"**:
- Verify redirect URIs in Google Cloud Console match exactly
- Include both Supabase callback AND your app callback
- No trailing slashes, exact HTTPS URLs

### **If authentication fails**:
- Check browser console for specific error messages
- Verify environment variables are set in Vercel
- Ensure Supabase project is active and not paused

### **If still getting connection errors**:
- Check Supabase status: https://status.supabase.com/
- Try from different network (mobile hotspot)
- Verify DNS resolution: `nslookup [your-project-id].supabase.co`

---

## **🚀 VERIFICATION CHECKLIST**

- [ ] Real Supabase URL set in Vercel env vars (not placeholder)
- [ ] Google OAuth credentials configured in Google Cloud Console
- [ ] Google provider enabled in Supabase with correct credentials
- [ ] Redirect URIs added to both Google and Supabase
- [ ] App redeployed after environment variable changes
- [ ] `curl -I https://[your-project-id].supabase.co` returns 200 OK
- [ ] "Continue with Google" works without connection errors

---

## **📞 SUPPORT**

If you're still experiencing issues:
1. Check Supabase project logs in dashboard
2. Check Vercel function logs for auth errors  
3. Verify all URLs are using HTTPS (not HTTP)
4. Contact Supabase support if project appears down
