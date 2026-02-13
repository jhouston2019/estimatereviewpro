# NETLIFY DEPLOYMENT GUIDE

## Current Status: ⚠️ BUILD FAILING (Expected - Missing Environment Variables)

The build is failing because required environment variables are not configured in Netlify. This is normal for a first deployment.

---

## 🚨 CRITICAL: Required Environment Variables

Before the site can deploy, you MUST add these environment variables in Netlify:

### 1. Go to Netlify Dashboard
1. Open your site
2. Go to **Site settings** → **Build & deploy** → **Environment**
3. Click **Add a variable** for each of the following:

---

## 📋 REQUIRED ENVIRONMENT VARIABLES

### Supabase (3 variables)
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

**Where to find these:**
1. Go to your Supabase project dashboard
2. Click **Settings** → **API**
3. Copy:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon` `public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` `secret` key → `SUPABASE_SERVICE_ROLE_KEY`

---

### Stripe (3 variables)
```bash
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_... (or pk_live_...)
STRIPE_SECRET_KEY=sk_test_... (or sk_live_...)
STRIPE_WEBHOOK_SECRET=whsec_...
```

**Where to find these:**
1. Go to Stripe Dashboard → **Developers** → **API keys**
2. Copy:
   - Publishable key → `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
   - Secret key → `STRIPE_SECRET_KEY`
3. For webhook secret:
   - Go to **Developers** → **Webhooks**
   - Click on your webhook endpoint
   - Copy **Signing secret** → `STRIPE_WEBHOOK_SECRET`

---

### Stripe Price IDs (5 variables)
```bash
STRIPE_PRICE_SINGLE_REVIEW=price_...
STRIPE_PRICE_PROFESSIONAL=price_...
STRIPE_PRICE_ENTERPRISE=price_...
STRIPE_PRICE_PROFESSIONAL_OVERAGE=price_...
STRIPE_PRICE_ENTERPRISE_OVERAGE=price_...
```

**Where to find these:**
1. Go to Stripe Dashboard → **Products**
2. Click on each product
3. Copy the Price ID for each:
   - Single Estimate Review ($49) → `STRIPE_PRICE_SINGLE_REVIEW`
   - Professional Plan ($299/month) → `STRIPE_PRICE_PROFESSIONAL`
   - Professional Overage ($29) → `STRIPE_PRICE_PROFESSIONAL_OVERAGE`
   - Enterprise Plan ($599/month) → `STRIPE_PRICE_ENTERPRISE`
   - Enterprise Overage ($19) → `STRIPE_PRICE_ENTERPRISE_OVERAGE`

**Note:** If you haven't created these products yet, see `STRIPE_SETUP.md`

---

### OpenAI (1 variable)
```bash
OPENAI_API_KEY=sk-...
```

**Where to find this:**
1. Go to OpenAI Platform → **API keys**
2. Create a new secret key or use existing
3. Copy → `OPENAI_API_KEY`

---

### App URL (1 variable)
```bash
NEXT_PUBLIC_APP_URL=https://your-site.netlify.app
```

**Set this to your Netlify site URL:**
- For testing: `https://your-site-name.netlify.app`
- For production: `https://yourdomain.com`

---

## 🔧 TOTAL: 13 Environment Variables Required

| Variable | Required | Source |
|----------|----------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Supabase Dashboard |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Supabase Dashboard |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Supabase Dashboard |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | ✅ | Stripe Dashboard |
| `STRIPE_SECRET_KEY` | ✅ | Stripe Dashboard |
| `STRIPE_WEBHOOK_SECRET` | ✅ | Stripe Webhooks |
| `STRIPE_PRICE_SINGLE_REVIEW` | ✅ | Stripe Products |
| `STRIPE_PRICE_PROFESSIONAL` | ✅ | Stripe Products |
| `STRIPE_PRICE_ENTERPRISE` | ✅ | Stripe Products |
| `STRIPE_PRICE_PROFESSIONAL_OVERAGE` | ✅ | Stripe Products |
| `STRIPE_PRICE_ENTERPRISE_OVERAGE` | ✅ | Stripe Products |
| `OPENAI_API_KEY` | ✅ | OpenAI Platform |
| `NEXT_PUBLIC_APP_URL` | ✅ | Your Netlify URL |

---

## 🚀 DEPLOYMENT STEPS

### Step 1: Add Environment Variables
1. Go to Netlify site settings
2. Add all 13 environment variables listed above
3. Click **Save**

### Step 2: Apply Database Migrations
Before deploying, you need to run the database migrations:

```bash
# Connect to your Supabase project
# Go to Supabase Dashboard → SQL Editor

# Run the migration file:
# Copy contents of: supabase/migrations/20260210_pricing_schema.sql
# Paste into SQL Editor and execute
```

**Or use Supabase CLI:**
```bash
supabase db push
```

### Step 3: Create Stripe Products
If you haven't already, create the Stripe products:

See `STRIPE_SETUP.md` for detailed instructions.

### Step 4: Configure Stripe Webhook
1. Go to Stripe Dashboard → **Developers** → **Webhooks**
2. Click **Add endpoint**
3. Endpoint URL: `https://your-site.netlify.app/api/webhook`
4. Select events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Copy the **Signing secret** → Add to Netlify as `STRIPE_WEBHOOK_SECRET`

### Step 5: Trigger New Deploy
1. Go to Netlify → **Deploys**
2. Click **Trigger deploy** → **Deploy site**
3. Wait for build to complete

---

## ✅ VERIFICATION CHECKLIST

After deployment succeeds:

- [ ] Site loads without errors
- [ ] Landing page displays correctly
- [ ] `/upload` page loads
- [ ] `/pricing` page loads
- [ ] Can create account (Supabase auth works)
- [ ] Can upload estimate (preview mode)
- [ ] Export buttons are blurred (gating works)
- [ ] Single payment flow works ($49 checkout)
- [ ] Subscription flow works (Professional/Enterprise)
- [ ] Stripe webhook receives events

---

## 🐛 TROUBLESHOOTING

### Build Still Failing?

**Check:**
1. All 13 environment variables are added
2. No typos in variable names
3. Values are correct (no extra spaces)
4. Supabase keys are from correct project
5. Stripe keys match mode (test vs live)

### "Neither apiKey nor config.authenticator provided"

This error means Stripe secret key is missing or incorrect.

**Fix:**
- Verify `STRIPE_SECRET_KEY` is set in Netlify
- Verify it starts with `sk_test_` or `sk_live_`

### "supabaseKey is required"

This error means Supabase service role key is missing.

**Fix:**
- Verify `SUPABASE_SERVICE_ROLE_KEY` is set in Netlify
- Verify it's the `service_role` key (not `anon` key)

### Database Errors

If you see database errors after deployment:

**Fix:**
1. Verify migrations were applied
2. Check RLS policies are enabled
3. Verify Supabase service role key is correct

---

## 📊 DEPLOYMENT MODES

### Test Mode (Recommended First)
Use Stripe test keys:
- `pk_test_...`
- `sk_test_...`

**Benefits:**
- No real charges
- Test all flows safely
- Verify everything works

### Production Mode
Use Stripe live keys:
- `pk_live_...`
- `sk_live_...`

**Requirements:**
- Stripe account activated
- Business verified
- All flows tested in test mode

---

## 🔒 SECURITY NOTES

**NEVER commit these to git:**
- ❌ `.env.local`
- ❌ Stripe secret keys
- ❌ Supabase service role key
- ❌ OpenAI API key

**ONLY add them in:**
- ✅ Netlify environment variables
- ✅ Local `.env.local` (gitignored)

---

## 📝 NEXT STEPS AFTER SUCCESSFUL DEPLOY

1. **Test all flows end-to-end**
   - Upload estimate
   - Preview results
   - Single payment
   - Subscription signup
   - Usage limits
   - Overage billing

2. **Configure custom domain** (optional)
   - Go to Netlify → **Domain settings**
   - Add custom domain
   - Update DNS records
   - Update `NEXT_PUBLIC_APP_URL`
   - Update Stripe webhook URL

3. **Monitor errors**
   - Check Netlify function logs
   - Check Supabase logs
   - Check Stripe webhook logs

4. **Set up monitoring** (recommended)
   - Sentry for error tracking
   - Google Analytics for usage
   - Stripe Dashboard for payments

---

## 🎯 CURRENT ERROR EXPLANATION

The error you're seeing is **expected and normal** for a first deployment:

```
Error: Neither apiKey nor config.authenticator provided
Error: supabaseKey is required.
Error: Failed to collect page data for /api/checkout-subscription
```

**Why this happens:**
- Next.js tries to evaluate API routes during build
- API routes try to initialize Stripe and Supabase clients
- Environment variables are not set yet
- Build fails

**Solution:**
Add all 13 environment variables in Netlify, then redeploy.

---

## 📞 SUPPORT

If you're still stuck after adding environment variables:

1. Check `PRODUCTION_READINESS.md` for complete setup checklist
2. Check `STRIPE_SETUP.md` for Stripe configuration
3. Check `PRICING_IMPLEMENTATION.md` for implementation details
4. Verify all prerequisites are complete

---

## END OF NETLIFY DEPLOYMENT GUIDE
