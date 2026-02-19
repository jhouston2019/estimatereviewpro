/**
 * Seed Example Reports Script
 * Run with: node scripts/seed-examples.mjs
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read environment variables from .env.local
const envPath = join(__dirname, '..', '.env.local');
const envContent = readFileSync(envPath, 'utf8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    envVars[match[1].trim()] = match[2].trim().replace(/^["']|["']$/g, '');
  }
});

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = envVars.SUPABASE_SERVICE_ROLE_KEY;

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
    const sqlPath = join(__dirname, '..', 'supabase', 'migrations', '01_seed_example_reports.sql');
    const sqlContent = readFileSync(sqlPath, 'utf8');

    console.log('📄 Read migration file: 01_seed_example_reports.sql');
    console.log(`   File size: ${(sqlContent.length / 1024).toFixed(2)} KB\n`);

    console.log('⚙️  Executing SQL via Supabase REST API...');
    
    // Use fetch to execute SQL directly
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({ query: sqlContent })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.log(`   ⚠️  Direct SQL execution not available (${response.status})`);
      console.log('   This is normal - we\'ll use the manual method instead.\n');
      
      console.log('📋 Please run the SQL manually:');
      console.log('   1. Go to: https://supabase.com/dashboard');
      console.log('   2. Select your project');
      console.log('   3. Click "SQL Editor" → "New query"');
      console.log('   4. Copy contents of: supabase/migrations/01_seed_example_reports.sql');
      console.log('   5. Paste and click "Run"\n');
      
      // Still try to verify if reports already exist
      console.log('🔍 Checking if reports already exist...');
      const { data: existingReports } = await supabase
        .from('reports')
        .select('id, estimate_name')
        .in('id', [
          '10000000-0000-0000-0000-000000000001',
          '10000000-0000-0000-0000-000000000002',
          '10000000-0000-0000-0000-000000000003',
          '10000000-0000-0000-0000-000000000004',
          '10000000-0000-0000-0000-000000000005',
          '10000000-0000-0000-0000-000000000006',
          '10000000-0000-0000-0000-000000000007',
        ]);

      if (existingReports && existingReports.length > 0) {
        console.log(`✅ Found ${existingReports.length} existing example reports!`);
        console.log('   The data is already seeded.\n');
        existingReports.forEach((report, idx) => {
          console.log(`   ${idx + 1}. ${report.estimate_name}`);
        });
        console.log('\n   Visit: /examples to view them');
        return;
      }

      console.log('   No existing reports found. Please run the SQL manually as shown above.\n');
      return;
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
      return;
    }

    console.log(`✅ Found ${reports?.length || 0} example reports:\n`);
    reports?.forEach((report, idx) => {
      console.log(`   ${idx + 1}. ${report.estimate_name}`);
    });

    console.log('\n🎉 Seeding complete!');
    console.log('   Visit: /examples to view the reports\n');

  } catch (err) {
    console.error('❌ Unexpected error:', err.message);
    console.log('\n📋 Manual steps:');
    console.log('   1. Go to: https://supabase.com/dashboard');
    console.log('   2. Select your project');
    console.log('   3. Go to SQL Editor');
    console.log('   4. Copy contents of: supabase/migrations/01_seed_example_reports.sql');
    console.log('   5. Paste and click "Run"\n');
  }
}

seedExamples();
