-- Seed Example Reports for Estimate Review Pro
-- Enterprise-ready, comprehensive example reports demonstrating system capabilities
-- Run this after 00_create_users_table.sql and 20260210_pricing_schema.sql

-- Create example users and teams for demonstration
DO $$
DECLARE
  demo_user_id UUID := '00000000-0000-0000-0000-000000000001';
  demo_team_id UUID := '00000000-0000-0000-0000-000000000010';
  demo_user_email TEXT := 'demo@estimatereviewpro.com';
BEGIN
  -- Insert demo user (only if auth.users exists and has the user)
  -- In production, this would be created through Supabase Auth
  INSERT INTO public.users (id, email, plan_type, team_id, role)
  VALUES (demo_user_id, demo_user_email, 'professional', demo_team_id, 'owner')
  ON CONFLICT (id) DO NOTHING;

  -- Insert demo team
  INSERT INTO teams (id, name, owner_id, plan_type, review_limit, overage_price)
  VALUES (
    demo_team_id,
    'Demo Construction & Restoration',
    demo_user_id,
    'professional',
    50,
    10
  )
  ON CONFLICT (id) DO NOTHING;

  -- Initialize usage tracking for current month
  INSERT INTO usage_tracking (team_id, month_year, review_count, overage_count)
  VALUES (
    demo_team_id,
    TO_CHAR(NOW(), 'YYYY-MM'),
    5,
    0
  )
  ON CONFLICT (team_id, month_year) DO NOTHING;
END $$;

-- ============================================================================
-- REPORT 1: Comprehensive Water Damage - Residential Property
-- ============================================================================
INSERT INTO reports (
  id,
  user_id,
  team_id,
  estimate_name,
  estimate_type,
  damage_type,
  result_json,
  paid_single_use,
  created_at
) VALUES (
  '10000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000010',
  'Johnson Residence - Water Damage Claim #WD-2024-8847',
  'residential',
  'water_damage',
  '{
    "classification": {
      "classification": "XACTIMATE",
      "confidence": 95,
      "platform": "Xactimate 28.5",
      "metadata": {
        "detected_format": "Xactimate ESX Export",
        "line_item_count": 47,
        "trade_codes_found": ["DEM", "DRY", "INS", "PLM", "FLR", "PNT"]
      }
    },
    "property_details": {
      "address": "1234 Oak Street, Springfield, IL 62701",
      "claim_number": "WD-2024-8847",
      "date_of_loss": "2024-01-15",
      "adjuster": "Sarah Mitchell",
      "total_estimate_value": 28450.75,
      "affected_areas": ["Master Bathroom", "Master Bedroom", "Hallway", "Living Room"]
    },
    "detected_trades": [
      {
        "code": "DEM",
        "name": "Demolition",
        "line_items": [
          {"description": "Remove drywall - wet", "quantity": 280, "unit": "SF", "unit_price": 1.85, "total": 518.00},
          {"description": "Remove carpet & pad", "quantity": 450, "unit": "SF", "unit_price": 0.95, "total": 427.50},
          {"description": "Remove vinyl flooring", "quantity": 120, "unit": "SF", "unit_price": 0.75, "total": 90.00},
          {"description": "Remove base trim", "quantity": 85, "unit": "LF", "unit_price": 0.85, "total": 72.25}
        ],
        "subtotal": 1107.75
      },
      {
        "code": "DRY",
        "name": "Drying & Dehumidification",
        "line_items": [
          {"description": "Drying equipment - 3 days", "quantity": 3, "unit": "DAY", "unit_price": 285.00, "total": 855.00},
          {"description": "Dehumidifier - commercial", "quantity": 3, "unit": "DAY", "unit_price": 95.00, "total": 285.00},
          {"description": "Air mover - high velocity", "quantity": 9, "unit": "DAY", "unit_price": 12.00, "total": 108.00}
        ],
        "subtotal": 1248.00
      },
      {
        "code": "INS",
        "name": "Insulation",
        "line_items": [
          {"description": "Fiberglass batt R-13 wall", "quantity": 280, "unit": "SF", "unit_price": 1.15, "total": 322.00}
        ],
        "subtotal": 322.00
      },
      {
        "code": "PLM",
        "name": "Plumbing",
        "line_items": [
          {"description": "Replace supply line - PEX", "quantity": 1, "unit": "EA", "unit_price": 185.00, "total": 185.00},
          {"description": "Pressure test system", "quantity": 1, "unit": "EA", "unit_price": 125.00, "total": 125.00}
        ],
        "subtotal": 310.00
      },
      {
        "code": "FLR",
        "name": "Flooring",
        "line_items": [
          {"description": "Carpet & pad - builder grade", "quantity": 450, "unit": "SF", "unit_price": 4.25, "total": 1912.50},
          {"description": "Vinyl plank flooring", "quantity": 120, "unit": "SF", "unit_price": 5.50, "total": 660.00}
        ],
        "subtotal": 2572.50
      },
      {
        "code": "PNT",
        "name": "Painting",
        "line_items": [
          {"description": "Paint walls - 2 coats", "quantity": 280, "unit": "SF", "unit_price": 0.95, "total": 266.00},
          {"description": "Paint ceiling - 2 coats", "quantity": 450, "unit": "SF", "unit_price": 0.85, "total": 382.50},
          {"description": "Paint base trim", "quantity": 85, "unit": "LF", "unit_price": 1.25, "total": 106.25}
        ],
        "subtotal": 754.75
      }
    ],
    "missing_items": [
      {
        "category": "Antimicrobial Treatment",
        "description": "No antimicrobial/disinfectant treatment detected after water exposure. Standard practice for Category 2 or 3 water.",
        "severity": "error",
        "expected_for_damage_type": true,
        "estimated_cost_impact": "150-350",
        "xactimate_codes": ["CLN ANTI", "CLN DSNF"]
      },
      {
        "category": "Moisture Testing",
        "description": "No moisture testing or monitoring documented. Required to verify drying completion per IICRC S500 standards.",
        "severity": "error",
        "expected_for_damage_type": true,
        "estimated_cost_impact": "200-400",
        "xactimate_codes": ["DRY MSTR"]
      },
      {
        "category": "Subfloor Inspection",
        "description": "No subfloor inspection or replacement noted. Water damage typically affects subfloor integrity.",
        "severity": "warning",
        "expected_for_damage_type": true,
        "estimated_cost_impact": "800-1500",
        "xactimate_codes": ["FLR SUBR"]
      },
      {
        "category": "Electrical Inspection",
        "description": "No electrical inspection documented. Water exposure may have affected outlets, switches, or wiring in affected areas.",
        "severity": "warning",
        "expected_for_damage_type": true,
        "estimated_cost_impact": "150-500",
        "xactimate_codes": ["ELC INSP"]
      },
      {
        "category": "Contents Pack-Out",
        "description": "No contents pack-out or storage noted. Typically required during water mitigation and reconstruction.",
        "severity": "info",
        "expected_for_damage_type": true,
        "estimated_cost_impact": "1200-2500",
        "xactimate_codes": ["CNT PACK", "CNT STOR"]
      }
    ],
    "quantity_issues": [
      {
        "line_item": "Remove drywall - wet (280 SF)",
        "issue_type": "quantity_mismatch",
        "description": "Drywall removal quantity (280 SF) does not account for both sides of walls. Standard practice is to remove both sides when wet.",
        "recommended_quantity": "560 SF",
        "cost_impact": 518.00
      },
      {
        "line_item": "Drying equipment - 3 days",
        "issue_type": "quantity_mismatch",
        "description": "3-day drying period may be insufficient for 450 SF carpet and 280 SF drywall. IICRC S500 typically requires 5-7 days for this scope.",
        "recommended_quantity": "5-7 days",
        "cost_impact": 570.00
      }
    ],
    "structural_gaps": [
      {
        "category": "Drywall Installation",
        "gap_type": "missing_labor",
        "description": "Drywall removal noted but no drywall installation/replacement included in scope.",
        "estimated_cost": "1680-2240",
        "xactimate_codes": ["DRY 1/2R", "DRY HANG"]
      },
      {
        "category": "Base Trim",
        "gap_type": "replacement_without_removal",
        "description": "Base trim removal included but no reinstallation noted.",
        "estimated_cost": "340-425",
        "xactimate_codes": ["CRP BASR"]
      }
    ],
    "pricing_observations": [
      {
        "item": "Carpet & pad - builder grade",
        "observed_price": 4.25,
        "typical_range": "4.50-6.50",
        "note": "Price is at lower end of typical range for builder-grade carpet in Springfield, IL market (2024)."
      },
      {
        "item": "Drying equipment - 3 days",
        "observed_price": 285.00,
        "typical_range": "250-350",
        "note": "Daily rate within normal range for commercial drying equipment."
      }
    ],
    "compliance_notes": [
      {
        "standard": "IICRC S500",
        "requirement": "Moisture mapping and documentation",
        "status": "not_documented",
        "description": "IICRC S500 Standard requires moisture mapping before and after drying. No documentation of moisture readings included."
      },
      {
        "standard": "IICRC S500",
        "requirement": "Antimicrobial treatment for Category 2/3 water",
        "status": "missing",
        "description": "If water source is Category 2 or 3, antimicrobial treatment is required per IICRC guidelines."
      }
    ],
    "summary": "This Xactimate estimate covers basic water damage mitigation and restoration for 570 SF of affected space. The estimate includes demolition, drying, and reconstruction of flooring and painting. However, several standard items are missing: antimicrobial treatment, moisture testing documentation, subfloor inspection, and drywall installation. Additionally, drying duration appears insufficient per IICRC S500 standards (3 days vs recommended 5-7 days). The drywall removal quantity may need adjustment to account for both sides of affected walls. Total estimated gap: $4,800-$7,900 in missing scope.",
    "risk_level": "medium",
    "total_missing_value_estimate": {
      "low": 4800,
      "high": 7900
    },
    "recommendations_for_adjuster": [
      "Request documentation of moisture readings and drying completion",
      "Clarify whether antimicrobial treatment was performed",
      "Verify subfloor condition before flooring installation",
      "Confirm drywall installation is included in scope",
      "Request electrical inspection clearance for affected areas"
    ],
    "metadata": {
      "processing_time_ms": 2847,
      "model_version": "gpt-4-turbo-preview",
      "timestamp": "2024-02-15T14:23:45.123Z",
      "analysis_depth": "comprehensive",
      "confidence_score": 92
    }
  }'::jsonb,
  false,
  NOW() - INTERVAL '15 days'
) ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- REPORT 2: Roof Damage - Hail & Wind - Commercial Property
-- ============================================================================
INSERT INTO reports (
  id,
  user_id,
  team_id,
  estimate_name,
  estimate_type,
  damage_type,
  result_json,
  paid_single_use,
  created_at
) VALUES (
  '10000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000010',
  'Riverside Office Complex - Storm Damage Claim #COM-2024-3312',
  'commercial',
  'hail_wind_damage',
  '{
    "classification": {
      "classification": "XACTIMATE",
      "confidence": 98,
      "platform": "Xactimate 28.5",
      "metadata": {
        "detected_format": "Xactimate ESX Export - Commercial",
        "line_item_count": 89,
        "trade_codes_found": ["RFG", "SHT", "MSC", "GUT", "INS", "ELC", "GYP"]
      }
    },
    "property_details": {
      "address": "8500 Commerce Drive, Dallas, TX 75201",
      "claim_number": "COM-2024-3312",
      "date_of_loss": "2024-03-22",
      "adjuster": "Michael Chen, CPA",
      "total_estimate_value": 187650.00,
      "building_type": "Commercial Office - 3 Story",
      "roof_area": "18,500 SF",
      "affected_areas": ["Entire roof system", "West facade", "HVAC units (2)", "Skylights (4)"]
    },
    "detected_trades": [
      {
        "code": "RFG",
        "name": "Roofing",
        "line_items": [
          {"description": "Remove TPO membrane - 60 mil", "quantity": 18500, "unit": "SF", "unit_price": 0.85, "total": 15725.00},
          {"description": "Install TPO membrane - 60 mil", "quantity": 18500, "unit": "SF", "unit_price": 3.25, "total": 60125.00},
          {"description": "Remove/replace insulation - polyiso 2in", "quantity": 18500, "unit": "SF", "unit_price": 1.45, "total": 26825.00},
          {"description": "Edge metal - aluminum", "quantity": 520, "unit": "LF", "unit_price": 8.50, "total": 4420.00},
          {"description": "Roof penetration flashing", "quantity": 12, "unit": "EA", "unit_price": 125.00, "total": 1500.00}
        ],
        "subtotal": 108595.00
      },
      {
        "code": "SHT",
        "name": "Sheet Metal",
        "line_items": [
          {"description": "Gutter - 6in aluminum", "quantity": 240, "unit": "LF", "unit_price": 12.50, "total": 3000.00},
          {"description": "Downspout - 3x4 aluminum", "quantity": 80, "unit": "LF", "unit_price": 8.75, "total": 700.00}
        ],
        "subtotal": 3700.00
      },
      {
        "code": "MSC",
        "name": "Miscellaneous",
        "line_items": [
          {"description": "Dumpster - 30 yard", "quantity": 3, "unit": "EA", "unit_price": 485.00, "total": 1455.00},
          {"description": "Roof protection/safety equipment", "quantity": 1, "unit": "LS", "unit_price": 2500.00, "total": 2500.00}
        ],
        "subtotal": 3955.00
      }
    ],
    "missing_items": [
      {
        "category": "Roof Deck Inspection & Repair",
        "description": "No roof deck inspection or repair included. Hail and wind damage typically causes deck damage requiring plywood replacement.",
        "severity": "error",
        "expected_for_damage_type": true,
        "estimated_cost_impact": "8500-15000",
        "xactimate_codes": ["RFG DECK", "FRM SHTH"],
        "justification": "Commercial roofs with 60 mil TPO and hail damage commonly have deck penetration. Industry standard is to inspect 100% of deck during tear-off."
      },
      {
        "category": "Skylight Replacement",
        "description": "Four skylights noted in property but no skylight repair/replacement in scope. Hail typically damages skylight domes and flashing.",
        "severity": "error",
        "expected_for_damage_type": true,
        "estimated_cost_impact": "4800-8000",
        "xactimate_codes": ["RFG SKYL", "RFG SKYF"],
        "justification": "Skylights are highly vulnerable to hail damage. Dome cracking and flashing damage are common with 1+ inch hail."
      },
      {
        "category": "HVAC Curb & Flashing",
        "description": "Two HVAC units on roof but no curb or flashing repair included. Wind and hail damage typically affects HVAC curbs and penetrations.",
        "severity": "error",
        "expected_for_damage_type": true,
        "estimated_cost_impact": "2400-4500",
        "xactimate_codes": ["RFG CURB", "SHT CURB"],
        "justification": "HVAC curbs and pitch pans are standard failure points in wind/hail events. Proper flashing is critical to prevent future leaks."
      },
      {
        "category": "Interior Water Damage",
        "description": "No interior damage scope despite active roof leak. Water intrusion typically causes ceiling, wall, and insulation damage.",
        "severity": "warning",
        "expected_for_damage_type": true,
        "estimated_cost_impact": "12000-25000",
        "xactimate_codes": ["GYP", "INS", "PNT", "CLN"],
        "justification": "If roof was leaking before repair, interior damage is likely. Requires inspection of top floor ceilings and walls."
      },
      {
        "category": "Temporary Roof Protection",
        "description": "No temporary weatherproofing or tarp installation during repair period.",
        "severity": "warning",
        "expected_for_damage_type": true,
        "estimated_cost_impact": "1500-3000",
        "xactimate_codes": ["RFG TARP"],
        "justification": "Commercial building requires weather protection during multi-day roof replacement to prevent business interruption and interior damage."
      },
      {
        "category": "Engineering Inspection",
        "description": "No structural engineering inspection for wind damage. Required for commercial properties with wind speeds >70 mph.",
        "severity": "info",
        "expected_for_damage_type": true,
        "estimated_cost_impact": "1200-2000",
        "xactimate_codes": ["MSC ENGI"],
        "justification": "Many jurisdictions require PE certification for commercial roof replacement after storm damage."
      },
      {
        "category": "Permit & Inspection Fees",
        "description": "No building permit or inspection fees included. Required for commercial roof replacement in Dallas, TX.",
        "severity": "warning",
        "expected_for_damage_type": true,
        "estimated_cost_impact": "800-1500",
        "xactimate_codes": ["MSC PRMT"],
        "justification": "City of Dallas requires permits for commercial re-roofing. Typical fee is 0.5-1% of project value."
      }
    ],
    "quantity_issues": [
      {
        "line_item": "Roof penetration flashing (12 EA)",
        "issue_type": "quantity_mismatch",
        "description": "Only 12 penetrations listed but property has 2 HVAC units, 4 skylights, 8 vents, and 3 drains = minimum 17 penetrations.",
        "recommended_quantity": "17+ EA",
        "cost_impact": 625.00
      },
      {
        "line_item": "Edge metal - aluminum (520 LF)",
        "issue_type": "quantity_mismatch",
        "description": "Edge metal quantity appears low for 18,500 SF roof. Typical perimeter for this size is 600-700 LF.",
        "recommended_quantity": "600-700 LF",
        "cost_impact": "680-1530"
      }
    ],
    "structural_gaps": [
      {
        "category": "Roof Deck",
        "gap_type": "missing_trade",
        "description": "Complete absence of roof deck inspection and repair scope. Critical for structural integrity.",
        "estimated_cost": "8500-15000",
        "xactimate_codes": ["RFG DECK", "FRM SHTH"]
      },
      {
        "category": "Interior Restoration",
        "gap_type": "incomplete_scope",
        "description": "No interior damage assessment or repair scope. Roof leaks typically cause interior damage requiring mitigation.",
        "estimated_cost": "12000-25000",
        "xactimate_codes": ["GYP", "INS", "PNT", "CLN", "DRY"]
      }
    ],
    "pricing_observations": [
      {
        "item": "TPO membrane - 60 mil installation",
        "observed_price": 3.25,
        "typical_range": "3.00-4.50",
        "note": "Price is within normal range for commercial TPO installation in Dallas market (2024). Mid-range pricing."
      },
      {
        "item": "Polyiso insulation - 2in",
        "observed_price": 1.45,
        "typical_range": "1.35-2.10",
        "note": "Competitive pricing for polyiso board. Within expected range for commercial project."
      },
      {
        "item": "Edge metal - aluminum",
        "observed_price": 8.50,
        "typical_range": "7.50-12.00",
        "note": "Fair pricing for aluminum edge metal. Standard commercial rate."
      }
    ],
    "compliance_notes": [
      {
        "standard": "IBC 2021 (International Building Code)",
        "requirement": "Wind uplift testing for commercial roofs",
        "status": "not_documented",
        "description": "No documentation of wind uplift rating or FM approval for TPO system. Required for commercial buildings in Dallas (Wind Zone 2)."
      },
      {
        "standard": "IICRC S500",
        "requirement": "Category classification of water intrusion",
        "status": "missing",
        "description": "If roof was leaking, water category must be determined (Category 1, 2, or 3) to establish proper mitigation protocol."
      },
      {
        "standard": "City of Dallas Building Code",
        "requirement": "Commercial re-roofing permit",
        "status": "not_included",
        "description": "Permit and inspection fees not included in estimate. Required for commercial roof replacement over 100 SF."
      }
    ],
    "summary": "This commercial roof replacement estimate covers the basic TPO membrane and insulation replacement for an 18,500 SF flat roof system. While the core roofing scope is present, several critical items are missing: roof deck inspection/repair (essential for hail damage), skylight replacement, HVAC curb repairs, and interior water damage assessment. The estimate also lacks antimicrobial treatment, temporary protection, engineering inspection, and permit fees. Quantity concerns include insufficient penetration flashings and potentially low edge metal footage. The 3-day drying period may be inadequate per IICRC standards. Total estimated missing scope: $30,000-$60,000. This represents a 16-32% gap in the total project cost.",
    "risk_level": "high",
    "total_missing_value_estimate": {
      "low": 30050,
      "high": 60425
    },
    "critical_action_items": [
      "Inspect roof deck during tear-off - document condition",
      "Assess all 4 skylights for damage",
      "Inspect both HVAC curbs and flashing systems",
      "Conduct interior inspection for water damage on 3rd floor",
      "Obtain engineering letter if required by jurisdiction",
      "Include permit fees in estimate"
    ],
    "metadata": {
      "processing_time_ms": 3521,
      "model_version": "gpt-4-turbo-preview",
      "timestamp": "2024-03-28T09:15:22.456Z",
      "analysis_depth": "comprehensive",
      "confidence_score": 96
    }
  }'::jsonb,
  false,
  NOW() - INTERVAL '10 days'
) ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- REPORT 3: Fire Damage - Residential - Multi-Trade Reconstruction
-- ============================================================================
INSERT INTO reports (
  id,
  user_id,
  team_id,
  estimate_name,
  estimate_type,
  damage_type,
  result_json,
  paid_single_use,
  created_at
) VALUES (
  '10000000-0000-0000-0000-000000000003',
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000010',
  'Martinez Home - Kitchen Fire Claim #FD-2024-5521',
  'residential',
  'fire_damage',
  '{
    "classification": {
      "classification": "XACTIMATE",
      "confidence": 97,
      "platform": "Xactimate 28.5",
      "metadata": {
        "detected_format": "Xactimate ESX Export",
        "line_item_count": 134,
        "trade_codes_found": ["DEM", "CLN", "GYP", "INS", "PNT", "CAB", "CTR", "PLM", "ELC", "FLR", "TIL", "MSC"]
      }
    },
    "property_details": {
      "address": "567 Maple Avenue, Phoenix, AZ 85001",
      "claim_number": "FD-2024-5521",
      "date_of_loss": "2024-02-08",
      "adjuster": "Jennifer Rodriguez",
      "total_estimate_value": 94275.50,
      "affected_areas": ["Kitchen", "Dining Room", "Living Room", "Hallway", "Attic space above kitchen"]
    },
    "detected_trades": [
      {
        "code": "DEM",
        "name": "Demolition",
        "line_items": [
          {"description": "Remove kitchen cabinets - upper", "quantity": 24, "unit": "LF", "unit_price": 8.50, "total": 204.00},
          {"description": "Remove kitchen cabinets - lower", "quantity": 18, "unit": "LF", "unit_price": 12.00, "total": 216.00},
          {"description": "Remove countertop - laminate", "quantity": 42, "unit": "SF", "unit_price": 2.25, "total": 94.50},
          {"description": "Remove drywall - fire damaged", "quantity": 850, "unit": "SF", "unit_price": 2.15, "total": 1827.50},
          {"description": "Remove ceiling drywall", "quantity": 420, "unit": "SF", "unit_price": 1.95, "total": 819.00},
          {"description": "Remove flooring - tile", "quantity": 180, "unit": "SF", "unit_price": 2.85, "total": 513.00},
          {"description": "Remove flooring - hardwood", "quantity": 650, "unit": "SF", "unit_price": 1.95, "total": 1267.50}
        ],
        "subtotal": 4941.50
      },
      {
        "code": "CLN",
        "name": "Cleaning",
        "line_items": [
          {"description": "Soot cleaning - walls", "quantity": 1200, "unit": "SF", "unit_price": 0.95, "total": 1140.00},
          {"description": "Soot cleaning - ceiling", "quantity": 650, "unit": "SF", "unit_price": 0.85, "total": 552.50},
          {"description": "Deodorization - thermal fogging", "quantity": 2000, "unit": "SF", "unit_price": 0.45, "total": 900.00},
          {"description": "HEPA air scrubber - 5 days", "quantity": 5, "unit": "DAY", "unit_price": 125.00, "total": 625.00}
        ],
        "subtotal": 3217.50
      },
      {
        "code": "GYP",
        "name": "Drywall",
        "line_items": [
          {"description": "Drywall 1/2in - walls", "quantity": 850, "unit": "SF", "unit_price": 2.45, "total": 2082.50},
          {"description": "Drywall 5/8in - ceiling", "quantity": 420, "unit": "SF", "unit_price": 2.75, "total": 1155.00},
          {"description": "Texture - knockdown", "quantity": 1270, "unit": "SF", "unit_price": 0.65, "total": 825.50}
        ],
        "subtotal": 4063.00
      },
      {
        "code": "PNT",
        "name": "Painting",
        "line_items": [
          {"description": "Prime & paint walls - 2 coats", "quantity": 850, "unit": "SF", "unit_price": 1.15, "total": 977.50},
          {"description": "Prime & paint ceiling - 2 coats", "quantity": 420, "unit": "SF", "unit_price": 0.95, "total": 399.00},
          {"description": "Paint trim & doors", "quantity": 1, "unit": "LS", "unit_price": 850.00, "total": 850.00}
        ],
        "subtotal": 2226.50
      },
      {
        "code": "CAB",
        "name": "Cabinets",
        "line_items": [
          {"description": "Kitchen cabinets - upper - stock", "quantity": 24, "unit": "LF", "unit_price": 185.00, "total": 4440.00},
          {"description": "Kitchen cabinets - lower - stock", "quantity": 18, "unit": "LF", "unit_price": 245.00, "total": 4410.00}
        ],
        "subtotal": 8850.00
      },
      {
        "code": "CTR",
        "name": "Countertops",
        "line_items": [
          {"description": "Laminate countertop - standard", "quantity": 42, "unit": "SF", "unit_price": 28.50, "total": 1197.00}
        ],
        "subtotal": 1197.00
      },
      {
        "code": "FLR",
        "name": "Flooring",
        "line_items": [
          {"description": "Ceramic tile - 12x12", "quantity": 180, "unit": "SF", "unit_price": 8.75, "total": 1575.00},
          {"description": "Hardwood flooring - oak 3.25in", "quantity": 650, "unit": "SF", "unit_price": 9.50, "total": 6175.00}
        ],
        "subtotal": 7750.00
      }
    ],
    "missing_items": [
      {
        "category": "Electrical System Inspection & Repair",
        "description": "No electrical inspection or repair scope. Fire damage requires comprehensive electrical assessment per NEC Article 110.26.",
        "severity": "error",
        "expected_for_damage_type": true,
        "estimated_cost_impact": "2500-5000",
        "xactimate_codes": ["ELC INSP", "ELC RECP", "ELC SWCH", "ELC FIXR"],
        "justification": "All electrical systems in fire-affected areas must be inspected. Wiring insulation may be compromised. Outlets and switches likely damaged by heat and smoke."
      },
      {
        "category": "Plumbing Inspection",
        "description": "Kitchen fire but no plumbing inspection or repair. Gas lines, water supply, and drain lines require inspection.",
        "severity": "error",
        "expected_for_damage_type": true,
        "estimated_cost_impact": "800-1500",
        "xactimate_codes": ["PLM INSP", "PLM SUPL", "PLM DRAN"],
        "justification": "Kitchen fires often damage plumbing. PEX and CPVC supply lines can be compromised by heat. Gas lines must be pressure tested."
      },
      {
        "category": "HVAC Ductwork Cleaning",
        "description": "No HVAC duct cleaning or sealing. Smoke and soot contamination spreads through duct system.",
        "severity": "error",
        "expected_for_damage_type": true,
        "estimated_cost_impact": "1200-2500",
        "xactimate_codes": ["CLN DUCT", "HVA SEAL"],
        "justification": "NADCA (National Air Duct Cleaners Association) standards require duct cleaning after fire. Soot in ducts will re-contaminate cleaned areas."
      },
      {
        "category": "Attic Structure Repair",
        "description": "Attic space noted as affected but no structural framing repair included. Fire typically damages roof trusses and sheathing.",
        "severity": "error",
        "expected_for_damage_type": true,
        "estimated_cost_impact": "4500-8500",
        "xactimate_codes": ["FRM TRSR", "FRM SHTH", "RFG DECK"],
        "justification": "Kitchen fires extend into attic. Structural members may be charred or weakened requiring sistering or replacement."
      },
      {
        "category": "Appliance Replacement",
        "description": "Kitchen fire but no appliance replacement scope. Range, hood, dishwasher, and microwave typically require replacement.",
        "severity": "warning",
        "expected_for_damage_type": true,
        "estimated_cost_impact": "3500-7000",
        "xactimate_codes": ["APP RANG", "APP HOOD", "APP DSHW", "APP MICR"],
        "justification": "Appliances exposed to fire and heat typically cannot be salvaged due to safety concerns and manufacturer warranties."
      },
      {
        "category": "Smoke Seal Primer",
        "description": "No smoke seal primer/sealer included before painting. Required to prevent smoke bleed-through.",
        "severity": "warning",
        "expected_for_damage_type": true,
        "estimated_cost_impact": "600-950",
        "xactimate_codes": ["PNT SEAL"],
        "justification": "Smoke-damaged surfaces require oil-based sealer (e.g., Kilz, BIN) before painting to prevent odor and staining."
      },
      {
        "category": "Contents Cleaning & Storage",
        "description": "No contents pack-out, cleaning, or storage. Standard for fire restoration to protect salvageable items.",
        "severity": "info",
        "expected_for_damage_type": true,
        "estimated_cost_impact": "4000-8000",
        "xactimate_codes": ["CNT PACK", "CNT CLEN", "CNT STOR"],
        "justification": "Contents must be removed during demolition and cleaning. Professional cleaning required for smoke-damaged items."
      },
      {
        "category": "Fire Department Access Damage",
        "description": "No documentation of forced entry damage or water damage from fire suppression efforts.",
        "severity": "info",
        "expected_for_damage_type": true,
        "estimated_cost_impact": "500-2000",
        "xactimate_codes": ["DOR", "CLN WATR"],
        "justification": "Fire department response often causes additional damage (forced entry, water from hoses) that should be documented."
      }
    ],
    "quantity_issues": [
      {
        "line_item": "Soot cleaning - walls (1200 SF)",
        "issue_type": "quantity_mismatch",
        "description": "Cleaning quantity only covers fire-damaged areas. Smoke contamination typically extends to entire home requiring whole-house cleaning.",
        "recommended_quantity": "3000-4000 SF",
        "cost_impact": "1710-2660"
      },
      {
        "line_item": "Deodorization - thermal fogging (2000 SF)",
        "issue_type": "quantity_mismatch",
        "description": "Deodorization should cover entire conditioned space, not just damaged areas. Smoke odor permeates throughout structure.",
        "recommended_quantity": "2500-3000 SF",
        "cost_impact": "225-450"
      }
    ],
    "structural_gaps": [
      {
        "category": "Electrical Trade",
        "gap_type": "missing_trade",
        "description": "Complete absence of electrical scope. Critical safety issue for fire-damaged property.",
        "estimated_cost": "2500-5000",
        "xactimate_codes": ["ELC"]
      },
      {
        "category": "Attic Structural Repair",
        "gap_type": "incomplete_scope",
        "description": "Attic noted as affected but no framing or sheathing repair included.",
        "estimated_cost": "4500-8500",
        "xactimate_codes": ["FRM"]
      },
      {
        "category": "Appliances",
        "gap_type": "missing_material",
        "description": "No kitchen appliance replacement. Essential for functional kitchen restoration.",
        "estimated_cost": "3500-7000",
        "xactimate_codes": ["APP"]
      }
    ],
    "pricing_observations": [
      {
        "item": "Kitchen cabinets - stock grade",
        "observed_price": 185.00,
        "typical_range": "175-350",
        "note": "Lower-end stock cabinets. Pricing appropriate for builder-grade replacement in Phoenix market."
      },
      {
        "item": "Hardwood flooring - oak 3.25in",
        "observed_price": 9.50,
        "typical_range": "8.50-14.00",
        "note": "Mid-range pricing for solid oak flooring. Reasonable for Phoenix market (2024)."
      },
      {
        "item": "Soot cleaning",
        "observed_price": 0.95,
        "typical_range": "0.85-1.50",
        "note": "Standard rate for soot cleaning. Within normal range for residential fire restoration."
      }
    ],
    "compliance_notes": [
      {
        "standard": "NFPA 921 (Fire Investigation)",
        "requirement": "Documentation of fire origin and extent",
        "status": "not_documented",
        "description": "No documentation of fire origin point or extent of heat/smoke damage. Important for determining scope."
      },
      {
        "standard": "NEC Article 110.26",
        "requirement": "Electrical inspection after fire",
        "status": "missing",
        "description": "National Electrical Code requires inspection and testing of all electrical systems in fire-affected areas."
      },
      {
        "standard": "IICRC S500",
        "requirement": "Water damage from fire suppression",
        "status": "not_addressed",
        "description": "Fire suppression water must be treated as Category 3 (contaminated) per IICRC standards. No water mitigation scope included."
      },
      {
        "standard": "City of Phoenix Building Code",
        "requirement": "Building permit for structural repairs",
        "status": "not_included",
        "description": "Permit required for fire restoration work exceeding $5,000. Permit fees not included in estimate."
      }
    },
    "summary": "This residential fire restoration estimate covers demolition, cleaning, and reconstruction of kitchen and adjacent areas totaling approximately 2,000 SF. The estimate includes basic trades: demolition, soot cleaning, drywall, painting, cabinets, countertops, and flooring. However, critical items are missing: electrical inspection and repair (mandatory for fire damage), plumbing inspection, HVAC duct cleaning, attic structural repair, appliance replacement, and smoke seal primer. The cleaning scope appears limited - smoke contamination typically extends beyond visible damage requiring whole-house treatment. Missing scope estimated at $20,000-$40,000, representing a 21-42% gap in total restoration cost. This estimate may not result in a fully functional, code-compliant kitchen.",
    "risk_level": "high",
    "total_missing_value_estimate": {
      "low": 20325,
      "high": 40100
    },
    "critical_action_items": [
      "Require licensed electrician inspection and certification",
      "Inspect attic framing and roof deck for fire damage",
      "Include HVAC duct cleaning to prevent recontamination",
      "Add smoke seal primer to all affected surfaces",
      "Include appliance replacement in scope",
      "Verify plumbing systems are functional and undamaged",
      "Obtain building permit before work begins"
    ],
    "metadata": {
      "processing_time_ms": 4125,
      "model_version": "gpt-4-turbo-preview",
      "timestamp": "2024-02-18T11:42:18.789Z",
      "analysis_depth": "comprehensive",
      "confidence_score": 94
    }
  }'::jsonb,
  false,
  NOW() - INTERVAL '5 days'
) ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- REPORT 4: Mold Remediation - Residential - Hidden Damage Discovery
-- ============================================================================
INSERT INTO reports (
  id,
  user_id,
  team_id,
  estimate_name,
  estimate_type,
  damage_type,
  result_json,
  paid_single_use,
  created_at
) VALUES (
  '10000000-0000-0000-0000-000000000004',
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000010',
  'Thompson Property - Mold Remediation Claim #MD-2024-7733',
  'residential',
  'mold_damage',
  '{
    "classification": {
      "classification": "MANUAL",
      "confidence": 78,
      "platform": "Contractor estimate - typed format",
      "metadata": {
        "detected_format": "Manual contractor estimate",
        "line_item_count": 23,
        "trade_codes_found": ["DEM", "REM", "INS", "GYP", "PNT"]
      }
    },
    "property_details": {
      "address": "892 Riverside Drive, Portland, OR 97201",
      "claim_number": "MD-2024-7733",
      "date_of_loss": "2024-01-05 (discovery date)",
      "adjuster": "Robert Kim",
      "total_estimate_value": 12850.00,
      "affected_areas": ["Master Bathroom", "Master Bedroom closet", "Exterior wall cavity"]
    },
    "detected_trades": [
      {
        "code": "DEM",
        "name": "Demolition",
        "line_items": [
          {"description": "Remove drywall - mold affected", "quantity": 120, "unit": "SF", "unit_price": 2.50, "total": 300.00},
          {"description": "Remove insulation - contaminated", "quantity": 120, "unit": "SF", "unit_price": 1.85, "total": 222.00},
          {"description": "Remove base trim", "quantity": 32, "unit": "LF", "unit_price": 0.95, "total": 30.40}
        ],
        "subtotal": 552.40
      },
      {
        "code": "REM",
        "name": "Mold Remediation",
        "line_items": [
          {"description": "Containment setup - 6mil poly", "quantity": 1, "unit": "LS", "unit_price": 450.00, "total": 450.00},
          {"description": "HEPA filtration - 3 days", "quantity": 3, "unit": "DAY", "unit_price": 125.00, "total": 375.00},
          {"description": "Mold remediation - surfaces", "quantity": 120, "unit": "SF", "unit_price": 8.50, "total": 1020.00},
          {"description": "HEPA vacuum & wipe down", "quantity": 250, "unit": "SF", "unit_price": 1.25, "total": 312.50}
        ],
        "subtotal": 2157.50
      },
      {
        "code": "INS",
        "name": "Insulation",
        "line_items": [
          {"description": "Fiberglass batt R-13", "quantity": 120, "unit": "SF", "unit_price": 1.15, "total": 138.00}
        ],
        "subtotal": 138.00
      },
      {
        "code": "GYP",
        "name": "Drywall",
        "line_items": [
          {"description": "Drywall 1/2in - mold resistant", "quantity": 120, "unit": "SF", "unit_price": 2.85, "total": 342.00}
        ],
        "subtotal": 342.00
      },
      {
        "code": "PNT",
        "name": "Painting",
        "line_items": [
          {"description": "Prime & paint - 2 coats", "quantity": 120, "unit": "SF", "unit_price": 1.15, "total": 138.00}
        ],
        "subtotal": 138.00
      }
    ],
    "missing_items": [
      {
        "category": "Pre-Remediation Mold Testing",
        "description": "No pre-remediation mold testing or air sampling. Required to establish baseline and identify mold species.",
        "severity": "error",
        "expected_for_damage_type": true,
        "estimated_cost_impact": "450-800",
        "xactimate_codes": ["MSC MLDT"],
        "justification": "IICRC S520 and ANSI/IICRC S520 require testing to identify mold type, establish containment protocol, and create baseline for clearance testing."
      },
      {
        "category": "Post-Remediation Clearance Testing",
        "description": "No post-remediation clearance testing included. Required to verify successful remediation per IICRC S520.",
        "severity": "error",
        "expected_for_damage_type": true,
        "estimated_cost_impact": "350-650",
        "xactimate_codes": ["MSC MLDC"],
        "justification": "Third-party clearance testing is industry standard and often required by insurance companies to close mold claims."
      },
      {
        "category": "Moisture Source Identification",
        "description": "No scope for identifying and repairing moisture source. Mold will return if source not addressed.",
        "severity": "error",
        "expected_for_damage_type": true,
        "estimated_cost_impact": "500-2500",
        "xactimate_codes": ["PLM", "RFG", "MSC INSP"],
        "justification": "Mold remediation without source repair is temporary. Common sources: plumbing leaks, roof leaks, poor ventilation, foundation issues."
      },
      {
        "category": "Negative Air Pressure System",
        "description": "Containment noted but no negative air machine specified. Required per IICRC S520 for proper containment.",
        "severity": "warning",
        "expected_for_damage_type": true,
        "estimated_cost_impact": "300-600",
        "xactimate_codes": ["REM NEGA"],
        "justification": "Negative air pressure prevents mold spore migration during remediation. HEPA filtration alone is insufficient."
      },
      {
        "category": "Antimicrobial Treatment",
        "description": "No antimicrobial application to framing and subfloor after remediation.",
        "severity": "warning",
        "expected_for_damage_type": true,
        "estimated_cost_impact": "200-400",
        "xactimate_codes": ["CLN ANTI"],
        "justification": "Antimicrobial treatment of structural members is standard practice after mold removal to prevent regrowth."
      },
      {
        "category": "Bathroom Exhaust Fan",
        "description": "Master bathroom mold but no exhaust fan inspection or replacement. Poor ventilation is common mold cause.",
        "severity": "warning",
        "expected_for_damage_type": true,
        "estimated_cost_impact": "150-350",
        "xactimate_codes": ["HVA EXHF"],
        "justification": "Inadequate bathroom ventilation is primary cause of mold growth. Fan may be undersized or non-functional."
      },
      {
        "category": "Disposal Fees",
        "description": "No hazardous waste disposal fees for mold-contaminated materials.",
        "severity": "info",
        "expected_for_damage_type": true,
        "estimated_cost_impact": "200-500",
        "xactimate_codes": ["MSC DISP"],
        "justification": "Mold-contaminated materials require special handling and disposal. Standard dumpster fees do not cover hazardous waste."
      }
    ],
    "quantity_issues": [
      {
        "line_item": "Remove drywall - mold affected (120 SF)",
        "issue_type": "quantity_mismatch",
        "description": "IICRC S520 requires removal of drywall 2 feet beyond visible mold. 120 SF seems insufficient for master bath and closet.",
        "recommended_quantity": "180-240 SF",
        "cost_impact": "150-300"
      },
      {
        "line_item": "Containment setup",
        "issue_type": "incomplete_scope",
        "description": "Containment listed as lump sum but no details on negative air machine, airlock, or decontamination chamber.",
        "recommended_addition": "Negative air machine - 3 days",
        "cost_impact": "300-600"
      }
    ],
    "structural_gaps": [
      {
        "category": "Moisture Source Repair",
        "gap_type": "missing_trade",
        "description": "No plumbing or building envelope repair to address moisture source. Remediation will fail without source repair.",
        "estimated_cost": "500-2500",
        "xactimate_codes": ["PLM", "RFG", "SID"]
      },
      {
        "category": "Testing & Certification",
        "gap_type": "missing_labor",
        "description": "No pre or post testing. Cannot verify successful remediation without clearance testing.",
        "estimated_cost": "800-1450",
        "xactimate_codes": ["MSC MLDT", "MSC MLDC"]
      }
    ],
    "pricing_observations": [
      {
        "item": "Mold remediation - surfaces",
        "observed_price": 8.50,
        "typical_range": "7.00-15.00",
        "note": "Mid-range pricing for mold remediation. Appropriate for residential scope in Portland market."
      },
      {
        "item": "Containment setup",
        "observed_price": 450.00,
        "typical_range": "400-800",
        "note": "Lower end for containment. May not include negative air machine or proper airlock system."
      }
    ],
    "compliance_notes": [
      {
        "standard": "IICRC S520",
        "requirement": "Pre-remediation assessment and testing",
        "status": "missing",
        "description": "S520 Standard requires pre-remediation assessment including air sampling and surface sampling to identify mold species and concentration."
      },
      {
        "standard": "IICRC S520",
        "requirement": "Post-remediation verification",
        "status": "missing",
        "description": "Clearance testing by third-party IH (Industrial Hygienist) required to verify successful remediation and safe re-occupancy."
      },
      {
        "standard": "IICRC S520",
        "requirement": "Negative air pressure containment",
        "status": "not_documented",
        "description": "Containment must maintain negative pressure with HEPA-filtered exhaust. Not clearly specified in estimate."
      },
      {
        "standard": "Oregon Building Code",
        "requirement": "Licensed contractor for mold remediation",
        "status": "not_verified",
        "description": "Oregon requires CCB license for mold work over $500. Contractor licensing should be verified."
      }
    },
    "summary": "This mold remediation estimate covers basic removal and reconstruction for 120 SF of affected area in master bathroom and closet. While core remediation activities are present, several critical items are missing: pre-remediation testing (required to identify mold species), post-remediation clearance testing (required to verify success), moisture source identification and repair (essential to prevent recurrence), negative air machine (required for proper containment), and antimicrobial treatment. The estimate also lacks bathroom exhaust fan assessment, which is often the root cause of bathroom mold. Without these items, the remediation may not meet IICRC S520 standards and mold is likely to return. Total estimated missing scope: $3,450-$8,450, representing a 27-66% increase over the current estimate. Most critically, without clearance testing, there is no verification that the property is safe for re-occupancy.",
    "risk_level": "high",
    "total_missing_value_estimate": {
      "low": 3450,
      "high": 8450
    },
    "critical_action_items": [
      "Require pre-remediation mold testing (air & surface samples)",
      "Include post-remediation clearance testing by certified IH",
      "Identify and repair moisture source before remediation",
      "Add negative air machine to containment protocol",
      "Inspect and potentially replace bathroom exhaust fan",
      "Apply antimicrobial treatment to structural members",
      "Verify contractor has proper mold remediation licensing"
    ],
    "metadata": {
      "processing_time_ms": 3247,
      "model_version": "gpt-4-turbo-preview",
      "timestamp": "2024-02-10T16:28:33.234Z",
      "analysis_depth": "comprehensive",
      "confidence_score": 89
    }
  }'::jsonb,
  false,
  NOW() - INTERVAL '3 days'
) ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- REPORT 5: Hurricane Damage - Residential - Multi-System Impact
-- ============================================================================
INSERT INTO reports (
  id,
  user_id,
  team_id,
  estimate_name,
  estimate_type,
  damage_type,
  result_json,
  paid_single_use,
  created_at
) VALUES (
  '10000000-0000-0000-0000-000000000005',
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000010',
  'Coastal Home - Hurricane Milton Damage #HU-2024-9918',
  'residential',
  'hurricane_damage',
  '{
    "classification": {
      "classification": "XACTIMATE",
      "confidence": 96,
      "platform": "Xactimate 28.5",
      "metadata": {
        "detected_format": "Xactimate ESX Export",
        "line_item_count": 156,
        "trade_codes_found": ["RFG", "SID", "WDW", "DOR", "GUT", "ELC", "DRY", "CLN", "GYP", "INS", "PNT", "FLR", "MSC"]
      }
    },
    "property_details": {
      "address": "2847 Beachfront Boulevard, Tampa, FL 33602",
      "claim_number": "HU-2024-9918",
      "date_of_loss": "2024-10-09",
      "storm_name": "Hurricane Milton",
      "adjuster": "Patricia Gonzalez, CPCU",
      "total_estimate_value": 248750.00,
      "building_type": "Single Family Residence - 2 Story",
      "square_footage": 3200,
      "affected_areas": ["Entire roof system", "West & North facades", "Windows (8)", "Garage door", "Interior - multiple rooms"]
    },
    "detected_trades": [
      {
        "code": "RFG",
        "name": "Roofing",
        "line_items": [
          {"description": "Remove asphalt shingles - architectural", "quantity": 3800, "unit": "SF", "unit_price": 0.95, "total": 3610.00},
          {"description": "Install asphalt shingles - architectural", "quantity": 3800, "unit": "SF", "unit_price": 3.85, "total": 14630.00},
          {"description": "Synthetic underlayment", "quantity": 3800, "unit": "SF", "unit_price": 0.45, "total": 1710.00},
          {"description": "Drip edge - aluminum", "quantity": 320, "unit": "LF", "unit_price": 3.25, "total": 1040.00},
          {"description": "Ridge vent", "quantity": 48, "unit": "LF", "unit_price": 8.50, "total": 408.00},
          {"description": "Roof valley - ice & water shield", "quantity": 85, "unit": "LF", "unit_price": 4.75, "total": 403.75}
        ],
        "subtotal": 21801.75
      },
      {
        "code": "SID",
        "name": "Siding",
        "line_items": [
          {"description": "Remove vinyl siding", "quantity": 850, "unit": "SF", "unit_price": 0.85, "total": 722.50},
          {"description": "Install vinyl siding - standard", "quantity": 850, "unit": "SF", "unit_price": 4.25, "total": 3612.50},
          {"description": "J-channel & trim", "quantity": 180, "unit": "LF", "unit_price": 2.85, "total": 513.00}
        ],
        "subtotal": 4848.00
      },
      {
        "code": "WDW",
        "name": "Windows",
        "line_items": [
          {"description": "Replace window - vinyl double hung 3x5", "quantity": 4, "unit": "EA", "unit_price": 485.00, "total": 1940.00},
          {"description": "Replace window - vinyl casement 4x4", "quantity": 2, "unit": "EA", "unit_price": 625.00, "total": 1250.00}
        ],
        "subtotal": 3190.00
      },
      {
        "code": "DOR",
        "name": "Doors",
        "line_items": [
          {"description": "Garage door - 16x7 steel insulated", "quantity": 1, "unit": "EA", "unit_price": 1285.00, "total": 1285.00},
          {"description": "Garage door opener", "quantity": 1, "unit": "EA", "unit_price": 385.00, "total": 385.00}
        ],
        "subtotal": 1670.00
      },
      {
        "code": "GUT",
        "name": "Gutters",
        "line_items": [
          {"description": "Remove gutters & downspouts", "quantity": 240, "unit": "LF", "unit_price": 1.25, "total": 300.00},
          {"description": "Install gutters - 5in aluminum", "quantity": 240, "unit": "LF", "unit_price": 8.50, "total": 2040.00},
          {"description": "Downspouts - 3x4 aluminum", "quantity": 60, "unit": "LF", "unit_price": 7.25, "total": 435.00}
        ],
        "subtotal": 2775.00
      },
      {
        "code": "DRY",
        "name": "Water Mitigation",
        "line_items": [
          {"description": "Water extraction", "quantity": 1200, "unit": "SF", "unit_price": 0.85, "total": 1020.00},
          {"description": "Drying equipment - 5 days", "quantity": 5, "unit": "DAY", "unit_price": 385.00, "total": 1925.00},
          {"description": "Dehumidifier - commercial", "quantity": 10, "unit": "DAY", "unit_price": 95.00, "total": 950.00}
        ],
        "subtotal": 3895.00
      },
      {
        "code": "GYP",
        "name": "Drywall",
        "line_items": [
          {"description": "Remove drywall - water damaged", "quantity": 680, "unit": "SF", "unit_price": 1.85, "total": 1258.00},
          {"description": "Install drywall 1/2in", "quantity": 680, "unit": "SF", "unit_price": 2.45, "total": 1666.00},
          {"description": "Texture - orange peel", "quantity": 680, "unit": "SF", "unit_price": 0.65, "total": 442.00}
        ],
        "subtotal": 3366.00
      },
      {
        "code": "PNT",
        "name": "Painting",
        "line_items": [
          {"description": "Prime & paint interior walls", "quantity": 680, "unit": "SF", "unit_price": 1.15, "total": 782.00},
          {"description": "Prime & paint ceilings", "quantity": 450, "unit": "SF", "unit_price": 0.95, "total": 427.50}
        ],
        "subtotal": 1209.50
      },
      {
        "code": "FLR",
        "name": "Flooring",
        "line_items": [
          {"description": "Remove laminate flooring", "quantity": 450, "unit": "SF", "unit_price": 0.95, "total": 427.50},
          {"description": "Install laminate flooring", "quantity": 450, "unit": "SF", "unit_price": 5.25, "total": 2362.50}
        ],
        "subtotal": 2790.00
      }
    ],
    "missing_items": [
      {
        "category": "Roof Deck Replacement",
        "description": "No roof deck/sheathing replacement. Hurricane-force winds typically cause deck damage requiring plywood replacement.",
        "severity": "error",
        "expected_for_damage_type": true,
        "estimated_cost_impact": "8500-15000",
        "xactimate_codes": ["RFG DECK", "FRM SHTH"],
        "justification": "Wind speeds >100 mph commonly cause deck uplift and damage. Industry standard is to replace damaged sections during re-roof."
      },
      {
        "category": "Structural Framing Inspection",
        "description": "No structural engineering inspection or framing repair. Hurricane damage requires structural assessment.",
        "severity": "error",
        "expected_for_damage_type": true,
        "estimated_cost_impact": "1500-3500",
        "xactimate_codes": ["MSC ENGI", "FRM REPR"],
        "justification": "Florida Building Code requires PE inspection for hurricane damage. Roof trusses, rafters, and wall framing may be compromised."
      },
      {
        "category": "Soffit & Fascia Repair",
        "description": "No soffit or fascia repair despite wind damage. These components are highly vulnerable to wind uplift.",
        "severity": "error",
        "expected_for_damage_type": true,
        "estimated_cost_impact": "3200-5500",
        "xactimate_codes": ["CRP SOFF", "CRP FASC"],
        "justification": "Wind-driven rain enters through damaged soffits. Fascia boards often split or detach in high winds."
      },
      {
        "category": "Window Flashing & Weather Barrier",
        "description": "Window replacement included but no flashing or weather barrier repair around openings.",
        "severity": "warning",
        "expected_for_damage_type": true,
        "estimated_cost_impact": "800-1500",
        "xactimate_codes": ["SID FLSH", "SID WRAP"],
        "justification": "Proper flashing and weather barrier critical for coastal properties. Wind-driven rain can compromise existing barriers."
      },
      {
        "category": "Attic Ventilation",
        "description": "No attic ventilation repair. Ridge vent included but no soffit vents or gable vents assessed.",
        "severity": "warning",
        "expected_for_damage_type": true,
        "estimated_cost_impact": "600-1200",
        "xactimate_codes": ["RFG VENT", "CRP VENT"],
        "justification": "Balanced attic ventilation essential in Florida climate. Inadequate ventilation causes premature roof failure and moisture issues."
      },
      {
        "category": "Electrical Service & Panel",
        "description": "No electrical service inspection despite water intrusion. Panel and circuits require inspection after flooding.",
        "severity": "warning",
        "expected_for_damage_type": true,
        "estimated_cost_impact": "500-2000",
        "xactimate_codes": ["ELC INSP", "ELC PANL"],
        "justification": "Water intrusion from roof and window damage may have affected electrical system. Safety inspection required."
      },
      {
        "category": "Insulation Replacement",
        "description": "Minimal insulation scope. Hurricane damage typically requires extensive attic insulation replacement due to wind and water.",
        "severity": "warning",
        "expected_for_damage_type": true,
        "estimated_cost_impact": "4500-7500",
        "xactimate_codes": ["INS BLOW", "INS BATT"],
        "justification": "Attic insulation often displaced by wind or saturated by rain intrusion. Entire attic may require re-insulation."
      },
      {
        "category": "Hurricane Straps & Reinforcement",
        "description": "No hurricane straps or structural reinforcement. Required for Florida coastal properties per current code.",
        "severity": "info",
        "expected_for_damage_type": true,
        "estimated_cost_impact": "2500-5000",
        "xactimate_codes": ["FRM STRA", "FRM BRAC"],
        "justification": "Florida Building Code requires hurricane straps on roof-to-wall connections. Opportunity to upgrade to current code during repair."
      },
      {
        "category": "Temporary Repairs & Board-Up",
        "description": "No emergency board-up or temporary weatherproofing documented. Standard immediate response for hurricane damage.",
        "severity": "info",
        "expected_for_damage_type": true,
        "estimated_cost_impact": "1500-3000",
        "xactimate_codes": ["MSC BDUP", "RFG TARP"],
        "justification": "Emergency mitigation to prevent further damage. Should be documented even if already performed."
      },
      {
        "category": "Permit & Engineering Fees",
        "description": "No building permit, engineering inspection, or permit fees included.",
        "severity": "warning",
        "expected_for_damage_type": true,
        "estimated_cost_impact": "2000-4000",
        "xactimate_codes": ["MSC PRMT", "MSC ENGI"],
        "justification": "Tampa requires permits for roof replacement and structural repairs. Engineering letter required for hurricane damage claims."
      }
    ],
    "quantity_issues": [
      {
        "line_item": "Synthetic underlayment (3800 SF)",
        "issue_type": "quantity_mismatch",
        "description": "Underlayment quantity matches roof area but no additional coverage for valleys, eaves, or waste factor (typically 10-15%).",
        "recommended_quantity": "4200-4400 SF",
        "cost_impact": "180-270"
      },
      {
        "line_item": "Replace window - vinyl double hung 3x5 (4 EA)",
        "issue_type": "quantity_mismatch",
        "description": "Only 6 windows included but property description mentions 8 windows affected by storm.",
        "recommended_quantity": "8 EA",
        "cost_impact": "970-1250"
      }
    ],
    "structural_gaps": [
      {
        "category": "Roof Deck",
        "gap_type": "missing_trade",
        "description": "No roof deck repair despite hurricane-force winds. Critical structural component.",
        "estimated_cost": "8500-15000",
        "xactimate_codes": ["RFG DECK", "FRM SHTH"]
      },
      {
        "category": "Soffit & Fascia",
        "gap_type": "missing_trade",
        "description": "No soffit or fascia repair. Essential for proper roof edge and ventilation.",
        "estimated_cost": "3200-5500",
        "xactimate_codes": ["CRP SOFF", "CRP FASC"]
      },
      {
        "category": "Structural Engineering",
        "gap_type": "missing_labor",
        "description": "No engineering inspection or certification. Required for hurricane damage in Florida.",
        "estimated_cost": "1500-3500",
        "xactimate_codes": ["MSC ENGI"]
      }
    ],
    "pricing_observations": [
      {
        "item": "Architectural shingles - installation",
        "observed_price": 3.85,
        "typical_range": "3.50-5.50",
        "note": "Mid-range pricing for architectural shingles in Tampa market post-Hurricane Milton. Pricing may increase due to high demand."
      },
      {
        "item": "Vinyl siding - standard",
        "observed_price": 4.25,
        "typical_range": "4.00-6.50",
        "note": "Competitive pricing for vinyl siding installation. Within expected range for Tampa market."
      },
      {
        "item": "Vinyl windows - double hung",
        "observed_price": 485.00,
        "typical_range": "450-750",
        "note": "Lower-mid range for vinyl replacement windows. May not include impact-resistant glazing required in coastal zones."
      }
    ],
    "compliance_notes": [
      {
        "standard": "Florida Building Code (FBC) 7th Edition",
        "requirement": "Impact-resistant windows in HVHZ",
        "status": "not_specified",
        "description": "Tampa is in High Velocity Hurricane Zone. Windows must be impact-resistant or have approved shutters. Estimate does not specify impact rating."
      },
      {
        "standard": "Florida Building Code",
        "requirement": "Hurricane straps and reinforcement",
        "status": "missing",
        "description": "Roof-to-wall connections must meet current FBC requirements. No structural reinforcement included in scope."
      },
      {
        "standard": "Florida Building Code",
        "requirement": "Structural engineering certification",
        "status": "missing",
        "description": "PE (Professional Engineer) inspection and certification required for hurricane damage claims in Florida."
      },
      {
        "standard": "FORTIFIED Home Standard",
        "requirement": "Sealed roof deck",
        "status": "not_addressed",
        "description": "FORTIFIED standard (recommended by insurers) requires sealed roof deck. Opportunity to upgrade for premium discount."
      },
      {
        "standard": "City of Tampa Building Department",
        "requirement": "Building permit for roof replacement",
        "status": "not_included",
        "description": "Permit required for roof replacement. Fees and inspection costs not included in estimate."
      }
    ],
    "summary": "This hurricane damage estimate covers major visible damage: complete roof replacement (3,800 SF), siding repair (850 SF), window replacement (6 units), garage door, water mitigation, and interior restoration. The estimate totals $248,750 and includes 12 trade categories with 156 line items. However, several critical items are missing: roof deck inspection and repair (essential for hurricane damage), structural engineering certification (required in Florida), soffit and fascia repair, impact-resistant window specification, hurricane straps/reinforcement, attic insulation replacement, and permit fees. The estimate also has quantity discrepancies (missing 2 windows, insufficient underlayment). Most critically, the estimate does not address Florida Building Code requirements for coastal construction including impact-resistant glazing and structural reinforcement. Total estimated missing scope: $25,000-$50,000, representing a 10-20% gap. Without these items, the repair may not meet code requirements or provide adequate hurricane protection for future storms.",
    "risk_level": "high",
    "total_missing_value_estimate": {
      "low": 25100,
      "high": 50420
    },
    "critical_action_items": [
      "Require structural engineering inspection and certification",
      "Inspect roof deck during tear-off - document and repair damage",
      "Verify windows meet impact-resistance requirements for HVHZ",
      "Include soffit and fascia repair in scope",
      "Add hurricane straps to meet current FBC requirements",
      "Assess attic insulation - likely needs full replacement",
      "Include building permit and inspection fees",
      "Consider FORTIFIED Home upgrades for insurance premium reduction"
    ],
    "metadata": {
      "processing_time_ms": 5234,
      "model_version": "gpt-4-turbo-preview",
      "timestamp": "2024-10-25T13:47:52.891Z",
      "analysis_depth": "comprehensive",
      "confidence_score": 95
    }
  }'::jsonb,
  false,
  NOW() - INTERVAL '2 days'
) ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- REPORT 6: Plumbing Leak - Residential - Minimal Scope Example
-- ============================================================================
INSERT INTO reports (
  id,
  user_id,
  team_id,
  estimate_name,
  estimate_type,
  damage_type,
  result_json,
  paid_single_use,
  created_at
) VALUES (
  '10000000-0000-0000-0000-000000000006',
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000010',
  'Anderson Condo - Supply Line Leak #PL-2024-4456',
  'residential',
  'water_damage',
  '{
    "classification": {
      "classification": "MANUAL",
      "confidence": 72,
      "platform": "Contractor quote - itemized",
      "metadata": {
        "detected_format": "Manual contractor quote",
        "line_item_count": 8,
        "trade_codes_found": ["PLM", "DRY"]
      }
    },
    "property_details": {
      "address": "Unit 304, 1200 Park Avenue, Seattle, WA 98101",
      "claim_number": "PL-2024-4456",
      "date_of_loss": "2024-01-28",
      "adjuster": "David Thompson",
      "total_estimate_value": 3250.00,
      "affected_areas": ["Kitchen sink area", "Under-sink cabinet"]
    },
    "detected_trades": [
      {
        "code": "PLM",
        "name": "Plumbing",
        "line_items": [
          {"description": "Replace supply line - braided stainless", "quantity": 1, "unit": "EA", "unit_price": 85.00, "total": 85.00},
          {"description": "Shutoff valve replacement", "quantity": 1, "unit": "EA", "unit_price": 125.00, "total": 125.00}
        ],
        "subtotal": 210.00
      },
      {
        "code": "DRY",
        "name": "Drying",
        "line_items": [
          {"description": "Drying equipment - 2 days", "quantity": 2, "unit": "DAY", "unit_price": 185.00, "total": 370.00}
        ],
        "subtotal": 370.00
      }
    ],
    "missing_items": [
      {
        "category": "Cabinet Replacement",
        "description": "Under-sink cabinet noted as affected but no cabinet removal or replacement included.",
        "severity": "error",
        "expected_for_damage_type": true,
        "estimated_cost_impact": "450-850",
        "xactimate_codes": ["CAB BASR", "CAB REPL"],
        "justification": "Water-damaged cabinets typically require replacement. Particleboard swells and delaminates when wet."
      },
      {
        "category": "Moisture Testing",
        "description": "No moisture testing or monitoring. Required to verify complete drying per IICRC S500.",
        "severity": "warning",
        "expected_for_damage_type": true,
        "estimated_cost_impact": "150-300",
        "xactimate_codes": ["DRY MSTR"],
        "justification": "Moisture meters required to document moisture levels before and after drying. Prevents mold growth."
      },
      {
        "category": "Antimicrobial Treatment",
        "description": "No antimicrobial treatment after water exposure. Standard practice for Category 2 water.",
        "severity": "warning",
        "expected_for_damage_type": true,
        "estimated_cost_impact": "100-200",
        "xactimate_codes": ["CLN ANTI"],
        "justification": "Supply line water is Category 2 (gray water) after contact with surfaces. Antimicrobial treatment prevents bacterial growth."
      },
      {
        "category": "Flooring Inspection",
        "description": "No flooring inspection or repair. Water typically spreads beyond immediate leak area.",
        "severity": "info",
        "expected_for_damage_type": true,
        "estimated_cost_impact": "500-1500",
        "xactimate_codes": ["FLR"],
        "justification": "Water migrates through flooring and subfloor. Inspection needed to determine extent of damage."
      },
      {
        "category": "Wall & Baseboard Damage",
        "description": "No wall or baseboard repair. Water wicks up walls from floor level.",
        "severity": "info",
        "expected_for_damage_type": true,
        "estimated_cost_impact": "400-800",
        "xactimate_codes": ["GYP", "CRP BASE"],
        "justification": "Water damage typically affects lower 12-24 inches of drywall and all baseboards in affected area."
      }
    ],
    "quantity_issues": [
      {
        "line_item": "Drying equipment - 2 days",
        "issue_type": "quantity_mismatch",
        "description": "2-day drying period may be insufficient. IICRC S500 typically requires 3-5 days for cabinet and wall drying.",
        "recommended_quantity": "3-5 days",
        "cost_impact": "185-555"
      }
    ],
    "structural_gaps": [
      {
        "category": "Cabinet Replacement",
        "gap_type": "missing_material",
        "description": "Water-damaged cabinet requires replacement but not included in scope.",
        "estimated_cost": "450-850",
        "xactimate_codes": ["CAB"]
      },
      {
        "category": "Flooring & Wall Repair",
        "gap_type": "incomplete_scope",
        "description": "No assessment of flooring or wall damage beyond immediate leak area.",
        "estimated_cost": "900-2300",
        "xactimate_codes": ["FLR", "GYP", "CRP"]
      }
    ],
    "pricing_observations": [
      {
        "item": "Supply line - braided stainless",
        "observed_price": 85.00,
        "typical_range": "65-150",
        "note": "Standard pricing for supply line replacement. Within normal range for Seattle market."
      },
      {
        "item": "Drying equipment - daily rate",
        "observed_price": 185.00,
        "typical_range": "150-300",
        "note": "Mid-range daily rate for drying equipment. Typical for small residential water loss."
      }
    ],
    "compliance_notes": [
      {
        "standard": "IICRC S500",
        "requirement": "Moisture documentation",
        "status": "missing",
        "description": "S500 requires moisture mapping and documentation. No moisture readings included in estimate."
      },
      {
        "standard": "Seattle Building Code",
        "requirement": "Plumbing permit for supply line work",
        "status": "not_included",
        "description": "Permit may be required for plumbing repairs. Should be verified with local jurisdiction."
      }
    ],
    "summary": "This is a minimal-scope estimate for a small plumbing leak totaling $3,250. The estimate covers only the immediate plumbing repair (supply line and shutoff valve) and 2 days of drying equipment. However, the estimate does not address the water-damaged cabinet, lacks moisture testing documentation, omits antimicrobial treatment, and does not assess flooring or wall damage. The drying duration appears insufficient per IICRC standards. For a complete restoration, additional scope is needed: cabinet replacement, moisture testing, antimicrobial treatment, and assessment of flooring/wall damage. Total estimated missing scope: $1,600-$3,700, which would more than double the current estimate. This minimal approach may leave hidden damage unaddressed, potentially leading to mold growth or future issues.",
    "risk_level": "medium",
    "total_missing_value_estimate": {
      "low": 1600,
      "high": 3705
    },
    "critical_action_items": [
      "Inspect and replace water-damaged cabinet",
      "Conduct moisture testing to verify complete drying",
      "Apply antimicrobial treatment to affected areas",
      "Inspect flooring for water damage and delamination",
      "Check walls and baseboards for water wicking",
      "Extend drying period to 3-5 days per IICRC standards"
    ],
    "metadata": {
      "processing_time_ms": 1847,
      "model_version": "gpt-4-turbo-preview",
      "timestamp": "2024-02-05T08:22:15.567Z",
      "analysis_depth": "comprehensive",
      "confidence_score": 88
    }
  }'::jsonb,
  false,
  NOW() - INTERVAL '1 day'
) ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- REPORT 7: Comprehensive Reconstruction - Residential - Well-Scoped Example
-- ============================================================================
INSERT INTO reports (
  id,
  user_id,
  team_id,
  estimate_name,
  estimate_type,
  damage_type,
  result_json,
  paid_single_use,
  created_at
) VALUES (
  '10000000-0000-0000-0000-000000000007',
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000010',
  'Williams Estate - Comprehensive Storm Restoration #SR-2024-2234',
  'residential',
  'storm_damage',
  '{
    "classification": {
      "classification": "XACTIMATE",
      "confidence": 99,
      "platform": "Xactimate 28.5",
      "metadata": {
        "detected_format": "Xactimate ESX Export - Detailed",
        "line_item_count": 287,
        "trade_codes_found": ["DEM", "DRY", "CLN", "FRM", "RFG", "SID", "WDW", "DOR", "GUT", "ELC", "PLM", "HVA", "INS", "GYP", "TIL", "CAB", "CTR", "FLR", "PNT", "CRP", "MSC"]
      }
    },
    "property_details": {
      "address": "4521 Heritage Lane, Charlotte, NC 28202",
      "claim_number": "SR-2024-2234",
      "date_of_loss": "2024-03-15",
      "adjuster": "Amanda Foster, AIC",
      "total_estimate_value": 387650.00,
      "building_type": "Single Family Residence - 2 Story Custom",
      "square_footage": 4800,
      "affected_areas": ["Entire property - multi-system damage"]
    },
    "detected_trades": [
      {
        "code": "RFG",
        "name": "Roofing",
        "line_items": [
          {"description": "Remove architectural shingles", "quantity": 4200, "unit": "SF", "unit_price": 0.95, "total": 3990.00},
          {"description": "Replace roof deck - 7/16 OSB", "quantity": 850, "unit": "SF", "unit_price": 3.85, "total": 3272.50},
          {"description": "Install architectural shingles - premium", "quantity": 4200, "unit": "SF", "unit_price": 4.25, "total": 17850.00},
          {"description": "Synthetic underlayment - high grade", "quantity": 4620, "unit": "SF", "unit_price": 0.55, "total": 2541.00},
          {"description": "Ice & water shield - valleys & eaves", "quantity": 420, "unit": "SF", "unit_price": 1.25, "total": 525.00},
          {"description": "Ridge vent - continuous", "quantity": 65, "unit": "LF", "unit_price": 9.50, "total": 617.50},
          {"description": "Drip edge - aluminum", "quantity": 380, "unit": "LF", "unit_price": 3.50, "total": 1330.00},
          {"description": "Pipe boot flashing", "quantity": 8, "unit": "EA", "unit_price": 45.00, "total": 360.00},
          {"description": "Chimney flashing - step & counter", "quantity": 1, "unit": "LS", "unit_price": 850.00, "total": 850.00}
        ],
        "subtotal": 31336.00
      },
      {
        "code": "FRM",
        "name": "Framing",
        "line_items": [
          {"description": "Roof truss repair - sister", "quantity": 6, "unit": "EA", "unit_price": 385.00, "total": 2310.00},
          {"description": "Wall stud replacement", "quantity": 12, "unit": "EA", "unit_price": 125.00, "total": 1500.00},
          {"description": "Header repair - engineered lumber", "quantity": 2, "unit": "EA", "unit_price": 485.00, "total": 970.00}
        ],
        "subtotal": 4780.00
      },
      {
        "code": "ELC",
        "name": "Electrical",
        "line_items": [
          {"description": "Electrical inspection", "quantity": 1, "unit": "EA", "unit_price": 285.00, "total": 285.00},
          {"description": "Replace receptacles", "quantity": 18, "unit": "EA", "unit_price": 45.00, "total": 810.00},
          {"description": "Replace switches", "quantity": 12, "unit": "EA", "unit_price": 38.00, "total": 456.00},
          {"description": "Replace light fixtures", "quantity": 8, "unit": "EA", "unit_price": 185.00, "total": 1480.00}
        ],
        "subtotal": 3031.00
      },
      {
        "code": "PLM",
        "name": "Plumbing",
        "line_items": [
          {"description": "Plumbing inspection", "quantity": 1, "unit": "EA", "unit_price": 225.00, "total": 225.00},
          {"description": "Replace supply lines - PEX", "quantity": 4, "unit": "EA", "unit_price": 125.00, "total": 500.00},
          {"description": "Pressure test system", "quantity": 1, "unit": "EA", "unit_price": 185.00, "total": 185.00}
        ],
        "subtotal": 910.00
      },
      {
        "code": "HVA",
        "name": "HVAC",
        "line_items": [
          {"description": "HVAC system inspection", "quantity": 1, "unit": "EA", "unit_price": 195.00, "total": 195.00},
          {"description": "Duct cleaning - whole house", "quantity": 4800, "unit": "SF", "unit_price": 0.45, "total": 2160.00},
          {"description": "Duct sealing - mastic", "quantity": 1, "unit": "LS", "unit_price": 850.00, "total": 850.00}
        ],
        "subtotal": 3205.00
      },
      {
        "code": "MSC",
        "name": "Miscellaneous",
        "line_items": [
          {"description": "Engineering inspection & report", "quantity": 1, "unit": "EA", "unit_price": 1250.00, "total": 1250.00},
          {"description": "Building permit", "quantity": 1, "unit": "EA", "unit_price": 850.00, "total": 850.00},
          {"description": "Dumpster - 30 yard", "quantity": 2, "unit": "EA", "unit_price": 485.00, "total": 970.00},
          {"description": "Temporary power", "quantity": 1, "unit": "LS", "unit_price": 450.00, "total": 450.00}
        ],
        "subtotal": 3520.00
      }
    ],
    "missing_items": [],
    "quantity_issues": [],
    "structural_gaps": [],
    "pricing_observations": [
      {
        "item": "Architectural shingles - premium",
        "observed_price": 4.25,
        "typical_range": "3.75-5.50",
        "note": "Mid-high range pricing for premium architectural shingles. Appropriate for custom home in Charlotte market."
      },
      {
        "item": "Roof deck replacement - OSB",
        "observed_price": 3.85,
        "typical_range": "3.50-5.00",
        "note": "Competitive pricing for roof deck replacement. Within expected range."
      },
      {
        "item": "Engineering inspection",
        "observed_price": 1250.00,
        "typical_range": "1000-2000",
        "note": "Standard fee for residential structural engineering inspection and report."
      }
    ],
    "compliance_notes": [
      {
        "standard": "IICRC S500",
        "requirement": "Moisture documentation and testing",
        "status": "included",
        "description": "Estimate includes moisture testing and monitoring. Complies with IICRC S500 standards."
      },
      {
        "standard": "North Carolina Building Code",
        "requirement": "Building permit and inspections",
        "status": "included",
        "description": "Building permit and engineering inspection included in estimate. Meets local code requirements."
      },
      {
        "standard": "NEC (National Electrical Code)",
        "requirement": "Electrical inspection after water damage",
        "status": "included",
        "description": "Licensed electrician inspection included. Meets NEC safety requirements."
      }
    ],
    "summary": "This is an exceptionally well-scoped estimate covering comprehensive storm restoration for a 4,800 SF custom home. The estimate totals $387,650 and includes 287 line items across 21 trade categories. Notable strengths: includes roof deck replacement (850 SF), structural engineering inspection, electrical and plumbing inspections, HVAC duct cleaning, building permit, and proper moisture testing. The estimate demonstrates industry best practices with appropriate quantities, comprehensive trade coverage, and compliance with IICRC and building code standards. No significant missing items identified. Pricing is competitive and appropriate for Charlotte market. This estimate represents a thorough, professional approach to storm restoration and should result in a complete, code-compliant repair. The adjuster has done an excellent job of scoping this project.",
    "risk_level": "low",
    "total_missing_value_estimate": {
      "low": 0,
      "high": 0
    },
    "critical_action_items": [
      "Proceed with scope as written",
      "Verify all permits obtained before work begins",
      "Ensure engineering inspection completed during framing phase",
      "Document moisture readings throughout drying process"
    ],
    "positive_findings": [
      "Comprehensive multi-trade scope covering all affected systems",
      "Roof deck replacement included (often missing in estimates)",
      "Structural engineering inspection included",
      "All required inspections included (electrical, plumbing, HVAC)",
      "Building permit and fees included",
      "Moisture testing and monitoring included",
      "HVAC duct cleaning included (often overlooked)",
      "Appropriate quantities with waste factors",
      "Competitive pricing for Charlotte market",
      "Meets IICRC and building code standards"
    ],
    "metadata": {
      "processing_time_ms": 6124,
      "model_version": "gpt-4-turbo-preview",
      "timestamp": "2024-03-22T14:15:44.123Z",
      "analysis_depth": "comprehensive",
      "confidence_score": 98
    }
  }'::jsonb,
  false,
  NOW() - INTERVAL '1 day'
) ON CONFLICT (id) DO NOTHING;

-- Add comments for documentation
COMMENT ON COLUMN reports.result_json IS 'Comprehensive AI analysis results including classification, detected trades, missing items, quantity issues, structural gaps, pricing observations, compliance notes, and metadata';

-- Create view for easy report querying
CREATE OR REPLACE VIEW report_summary AS
SELECT 
  r.id,
  r.estimate_name,
  r.estimate_type,
  r.damage_type,
  r.created_at,
  u.email as user_email,
  t.name as team_name,
  (r.result_json->>'classification')::jsonb->>'classification' as classification_type,
  (r.result_json->>'classification')::jsonb->>'confidence' as confidence,
  (r.result_json->>'property_details')::jsonb->>'total_estimate_value' as estimate_value,
  (r.result_json->>'risk_level')::text as risk_level,
  (r.result_json->>'total_missing_value_estimate')::jsonb->>'low' as missing_value_low,
  (r.result_json->>'total_missing_value_estimate')::jsonb->>'high' as missing_value_high,
  jsonb_array_length((r.result_json->>'detected_trades')::jsonb) as trade_count,
  jsonb_array_length((r.result_json->>'missing_items')::jsonb) as missing_item_count,
  jsonb_array_length((r.result_json->>'quantity_issues')::jsonb) as quantity_issue_count
FROM reports r
LEFT JOIN users u ON r.user_id = u.id
LEFT JOIN teams t ON r.team_id = t.id;

-- Grant permissions
GRANT SELECT ON report_summary TO authenticated;
