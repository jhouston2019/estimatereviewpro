-- Add usage tracking for firm plans
CREATE TABLE IF NOT EXISTS usage_tracking (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  billing_period_start timestamptz NOT NULL,
  reviews_used integer NOT NULL DEFAULT 0,
  plan_type text NOT NULL CHECK (plan_type IN ('individual', 'firm', 'pro')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_usage_tracking_org_period 
  ON usage_tracking(organization_id, billing_period_start);

-- Add plan metadata to profiles
ALTER TABLE profiles 
  ADD COLUMN IF NOT EXISTS plan_type text DEFAULT 'individual' CHECK (plan_type IN ('individual', 'firm', 'pro')),
  ADD COLUMN IF NOT EXISTS billing_period_start timestamptz,
  ADD COLUMN IF NOT EXISTS included_reviews integer DEFAULT 1,
  ADD COLUMN IF NOT EXISTS overage_price integer DEFAULT 0;

-- Function to reset usage at billing cycle
CREATE OR REPLACE FUNCTION reset_usage_for_billing_cycle()
RETURNS trigger AS $$
BEGIN
  -- When billing_period_start changes, reset usage
  IF OLD.billing_period_start IS DISTINCT FROM NEW.billing_period_start THEN
    INSERT INTO usage_tracking (
      organization_id,
      billing_period_start,
      reviews_used,
      plan_type
    ) VALUES (
      NEW.id,
      NEW.billing_period_start,
      0,
      NEW.plan_type
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-reset usage
DROP TRIGGER IF EXISTS trigger_reset_usage ON profiles;
CREATE TRIGGER trigger_reset_usage
  AFTER UPDATE OF billing_period_start ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION reset_usage_for_billing_cycle();

-- Function to get current usage
CREATE OR REPLACE FUNCTION get_current_usage(org_id uuid)
RETURNS TABLE (
  reviews_used integer,
  included_reviews integer,
  overage_price integer,
  plan_type text
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(ut.reviews_used, 0) as reviews_used,
    p.included_reviews,
    p.overage_price,
    p.plan_type
  FROM profiles p
  LEFT JOIN usage_tracking ut ON ut.organization_id = p.id 
    AND ut.billing_period_start = p.billing_period_start
  WHERE p.id = org_id;
END;
$$ LANGUAGE plpgsql;

