/**
 * Database Seeding Script using Direct Postgres Connection
 * Run with: node scripts/seed-database.mjs
 */

import pkg from 'pg';
const { Client } = pkg;
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Supabase connection details
const connectionString = 'postgresql://postgres.kptombohsrxxmaalnwmv:Axis2025!@aws-0-us-east-1.pooler.supabase.com:6543/postgres';

async function runMigration(client, filename) {
  console.log(`\n📄 Running: ${filename}`);
  const sqlPath = join(__dirname, '..', 'supabase', 'migrations', filename);
  const sql = readFileSync(sqlPath, 'utf8');
  
  try {
    await client.query(sql);
    console.log(`   ✅ Success`);
    return true;
  } catch (err) {
    if (err.message.includes('already exists') || err.message.includes('duplicate')) {
      console.log(`   ℹ️  Already exists (skipping)`);
      return true;
    }
    console.error(`   ❌ Error: ${err.message}`);
    return false;
  }
}

async function main() {
  console.log('🚀 Starting database setup...\n');
  console.log('Connecting to Supabase Postgres...');
  
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('✅ Connected!\n');

    // Run migrations in order
    await runMigration(client, '00_create_users_table.sql');
    await runMigration(client, '20260210_pricing_schema.sql');
    await runMigration(client, '01_seed_example_reports.sql');

    // Verify
    console.log('\n🔍 Verifying example reports...');
    const result = await client.query(`
      SELECT id, estimate_name 
      FROM reports 
      WHERE id IN (
        '10000000-0000-0000-0000-000000000001',
        '10000000-0000-0000-0000-000000000002',
        '10000000-0000-0000-0000-000000000003',
        '10000000-0000-0000-0000-000000000004',
        '10000000-0000-0000-0000-000000000005',
        '10000000-0000-0000-0000-000000000006',
        '10000000-0000-0000-0000-000000000007'
      )
      ORDER BY created_at
    `);

    console.log(`\n✅ Found ${result.rows.length} example reports:`);
    result.rows.forEach((row, i) => {
      console.log(`   ${i + 1}. ${row.estimate_name}`);
    });

    console.log('\n🎉 Database setup complete!');
    console.log('   Visit: http://localhost:3000/examples\n');

  } catch (err) {
    console.error('\n❌ Fatal error:', err.message);
    console.error('\nConnection string format should be:');
    console.error('postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres');
    console.error('\nGet your connection string from:');
    console.error('https://supabase.com/dashboard/project/kptombohsrxxmaalnwmv/settings/database');
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
