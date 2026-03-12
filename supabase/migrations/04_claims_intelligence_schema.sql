/**
 * CLAIMS INTELLIGENCE PLATFORM - DATABASE SCHEMA
 * Migration 04: Intelligence dataset tables
 * 
 * Purpose: Track carrier behavior patterns, scope gaps, pricing deviations,
 * labor suppression, and claim recovery data across all analyzed estimates
 */

-- ============================================================================
-- CARRIER BEHAVIOR INTELLIGENCE
-- ============================================================================

CREATE TABLE IF NOT EXISTS carrier_behavior_patterns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  carrier_name TEXT NOT NULL,
  issue_type TEXT NOT NULL,
  frequency INTEGER DEFAULT 1,
  average_gap NUMERIC(12,2),
  states_observed TEXT[],
  total_claims_analyzed INTEGER DEFAULT 1,
  last_seen TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_carrier_behavior_carrier ON carrier_behavior_patterns(carrier_name);
CREATE INDEX idx_carrier_behavior_issue ON carrier_behavior_patterns(issue_type);
CREATE INDEX idx_carrier_behavior_last_seen ON carrier_behavior_patterns(last_seen);

COMMENT ON TABLE carrier_behavior_patterns IS 'Tracks how carriers manipulate estimates across claims';

-- ============================================================================
-- SCOPE GAP INTELLIGENCE
-- ============================================================================

CREATE TABLE IF NOT EXISTS scope_gap_patterns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trade_type TEXT NOT NULL,
  missing_item TEXT NOT NULL,
  frequency INTEGER DEFAULT 1,
  average_cost_impact NUMERIC(12,2),
  carriers_observed TEXT[],
  regions_observed TEXT[],
  last_seen TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_scope_gap_trade ON scope_gap_patterns(trade_type);
CREATE INDEX idx_scope_gap_item ON scope_gap_patterns(missing_item);
CREATE INDEX idx_scope_gap_frequency ON scope_gap_patterns(frequency DESC);

COMMENT ON TABLE scope_gap_patterns IS 'Tracks commonly missing scope items by trade';

-- ============================================================================
-- PRICING DEVIATION INTELLIGENCE
-- ============================================================================

CREATE TABLE IF NOT EXISTS pricing_deviation_patterns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  line_item_code TEXT NOT NULL,
  line_item_description TEXT,
  expected_price NUMERIC(12,2),
  observed_price NUMERIC(12,2),
  suppression_rate NUMERIC(5,2),
  region TEXT,
  carrier TEXT,
  occurrences INTEGER DEFAULT 1,
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_pricing_deviation_code ON pricing_deviation_patterns(line_item_code);
CREATE INDEX idx_pricing_deviation_region ON pricing_deviation_patterns(region);
CREATE INDEX idx_pricing_deviation_carrier ON pricing_deviation_patterns(carrier);
CREATE INDEX idx_pricing_deviation_suppression ON pricing_deviation_patterns(suppression_rate DESC);

COMMENT ON TABLE pricing_deviation_patterns IS 'Tracks pricing suppression by carriers';

-- ============================================================================
-- LABOR SUPPRESSION INTELLIGENCE
-- ============================================================================

CREATE TABLE IF NOT EXISTS labor_rate_patterns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  region TEXT NOT NULL,
  trade_type TEXT NOT NULL,
  industry_rate NUMERIC(10,2),
  carrier_rate NUMERIC(10,2),
  suppression_percentage NUMERIC(5,2),
  carrier TEXT,
  occurrences INTEGER DEFAULT 1,
  last_seen TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_labor_patterns_region ON labor_rate_patterns(region);
CREATE INDEX idx_labor_patterns_trade ON labor_rate_patterns(trade_type);
CREATE INDEX idx_labor_patterns_carrier ON labor_rate_patterns(carrier);
CREATE INDEX idx_labor_patterns_suppression ON labor_rate_patterns(suppression_percentage DESC);

COMMENT ON TABLE labor_rate_patterns IS 'Tracks labor rate suppression by region and carrier';

-- ============================================================================
-- CLAIM RECOVERY INTELLIGENCE
-- ============================================================================

CREATE TABLE IF NOT EXISTS claim_recovery_patterns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  report_id UUID REFERENCES reports(id) ON DELETE CASCADE,
  claim_type TEXT,
  carrier TEXT,
  state TEXT,
  estimate_value NUMERIC(12,2),
  reconstructed_value NUMERIC(12,2),
  underpayment_gap NUMERIC(12,2),
  recovery_percentage NUMERIC(5,2),
  issues_detected JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_recovery_carrier ON claim_recovery_patterns(carrier);
CREATE INDEX idx_recovery_state ON claim_recovery_patterns(state);
CREATE INDEX idx_recovery_gap ON claim_recovery_patterns(underpayment_gap DESC);
CREATE INDEX idx_recovery_percentage ON claim_recovery_patterns(recovery_percentage DESC);
CREATE INDEX idx_recovery_created ON claim_recovery_patterns(created_at DESC);

COMMENT ON TABLE claim_recovery_patterns IS 'Tracks claim recovery opportunities and underpayment gaps';

-- ============================================================================
-- LITIGATION EVIDENCE STORAGE
-- ============================================================================

CREATE TABLE IF NOT EXISTS litigation_evidence (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  report_id UUID REFERENCES reports(id) ON DELETE CASCADE,
  issue_type TEXT NOT NULL,
  evidence_data JSONB NOT NULL,
  industry_standard TEXT,
  carrier_deviation TEXT,
  financial_impact NUMERIC(12,2),
  supporting_documentation TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_litigation_report ON litigation_evidence(report_id);
CREATE INDEX idx_litigation_issue_type ON litigation_evidence(issue_type);
CREATE INDEX idx_litigation_impact ON litigation_evidence(financial_impact DESC);

COMMENT ON TABLE litigation_evidence IS 'Stores attorney-ready evidence for each detected issue';

-- ============================================================================
-- RECONSTRUCTED ESTIMATES
-- ============================================================================

CREATE TABLE IF NOT EXISTS reconstructed_estimates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  report_id UUID REFERENCES reports(id) ON DELETE CASCADE,
  original_value NUMERIC(12,2),
  reconstructed_value NUMERIC(12,2),
  gap_value NUMERIC(12,2),
  missing_line_items JSONB,
  reconstruction_methodology TEXT,
  confidence_score NUMERIC(5,2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_reconstructed_report ON reconstructed_estimates(report_id);
CREATE INDEX idx_reconstructed_gap ON reconstructed_estimates(gap_value DESC);

COMMENT ON TABLE reconstructed_estimates IS 'Stores reconstructed estimate data with missing scope';

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE carrier_behavior_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE scope_gap_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing_deviation_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE labor_rate_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE claim_recovery_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE litigation_evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE reconstructed_estimates ENABLE ROW LEVEL SECURITY;

-- Admin can read all intelligence data
CREATE POLICY "Admin can view all carrier patterns"
  ON carrier_behavior_patterns FOR SELECT
  USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admin can view all scope patterns"
  ON scope_gap_patterns FOR SELECT
  USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admin can view all pricing patterns"
  ON pricing_deviation_patterns FOR SELECT
  USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admin can view all labor patterns"
  ON labor_rate_patterns FOR SELECT
  USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admin can view all recovery patterns"
  ON claim_recovery_patterns FOR SELECT
  USING (auth.jwt() ->> 'role' = 'admin');

-- Users can view their own litigation evidence
CREATE POLICY "Users can view own litigation evidence"
  ON litigation_evidence FOR SELECT
  USING (
    report_id IN (
      SELECT id FROM reports WHERE user_id = auth.uid()
    )
  );

-- Users can view their own reconstructed estimates
CREATE POLICY "Users can view own reconstructed estimates"
  ON reconstructed_estimates FOR SELECT
  USING (
    report_id IN (
      SELECT id FROM reports WHERE user_id = auth.uid()
    )
  );

-- Service role can insert all
CREATE POLICY "Service role can insert carrier patterns"
  ON carrier_behavior_patterns FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Service role can update carrier patterns"
  ON carrier_behavior_patterns FOR UPDATE
  USING (true);

CREATE POLICY "Service role can insert scope patterns"
  ON scope_gap_patterns FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Service role can update scope patterns"
  ON scope_gap_patterns FOR UPDATE
  USING (true);

CREATE POLICY "Service role can insert pricing patterns"
  ON pricing_deviation_patterns FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Service role can insert labor patterns"
  ON labor_rate_patterns FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Service role can update labor patterns"
  ON labor_rate_patterns FOR UPDATE
  USING (true);

CREATE POLICY "Service role can insert recovery patterns"
  ON claim_recovery_patterns FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Service role can insert litigation evidence"
  ON litigation_evidence FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Service role can insert reconstructed estimates"
  ON reconstructed_estimates FOR INSERT
  WITH CHECK (true);

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

/**
 * Get carrier behavior statistics
 */
CREATE OR REPLACE FUNCTION get_carrier_behavior_stats(carrier_name_param TEXT)
RETURNS TABLE (
  issue_type TEXT,
  frequency INTEGER,
  average_gap NUMERIC,
  states TEXT[]
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cbp.issue_type,
    cbp.frequency,
    cbp.average_gap,
    cbp.states_observed
  FROM carrier_behavior_patterns cbp
  WHERE cbp.carrier_name = carrier_name_param
  ORDER BY cbp.frequency DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

/**
 * Get most common scope gaps by trade
 */
CREATE OR REPLACE FUNCTION get_common_scope_gaps(trade_param TEXT)
RETURNS TABLE (
  missing_item TEXT,
  frequency INTEGER,
  avg_cost NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sgp.missing_item,
    sgp.frequency,
    sgp.average_cost_impact
  FROM scope_gap_patterns sgp
  WHERE sgp.trade_type = trade_param
  ORDER BY sgp.frequency DESC
  LIMIT 20;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

/**
 * Get pricing suppression by carrier and region
 */
CREATE OR REPLACE FUNCTION get_pricing_suppression(
  carrier_param TEXT,
  region_param TEXT
)
RETURNS TABLE (
  line_item_code TEXT,
  suppression_rate NUMERIC,
  occurrences INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pdp.line_item_code,
    pdp.suppression_rate,
    pdp.occurrences
  FROM pricing_deviation_patterns pdp
  WHERE pdp.carrier = carrier_param
    AND pdp.region = region_param
  ORDER BY pdp.suppression_rate DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

/**
 * Get average underpayment by carrier
 */
CREATE OR REPLACE FUNCTION get_carrier_underpayment_stats(carrier_param TEXT)
RETURNS TABLE (
  total_claims INTEGER,
  avg_underpayment NUMERIC,
  avg_recovery_percentage NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::INTEGER as total_claims,
    AVG(crp.underpayment_gap) as avg_underpayment,
    AVG(crp.recovery_percentage) as avg_recovery_percentage
  FROM claim_recovery_patterns crp
  WHERE crp.carrier = carrier_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- SAMPLE DATA FOR TESTING
-- ============================================================================

-- Sample carrier behavior patterns
INSERT INTO carrier_behavior_patterns (carrier_name, issue_type, frequency, average_gap, states_observed) VALUES
  ('State Farm', 'O&P Omission', 42, 11200.00, ARRAY['GA', 'FL', 'TX']),
  ('State Farm', 'Labor Suppression', 31, 3800.00, ARRAY['GA', 'FL', 'TX', 'NC']),
  ('Allstate', 'Depreciation Stacking', 38, 8900.00, ARRAY['CA', 'TX', 'FL']),
  ('USAA', 'Scope Limitation', 29, 15300.00, ARRAY['TX', 'CA', 'NC']),
  ('Farmers', 'Line Item Removal', 24, 6700.00, ARRAY['GA', 'FL']);

-- Sample scope gap patterns
INSERT INTO scope_gap_patterns (trade_type, missing_item, frequency, average_cost_impact, carriers_observed, regions_observed) VALUES
  ('Roofing', 'Drip Edge', 41, 1200.00, ARRAY['State Farm', 'Allstate'], ARRAY['Southeast', 'Southwest']),
  ('Roofing', 'Ice & Water Shield', 38, 2400.00, ARRAY['State Farm', 'USAA'], ARRAY['Northeast', 'Midwest']),
  ('Roofing', 'Starter Strip', 35, 800.00, ARRAY['Allstate', 'Farmers'], ARRAY['Southeast']),
  ('Roofing', 'Ridge Vent', 28, 1800.00, ARRAY['State Farm'], ARRAY['All']),
  ('Drywall', 'Texture Matching', 44, 1500.00, ARRAY['State Farm', 'Allstate', 'USAA'], ARRAY['All']),
  ('Drywall', 'Primer/Sealer', 39, 900.00, ARRAY['State Farm', 'Farmers'], ARRAY['All']),
  ('Flooring', 'Underlayment', 33, 2200.00, ARRAY['Allstate', 'USAA'], ARRAY['All']),
  ('Flooring', 'Transition Strips', 31, 600.00, ARRAY['State Farm'], ARRAY['All']),
  ('Plumbing', 'Permit', 47, 350.00, ARRAY['State Farm', 'Allstate', 'USAA', 'Farmers'], ARRAY['All']),
  ('Electrical', 'Permit', 45, 400.00, ARRAY['State Farm', 'Allstate', 'USAA', 'Farmers'], ARRAY['All']);

-- Sample pricing deviation patterns
INSERT INTO pricing_deviation_patterns (line_item_code, line_item_description, expected_price, observed_price, suppression_rate, region, carrier) VALUES
  ('RFG-SHGL', 'Architectural Shingles', 125.00, 89.00, -28.80, 'SOUTHEAST', 'State Farm'),
  ('DRY-HNG', 'Drywall Hanging', 2.10, 1.65, -21.43, 'SOUTHEAST', 'State Farm'),
  ('PNT-INT', 'Interior Painting', 3.50, 2.80, -20.00, 'SOUTHEAST', 'Allstate'),
  ('FLR-LVP', 'LVP Flooring Install', 4.25, 3.20, -24.71, 'NORTHEAST', 'USAA');

-- Sample labor rate patterns
INSERT INTO labor_rate_patterns (region, trade_type, industry_rate, carrier_rate, suppression_percentage, carrier) VALUES
  ('SOUTHEAST', 'Roofing', 75.00, 58.00, -22.67, 'State Farm'),
  ('SOUTHEAST', 'Drywall', 65.00, 52.00, -20.00, 'State Farm'),
  ('NORTHEAST', 'Roofing', 95.00, 72.00, -24.21, 'Allstate'),
  ('MIDWEST', 'Plumbing', 85.00, 68.00, -20.00, 'USAA');

-- ============================================================================
-- AGGREGATE VIEWS
-- ============================================================================

/**
 * View: Carrier underpayment summary
 */
CREATE OR REPLACE VIEW carrier_underpayment_summary AS
SELECT 
  carrier,
  COUNT(*) as total_claims,
  AVG(underpayment_gap) as avg_gap,
  SUM(underpayment_gap) as total_gap,
  AVG(recovery_percentage) as avg_recovery_pct,
  MIN(created_at) as first_seen,
  MAX(created_at) as last_seen
FROM claim_recovery_patterns
GROUP BY carrier
ORDER BY avg_gap DESC;

/**
 * View: Most common scope gaps
 */
CREATE OR REPLACE VIEW top_scope_gaps AS
SELECT 
  trade_type,
  missing_item,
  frequency,
  average_cost_impact,
  array_length(carriers_observed, 1) as carrier_count
FROM scope_gap_patterns
ORDER BY frequency DESC
LIMIT 50;

/**
 * View: Pricing suppression by carrier
 */
CREATE OR REPLACE VIEW pricing_suppression_by_carrier AS
SELECT 
  carrier,
  COUNT(*) as items_suppressed,
  AVG(suppression_rate) as avg_suppression_rate,
  SUM(expected_price - observed_price) as total_suppression_amount
FROM pricing_deviation_patterns
WHERE suppression_rate < 0
GROUP BY carrier
ORDER BY avg_suppression_rate ASC;

-- ============================================================================
-- UPDATE REPORTS TABLE
-- ============================================================================

ALTER TABLE reports ADD COLUMN IF NOT EXISTS reconstructed_value NUMERIC(12,2);
ALTER TABLE reports ADD COLUMN IF NOT EXISTS recovery_opportunity NUMERIC(12,2);
ALTER TABLE reports ADD COLUMN IF NOT EXISTS litigation_evidence_generated BOOLEAN DEFAULT FALSE;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS carrier_pattern_logged BOOLEAN DEFAULT FALSE;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS scope_reconstruction_data JSONB;

-- ============================================================================
-- GRANTS
-- ============================================================================

GRANT SELECT ON carrier_behavior_patterns TO authenticated;
GRANT SELECT ON scope_gap_patterns TO authenticated;
GRANT SELECT ON pricing_deviation_patterns TO authenticated;
GRANT SELECT ON labor_rate_patterns TO authenticated;
GRANT SELECT ON claim_recovery_patterns TO authenticated;
GRANT SELECT ON litigation_evidence TO authenticated;
GRANT SELECT ON reconstructed_estimates TO authenticated;

GRANT SELECT ON carrier_underpayment_summary TO authenticated;
GRANT SELECT ON top_scope_gaps TO authenticated;
GRANT SELECT ON pricing_suppression_by_carrier TO authenticated;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON COLUMN reports.reconstructed_value IS 'What the estimate should have been';
COMMENT ON COLUMN reports.recovery_opportunity IS 'Total financial recovery potential';
COMMENT ON COLUMN reports.litigation_evidence_generated IS 'Whether litigation evidence was generated';
COMMENT ON COLUMN reports.carrier_pattern_logged IS 'Whether data was logged to intelligence dataset';
COMMENT ON COLUMN reports.scope_reconstruction_data IS 'Detailed reconstruction analysis';
