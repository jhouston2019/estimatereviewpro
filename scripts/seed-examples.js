/**
 * Seed Example Reports Script
 * Run with: node scripts/seed-examples.js
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  console.error('   Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seedExamples() {
  console.log('🌱 Starting to seed example reports...\n');

  try {
    // Read the SQL file
    const sqlPath = path.join(__dirname, '..', 'supabase', 'migrations', '01_seed_example_reports.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');

    console.log('📄 Read migration file: 01_seed_example_reports.sql');
    console.log(`   File size: ${(sqlContent.length / 1024).toFixed(2)} KB\n`);

    // Execute the SQL
    console.log('⚙️  Executing SQL migration...');
    const { data, error } = await supabase.rpc('exec_sql', { sql: sqlContent }).catch(async () => {
      // If RPC doesn't exist, try direct SQL execution
      console.log('   RPC method not available, trying alternative approach...');
      
      // Alternative: Use Supabase REST API directly
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`
        },
        body: JSON.stringify({ sql: sqlContent })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${await response.text()}`);
      }

      return { data: await response.json(), error: null };
    });

    if (error) {
      console.error('❌ Error executing SQL:', error);
      console.log('\n📋 Manual steps:');
      console.log('   1. Go to your Supabase Dashboard: https://supabase.com/dashboard');
      console.log('   2. Select your project');
      console.log('   3. Go to SQL Editor');
      console.log('   4. Copy and paste the contents of: supabase/migrations/01_seed_example_reports.sql');
      console.log('   5. Click "Run"\n');
      process.exit(1);
    }

    console.log('✅ SQL executed successfully!\n');

    // Verify the reports were created
    console.log('🔍 Verifying seeded reports...');
    const { data: reports, error: fetchError } = await supabase
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

    if (fetchError) {
      console.error('❌ Error fetching reports:', fetchError);
      process.exit(1);
    }

    console.log(`✅ Found ${reports?.length || 0} example reports:\n`);
    reports?.forEach((report, idx) => {
      console.log(`   ${idx + 1}. ${report.estimate_name}`);
    });

    console.log('\n🎉 Seeding complete!');
    console.log('   Visit: http://localhost:3000/examples to view the reports\n');

  } catch (err) {
    console.error('❌ Unexpected error:', err.message);
    console.log('\n📋 Manual steps:');
    console.log('   1. Go to your Supabase Dashboard: https://supabase.com/dashboard');
    console.log('   2. Select your project');
    console.log('   3. Go to SQL Editor');
    console.log('   4. Copy and paste the contents of: supabase/migrations/01_seed_example_reports.sql');
    console.log('   5. Click "Run"\n');
    process.exit(1);
  }
}

seedExamples();
