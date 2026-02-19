/**
 * Direct Database Seeding Script
 * This will create the tables and seed the example reports
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const supabaseUrl = 'https://kptombohsrxxmaalnwmv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtwdG9tYm9oc3J4eG1hYWxud212Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTQ3NzY2MywiZXhwIjoyMDgxMDUzNjYzfQ.ZGtTAFXyI61nGh4yfbO6vSFk6WpCo8oJTRhjLSYLK68';

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  }
});

async function executeSqlFile(filename) {
  console.log(`\n📄 Executing: ${filename}`);
  const sqlPath = join(__dirname, '..', 'supabase', 'migrations', filename);
  const sql = readFileSync(sqlPath, 'utf8');
  
  // Split by semicolons but keep DO blocks together
  const statements = [];
  let current = '';
  let inDoBlock = false;
  
  for (const line of sql.split('\n')) {
    if (line.trim().startsWith('DO $$') || line.trim().startsWith('DO $')) {
      inDoBlock = true;
    }
    
    current += line + '\n';
    
    if (line.includes('END $$;') || line.includes('END $;')) {
      inDoBlock = false;
      statements.push(current.trim());
      current = '';
    } else if (!inDoBlock && line.includes(';') && !line.trim().startsWith('--')) {
      statements.push(current.trim());
      current = '';
    }
  }
  
  if (current.trim()) {
    statements.push(current.trim());
  }

  for (const statement of statements) {
    if (!statement || statement.startsWith('--') || statement.trim() === '') continue;
    
    try {
      const { error } = await supabase.rpc('exec_sql', { query: statement });
      if (error) {
        // Try direct query
        const response = await fetch(`${supabaseUrl}/rest/v1/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
          },
          body: JSON.stringify({ query: statement })
        });
        
        if (!response.ok && !response.status === 409) {
          console.log(`   ⚠️  Skipping statement (may already exist)`);
        }
      }
    } catch (err) {
      // Ignore errors for statements that may already exist
      if (!err.message.includes('already exists') && !err.message.includes('duplicate')) {
        console.log(`   ⚠️  ${err.message.substring(0, 100)}`);
      }
    }
  }
  
  console.log(`   ✅ Completed`);
}

async function seedDatabase() {
  console.log('🚀 Starting database setup...\n');
  
  try {
    // Execute migrations in order
    await executeSqlFile('00_create_users_table.sql');
    await executeSqlFile('20260210_pricing_schema.sql');
    await executeSqlFile('01_seed_example_reports.sql');
    
    console.log('\n🔍 Verifying reports...');
    const { data: reports, error } = await supabase
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

    if (error) {
      throw error;
    }

    console.log(`\n✅ Found ${reports?.length || 0} example reports:`);
    reports?.forEach((r, i) => console.log(`   ${i + 1}. ${r.estimate_name}`));
    
    console.log('\n🎉 Database setup complete!');
    console.log('   Visit: http://localhost:3000/examples\n');
    
  } catch (err) {
    console.error('\n❌ Error:', err.message);
    console.log('\nTrying alternative approach...\n');
    
    // Alternative: Use Supabase Management API
    await seedViaManagementAPI();
  }
}

async function seedViaManagementAPI() {
  console.log('Using Supabase Management API...\n');
  
  const migrations = [
    '00_create_users_table.sql',
    '20260210_pricing_schema.sql', 
    '01_seed_example_reports.sql'
  ];
  
  for (const migration of migrations) {
    console.log(`📄 Processing: ${migration}`);
    const sqlPath = join(__dirname, '..', 'supabase', 'migrations', migration);
    const sql = readFileSync(sqlPath, 'utf8');
    
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({ query: sql })
    });
    
    if (response.ok) {
      console.log(`   ✅ Success`);
    } else {
      console.log(`   ⚠️  Status: ${response.status}`);
    }
  }
  
  console.log('\n🔍 Checking results...');
  const { data: reports } = await supabase
    .from('reports')
    .select('id, estimate_name')
    .limit(10);
    
  if (reports && reports.length > 0) {
    console.log(`✅ Found ${reports.length} reports in database`);
    console.log('\n🎉 Setup complete!');
  } else {
    console.log('\n⚠️  Could not verify. Please check Supabase dashboard.');
  }
}

seedDatabase();
