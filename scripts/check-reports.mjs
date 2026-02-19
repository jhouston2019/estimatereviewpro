/**
 * Check if example reports exist
 * Run with: node scripts/check-reports.mjs
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://kptombohsrxxmaalnwmv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtwdG9tYm9oc3J4eG1hYWxud212Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTQ3NzY2MywiZXhwIjoyMDgxMDUzNjYzfQ.ZGtTAFXyI61nGh4yfbO6vSFk6WpCo8oJTRhjLSYLK68';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkReports() {
  console.log('🔍 Checking for example reports...\n');

  try {
    const { data: reports, error } = await supabase
      .from('reports')
      .select('id, estimate_name, created_at')
      .in('id', [
        '10000000-0000-0000-0000-000000000001',
        '10000000-0000-0000-0000-000000000002',
        '10000000-0000-0000-0000-000000000003',
        '10000000-0000-0000-0000-000000000004',
        '10000000-0000-0000-0000-000000000005',
        '10000000-0000-0000-0000-000000000006',
        '10000000-0000-0000-0000-000000000007',
      ]);

    if (error) {
      console.error('❌ Error:', error.message);
      console.log('\n💡 This usually means:');
      console.log('   1. The reports table doesn\'t exist yet');
      console.log('   2. Run migration: 20260210_pricing_schema.sql first\n');
      return;
    }

    if (!reports || reports.length === 0) {
      console.log('❌ No example reports found\n');
      console.log('📋 To fix this:');
      console.log('   1. Go to: https://supabase.com/dashboard');
      console.log('   2. Select your project');
      console.log('   3. Open SQL Editor');
      console.log('   4. Copy contents of: supabase/migrations/01_seed_example_reports.sql');
      console.log('   5. Paste and Run\n');
      console.log('   Or see: QUICK_FIX.md for detailed instructions\n');
      return;
    }

    console.log(`✅ Found ${reports.length} example reports:\n`);
    reports.forEach((report, idx) => {
      console.log(`   ${idx + 1}. ${report.estimate_name}`);
      console.log(`      ID: ${report.id}`);
      console.log(`      Created: ${new Date(report.created_at).toLocaleDateString()}\n`);
    });

    console.log('🎉 All example reports are loaded!');
    console.log('   Visit: http://localhost:3000/examples\n');

  } catch (err) {
    console.error('❌ Unexpected error:', err.message);
  }
}

checkReports();
