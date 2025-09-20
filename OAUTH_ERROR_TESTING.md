# OAuth Error Handling Testing Guide

## **New Features Added**

### **🛡️ Defensive Checks & Error Handling**
- **Pre-flight validation**: Checks Supabase URL before attempting OAuth
- **Placeholder detection**: Identifies and blocks authentication with placeholder URLs
- **Error modal**: Shows detailed error information with debug data
- **Auto-reporting**: Critical errors automatically logged to `/api/log-client-error`
- **Debug badge**: Visual indicator when using placeholder configuration

### **🔍 Debug Features**
- **Error modal with copy-paste debug info**
- **One-click error reporting to server**
- **Client-side configuration validation**
- **Network error detection and classification**

## **Testing Scenarios**

### **Scenario 1: Placeholder Supabase URL (Current Production Issue)**

**Expected Behavior**:
- ✅ Button shows "Configuration Required" with red styling
- ✅ Debug badge appears on button (red "Debug" badge)
- ✅ Warning message below button explains placeholder issue
- ✅ Clicking button opens error modal (doesn't attempt OAuth)
- ✅ Modal shows configuration issue with setup guide link

**How to Test**:
1. Ensure `NEXT_PUBLIC_SUPABASE_URL` is set to placeholder value
2. Load login page
3. Observe button appearance and warning
4. Click button to see error modal

### **Scenario 2: Network/Connection Error**

**Expected Behavior**:
- ✅ Button appears normal initially
- ✅ Clicking triggers OAuth attempt
- ✅ Network failure caught and error modal displayed
- ✅ Error automatically reported to server
- ✅ Modal shows network error with troubleshooting steps

**How to Test**:
1. Set valid-looking but non-existent Supabase URL
2. Click "Continue with Google"
3. Observe error handling

### **Scenario 3: Valid Configuration**

**Expected Behavior**:
- ✅ Button shows normal "Continue with Google" styling
- ✅ No warning messages or debug badges
- ✅ Clicking redirects to Google OAuth (if properly configured)

## **Error Modal Features**

### **User-Friendly Section**:
- Clear error message and description
- Quick fix recommendations with direct links
- "Copy Debug Info" button for sharing with developers
- "Send Error Report" button for automatic logging

### **Technical Debug Section** (Expandable):
- Complete error details with stack trace
- Environment information (Supabase URL, timestamp, user agent)
- Configuration flags (placeholder detection, network status)
- JSON formatted debug data

### **Auto-Reporting**:
- Critical errors (network failures, placeholder URLs) automatically reported
- Includes full debug context and error details
- Generates unique error ID for tracking

## **API Endpoints for Testing**

### **`/api/log-client-error`**
**Purpose**: Logs client-side OAuth errors
**Method**: POST
**Test**: 
```bash
curl -X POST https://your-app.vercel.app/api/log-client-error \
  -H "Content-Type: application/json" \
  -d '{
    "error": {"message": "Test error", "name": "TestError"},
    "context": "manual-test",
    "userAgent": "Test Agent",
    "url": "https://test.com",
    "timestamp": "2025-09-20T15:00:00Z"
  }'
```

### **`/api/diagnostic`**
**Purpose**: Real-time configuration and connectivity testing
**Method**: GET
**Test**:
```bash
curl https://your-app.vercel.app/api/diagnostic
```

## **Configuration States & Button Appearance**

| Configuration State | Button Text | Button Style | Badge | Warning |
|-------------------|-------------|--------------|-------|---------|
| Placeholder URL | "Configuration Required" | Red background | "Debug" badge | Yellow warning box |
| Invalid/Missing | "Setup Required" | Orange background | None | Yellow warning box |
| Valid but unreachable | "Continue with Google" | Normal | None | None (error on click) |
| Fully working | "Continue with Google" | Normal | None | None |

## **Error Classification**

### **Configuration Errors**:
- Placeholder URLs detected
- Missing environment variables
- Invalid URL format

### **Network Errors**:
- Connection timeouts
- DNS resolution failures
- CORS issues
- Server unreachable

### **OAuth Errors**:
- Invalid redirect URIs
- Missing Google OAuth setup
- Supabase provider not enabled

## **Debugging Tools**

### **Client-Side Debug Helper**:
```javascript
// In browser console
import { getClientSupabaseConfig } from '@/lib/supabase'
console.log(getClientSupabaseConfig())
```

### **Error Log Inspection**:
```sql
-- In Supabase SQL Editor
SELECT * FROM logs 
WHERE level = 'error' 
  AND payload->>'source' = 'client-side'
ORDER BY created_at DESC 
LIMIT 10;
```

## **Production Deployment Checklist**

### **Before Deploying**:
- [ ] Set real `NEXT_PUBLIC_SUPABASE_URL` in Vercel
- [ ] Set real `NEXT_PUBLIC_SUPABASE_ANON_KEY` in Vercel  
- [ ] Set real `SUPABASE_SERVICE_KEY` in Vercel
- [ ] Configure Google OAuth in Google Cloud Console
- [ ] Enable Google provider in Supabase
- [ ] Add redirect URIs to both Google and Supabase

### **After Deploying**:
- [ ] Test `/api/diagnostic` endpoint shows all green
- [ ] Verify no debug badges appear on login button
- [ ] Test Google OAuth flow works end-to-end
- [ ] Check error logs for any auto-reported issues

## **Troubleshooting Common Issues**

### **"Configuration Required" Button**:
- Check `NEXT_PUBLIC_SUPABASE_URL` in Vercel environment variables
- Ensure URL format: `https://your-project-id.supabase.co`
- Redeploy after changing environment variables

### **Error Modal Not Showing**:
- Check browser console for JavaScript errors
- Verify modal component is properly imported
- Test with placeholder URL to trigger modal

### **Auto-Reporting Not Working**:
- Check `/api/log-client-error` endpoint accessibility
- Verify logs table exists in Supabase
- Check server logs for API errors

### **Debug Badge Always Showing**:
- Verify environment variables are set correctly
- Check browser dev tools → Network → Headers for env vars
- Clear browser cache and hard refresh

---

**Last Updated**: September 20, 2025  
**Features**: Defensive OAuth checks, error modal, auto-reporting, debug tools
