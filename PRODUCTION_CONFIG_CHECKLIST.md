# 🔧 Production Configuration Checklist

## **Current Issue**: Placeholder Supabase URL in Production

Your app is currently pointing to `https://your-project.supabase.co` which doesn't exist, causing the "connection closed" error.

---

## **✅ STEP-BY-STEP FIX:**

### **1. Get Real Supabase Configuration**
- [ ] Go to https://app.supabase.com/
- [ ] Select your project (or create new one)
- [ ] Go to Settings → API
- [ ] Copy Project URL (format: `https://abcd1234.supabase.co`)
- [ ] Copy anon public key
- [ ] Copy service_role key

### **2. Update Vercel Environment Variables**
- [ ] Go to Vercel Dashboard → Your Project → Settings → Environment Variables
- [ ] Update/Add for **Production** environment:
  ```
  NEXT_PUBLIC_SUPABASE_URL = https://[your-project-id].supabase.co
  NEXT_PUBLIC_SUPABASE_ANON_KEY = [your-anon-key]
  SUPABASE_SERVICE_KEY = [your-service-key] (mark as SECRET)
  NEXT_PUBLIC_APP_URL = https://[your-app].vercel.app
  ```
- [ ] Update/Add for **Preview** environment (same values)
- [ ] Save changes

### **3. Configure Supabase Auth Redirects**
- [ ] In Supabase Dashboard → Authentication → Settings
- [ ] Under "Site URL", set: `https://[your-vercel-app].vercel.app`
- [ ] Under "Redirect URLs", add:
  ```
  https://[your-vercel-app].vercel.app/
  https://[your-vercel-app].vercel.app/auth/callback
  ```

### **4. Configure Google OAuth (if using)**
- [ ] In Supabase Dashboard → Authentication → Providers
- [ ] Enable Google provider
- [ ] Add Google OAuth credentials from Google Cloud Console
- [ ] In Google Cloud Console → OAuth 2.0 Client IDs:
  - [ ] Add authorized redirect URI: `https://[your-project-id].supabase.co/auth/v1/callback`
  - [ ] Add authorized JavaScript origins: `https://[your-vercel-app].vercel.app`

### **5. Redeploy**
- [ ] Trigger new deployment in Vercel (environment variables require redeploy)
- [ ] Wait for deployment to complete

---

## **🧪 VERIFICATION TESTS:**

### **Test 1: Supabase Connectivity**
```bash
curl -I https://[your-actual-project-id].supabase.co
# Expected: HTTP/2 200 or similar success response
# NOT: "Could not resolve host"
```

### **Test 2: Environment Variables Check**
- [ ] Open your production app
- [ ] Check if debug badge appears on Google sign-in button
- [ ] If badge shows "Debug" → env vars still using placeholder
- [ ] If no badge → env vars updated correctly

### **Test 3: Google OAuth Flow**
- [ ] Open incognito browser window
- [ ] Go to your production app
- [ ] Click "Continue with Google"
- [ ] Should redirect to Google (NOT show connection error)
- [ ] Complete OAuth and return to app
- [ ] Verify user is signed in and dashboard loads

### **Test 4: Check Logs**
- [ ] In Supabase Dashboard → Logs → Auth logs
- [ ] Look for successful OAuth callback entries
- [ ] No connection errors or failed requests

---

## **🚨 COMMON ISSUES & FIXES:**

### **Issue**: Still seeing placeholder URL error
**Fix**: 
- Verify env vars are set correctly in Vercel
- Redeploy after setting env vars (required!)
- Clear browser cache

### **Issue**: "redirect_uri_mismatch" error
**Fix**:
- Add exact redirect URIs to Google Cloud Console
- Include both app domain and Supabase callback URL
- No trailing slashes, exact HTTPS URLs

### **Issue**: Google sign-in button still shows debug badge
**Fix**:
- Environment variables not updated correctly
- Check Vercel env vars are applied to Production
- Redeploy to pick up new env vars

### **Issue**: OAuth completes but user not signed in
**Fix**:
- Check Supabase Auth logs for errors
- Verify Google provider enabled in Supabase
- Check browser console for JavaScript errors

---

## **📋 QUICK REFERENCE:**

### **Your Configuration (fill in):**
```
Supabase Project URL: https://________________.supabase.co
Vercel App URL: https://________________.vercel.app
Google Client ID: ________________.apps.googleusercontent.com
```

### **Required Redirect URIs:**
```
In Google Cloud Console:
- https://[your-project-id].supabase.co/auth/v1/callback
- https://[your-vercel-app].vercel.app

In Supabase:
- https://[your-vercel-app].vercel.app/
- https://[your-vercel-app].vercel.app/auth/callback
```

---

## **✅ SUCCESS CRITERIA:**

When properly configured:
- [ ] `curl -I https://[project].supabase.co` returns 200 OK
- [ ] Google sign-in button has no debug badge
- [ ] "Continue with Google" redirects to Google OAuth
- [ ] OAuth flow completes and user returns to app
- [ ] Dashboard loads with user signed in
- [ ] No connection errors in browser console

---

**Last Updated**: September 20, 2025  
**Status**: Waiting for environment variable updates
