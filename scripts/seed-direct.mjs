/**
 * Direct Data Insertion via Supabase REST API
 * This bypasses SQL execution and inserts data directly
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://kptombohsrxxmaalnwmv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtwdG9tYm9oc3J4eG1hYWxud212Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTQ3NzY2MywiZXhwIjoyMDgxMDUzNjYzfQ.ZGtTAFXyI61nGh4yfbO6vSFk6WpCo8oJTRhjLSYLK68';

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false }
});

// Example report data
const exampleReports = [
  {
    id: '10000000-0000-0000-0000-000000000001',
    user_id: '00000000-0000-0000-0000-000000000001',
    team_id: '00000000-0000-0000-0000-000000000010',
    estimate_name: 'Johnson Residence - Water Damage Claim #WD-2024-8847',
    estimate_type: 'residential',
    damage_type: 'water_damage',
    paid_single_use: false,
    result_json: {
      classification: {
        classification: 'XACTIMATE',
        confidence: 95,
        metadata: {
          detected_format: 'Xactimate XML Export',
          line_item_count: 127,
          trade_codes_found: ['DEM', 'DRY', 'PLU', 'INS', 'PAI', 'FLO']
        }
      },
      property_details: {
        address: '1247 Maple Street, Springfield, IL 62704',
        claim_number: 'WD-2024-8847',
        date_of_loss: '2024-08-15',
        adjuster: 'Sarah Mitchell',
        total_estimate_value: 142350
      },
      detected_trades: [
        {
          code: 'DEM',
          name: 'Demolition',
          subtotal: 8420,
          line_items: [
            { description: 'Remove wet drywall', quantity: 450, unit: 'SF' },
            { description: 'Remove wet insulation', quantity: 450, unit: 'SF' }
          ]
        },
        {
          code: 'DRY',
          name: 'Drying',
          subtotal: 12500,
          line_items: [
            { description: 'Dehumidification - 3 days', quantity: 3, unit: 'DAY' },
            { description: 'Air movers', quantity: 8, unit: 'EA' }
          ]
        }
      ],
      missing_items: [
        {
          category: 'Water Mitigation',
          description: 'Antimicrobial treatment not included after water extraction',
          severity: 'error',
          estimated_cost_impact: 1250,
          xactimate_codes: ['CLN ANT'],
          justification: 'IICRC S500 Standard requires antimicrobial application in Category 2 water damage'
        },
        {
          category: 'Structural Drying',
          description: 'Moisture monitoring and documentation missing',
          severity: 'warning',
          estimated_cost_impact: 850,
          xactimate_codes: ['DRY MON'],
          justification: 'Daily moisture readings required to document proper drying per IICRC S500'
        }
      ],
      quantity_issues: [],
      structural_gaps: [],
      pricing_observations: [],
      compliance_notes: [
        {
          standard: 'IICRC S500',
          requirement: 'Antimicrobial Treatment',
          description: 'Category 2 water requires antimicrobial application',
          status: 'missing'
        }
      ],
      summary: 'This residential water damage estimate shows a moderate scope with several critical gaps. The estimate properly includes demolition and drying equipment but is missing antimicrobial treatment and moisture monitoring documentation required by IICRC S500 standards.',
      risk_level: 'medium',
      total_missing_value_estimate: {
        low: 18500,
        high: 32000
      },
      critical_action_items: [
        'Add antimicrobial treatment per IICRC S500',
        'Include moisture monitoring documentation',
        'Verify all affected areas are included in scope'
      ],
      metadata: {
        processing_time_ms: 2847,
        model_version: 'claude-3-5-sonnet-20241022',
        confidence_score: 92,
        analysis_depth: 'comprehensive'
      }
    }
  }
];

async function seedData() {
  console.log('🚀 Seeding example reports directly...\n');

  try {
    // First, create demo user
    console.log('👤 Creating demo user...');
    const { error: userError } = await supabase
      .from('users')
      .upsert({
        id: '00000000-0000-0000-0000-000000000001',
        email: 'demo@estimatereviewpro.com',
        plan_type: 'professional',
        team_id: '00000000-0000-0000-0000-000000000010',
        role: 'owner'
      }, { onConflict: 'id' });

    if (userError && !userError.message.includes('already exists')) {
      console.log(`   ⚠️  User: ${userError.message}`);
    } else {
      console.log('   ✅ Demo user ready');
    }

    // Create demo team
    console.log('🏢 Creating demo team...');
    const { error: teamError } = await supabase
      .from('teams')
      .upsert({
        id: '00000000-0000-0000-0000-000000000010',
        name: 'Demo Construction & Restoration',
        owner_id: '00000000-0000-0000-0000-000000000001',
        plan_type: 'professional',
        review_limit: 50,
        overage_price: 10
      }, { onConflict: 'id' });

    if (teamError && !teamError.message.includes('already exists')) {
      console.log(`   ⚠️  Team: ${teamError.message}`);
    } else {
      console.log('   ✅ Demo team ready');
    }

    // Insert example reports
    console.log('\n📊 Inserting example reports...');
    for (const report of exampleReports) {
      const { error } = await supabase
        .from('reports')
        .upsert(report, { onConflict: 'id' });

      if (error) {
        console.log(`   ❌ ${report.estimate_name}: ${error.message}`);
      } else {
        console.log(`   ✅ ${report.estimate_name}`);
      }
    }

    // Verify
    console.log('\n🔍 Verifying...');
    const { data: reports, error: fetchError } = await supabase
      .from('reports')
      .select('id, estimate_name')
      .eq('id', '10000000-0000-0000-0000-000000000001');

    if (fetchError) {
      console.error(`   ❌ ${fetchError.message}`);
      console.log('\n⚠️  The tables may not exist yet.');
      console.log('   You need to run the migrations in Supabase Dashboard first:');
      console.log('   1. Go to: https://supabase.com/dashboard/project/kptombohsrxxmaalnwmv');
      console.log('   2. Click SQL Editor');
      console.log('   3. Run: supabase/migrations/00_create_users_table.sql');
      console.log('   4. Run: supabase/migrations/20260210_pricing_schema.sql');
      console.log('   5. Then run this script again\n');
      return;
    }

    if (reports && reports.length > 0) {
      console.log(`   ✅ Successfully seeded ${reports.length} report(s)`);
      console.log('\n🎉 Done! Visit: http://localhost:3000/examples\n');
    } else {
      console.log('   ⚠️  No reports found after insertion');
    }

  } catch (err) {
    console.error('\n❌ Error:', err.message);
  }
}

seedData();
