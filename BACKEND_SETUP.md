# BagSwap MVP - Backend Setup Guide

## Prerequisites

1. **Node.js** (v18 or later)
2. **Supabase Account** - [app.supabase.com](https://app.supabase.com)
3. **Stripe Account** - [dashboard.stripe.com](https://dashboard.stripe.com)

## Step 1: Supabase Setup

### 1.1 Create Supabase Project
1. Go to [app.supabase.com](https://app.supabase.com)
2. Click "New Project"
3. Choose your organization
4. Enter project name: `bagswap-mvp`
5. Generate a strong database password
6. Select region closest to your users (e.g., `ap-south-1` for India)
7. Click "Create new project"

### 1.2 Get Supabase Credentials
Once your project is created:

1. Go to **Settings** → **API**
2. Copy the following values:
   - **Project URL** (looks like: `https://xxxxxxxxxxxxx.supabase.co`)
   - **anon public** key (starts with `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`)
   - **service_role** key (starts with `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`)

### 1.3 Run Database Migration
1. In Supabase Dashboard, go to **SQL Editor**
2. Copy the contents of `migrations/001_initial_schema.sql`
3. Paste into SQL Editor and click **Run**
4. Verify tables are created in **Table Editor**

### 1.4 Configure Authentication
1. Go to **Authentication** → **Settings**
2. Under **Site URL**, add your domain: `http://localhost:3000` (for development)
3. Under **Redirect URLs**, add: `http://localhost:3000/auth/callback`

## Step 2: Stripe Setup

### 2.1 Get Stripe API Keys
1. Go to [dashboard.stripe.com](https://dashboard.stripe.com)
2. Switch to **Test mode** (toggle in left sidebar)
3. Go to **Developers** → **API keys**
4. Copy:
   - **Publishable key** (starts with `pk_test_...`)
   - **Secret key** (starts with `sk_test_...`)

### 2.2 Configure Stripe for India
1. Go to **Settings** → **Account details**
2. Set country to **India** if targeting Indian users
3. Go to **Settings** → **Payment methods**
4. Enable **UPI**, **Cards**, **Wallets** as needed

## Step 3: Environment Configuration

### 3.1 Create Environment File
Create `.env.local` in your project root:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Stripe Configuration
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...

# Admin Configuration
ADMIN_API_KEY=your-secure-admin-key-here

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3.2 Install Dependencies
```bash
npm install @supabase/supabase-js stripe
```

## Step 4: API Testing

### 4.1 Test Database Connection
Create a test user via Supabase Auth UI or API, then test:

```bash
curl -X GET "http://localhost:3000/api/admin/stats" \
  -H "x-admin-key: your-secure-admin-key-here"
```

### 4.2 Test Stripe Integration
```bash
# Create a listing (requires authenticated user)
curl -X POST "http://localhost:3000/api/listings" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-uuid-here",
    "flightNo": "AI101",
    "flightDate": "2024-12-25",
    "airline": "Air India",
    "weightKg": 15,
    "pricePerKg": 50000,
    "autoAccept": false
  }'
```

## Step 5: Frontend Integration

### 5.1 Update Frontend Auth
Replace mock auth in `components/auth-provider.tsx` with Supabase auth:

```typescript
import { supabase } from '@/lib/supabase'

// Replace mock login with:
const login = async (email: string) => {
  const { data, error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: true
    }
  })
  if (error) throw error
  return data
}
```

### 5.2 Update API Calls
Replace mock database calls with actual API calls:

```typescript
// Replace mockDb.createListing with:
const createListing = async (listingData) => {
  const response = await fetch('/api/listings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(listingData)
  })
  return response.json()
}
```

## Step 6: Production Deployment

### 6.1 Vercel Environment Variables
In Vercel dashboard, add all environment variables from `.env.local`:

1. Go to your Vercel project
2. **Settings** → **Environment Variables**
3. Add each variable with appropriate values for production

### 6.2 Supabase Production URLs
Update redirect URLs in Supabase:
1. **Authentication** → **Settings**
2. Add production URLs to **Site URL** and **Redirect URLs**

### 6.3 Stripe Production Keys
Switch to Stripe live mode and update keys in production environment.

## API Endpoints Reference

### Authentication
- Uses Supabase Auth (OTP, Magic Links, Social)

### Listings
- `POST /api/listings` - Create new listing
- `GET /api/listings?flightNo=AI101&flightDate=2024-12-25` - Search listings

### Matches
- `POST /api/matches` - Create match (book listing)
- `GET /api/matches?userId=uuid&type=buyer` - Get user matches
- `POST /api/matches/:id/accept` - Seller accepts match
- `POST /api/matches/:id/confirm` - Confirm at airport (capture payment)
- `POST /api/matches/:id/dispute` - Report dispute

### Admin
- `GET /api/admin/stats` - Platform statistics
- `GET /api/admin/disputes` - List disputes
- `POST /api/admin/disputes` - Resolve dispute

## Security Features

### Fraud Prevention
- **Trust Scores**: Based on verified status, match history, flight history
- **Auto-Accept Limits**: Only users with 2+ matches and verified status
- **Buyer Eligibility**: Requires 1+ past flight
- **Rate Limiting**: Flags users with 3+ requests in 24h

### Payment Security
- **Escrow System**: Payments held until confirmation
- **Manual Capture**: Funds released only after both parties confirm
- **Dispute Resolution**: Admin can refund or release disputed payments

### Data Protection
- **Row Level Security**: Database-level access control
- **Contact Masking**: Personal info hidden until match acceptance
- **Audit Logging**: All actions tracked for security review

## Monitoring & Maintenance

### Health Checks
- Monitor Supabase connection
- Track Stripe webhook delivery
- Watch for fraud flags

### Regular Tasks
- Review disputed matches
- Update trust scores
- Clean up old data

### Scaling Considerations
- Database indexing for performance
- Stripe webhook processing
- Background job queue for notifications

## Troubleshooting

### Common Issues

**Database Connection Failed**
- Verify SUPABASE_URL and keys
- Check RLS policies
- Ensure user has proper permissions

**Stripe Payment Failed**
- Verify webhook endpoints
- Check API key validity
- Monitor Stripe dashboard for errors

**Authentication Issues**
- Check redirect URLs
- Verify JWT tokens
- Review Supabase auth settings

### Support Contacts
- Supabase: [supabase.com/docs](https://supabase.com/docs)
- Stripe: [stripe.com/docs](https://stripe.com/docs)
- Next.js: [nextjs.org/docs](https://nextjs.org/docs)
