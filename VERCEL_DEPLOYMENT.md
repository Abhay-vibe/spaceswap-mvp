# BagSwap MVP - Vercel Deployment Guide

## Prerequisites Checklist

Before deploying, ensure you have:
- ✅ Supabase project created and configured
- ✅ Stripe account with API keys
- ✅ GitHub repository with your code
- ✅ Vercel account (free tier works for MVP)

## Step 1: Prepare Your Code for Deployment

### 1.1 Create/Update .gitignore
```bash
# Environment files
.env
.env.local
.env.production

# Dependencies
node_modules/
.pnpm-lock.yaml

# Build output
.next/
out/

# Runtime data
.vercel
```

### 1.2 Commit Your Changes
```bash
git add .
git commit -m "feat: complete backend implementation with Supabase and Stripe"
git push origin main
```

## Step 2: Set Up Vercel Project

### 2.1 Connect to Vercel
1. Go to [vercel.com](https://vercel.com) and sign in
2. Click **"New Project"**
3. Import your GitHub repository
4. Select **"BagSwap MVP"** repository
5. Click **"Deploy"** (it will fail first time - that's expected)

### 2.2 Configure Build Settings
In Vercel dashboard:
1. Go to **Settings** → **General**
2. **Framework Preset**: Next.js
3. **Node.js Version**: 18.x (recommended)
4. **Build Command**: `npm run build`
5. **Output Directory**: `.next` (default)
6. **Install Command**: `npm install`

## Step 3: Environment Variables Setup

### 3.1 Add Environment Variables in Vercel
Go to **Settings** → **Environment Variables** and add:

```env
# Supabase (from your Supabase project settings)
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Stripe (use test keys for staging, live keys for production)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...

# Admin (generate a secure 32+ character string)
ADMIN_API_KEY=your-very-secure-admin-key-here-min-32-chars

# App URL (will be your Vercel domain)
NEXT_PUBLIC_APP_URL=https://your-app-name.vercel.app
```

**Important**: Set environment for **Production**, **Preview**, and **Development**

### 3.2 Generate Secure Admin Key
```bash
# Generate a secure admin key
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Step 4: Update Supabase Configuration

### 4.1 Update Authentication URLs
In Supabase Dashboard:
1. Go to **Authentication** → **Settings**
2. **Site URL**: `https://your-app-name.vercel.app`
3. **Redirect URLs**: Add:
   - `https://your-app-name.vercel.app/auth/callback`
   - `https://your-app-name.vercel.app/`
   - `https://*.vercel.app/auth/callback` (for preview deployments)

### 4.2 Update CORS Settings (if needed)
In Supabase Dashboard → **Settings** → **API**:
- Ensure CORS is configured for your Vercel domain

## Step 5: Update Stripe Configuration

### 5.1 Add Webhook Endpoint (Optional for MVP)
If you plan to use Stripe webhooks:
1. Go to Stripe Dashboard → **Developers** → **Webhooks**
2. Add endpoint: `https://your-app-name.vercel.app/api/webhooks/stripe`
3. Select events: `payment_intent.succeeded`, `payment_intent.payment_failed`

### 5.2 Update Redirect URLs
In your Stripe settings, ensure redirect URLs point to your Vercel domain.

## Step 6: Deploy and Test

### 6.1 Trigger Deployment
1. In Vercel dashboard, go to **Deployments**
2. Click **"Redeploy"** or push new code to trigger deployment
3. Wait for deployment to complete (usually 2-3 minutes)

### 6.2 Test Your Deployment
```bash
# Test admin endpoint
curl -X GET "https://your-app-name.vercel.app/api/admin/stats" \
  -H "x-admin-key: your-admin-key"

# Should return platform statistics
```

## Step 7: Domain Configuration (Optional)

### 7.1 Custom Domain
If you have a custom domain:
1. Go to **Settings** → **Domains**
2. Add your domain
3. Configure DNS records as instructed
4. Update all URLs in Supabase and Stripe

### 7.2 SSL Certificate
Vercel automatically provides SSL certificates for all domains.

## Step 8: Monitoring and Analytics

### 8.1 Enable Vercel Analytics
1. Go to **Analytics** tab in Vercel dashboard
2. Enable Web Analytics
3. Add analytics code is already included via `@vercel/analytics`

### 8.2 Set Up Error Monitoring
Consider adding error monitoring:
```bash
npm install @sentry/nextjs
# Follow Sentry setup for production error tracking
```

## Troubleshooting Common Issues

### Build Failures

**TypeScript Errors**:
```bash
# Add to next.config.mjs
typescript: {
  ignoreBuildErrors: true, // Only for MVP, fix in production
}
```

**Environment Variable Issues**:
- Ensure all required env vars are set in Vercel
- Check variable names match exactly (case-sensitive)
- Restart deployment after adding new variables

**API Route Errors**:
- Check Supabase connection
- Verify Stripe keys are correct
- Test locally first with `npm run dev`

### Runtime Errors

**Database Connection**:
- Verify Supabase URL and keys
- Check RLS policies
- Ensure migrations were run

**Payment Processing**:
- Confirm Stripe keys are correct
- Check webhook endpoints
- Monitor Stripe dashboard for errors

**Authentication Issues**:
- Verify redirect URLs in Supabase
- Check CORS settings
- Test auth flow manually

## Performance Optimization

### 8.1 Vercel Edge Functions (Optional)
For better performance in India:
```javascript
// Add to API routes for geo-optimization
export const config = {
  runtime: 'edge',
  regions: ['bom1'], // Mumbai region for Indian users
}
```

### 8.2 Caching Strategy
```javascript
// Add to next.config.mjs
module.exports = {
  async headers() {
    return [
      {
        source: '/api/listings',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, s-maxage=60, stale-while-revalidate=300',
          },
        ],
      },
    ]
  },
}
```

## Security Checklist for Production

- [ ] Use Stripe live keys (not test keys)
- [ ] Generate new, secure admin API key
- [ ] Enable Supabase RLS on all tables
- [ ] Set up proper CORS policies
- [ ] Enable rate limiting (Vercel Pro feature)
- [ ] Set up monitoring and alerts
- [ ] Review and test all API endpoints
- [ ] Implement proper error handling
- [ ] Set up backup strategy

## Post-Deployment Testing

### Test User Flow:
1. **Sign Up**: Create account via email
2. **Create Listing**: Add baggage space
3. **Search**: Find available listings
4. **Book**: Create match with payment
5. **Accept**: Seller accepts booking
6. **Confirm**: Airport confirmation
7. **Admin**: Test dispute resolution

### Load Testing:
```bash
# Install Artillery for load testing
npm install -g artillery
artillery quick --count 10 --num 5 https://your-app-name.vercel.app
```

## Maintenance Tasks

### Regular Monitoring:
- Check Vercel function logs
- Monitor Supabase usage
- Review Stripe transaction logs
- Watch for fraud flags in admin panel

### Updates:
- Keep dependencies updated
- Monitor security advisories
- Regular database maintenance
- Performance optimization

## Support Resources

- **Vercel Support**: [vercel.com/support](https://vercel.com/support)
- **Supabase Docs**: [supabase.com/docs](https://supabase.com/docs)
- **Stripe Support**: [stripe.com/support](https://stripe.com/support)
- **Next.js Deployment**: [nextjs.org/docs/deployment](https://nextjs.org/docs/deployment)

## Quick Commands Reference

```bash
# Local development
npm run dev

# Build locally (test before deploy)
npm run build
npm run start

# Test API endpoints
node scripts/test-api.js

# Deploy via Git
git push origin main  # Auto-deploys to Vercel

# View logs
vercel logs https://your-app-name.vercel.app
```

---

**🎉 Your BagSwap MVP is now live on Vercel!**

Access your app at: `https://your-app-name.vercel.app`
