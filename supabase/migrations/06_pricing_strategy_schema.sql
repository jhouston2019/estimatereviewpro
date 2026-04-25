/**
 * PRICING STRATEGY - DATABASE SCHEMA
 * Migration 06: Subscription plans and usage tracking
 * 
 * Purpose: Support new pricing model with usage limits and recovery guarantee
 */

-- ============================================================================
-- SUBSCRIPTION PLANS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS subscription_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  plan_name TEXT NOT NULL UNIQUE,
  stripe_price_id TEXT,
  price NUMERIC(10,2) NOT NULL,
  reviews_per_month INTEGER,
  features JSONB DEFAULT '[]'::jsonb,
  plan_type TEXT NOT NULL, -- 'one-time', 'monthly', 'annual'
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_subscription_plans_name ON subscription_plans(plan_name);
CREATE INDEX idx_subscription_plans_active ON subscription_plans(is_active);

COMMENT ON TABLE subscription_plans IS 'Available subscription plans and pricing tiers';

-- ============================================================================
-- USER REVIEW USAGE TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_review_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id UUID REFERENCES subscription_plans(id),
  reviews_used INTEGER DEFAULT 0,
  reviews_limit INTEGER,
  billing_period_start TIMESTAMPTZ NOT NULL,
  billing_period_end TIMESTAMPTZ NOT NULL,
  stripe_subscription_id TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_user_review_usage_user ON user_review_usage(user_id);
CREATE INDEX idx_user_review_usage_active ON user_review_usage(user_id, is_active);
CREATE INDEX idx_user_review_usage_period ON user_review_usage(billing_period_start, billing_period_end);

COMMENT ON TABLE user_review_usage IS 'Track user review usage and limits by billing period';

-- ============================================================================
-- RECOVERY METRICS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS recovery_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  report_id UUID REFERENCES reports(id) ON DELETE CASCADE,
  estimate_id TEXT,
  original_estimate_value NUMERIC(10,2),
  reconstructed_value NUMERIC(10,2),
  recovery_value NUMERIC(10,2) NOT NULL,
  carrier TEXT,
  claim_type TEXT,
  state TEXT,
  guarantee_triggered BOOLEAN DEFAULT false,
  refund_issued BOOLEAN DEFAULT false,
  refund_amount NUMERIC(10,2),
  stripe_refund_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_recovery_metrics_user ON recovery_metrics(user_id);
CREATE INDEX idx_recovery_metrics_report ON recovery_metrics(report_id);
CREATE INDEX idx_recovery_metrics_carrier ON recovery_metrics(carrier);
CREATE INDEX idx_recovery_metrics_guarantee ON recovery_metrics(guarantee_triggered);

COMMENT ON TABLE recovery_metrics IS 'Track recovery value and guarantee triggers';

-- ============================================================================
-- PAYMENT TRANSACTIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS payment_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_payment_id TEXT NOT NULL,
  stripe_customer_id TEXT,
  amount NUMERIC(10,2) NOT NULL,
  currency TEXT DEFAULT 'usd',
  payment_type TEXT NOT NULL, -- 'one-time', 'subscription'
  plan_id UUID REFERENCES subscription_plans(id),
  status TEXT NOT NULL, -- 'succeeded', 'pending', 'failed', 'refunded'
  refunded_amount NUMERIC(10,2) DEFAULT 0,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_payment_transactions_user ON payment_transactions(user_id);
CREATE INDEX idx_payment_transactions_stripe ON payment_transactions(stripe_payment_id);
CREATE INDEX idx_payment_transactions_status ON payment_transactions(status);

COMMENT ON TABLE payment_transactions IS 'Track all payment transactions and refunds';

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_review_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE recovery_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;

-- Subscription plans: Anyone can view
CREATE POLICY "Anyone can view subscription plans"
  ON subscription_plans FOR SELECT
  USING (is_active = true);

-- User review usage: Users can view their own
CREATE POLICY "Users can view own usage"
  ON user_review_usage FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage usage"
  ON user_review_usage FOR ALL
  USING (true);

-- Recovery metrics: Users can view their own
CREATE POLICY "Users can view own recovery metrics"
  ON recovery_metrics FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert recovery metrics"
  ON recovery_metrics FOR INSERT
  WITH CHECK (true);

-- Payment transactions: Users can view their own
CREATE POLICY "Users can view own transactions"
  ON payment_transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage transactions"
  ON payment_transactions FOR ALL
  USING (true);

-- ============================================================================
-- DEFAULT SUBSCRIPTION PLANS
-- ============================================================================

INSERT INTO subscription_plans (plan_name, price, reviews_per_month, plan_type, features) VALUES
  (
    'Single Review',
    49.00,
    1,
    'one-time',
    '["Comprehensive estimate analysis", "Issue detection", "Recovery calculation", "Litigation evidence", "Recovery guarantee"]'::jsonb
  ),
  (
    'Enterprise',
    299.00,
    20,
    'monthly',
    '["20 estimate reviews per month", "Carrier intelligence reports", "Recovery analytics dashboard", "Priority support"]'::jsonb
  ),
  (
    'Litigation',
    499.00,
    NULL, -- unlimited
    'monthly',
    '["Unlimited estimate reviews", "Attorney-ready evidence reports", "Carrier behavior analytics", "Litigation exhibits", "Expert witness support", "Priority processing", "Dedicated account manager"]'::jsonb
  );

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

/**
 * Get user's current plan and usage
 */
CREATE OR REPLACE FUNCTION get_user_plan_usage(user_id_param UUID)
RETURNS TABLE (
  plan_name TEXT,
  reviews_used INTEGER,
  reviews_limit INTEGER,
  reviews_remaining INTEGER,
  billing_period_end TIMESTAMPTZ,
  is_active BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sp.plan_name,
    uru.reviews_used,
    uru.reviews_limit,
    CASE 
      WHEN uru.reviews_limit IS NULL THEN NULL -- unlimited
      ELSE uru.reviews_limit - uru.reviews_used
    END as reviews_remaining,
    uru.billing_period_end,
    uru.is_active
  FROM user_review_usage uru
  JOIN subscription_plans sp ON uru.plan_id = sp.id
  WHERE uru.user_id = user_id_param
    AND uru.is_active = true
    AND uru.billing_period_end > NOW()
  ORDER BY uru.created_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

/**
 * Check if user can create review
 */
CREATE OR REPLACE FUNCTION can_user_create_review(user_id_param UUID)
RETURNS BOOLEAN AS $$
DECLARE
  usage_record RECORD;
BEGIN
  SELECT * INTO usage_record
  FROM user_review_usage
  WHERE user_id = user_id_param
    AND is_active = true
    AND billing_period_end > NOW()
  ORDER BY created_at DESC
  LIMIT 1;
  
  -- No active plan
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  -- Unlimited plan
  IF usage_record.reviews_limit IS NULL THEN
    RETURN true;
  END IF;
  
  -- Check if under limit
  RETURN usage_record.reviews_used < usage_record.reviews_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

/**
 * Increment user review usage
 */
CREATE OR REPLACE FUNCTION increment_review_usage(user_id_param UUID)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE user_review_usage
  SET 
    reviews_used = reviews_used + 1,
    updated_at = NOW()
  WHERE user_id = user_id_param
    AND is_active = true
    AND billing_period_end > NOW();
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

/**
 * Get user's total recovery value
 */
CREATE OR REPLACE FUNCTION get_user_total_recovery(user_id_param UUID)
RETURNS NUMERIC AS $$
DECLARE
  total NUMERIC;
BEGIN
  SELECT COALESCE(SUM(recovery_value), 0)
  INTO total
  FROM recovery_metrics
  WHERE user_id = user_id_param;
  
  RETURN total;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

/**
 * Get recovery metrics summary
 */
CREATE OR REPLACE FUNCTION get_recovery_summary(user_id_param UUID)
RETURNS TABLE (
  total_reviews INTEGER,
  total_recovery NUMERIC,
  average_recovery NUMERIC,
  guarantees_triggered INTEGER,
  refunds_issued INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::INTEGER as total_reviews,
    COALESCE(SUM(recovery_value), 0) as total_recovery,
    COALESCE(AVG(recovery_value), 0) as average_recovery,
    COUNT(*) FILTER (WHERE guarantee_triggered = true)::INTEGER as guarantees_triggered,
    COUNT(*) FILTER (WHERE refund_issued = true)::INTEGER as refunds_issued
  FROM recovery_metrics
  WHERE user_id = user_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

/**
 * Reset monthly usage (called by cron job)
 */
CREATE OR REPLACE FUNCTION reset_monthly_usage()
RETURNS INTEGER AS $$
DECLARE
  reset_count INTEGER;
BEGIN
  -- Reset usage for expired billing periods
  UPDATE user_review_usage
  SET 
    reviews_used = 0,
    billing_period_start = billing_period_end,
    billing_period_end = billing_period_end + INTERVAL '1 month',
    updated_at = NOW()
  WHERE billing_period_end <= NOW()
    AND is_active = true;
  
  GET DIAGNOSTICS reset_count = ROW_COUNT;
  
  RETURN reset_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- VIEWS
-- ============================================================================

/**
 * User plan overview
 */
CREATE OR REPLACE VIEW user_plan_overview AS
SELECT 
  u.id as user_id,
  u.email,
  sp.plan_name,
  sp.price,
  uru.reviews_used,
  uru.reviews_limit,
  CASE 
    WHEN uru.reviews_limit IS NULL THEN 'Unlimited'
    ELSE (uru.reviews_limit - uru.reviews_used)::TEXT
  END as reviews_remaining,
  uru.billing_period_end,
  uru.is_active,
  COALESCE(rm.total_recovery, 0) as total_recovery_value
FROM auth.users u
LEFT JOIN user_review_usage uru ON u.id = uru.user_id AND uru.is_active = true
LEFT JOIN subscription_plans sp ON uru.plan_id = sp.id
LEFT JOIN (
  SELECT user_id, SUM(recovery_value) as total_recovery
  FROM recovery_metrics
  GROUP BY user_id
) rm ON u.id = rm.user_id;

/**
 * Recovery performance metrics
 */
CREATE OR REPLACE VIEW recovery_performance AS
SELECT 
  carrier,
  claim_type,
  COUNT(*) as total_claims,
  AVG(recovery_value) as avg_recovery,
  SUM(recovery_value) as total_recovery,
  COUNT(*) FILTER (WHERE guarantee_triggered = true) as guarantees_triggered,
  COUNT(*) FILTER (WHERE refund_issued = true) as refunds_issued,
  (COUNT(*) FILTER (WHERE guarantee_triggered = true)::FLOAT / COUNT(*)) * 100 as guarantee_rate
FROM recovery_metrics
GROUP BY carrier, claim_type;

-- ============================================================================
-- GRANTS
-- ============================================================================

GRANT SELECT ON subscription_plans TO authenticated;
GRANT SELECT ON subscription_plans TO anon;
GRANT SELECT ON user_review_usage TO authenticated;
GRANT SELECT ON recovery_metrics TO authenticated;
GRANT SELECT ON payment_transactions TO authenticated;
GRANT SELECT ON user_plan_overview TO authenticated;
GRANT SELECT ON recovery_performance TO authenticated;
