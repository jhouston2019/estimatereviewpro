-- Pricing & Billing Schema for Estimate Review Pro

-- 1. Update users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS plan_type TEXT CHECK (plan_type IN ('professional', 'enterprise'));
ALTER TABLE users ADD COLUMN IF NOT EXISTS team_id UUID REFERENCES teams(id);
ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT CHECK (role IN ('owner', 'member')) DEFAULT 'owner';

-- 2. Create teams table
CREATE TABLE IF NOT EXISTS teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan_type TEXT NOT NULL CHECK (plan_type IN ('professional', 'enterprise')),
  stripe_subscription_id TEXT UNIQUE,
  review_limit INTEGER NOT NULL,
  overage_price INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create reports table
CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
  estimate_name TEXT NOT NULL,
  estimate_type TEXT,
  damage_type TEXT,
  result_json JSONB NOT NULL,
  paid_single_use BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  CONSTRAINT single_use_expires CHECK (
    (paid_single_use = TRUE AND expires_at IS NOT NULL) OR
    (paid_single_use = FALSE)
  )
);

-- 4. Create usage_tracking table
CREATE TABLE IF NOT EXISTS usage_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  month_year TEXT NOT NULL,
  review_count INTEGER DEFAULT 0,
  overage_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(team_id, month_year)
);

-- 5. Create indexes
CREATE INDEX IF NOT EXISTS idx_users_stripe_customer ON users(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_users_team ON users(team_id);
CREATE INDEX IF NOT EXISTS idx_teams_subscription ON teams(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_reports_user ON reports(user_id);
CREATE INDEX IF NOT EXISTS idx_reports_team ON reports(team_id);
CREATE INDEX IF NOT EXISTS idx_reports_created ON reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_usage_team_month ON usage_tracking(team_id, month_year);

-- 6. RLS Policies

-- Enable RLS
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_tracking ENABLE ROW LEVEL SECURITY;

-- Teams policies
CREATE POLICY "Users can view their own team"
  ON teams FOR SELECT
  USING (
    owner_id = auth.uid() OR
    id IN (SELECT team_id FROM users WHERE id = auth.uid())
  );

CREATE POLICY "Team owners can update their team"
  ON teams FOR UPDATE
  USING (owner_id = auth.uid());

CREATE POLICY "Users can create teams"
  ON teams FOR INSERT
  WITH CHECK (owner_id = auth.uid());

-- Reports policies
CREATE POLICY "Users can view their own reports"
  ON reports FOR SELECT
  USING (
    user_id = auth.uid() OR
    team_id IN (SELECT team_id FROM users WHERE id = auth.uid())
  );

CREATE POLICY "Users can create reports"
  ON reports FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own reports"
  ON reports FOR UPDATE
  USING (user_id = auth.uid());

-- Usage tracking policies
CREATE POLICY "Team members can view usage"
  ON usage_tracking FOR SELECT
  USING (
    team_id IN (
      SELECT team_id FROM users WHERE id = auth.uid()
    ) OR
    team_id IN (
      SELECT id FROM teams WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "System can insert usage"
  ON usage_tracking FOR INSERT
  WITH CHECK (true);

CREATE POLICY "System can update usage"
  ON usage_tracking FOR UPDATE
  USING (true);

-- 7. Functions

-- Function to get current month usage
CREATE OR REPLACE FUNCTION get_team_usage(p_team_id UUID)
RETURNS TABLE (
  review_count INTEGER,
  overage_count INTEGER,
  review_limit INTEGER,
  overage_price INTEGER
) AS $$
DECLARE
  current_month TEXT;
BEGIN
  current_month := TO_CHAR(NOW(), 'YYYY-MM');
  
  RETURN QUERY
  SELECT 
    COALESCE(ut.review_count, 0) as review_count,
    COALESCE(ut.overage_count, 0) as overage_count,
    t.review_limit,
    t.overage_price
  FROM teams t
  LEFT JOIN usage_tracking ut ON ut.team_id = t.id AND ut.month_year = current_month
  WHERE t.id = p_team_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment usage
CREATE OR REPLACE FUNCTION increment_team_usage(p_team_id UUID)
RETURNS VOID AS $$
DECLARE
  current_month TEXT;
  current_count INTEGER;
  limit_count INTEGER;
BEGIN
  current_month := TO_CHAR(NOW(), 'YYYY-MM');
  
  -- Get current usage and limit
  SELECT review_limit INTO limit_count FROM teams WHERE id = p_team_id;
  
  -- Insert or update usage
  INSERT INTO usage_tracking (team_id, month_year, review_count, overage_count)
  VALUES (p_team_id, current_month, 1, 0)
  ON CONFLICT (team_id, month_year)
  DO UPDATE SET
    review_count = usage_tracking.review_count + 1,
    overage_count = CASE
      WHEN usage_tracking.review_count >= limit_count THEN usage_tracking.overage_count + 1
      ELSE usage_tracking.overage_count
    END,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user can create review
CREATE OR REPLACE FUNCTION can_create_review(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  user_plan TEXT;
  user_team UUID;
  usage_data RECORD;
  result JSONB;
BEGIN
  -- Get user plan and team
  SELECT plan_type, team_id INTO user_plan, user_team FROM users WHERE id = p_user_id;
  
  -- No plan = preview only
  IF user_plan IS NULL THEN
    RETURN jsonb_build_object(
      'allowed', true,
      'preview_only', true,
      'requires_payment', true
    );
  END IF;
  
  -- Has subscription = check usage
  IF user_team IS NOT NULL THEN
    SELECT * INTO usage_data FROM get_team_usage(user_team);
    
    RETURN jsonb_build_object(
      'allowed', true,
      'preview_only', false,
      'review_count', usage_data.review_count,
      'review_limit', usage_data.review_limit,
      'overage_count', usage_data.overage_count,
      'overage_price', usage_data.overage_price,
      'is_overage', usage_data.review_count >= usage_data.review_limit
    );
  END IF;
  
  RETURN jsonb_build_object('allowed', true, 'preview_only', false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_teams_updated_at BEFORE UPDATE ON teams
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_usage_updated_at BEFORE UPDATE ON usage_tracking
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 9. Comments
COMMENT ON TABLE teams IS 'Team subscriptions for Professional and Enterprise plans';
COMMENT ON TABLE reports IS 'Estimate review reports with payment tracking';
COMMENT ON TABLE usage_tracking IS 'Monthly usage tracking per team';
COMMENT ON COLUMN reports.paid_single_use IS 'TRUE if paid $49 one-time, FALSE if subscription';
COMMENT ON COLUMN reports.expires_at IS 'Expiration date for single-use reports (30 days from creation)';
