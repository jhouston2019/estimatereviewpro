-- Usage tracking for firm subscriptions
CREATE TABLE IF NOT EXISTS usage_tracking (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  billing_period_start timestamptz NOT NULL,
  billing_period_end timestamptz NOT NULL,
  reviews_used integer NOT NULL DEFAULT 0,
  plan_type text NOT NULL CHECK (plan_type IN ('firm', 'pro')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_usage_tracking_org_period 
  ON usage_tracking(organization_id, billing_period_start);

-- Function to get current usage for an organization
CREATE OR REPLACE FUNCTION get_current_usage(org_id uuid)
RETURNS TABLE (
  reviews_used integer,
  plan_type text,
  billing_period_start timestamptz,
  billing_period_end timestamptz
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ut.reviews_used,
    ut.plan_type,
    ut.billing_period_start,
    ut.billing_period_end
  FROM usage_tracking ut
  WHERE ut.organization_id = org_id
    AND ut.billing_period_start <= now()
    AND ut.billing_period_end > now()
  ORDER BY ut.billing_period_start DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Function to increment usage
CREATE OR REPLACE FUNCTION increment_usage(org_id uuid)
RETURNS void AS $$
DECLARE
  current_period record;
BEGIN
  -- Get current billing period
  SELECT * INTO current_period
  FROM usage_tracking
  WHERE organization_id = org_id
    AND billing_period_start <= now()
    AND billing_period_end > now()
  ORDER BY billing_period_start DESC
  LIMIT 1;

  -- Increment usage
  IF FOUND THEN
    UPDATE usage_tracking
    SET reviews_used = reviews_used + 1,
        updated_at = now()
    WHERE id = current_period.id;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Add plan fields to profiles table
ALTER TABLE profiles 
  ADD COLUMN IF NOT EXISTS plan_type text CHECK (plan_type IN ('individual', 'firm', 'pro')),
  ADD COLUMN IF NOT EXISTS stripe_subscription_id text,
  ADD COLUMN IF NOT EXISTS billing_period_start timestamptz,
  ADD COLUMN IF NOT EXISTS billing_period_end timestamptz;

-- Index for plan lookups
CREATE INDEX IF NOT EXISTS idx_profiles_plan_type ON profiles(plan_type);
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_subscription ON profiles(stripe_subscription_id);
