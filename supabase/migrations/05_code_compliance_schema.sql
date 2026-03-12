/**
 * CODE COMPLIANCE ENGINE - DATABASE SCHEMA
 * Migration 05: Code requirements table
 * 
 * Purpose: Store building code requirements by jurisdiction
 * Used by Code Compliance Engine to detect violations
 */

-- ============================================================================
-- CODE REQUIREMENTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS code_requirements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  jurisdiction TEXT NOT NULL,
  code_reference TEXT NOT NULL,
  requirement TEXT NOT NULL,
  trigger_trade TEXT NOT NULL,
  required_item TEXT NOT NULL,
  estimated_cost NUMERIC(10,2),
  unit TEXT,
  estimated_quantity NUMERIC(10,2),
  severity TEXT DEFAULT 'HIGH',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_code_requirements_jurisdiction ON code_requirements(jurisdiction);
CREATE INDEX idx_code_requirements_trade ON code_requirements(trigger_trade);
CREATE INDEX idx_code_requirements_item ON code_requirements(required_item);

COMMENT ON TABLE code_requirements IS 'Building code requirements by jurisdiction';

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE code_requirements ENABLE ROW LEVEL SECURITY;

-- Anyone can read code requirements
CREATE POLICY "Anyone can view code requirements"
  ON code_requirements FOR SELECT
  USING (true);

-- Service role can insert/update
CREATE POLICY "Service role can insert code requirements"
  ON code_requirements FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Service role can update code requirements"
  ON code_requirements FOR UPDATE
  USING (true);

-- ============================================================================
-- SAMPLE DATA - COMMON CODE REQUIREMENTS
-- ============================================================================

-- Roofing code requirements
INSERT INTO code_requirements (jurisdiction, code_reference, requirement, trigger_trade, required_item, estimated_cost, unit, estimated_quantity, severity) VALUES
  ('National', 'IRC R903.2', 'Drip edge required at all roof edges', 'Roofing', 'drip edge', 1200.00, 'LF', 120, 'HIGH'),
  ('National', 'IRC R905.2.7', 'Ice and water barrier required in valleys and eaves', 'Roofing', 'ice barrier', 2800.00, 'SQ', 8, 'HIGH'),
  ('National', 'IRC R905.2.8.3', 'Valley flashing required', 'Roofing', 'valley metal', 800.00, 'LF', 25, 'HIGH'),
  ('National', 'IRC R905.2.8.5', 'Flashing required at roof penetrations', 'Roofing', 'flashing', 1500.00, 'EA', 8, 'HIGH'),
  ('National', 'IRC R806', 'Attic ventilation required (1:150 ratio)', 'Roofing', 'ridge vent', 1800.00, 'LF', 40, 'MEDIUM'),
  ('National', 'Manufacturer Spec', 'Starter strip required for warranty', 'Roofing', 'starter strip', 780.00, 'LF', 120, 'MEDIUM');

-- Electrical code requirements
INSERT INTO code_requirements (jurisdiction, code_reference, requirement, trigger_trade, required_item, estimated_cost, unit, estimated_quantity, severity) VALUES
  ('National', 'NEC 110.3', 'Electrical work requires permit', 'Electrical', 'permit', 400.00, 'EA', 1, 'CRITICAL'),
  ('National', 'NEC 110.3', 'Electrical work requires inspection', 'Electrical', 'inspection', 175.00, 'EA', 1, 'HIGH'),
  ('National', 'NEC 210.52', 'GFCI protection required in wet locations', 'Electrical', 'GFCI outlet', 250.00, 'EA', 3, 'HIGH');

-- Plumbing code requirements
INSERT INTO code_requirements (jurisdiction, code_reference, requirement, trigger_trade, required_item, estimated_cost, unit, estimated_quantity, severity) VALUES
  ('National', 'IPC 106', 'Plumbing work requires permit', 'Plumbing', 'permit', 350.00, 'EA', 1, 'CRITICAL'),
  ('National', 'IPC 106', 'Plumbing work requires inspection', 'Plumbing', 'inspection', 150.00, 'EA', 1, 'HIGH'),
  ('National', 'IPC 305', 'Water hammer arrestors required', 'Plumbing', 'water hammer arrestor', 400.00, 'EA', 2, 'MEDIUM');

-- HVAC code requirements
INSERT INTO code_requirements (jurisdiction, code_reference, requirement, trigger_trade, required_item, estimated_cost, unit, estimated_quantity, severity) VALUES
  ('National', 'IMC 106', 'HVAC work requires permit', 'HVAC', 'permit', 450.00, 'EA', 1, 'CRITICAL'),
  ('National', 'IMC 106', 'HVAC work requires inspection', 'HVAC', 'inspection', 200.00, 'EA', 1, 'HIGH'),
  ('National', 'IMC 403', 'Condensate drain required', 'HVAC', 'condensate drain', 350.00, 'EA', 1, 'HIGH');

-- Framing code requirements
INSERT INTO code_requirements (jurisdiction, code_reference, requirement, trigger_trade, required_item, estimated_cost, unit, estimated_quantity, severity) VALUES
  ('National', 'IRC R301', 'Structural work requires engineering', 'Framing', 'engineering', 1500.00, 'EA', 1, 'CRITICAL'),
  ('National', 'IRC R301', 'Structural work requires permit', 'Framing', 'permit', 500.00, 'EA', 1, 'CRITICAL'),
  ('National', 'IRC R602', 'Structural work requires inspection', 'Framing', 'inspection', 250.00, 'EA', 1, 'HIGH');

-- Drywall/Finishing code requirements
INSERT INTO code_requirements (jurisdiction, code_reference, requirement, trigger_trade, required_item, estimated_cost, unit, estimated_quantity, severity) VALUES
  ('National', 'Manufacturer Spec', 'Primer required before painting new drywall', 'Drywall', 'primer', 900.00, 'SF', 500, 'MEDIUM'),
  ('National', 'Industry Standard', 'Texture matching required for seamless finish', 'Drywall', 'texture', 1500.00, 'SF', 500, 'MEDIUM');

-- Flooring code requirements
INSERT INTO code_requirements (jurisdiction, code_reference, requirement, trigger_trade, required_item, estimated_cost, unit, estimated_quantity, severity) VALUES
  ('National', 'Manufacturer Spec', 'Underlayment required for flooring warranty', 'Flooring', 'underlayment', 2200.00, 'SF', 400, 'HIGH'),
  ('National', 'Industry Standard', 'Transition strips required at doorways', 'Flooring', 'transition', 600.00, 'LF', 30, 'MEDIUM');

-- State-specific requirements (examples)
INSERT INTO code_requirements (jurisdiction, code_reference, requirement, trigger_trade, required_item, estimated_cost, unit, estimated_quantity, severity) VALUES
  ('Florida', 'Florida Building Code', 'Hurricane straps required', 'Roofing', 'hurricane straps', 1200.00, 'EA', 40, 'CRITICAL'),
  ('California', 'California Building Code', 'Seismic bracing required', 'HVAC', 'seismic bracing', 800.00, 'EA', 2, 'HIGH'),
  ('Texas', 'Texas Building Code', 'Wind uplift rated shingles required', 'Roofing', 'wind rated shingles', 0.00, 'SQ', 0, 'HIGH');

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

/**
 * Get code requirements for trade and jurisdiction
 */
CREATE OR REPLACE FUNCTION get_code_requirements_for_trade(
  trade_param TEXT,
  jurisdiction_param TEXT DEFAULT 'National'
)
RETURNS TABLE (
  code_reference TEXT,
  requirement TEXT,
  required_item TEXT,
  estimated_cost NUMERIC,
  severity TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cr.code_reference,
    cr.requirement,
    cr.required_item,
    cr.estimated_cost,
    cr.severity
  FROM code_requirements cr
  WHERE cr.trigger_trade = trade_param
    AND (cr.jurisdiction = jurisdiction_param OR cr.jurisdiction = 'National')
  ORDER BY 
    CASE cr.severity
      WHEN 'CRITICAL' THEN 1
      WHEN 'HIGH' THEN 2
      WHEN 'MEDIUM' THEN 3
      ELSE 4
    END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

/**
 * Get all code requirements for jurisdiction
 */
CREATE OR REPLACE FUNCTION get_all_code_requirements(
  jurisdiction_param TEXT DEFAULT 'National'
)
RETURNS TABLE (
  trigger_trade TEXT,
  required_item TEXT,
  code_reference TEXT,
  requirement TEXT,
  estimated_cost NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cr.trigger_trade,
    cr.required_item,
    cr.code_reference,
    cr.requirement,
    cr.estimated_cost
  FROM code_requirements cr
  WHERE cr.jurisdiction = jurisdiction_param OR cr.jurisdiction = 'National'
  ORDER BY cr.trigger_trade, cr.severity DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- GRANTS
-- ============================================================================

GRANT SELECT ON code_requirements TO authenticated;
GRANT SELECT ON code_requirements TO anon;
