import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://kptombohsrxxmaalnwmv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtwdG9tYm9oc3J4eG1hYWxud212Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTQ3NzY2MywiZXhwIjoyMDgxMDUzNjYzfQ.ZGtTAFXyI61nGh4yfbO6vSFk6WpCo8oJTRhjLSYLK68';

const supabase = createClient(supabaseUrl, supabaseKey);

const reports = [
  {
    id: '10000000-0000-0000-0000-000000000002',
    estimate_name: 'Commercial Building - Fire Damage Claim #FD-2024-3312',
    estimate_type: 'commercial',
    damage_type: 'fire_damage',
    result_json: {
      classification: { classification: 'XACTIMATE', confidence: 93, metadata: { line_item_count: 89 } },
      property_details: { address: '456 Business Blvd, Chicago, IL', claim_number: 'FD-2024-3312', total_estimate_value: 187500 },
      detected_trades: [{ code: 'DEM', name: 'Demolition', subtotal: 15000, line_items: [] }],
      missing_items: [
        { category: 'Fire Restoration', description: 'Smoke seal primer missing', severity: 'error', estimated_cost_impact: 8500, xactimate_codes: ['PNT SSP'] }
      ],
      quantity_issues: [],
      structural_gaps: [],
      pricing_observations: [],
      compliance_notes: [],
      summary: 'Commercial fire damage estimate with moderate gaps in smoke restoration scope.',
      risk_level: 'medium',
      total_missing_value_estimate: { low: 22000, high: 38000 },
      critical_action_items: ['Add smoke seal primer', 'Include HVAC cleaning'],
      metadata: { processing_time_ms: 3200, model_version: 'claude-3-5-sonnet', confidence_score: 93 }
    }
  },
  {
    id: '10000000-0000-0000-0000-000000000003',
    estimate_name: 'Martinez Home - Storm Damage Claim #SD-2024-7821',
    estimate_type: 'residential',
    damage_type: 'storm_damage',
    result_json: {
      classification: { classification: 'XACTIMATE', confidence: 91, metadata: { line_item_count: 52 } },
      property_details: { address: '789 Pine Ave, Houston, TX', claim_number: 'SD-2024-7821', total_estimate_value: 98000 },
      detected_trades: [{ code: 'RFG', name: 'Roofing', subtotal: 42000, line_items: [] }],
      missing_items: [
        { category: 'Roofing', description: 'Ice and water shield missing', severity: 'warning', estimated_cost_impact: 3500, xactimate_codes: ['RFG IWS'] }
      ],
      quantity_issues: [],
      structural_gaps: [],
      pricing_observations: [],
      compliance_notes: [],
      summary: 'Storm damage with roof replacement. Minor gaps in underlayment specifications.',
      risk_level: 'low',
      total_missing_value_estimate: { low: 8000, high: 15000 },
      critical_action_items: ['Add ice and water shield', 'Verify flashing details'],
      metadata: { processing_time_ms: 2800, model_version: 'claude-3-5-sonnet', confidence_score: 91 }
    }
  },
  {
    id: '10000000-0000-0000-0000-000000000004',
    estimate_name: 'Coastal Property - Hurricane Damage #HD-2024-9156',
    estimate_type: 'residential',
    damage_type: 'hurricane_damage',
    result_json: {
      classification: { classification: 'XACTIMATE', confidence: 96, metadata: { line_item_count: 134 } },
      property_details: { address: '321 Ocean Dr, Miami, FL', claim_number: 'HD-2024-9156', total_estimate_value: 215000 },
      detected_trades: [{ code: 'RFG', name: 'Roofing', subtotal: 68000, line_items: [] }],
      missing_items: [
        { category: 'Wind Mitigation', description: 'Hurricane straps not included', severity: 'error', estimated_cost_impact: 12000, xactimate_codes: ['FRM HS'] }
      ],
      quantity_issues: [],
      structural_gaps: [],
      pricing_observations: [],
      compliance_notes: [],
      summary: 'Major hurricane damage with significant structural repairs needed.',
      risk_level: 'high',
      total_missing_value_estimate: { low: 15000, high: 28000 },
      critical_action_items: ['Add hurricane straps', 'Include impact-rated windows'],
      metadata: { processing_time_ms: 4100, model_version: 'claude-3-5-sonnet', confidence_score: 96 }
    }
  },
  {
    id: '10000000-0000-0000-0000-000000000005',
    estimate_name: 'Office Complex - Mold Remediation #MR-2024-4483',
    estimate_type: 'commercial',
    damage_type: 'mold_damage',
    result_json: {
      classification: { classification: 'MANUAL', confidence: 88, metadata: { line_item_count: 67 } },
      property_details: { address: '555 Corporate Way, Atlanta, GA', claim_number: 'MR-2024-4483', total_estimate_value: 125000 },
      detected_trades: [{ code: 'CLN', name: 'Cleaning', subtotal: 28000, line_items: [] }],
      missing_items: [
        { category: 'Mold Remediation', description: 'Post-remediation testing missing', severity: 'error', estimated_cost_impact: 4500, xactimate_codes: ['CLN TST'] }
      ],
      quantity_issues: [],
      structural_gaps: [],
      pricing_observations: [],
      compliance_notes: [],
      summary: 'Commercial mold remediation with gaps in testing and documentation.',
      risk_level: 'medium',
      total_missing_value_estimate: { low: 12000, high: 24000 },
      critical_action_items: ['Add post-remediation testing', 'Include clearance documentation'],
      metadata: { processing_time_ms: 3500, model_version: 'claude-3-5-sonnet', confidence_score: 88 }
    }
  },
  {
    id: '10000000-0000-0000-0000-000000000006',
    estimate_name: 'Suburban Home - Hail & Wind Damage #HW-2024-6634',
    estimate_type: 'residential',
    damage_type: 'hail_wind_damage',
    result_json: {
      classification: { classification: 'XACTIMATE', confidence: 94, metadata: { line_item_count: 41 } },
      property_details: { address: '987 Maple St, Dallas, TX', claim_number: 'HW-2024-6634', total_estimate_value: 87000 },
      detected_trades: [{ code: 'RFG', name: 'Roofing', subtotal: 38000, line_items: [] }],
      missing_items: [
        { category: 'Exterior', description: 'Gutter replacement missing', severity: 'warning', estimated_cost_impact: 2800, xactimate_codes: ['EXT GTR'] }
      ],
      quantity_issues: [],
      structural_gaps: [],
      pricing_observations: [],
      compliance_notes: [],
      summary: 'Hail and wind damage with roof replacement. Minor exterior gaps.',
      risk_level: 'low',
      total_missing_value_estimate: { low: 5000, high: 12000 },
      critical_action_items: ['Add gutter replacement', 'Verify siding damage'],
      metadata: { processing_time_ms: 2600, model_version: 'claude-3-5-sonnet', confidence_score: 94 }
    }
  },
  {
    id: '10000000-0000-0000-0000-000000000007',
    estimate_name: 'Warehouse - Flood Damage Claim #FL-2024-2219',
    estimate_type: 'commercial',
    damage_type: 'flood_damage',
    result_json: {
      classification: { classification: 'XACTIMATE', confidence: 90, metadata: { line_item_count: 78 } },
      property_details: { address: '123 Industrial Pkwy, New Orleans, LA', claim_number: 'FL-2024-2219', total_estimate_value: 108000 },
      detected_trades: [{ code: 'DEM', name: 'Demolition', subtotal: 22000, line_items: [] }],
      missing_items: [
        { category: 'Flood Restoration', description: 'Antimicrobial treatment missing', severity: 'error', estimated_cost_impact: 3200, xactimate_codes: ['CLN ANT'] }
      ],
      quantity_issues: [],
      structural_gaps: [],
      pricing_observations: [],
      compliance_notes: [],
      summary: 'Commercial flood damage with gaps in antimicrobial treatment.',
      risk_level: 'medium',
      total_missing_value_estimate: { low: 6000, high: 11000 },
      critical_action_items: ['Add antimicrobial treatment', 'Include moisture monitoring'],
      metadata: { processing_time_ms: 3100, model_version: 'claude-3-5-sonnet', confidence_score: 90 }
    }
  }
];

async function seedAllReports() {
  console.log('🌱 Seeding all 6 remaining reports...\n');

  for (const report of reports) {
    const fullReport = {
      ...report,
      user_id: '00000000-0000-0000-0000-000000000001',
      team_id: '00000000-0000-0000-0000-000000000010',
      paid_single_use: false
    };

    const { error } = await supabase
      .from('reports')
      .upsert(fullReport, { onConflict: 'id' });

    if (error) {
      console.log(`   ❌ ${report.estimate_name}: ${error.message}`);
    } else {
      console.log(`   ✅ ${report.estimate_name}`);
    }
  }

  console.log('\n🎉 Done! All 7 reports should now be visible at /examples\n');
}

seedAllReports();
