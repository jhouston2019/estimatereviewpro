-- Create organization_usage table for tracking review usage
CREATE TABLE IF NOT EXISTS organization_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id text NOT NULL UNIQUE, -- Stripe customer ID
  billing_period_start timestamptz NOT NULL,
  reviews_used integer NOT NULL DEFAULT 0,
  plan_type text NOT NULL, -- 'individual', 'firm', or 'pro'
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Add index for fast lookups
CREATE INDEX IF NOT EXISTS idx_organization_usage_org_id ON organization_usage(organization_id);
CREATE INDEX IF NOT EXISTS idx_organization_usage_plan_type ON organization_usage(plan_type);

-- Add RLS policies
ALTER TABLE organization_usage ENABLE ROW LEVEL SECURITY;

-- Service role can do everything
CREATE POLICY "Service role has full access to organization_usage"
  ON organization_usage
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Update profiles table to include organization info
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS stripe_customer_id text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS organization_id text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS plan_type text DEFAULT 'free';

-- Add indexes for profiles
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_customer_id ON profiles(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_profiles_organization_id ON profiles(organization_id);
CREATE INDEX IF NOT EXISTS idx_profiles_plan_type ON profiles(plan_type);

-- Update reviews table to track which organization submitted it
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS organization_id text;
CREATE INDEX IF NOT EXISTS idx_reviews_organization_id ON reviews(organization_id);

-- Add comment
COMMENT ON TABLE organization_usage IS 'Tracks monthly usage for firm subscriptions';

