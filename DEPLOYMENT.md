# Deployment Guide - Estimate Review Pro

## Prerequisites

- Node.js 20+ installed
- Supabase account
- OpenAI API key
- Stripe account
- Netlify account
- GitHub account

## Step-by-Step Deployment

### 1. Install Dependencies

```bash
cd estimatereviewpro
npm install
```

This will install all required packages including:
- Next.js 16
- React 19
- Supabase client libraries
- OpenAI SDK
- Stripe SDK
- PDFKit
- Netlify Functions SDK

### 2. Set Up Supabase

#### A. Create Project
1. Go to [supabase.com](https://supabase.com)
2. Click "New Project"
3. Choose organization and name your project
4. Set a strong database password
5. Select a region close to your users

#### B. Run Database Setup
1. In Supabase dashboard, go to SQL Editor
2. Copy the entire contents of `supabase-setup.sql`
3. Paste and run in SQL Editor
4. Verify tables created: `profiles`, `reviews`
5. Verify storage buckets created: `uploads`, `reports`

#### C. Get API Keys
1. Go to Project Settings > API
2. Copy `Project URL` → This is your `NEXT_PUBLIC_SUPABASE_URL`
3. Copy `anon public` key → This is your `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Copy `service_role` key → This is your `SUPABASE_SERVICE_ROLE_KEY` (keep secret!)

### 3. Set Up OpenAI

1. Go to [platform.openai.com](https://platform.openai.com)
2. Create an account or sign in
3. Go to API Keys section
4. Click "Create new secret key"
5. Copy the key → This is your `OPENAI_API_KEY`
6. Make sure you have credits/billing set up

**Note**: The app uses GPT-4o with Vision, which costs approximately:
- Input: $2.50 per 1M tokens
- Output: $10.00 per 1M tokens
- Typical estimate analysis: $0.10-0.50 per review

### 4. Set Up Stripe

#### A. Create Account
1. Go to [stripe.com](https://stripe.com)
2. Create account and complete verification
3. Enable test mode for development

#### B. Get API Keys
1. Go to Developers > API Keys
2. Copy "Secret key" → This is your `STRIPE_SECRET_KEY`

#### C. Set Up Webhook (After Deployment)
1. Go to Developers > Webhooks
2. Click "Add endpoint"
3. Endpoint URL: `https://your-site.netlify.app/.netlify/functions/stripe-webhook`
4. Select events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
5. Copy "Signing secret" → This is your `STRIPE_WEBHOOK_SECRET`

### 5. Configure Environment Variables

Create `.env.local` for local development:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# OpenAI
OPENAI_API_KEY=sk-proj-xxxxx

# Stripe
STRIPE_SECRET_KEY=sk_test_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx

# Site URL
NEXT_PUBLIC_SITE_URL=http://localhost:3000
URL=http://localhost:3000
```

### 6. Test Locally

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Run dev server with Netlify functions
netlify dev
```

This will:
- Start Next.js on port 3000
- Start Netlify functions on port 8888
- Proxy everything through Netlify Dev

Test the flow:
1. Register a new account
2. Try to upload without payment (should block)
3. Go to account page
4. Use Stripe test card: `4242 4242 4242 4242`
5. Complete checkout
6. Upload an estimate
7. Verify analysis runs
8. Check PDF generation

### 7. Deploy to Netlify

#### A. Push to GitHub
```bash
git init
git add .
git commit -m "Initial commit - Estimate Review Pro"
git branch -M main
git remote add origin https://github.com/yourusername/estimatereviewpro.git
git push -u origin main
```

#### B. Connect to Netlify
1. Go to [netlify.com](https://netlify.com)
2. Click "Add new site" > "Import an existing project"
3. Choose GitHub and select your repository
4. Configure build settings:
   - Build command: `npm run build`
   - Publish directory: `.next`
   - Functions directory: `netlify/functions`

#### C. Add Environment Variables
In Netlify dashboard:
1. Go to Site settings > Environment variables
2. Add all variables from `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `OPENAI_API_KEY`
   - `STRIPE_SECRET_KEY`
   - `STRIPE_WEBHOOK_SECRET`
   - `NEXT_PUBLIC_SITE_URL` (use your Netlify URL)
   - `URL` (use your Netlify URL)

#### D. Deploy
1. Click "Deploy site"
2. Wait for build to complete
3. Copy your site URL (e.g., `https://your-site.netlify.app`)

### 8. Configure Stripe Webhook (Production)

1. Go back to Stripe dashboard
2. Add webhook endpoint with your production URL
3. Update `STRIPE_WEBHOOK_SECRET` in Netlify environment variables
4. Redeploy site

### 9. Update Supabase URLs

In Supabase dashboard:
1. Go to Authentication > URL Configuration
2. Add your Netlify URL to:
   - Site URL
   - Redirect URLs

### 10. Test Production

1. Visit your Netlify URL
2. Register a new account
3. Complete full workflow:
   - Purchase subscription
   - Upload estimates
   - Verify AI analysis
   - Download PDF report
   - Test billing portal

## Troubleshooting

### Functions Not Working
- Check Netlify function logs
- Verify environment variables are set
- Ensure `netlify.toml` is correct

### Supabase Errors
- Check RLS policies are enabled
- Verify storage buckets exist
- Check API keys are correct

### Stripe Webhook Failing
- Verify webhook secret matches
- Check endpoint URL is correct
- Test with Stripe CLI: `stripe listen --forward-to localhost:8888/.netlify/functions/stripe-webhook`

### OpenAI Errors
- Verify API key is valid
- Check billing/credits
- Ensure GPT-4o access is enabled

### Upload Failing
- Check Supabase storage policies
- Verify file size limits
- Check CORS settings in Supabase

## Monitoring

### Netlify
- Function logs: Netlify dashboard > Functions
- Build logs: Netlify dashboard > Deploys
- Analytics: Enable Netlify Analytics

### Supabase
- Database logs: Supabase dashboard > Logs
- API usage: Supabase dashboard > Settings > Usage

### Stripe
- Payments: Stripe dashboard > Payments
- Webhooks: Stripe dashboard > Developers > Webhooks

## Costs Estimate

### Monthly Operating Costs (100 reviews/month)
- Netlify: $0 (free tier) or $19/mo (Pro)
- Supabase: $0 (free tier) or $25/mo (Pro)
- OpenAI: ~$10-50 (depends on usage)
- Stripe: 2.9% + $0.30 per transaction

### Revenue (100 reviews/month)
- 50 one-off @ $79 = $3,950
- 10 subscriptions @ $249 = $2,490
- **Total: $6,440/month**

### Profit Margin
- Revenue: $6,440
- Costs: ~$100
- **Profit: ~$6,340 (98% margin)**

## Scaling

### 1,000+ reviews/month
- Upgrade Supabase to Pro ($25/mo)
- Upgrade Netlify to Pro ($19/mo)
- Consider OpenAI batch API for cost savings
- Enable CDN caching for PDFs

### 10,000+ reviews/month
- Consider dedicated infrastructure
- Implement queue system (BullMQ)
- Add Redis caching
- Optimize PDF generation
- Consider self-hosting OpenAI alternatives

## Security Checklist

- ✅ Row-level security enabled on all tables
- ✅ Service role key only in serverless functions
- ✅ Stripe webhook signature verification
- ✅ File uploads restricted to authenticated users
- ✅ HTTPS enforced on all endpoints
- ✅ Environment variables secured in Netlify
- ✅ CORS configured properly
- ✅ Rate limiting on API endpoints (consider adding)

## Next Steps

1. Set up custom domain
2. Add email notifications (SendGrid/Resend)
3. Implement usage analytics
4. Add team/organization features
5. Build admin dashboard
6. Add more payment options
7. Implement referral program
8. Add API for integrations

## Support

For issues or questions:
- Check logs in Netlify/Supabase dashboards
- Review this deployment guide
- Check README.md for architecture details

