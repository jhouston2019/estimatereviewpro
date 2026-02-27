-- Pricing & Validation Schema for Enhanced Features
-- Run after 00_create_users_table.sql and 20260210_pricing_schema.sql

-- ============================================================================
-- 1. PRICING DATABASE TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS pricing_database (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trade_code TEXT NOT NULL,
  item_code TEXT, -- Xactimate code (e.g., 'DRY REM')
  description TEXT NOT NULL,
  unit TEXT NOT NULL,
  base_price NUMERIC NOT NULL,
  price_source TEXT NOT NULL CHECK (price_source IN ('xactimate', 'rsmeans', 'market')),
  region TEXT NOT NULL,
  effective_date DATE NOT NULL,
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_pricing_trade_region ON pricing_database(trade_code, region);
CREATE INDEX idx_pricing_item_code ON pricing_database(item_code);
CREATE INDEX idx_pricing_effective_date ON pricing_database(effective_date DESC);
CREATE INDEX idx_pricing_source ON pricing_database(price_source);

COMMENT ON TABLE pricing_database IS 'Market pricing data for estimate validation';
COMMENT ON COLUMN pricing_database.trade_code IS 'Trade code (DRY, PNT, FLR, etc.)';
COMMENT ON COLUMN pricing_database.item_code IS 'Platform-specific item code (Xactimate, etc.)';
COMMENT ON COLUMN pricing_database.base_price IS 'Base price before regional adjustment';
COMMENT ON COLUMN pricing_database.price_source IS 'Data source: xactimate, rsmeans, or market';

-- ============================================================================
-- 2. REGIONAL MULTIPLIERS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS regional_multipliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  region TEXT NOT NULL UNIQUE,
  state TEXT NOT NULL,
  city TEXT,
  multiplier NUMERIC NOT NULL CHECK (multiplier > 0),
  effective_date DATE NOT NULL,
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_regional_state ON regional_multipliers(state);
CREATE INDEX idx_regional_effective_date ON regional_multipliers(effective_date DESC);

COMMENT ON TABLE regional_multipliers IS 'Regional cost adjustment multipliers';
COMMENT ON COLUMN regional_multipliers.multiplier IS 'Cost multiplier (1.0 = national average)';

-- Insert sample regional multipliers
INSERT INTO regional_multipliers (region, state, city, multiplier, effective_date) VALUES
  ('CA-San Francisco', 'CA', 'San Francisco', 1.45, '2026-01-01'),
  ('CA-Los Angeles', 'CA', 'Los Angeles', 1.38, '2026-01-01'),
  ('CA-San Diego', 'CA', 'San Diego', 1.32, '2026-01-01'),
  ('NY-New York City', 'NY', 'New York', 1.42, '2026-01-01'),
  ('IL-Chicago', 'IL', 'Chicago', 1.15, '2026-01-01'),
  ('TX-Houston', 'TX', 'Houston', 0.95, '2026-01-01'),
  ('TX-Dallas', 'TX', 'Dallas', 0.98, '2026-01-01'),
  ('FL-Miami', 'FL', 'Miami', 1.08, '2026-01-01'),
  ('FL-Orlando', 'FL', 'Orlando', 1.02, '2026-01-01'),
  ('WA-Seattle', 'WA', 'Seattle', 1.28, '2026-01-01'),
  ('CO-Denver', 'CO', 'Denver', 1.12, '2026-01-01'),
  ('AZ-Phoenix', 'AZ', 'Phoenix', 0.98, '2026-01-01'),
  ('GA-Atlanta', 'GA', 'Atlanta', 1.05, '2026-01-01'),
  ('MA-Boston', 'MA', 'Boston', 1.35, '2026-01-01'),
  ('PA-Philadelphia', 'PA', 'Philadelphia', 1.18, '2026-01-01'),
  ('OR-Portland', 'OR', 'Portland', 1.18, '2026-01-01'),
  ('NV-Las Vegas', 'NV', 'Las Vegas', 1.05, '2026-01-01'),
  ('NC-Charlotte', 'NC', 'Charlotte', 0.96, '2026-01-01'),
  ('TN-Nashville', 'TN', 'Nashville', 0.94, '2026-01-01'),
  ('DEFAULT', 'US', NULL, 1.00, '2026-01-01')
ON CONFLICT (region) DO NOTHING;

-- ============================================================================
-- 3. LABOR RATES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS labor_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trade TEXT NOT NULL,
  region TEXT NOT NULL,
  min_rate NUMERIC NOT NULL,
  avg_rate NUMERIC NOT NULL,
  max_rate NUMERIC NOT NULL,
  unit TEXT DEFAULT 'per hour',
  effective_date DATE NOT NULL,
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  source TEXT, -- 'BLS', 'industry_survey', 'market_data'
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(trade, region, effective_date)
);

CREATE INDEX idx_labor_trade_region ON labor_rates(trade, region);
CREATE INDEX idx_labor_effective_date ON labor_rates(effective_date DESC);
CREATE INDEX idx_labor_source ON labor_rates(source);

COMMENT ON TABLE labor_rates IS 'Regional labor rate data by trade';
COMMENT ON COLUMN labor_rates.min_rate IS 'Minimum hourly rate for trade in region';
COMMENT ON COLUMN labor_rates.avg_rate IS 'Average hourly rate for trade in region';
COMMENT ON COLUMN labor_rates.max_rate IS 'Maximum hourly rate for trade in region';

-- Insert sample labor rates (expand to 50+ regions in production)
INSERT INTO labor_rates (trade, region, min_rate, avg_rate, max_rate, effective_date, source) VALUES
  -- California - San Francisco
  ('General Contractor', 'CA-San Francisco', 85, 110, 145, '2026-01-01', 'market_data'),
  ('Carpenter', 'CA-San Francisco', 75, 95, 125, '2026-01-01', 'market_data'),
  ('Electrician', 'CA-San Francisco', 85, 110, 140, '2026-01-01', 'market_data'),
  ('Plumber', 'CA-San Francisco', 80, 105, 135, '2026-01-01', 'market_data'),
  ('HVAC Technician', 'CA-San Francisco', 75, 95, 125, '2026-01-01', 'market_data'),
  ('Painter', 'CA-San Francisco', 55, 75, 95, '2026-01-01', 'market_data'),
  ('Drywall Installer', 'CA-San Francisco', 60, 80, 105, '2026-01-01', 'market_data'),
  ('Flooring Installer', 'CA-San Francisco', 55, 75, 100, '2026-01-01', 'market_data'),
  ('Roofer', 'CA-San Francisco', 65, 85, 110, '2026-01-01', 'market_data'),
  ('Laborer', 'CA-San Francisco', 45, 60, 75, '2026-01-01', 'market_data'),
  
  -- Texas - Houston
  ('General Contractor', 'TX-Houston', 55, 75, 95, '2026-01-01', 'market_data'),
  ('Carpenter', 'TX-Houston', 45, 65, 85, '2026-01-01', 'market_data'),
  ('Electrician', 'TX-Houston', 55, 75, 95, '2026-01-01', 'market_data'),
  ('Plumber', 'TX-Houston', 50, 70, 90, '2026-01-01', 'market_data'),
  ('HVAC Technician', 'TX-Houston', 50, 65, 85, '2026-01-01', 'market_data'),
  ('Painter', 'TX-Houston', 35, 50, 65, '2026-01-01', 'market_data'),
  ('Drywall Installer', 'TX-Houston', 40, 55, 70, '2026-01-01', 'market_data'),
  ('Flooring Installer', 'TX-Houston', 35, 50, 70, '2026-01-01', 'market_data'),
  ('Roofer', 'TX-Houston', 45, 60, 80, '2026-01-01', 'market_data'),
  ('Laborer', 'TX-Houston', 30, 40, 50, '2026-01-01', 'market_data'),
  
  -- Illinois - Chicago
  ('General Contractor', 'IL-Chicago', 65, 85, 110, '2026-01-01', 'market_data'),
  ('Carpenter', 'IL-Chicago', 55, 75, 95, '2026-01-01', 'market_data'),
  ('Electrician', 'IL-Chicago', 65, 85, 110, '2026-01-01', 'market_data'),
  ('Plumber', 'IL-Chicago', 60, 80, 105, '2026-01-01', 'market_data'),
  ('HVAC Technician', 'IL-Chicago', 55, 75, 95, '2026-01-01', 'market_data'),
  ('Painter', 'IL-Chicago', 40, 60, 75, '2026-01-01', 'market_data'),
  ('Drywall Installer', 'IL-Chicago', 45, 65, 85, '2026-01-01', 'market_data'),
  ('Flooring Installer', 'IL-Chicago', 40, 60, 80, '2026-01-01', 'market_data'),
  ('Roofer', 'IL-Chicago', 50, 70, 90, '2026-01-01', 'market_data'),
  ('Laborer', 'IL-Chicago', 35, 50, 65, '2026-01-01', 'market_data'),
  
  -- Default/National Average
  ('General Contractor', 'DEFAULT', 60, 80, 105, '2026-01-01', 'market_data'),
  ('Carpenter', 'DEFAULT', 50, 70, 90, '2026-01-01', 'market_data'),
  ('Electrician', 'DEFAULT', 60, 80, 105, '2026-01-01', 'market_data'),
  ('Plumber', 'DEFAULT', 55, 75, 95, '2026-01-01', 'market_data'),
  ('HVAC Technician', 'DEFAULT', 55, 70, 90, '2026-01-01', 'market_data'),
  ('Painter', 'DEFAULT', 40, 55, 70, '2026-01-01', 'market_data'),
  ('Drywall Installer', 'DEFAULT', 45, 60, 75, '2026-01-01', 'market_data'),
  ('Flooring Installer', 'DEFAULT', 40, 55, 75, '2026-01-01', 'market_data'),
  ('Roofer', 'DEFAULT', 50, 65, 85, '2026-01-01', 'market_data'),
  ('Laborer', 'DEFAULT', 35, 45, 60, '2026-01-01', 'market_data')
ON CONFLICT (trade, region, effective_date) DO NOTHING;

-- ============================================================================
-- 4. ENHANCED AUDIT TRAIL TABLES
-- ============================================================================

CREATE TABLE IF NOT EXISTS audit_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID REFERENCES reports(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL, -- 'parse', 'match', 'ai_decision', 'exposure_calc', 'pricing_validation', etc.
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  engine_name TEXT NOT NULL,
  input_data JSONB,
  output_data JSONB,
  confidence_score NUMERIC,
  processing_time_ms INTEGER,
  metadata JSONB
);

CREATE INDEX idx_audit_report ON audit_events(report_id);
CREATE INDEX idx_audit_type ON audit_events(event_type);
CREATE INDEX idx_audit_timestamp ON audit_events(timestamp DESC);
CREATE INDEX idx_audit_engine ON audit_events(engine_name);

COMMENT ON TABLE audit_events IS 'Comprehensive audit trail for all analysis events';

CREATE TABLE IF NOT EXISTS ai_decisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID REFERENCES reports(id) ON DELETE CASCADE,
  decision_type TEXT NOT NULL, -- 'semantic_match', 'insight_generation', etc.
  input_prompt TEXT,
  ai_response JSONB,
  confidence NUMERIC,
  fallback_used BOOLEAN DEFAULT FALSE,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  model TEXT,
  temperature NUMERIC,
  tokens_used INTEGER,
  cost_usd NUMERIC
);

CREATE INDEX idx_ai_report ON ai_decisions(report_id);
CREATE INDEX idx_ai_type ON ai_decisions(decision_type);
CREATE INDEX idx_ai_timestamp ON ai_decisions(timestamp DESC);

COMMENT ON TABLE ai_decisions IS 'AI decision tracking for transparency and debugging';

-- ============================================================================
-- 5. ENHANCED REPORTS TABLE (Add new columns)
-- ============================================================================

-- Add new columns to existing reports table
ALTER TABLE reports 
  ADD COLUMN IF NOT EXISTS format_detected TEXT,
  ADD COLUMN IF NOT EXISTS region TEXT,
  ADD COLUMN IF NOT EXISTS overall_score INTEGER,
  ADD COLUMN IF NOT EXISTS pricing_variance NUMERIC,
  ADD COLUMN IF NOT EXISTS depreciation_score INTEGER,
  ADD COLUMN IF NOT EXISTS labor_score INTEGER,
  ADD COLUMN IF NOT EXISTS carrier_tactics_count INTEGER,
  ADD COLUMN IF NOT EXISTS processing_time_ms INTEGER;

CREATE INDEX IF NOT EXISTS idx_reports_overall_score ON reports(overall_score DESC);
CREATE INDEX IF NOT EXISTS idx_reports_region ON reports(region);
CREATE INDEX IF NOT EXISTS idx_reports_format ON reports(format_detected);

COMMENT ON COLUMN reports.format_detected IS 'Detected estimate format (Standard, Xactimate, Tabular, Compact)';
COMMENT ON COLUMN reports.region IS 'Region used for pricing/labor validation';
COMMENT ON COLUMN reports.overall_score IS 'Overall estimate quality score (0-100)';
COMMENT ON COLUMN reports.pricing_variance IS 'Pricing variance percentage';
COMMENT ON COLUMN reports.depreciation_score IS 'Depreciation fairness score (0-100)';
COMMENT ON COLUMN reports.labor_score IS 'Labor rate fairness score (0-100)';
COMMENT ON COLUMN reports.carrier_tactics_count IS 'Number of carrier tactics detected';

-- ============================================================================
-- 6. RLS POLICIES
-- ============================================================================

-- Enable RLS on new tables
ALTER TABLE pricing_database ENABLE ROW LEVEL SECURITY;
ALTER TABLE regional_multipliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE labor_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_decisions ENABLE ROW LEVEL SECURITY;

-- Pricing database - read-only for all authenticated users
CREATE POLICY "Authenticated users can view pricing data"
  ON pricing_database FOR SELECT
  USING (auth.role() = 'authenticated');

-- Regional multipliers - read-only for all authenticated users
CREATE POLICY "Authenticated users can view regional multipliers"
  ON regional_multipliers FOR SELECT
  USING (auth.role() = 'authenticated');

-- Labor rates - read-only for all authenticated users
CREATE POLICY "Authenticated users can view labor rates"
  ON labor_rates FOR SELECT
  USING (auth.role() = 'authenticated');

-- Audit events - users can view their own report audits
CREATE POLICY "Users can view their own audit events"
  ON audit_events FOR SELECT
  USING (
    report_id IN (
      SELECT id FROM reports WHERE user_id = auth.uid()
    )
  );

-- AI decisions - users can view their own AI decisions
CREATE POLICY "Users can view their own AI decisions"
  ON ai_decisions FOR SELECT
  USING (
    report_id IN (
      SELECT id FROM reports WHERE user_id = auth.uid()
    )
  );

-- System can insert audit events and AI decisions
CREATE POLICY "System can insert audit events"
  ON audit_events FOR INSERT
  WITH CHECK (true);

CREATE POLICY "System can insert AI decisions"
  ON ai_decisions FOR INSERT
  WITH CHECK (true);

-- ============================================================================
-- 7. HELPER FUNCTIONS
-- ============================================================================

-- Function to get pricing data for a trade/region
CREATE OR REPLACE FUNCTION get_pricing_data(
  p_trade_code TEXT,
  p_region TEXT,
  p_unit TEXT DEFAULT NULL
)
RETURNS TABLE (
  item_code TEXT,
  description TEXT,
  unit TEXT,
  base_price NUMERIC,
  adjusted_price NUMERIC,
  price_source TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pd.item_code,
    pd.description,
    pd.unit,
    pd.base_price,
    pd.base_price * COALESCE(rm.multiplier, 1.0) as adjusted_price,
    pd.price_source
  FROM pricing_database pd
  LEFT JOIN regional_multipliers rm ON rm.region = p_region
  WHERE pd.trade_code = p_trade_code
    AND (p_unit IS NULL OR pd.unit = p_unit)
    AND pd.effective_date <= CURRENT_DATE
  ORDER BY pd.effective_date DESC
  LIMIT 10;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get labor rates for a trade/region
CREATE OR REPLACE FUNCTION get_labor_rate(
  p_trade TEXT,
  p_region TEXT
)
RETURNS TABLE (
  min_rate NUMERIC,
  avg_rate NUMERIC,
  max_rate NUMERIC,
  source TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    lr.min_rate,
    lr.avg_rate,
    lr.max_rate,
    lr.source
  FROM labor_rates lr
  WHERE lr.trade = p_trade
    AND lr.region = p_region
    AND lr.effective_date <= CURRENT_DATE
  ORDER BY lr.effective_date DESC
  LIMIT 1;
  
  -- If no exact region match, try DEFAULT
  IF NOT FOUND THEN
    RETURN QUERY
    SELECT 
      lr.min_rate,
      lr.avg_rate,
      lr.max_rate,
      lr.source
    FROM labor_rates lr
    WHERE lr.trade = p_trade
      AND lr.region = 'DEFAULT'
      AND lr.effective_date <= CURRENT_DATE
    ORDER BY lr.effective_date DESC
    LIMIT 1;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 8. COMMENTS & DOCUMENTATION
-- ============================================================================

COMMENT ON SCHEMA public IS 'Enhanced Estimate Review Pro schema with pricing validation, labor rates, and audit trail';

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
