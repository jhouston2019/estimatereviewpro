# Quick Start Guide - Estimate Review Pro

Get up and running in 15 minutes.

## 1. Install Dependencies (2 min)

```bash
cd estimatereviewpro
npm install
```

## 2. Set Up Supabase (5 min)

1. Create account at [supabase.com](https://supabase.com)
2. Create new project
3. Go to SQL Editor
4. Copy/paste contents of `supabase-setup.sql`
5. Run the SQL
6. Go to Settings > API and copy:
   - Project URL
   - anon public key
   - service_role key

## 3. Get API Keys (3 min)

**OpenAI:**
- Visit [platform.openai.com/api-keys](https://platform.openai.com/api-keys)
- Create new key
- Copy it

**Stripe:**
- Visit [dashboard.stripe.com/test/apikeys](https://dashboard.stripe.com/test/apikeys)
- Copy "Secret key"
- For webhook secret, we'll set it up after deployment

## 4. Configure Environment (2 min)

Create `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

OPENAI_API_KEY=sk-proj-xxxxx

STRIPE_SECRET_KEY=sk_test_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx

NEXT_PUBLIC_SITE_URL=http://localhost:3000
URL=http://localhost:3000
```

## 5. Run Locally (1 min)

```bash
# Install Netlify CLI globally
npm install -g netlify-cli

# Start dev server
netlify dev
```

Visit http://localhost:8888

## 6. Test the Flow (2 min)

1. Register account
2. Go to Account page
3. Use test card: `4242 4242 4242 4242`
4. Purchase one-off review ($79)
5. Upload a sample estimate PDF
6. Watch the magic happen! ✨

## Deploy to Production

See `DEPLOYMENT.md` for full deployment instructions.

## Need Help?

- Check `README.md` for architecture overview
- Check `DEPLOYMENT.md` for detailed setup
- Check `TESTING.md` for testing checklist

## Common Issues

**"Cannot find module"**
- Run `npm install`

**"Invalid Supabase credentials"**
- Check `.env.local` has correct keys
- Verify keys copied correctly (no extra spaces)

**"OpenAI API error"**
- Verify API key is valid
- Check you have credits in OpenAI account
- Ensure GPT-4o access is enabled

**"Stripe webhook error"**
- For local testing, use Stripe CLI
- For production, set up webhook in Stripe dashboard

**"File upload fails"**
- Check Supabase storage buckets exist
- Verify RLS policies are set up
- Check file size (max 10MB recommended)

## What Gets Built

This is a complete, production-ready SaaS application with:

✅ User authentication (Supabase Auth)
✅ Payment processing (Stripe)
✅ AI analysis (OpenAI GPT-4o Vision)
✅ PDF generation (PDFKit)
✅ File storage (Supabase Storage)
✅ Serverless functions (Netlify)
✅ Beautiful UI (Tailwind CSS)
✅ Row-level security
✅ Subscription management
✅ Usage limits enforcement

## Next Steps

1. Customize branding (colors, logo, copy)
2. Set up custom domain
3. Add email notifications
4. Implement analytics
5. Add more features!

## Revenue Potential

With 100 reviews/month:
- 50 one-off @ $79 = $3,950
- 10 subscriptions @ $249 = $2,490
- **Total: $6,440/month**

Operating costs: ~$100/month
**Profit: ~$6,340/month (98% margin)**

## Support

Questions? Check the docs or reach out!

