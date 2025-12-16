# Estimate Review Pro

AI-powered estimate analysis for insurance claims professionals, public adjusters, and contractors.

## Features

- **AI Estimate Analysis**: Extract and parse line items from contractor and carrier estimates using OpenAI Vision API
- **Comparison Engine**: Automatically identify missing items, underpriced work, and discrepancies
- **Carrier Letter Summarization**: Convert dense technical reports into plain-English summaries
- **PDF Report Generation**: Professional, white-label PDF reports for clients
- **Stripe Billing**: One-time ($79) and subscription ($249/mo) payment options
- **Secure Storage**: Files stored in Supabase with row-level security

## Tech Stack

- **Frontend**: Next.js 16, React 19, Tailwind CSS 4
- **Backend**: Netlify Functions (serverless)
- **Database**: Supabase (PostgreSQL)
- **AI**: OpenAI GPT-4o with Vision
- **Payments**: Stripe
- **Storage**: Supabase Storage
- **Hosting**: Netlify

## Setup Instructions

### 1. Clone and Install

```bash
cd estimatereviewpro
npm install
```

### 2. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Run the following SQL in the Supabase SQL Editor:

```sql
-- Create profiles table
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  stripe_customer_id TEXT,
  subscription_status TEXT,
  tier TEXT CHECK (tier IN ('free', 'oneoff', 'pro')) DEFAULT 'free'
);

-- Create reviews table
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  contractor_estimate_url TEXT,
  carrier_estimate_url TEXT,
  ai_analysis_json JSONB,
  ai_comparison_json JSONB,
  ai_summary_json JSONB,
  pdf_report_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Reviews policies
CREATE POLICY "Users can view own reviews"
  ON reviews FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own reviews"
  ON reviews FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reviews"
  ON reviews FOR UPDATE
  USING (auth.uid() = user_id);

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('uploads', 'uploads', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('reports', 'reports', true);

-- Storage policies for uploads bucket
CREATE POLICY "Users can upload own files"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'uploads' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view own uploads"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'uploads' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Storage policies for reports bucket
CREATE POLICY "Anyone can view reports"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'reports');

CREATE POLICY "Service role can upload reports"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'reports');

-- Trigger to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

### 3. Set Up Environment Variables

Create a `.env.local` file in the `estimatereviewpro` directory:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

OPENAI_API_KEY=your_openai_api_key

STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret

NEXT_PUBLIC_SITE_URL=http://localhost:3000
URL=http://localhost:3000
```

### 4. Set Up Stripe

1. Create a Stripe account at [stripe.com](https://stripe.com)
2. Get your API keys from the Stripe Dashboard
3. Set up a webhook endpoint pointing to `https://your-site.netlify.app/.netlify/functions/stripe-webhook`
4. Add these events to your webhook:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`

### 5. Deploy to Netlify

1. Push your code to GitHub
2. Connect your repo to Netlify
3. Add all environment variables in Netlify dashboard
4. Deploy!

Netlify will automatically:
- Build your Next.js app
- Deploy serverless functions
- Set up continuous deployment

## Development

```bash
# Run locally
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## Project Structure

```
estimatereviewpro/
├── app/                      # Next.js app directory
│   ├── dashboard/           # Dashboard pages
│   ├── account/             # Account & billing
│   ├── login/               # Auth pages
│   └── api/                 # API routes
├── components/              # React components
├── lib/                     # Utilities & Supabase clients
├── netlify/
│   └── functions/           # Serverless functions
│       ├── analyze-estimate.ts
│       ├── compare-estimates.ts
│       ├── summarize-report.ts
│       ├── generate-pdf.ts
│       ├── create-checkout.ts
│       ├── create-portal-session.ts
│       └── stripe-webhook.ts
└── public/                  # Static assets
```

## Business Logic

### Subscription Tiers

- **Free**: No access to analysis (must upgrade)
- **One-off ($79)**: Single estimate review
- **Pro ($249/mo)**: Unlimited reviews with priority processing

### Analysis Pipeline

1. User uploads contractor estimate (required) + carrier estimate (optional) + carrier letter (optional)
2. Files uploaded to Supabase Storage
3. Review record created in database
4. Netlify functions triggered:
   - `analyze-estimate`: Extract line items using OpenAI Vision
   - `compare-estimates`: Compare contractor vs carrier
   - `summarize-report`: Summarize carrier letter (if provided)
   - `generate-pdf`: Create professional PDF report
5. User redirected to review details page

## Security

- Row-level security on all database tables
- Files stored in user-specific folders
- Service role key only used in serverless functions
- Stripe webhooks verified with signing secret
- Authentication via Supabase Auth

## License

Proprietary - All rights reserved

## Support

For questions or issues, contact support@estimatereviewpro.com

