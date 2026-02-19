import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { readFileSync } from 'fs';
import { join } from 'path';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(request: Request) {
  try {
    const { action } = await request.json();
    
    if (action !== 'seed') {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Read SQL files
    const migrationsPath = join(process.cwd(), 'supabase', 'migrations');
    const migrations = [
      '00_create_users_table.sql',
      '20260210_pricing_schema.sql',
      '01_seed_example_reports.sql'
    ];

    const results = [];

    for (const migration of migrations) {
      const sqlPath = join(migrationsPath, migration);
      const sql = readFileSync(sqlPath, 'utf8');

      // Execute via raw SQL
      try {
        const { data, error } = await supabase.rpc('exec_sql', { query: sql });
        
        if (error) {
          results.push({ migration, status: 'error', message: error.message });
        } else {
          results.push({ migration, status: 'success' });
        }
      } catch (err: any) {
        results.push({ migration, status: 'error', message: err.message });
      }
    }

    // Verify reports were created
    const { data: reports, error: fetchError } = await supabase
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

    return NextResponse.json({
      success: !fetchError,
      migrations: results,
      reports: reports?.length || 0,
      message: fetchError 
        ? 'Tables may not exist. Run migrations in Supabase Dashboard.'
        : `Successfully seeded ${reports?.length || 0} example reports`
    });

  } catch (err: any) {
    return NextResponse.json({ 
      error: err.message,
      hint: 'Run migrations manually in Supabase Dashboard SQL Editor'
    }, { status: 500 });
  }
}

export async function GET() {
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  const { data: reports, error } = await supabase
    .from('reports')
    .select('id, estimate_name')
    .limit(10);

  if (error) {
    return NextResponse.json({
      status: 'not_ready',
      error: error.message,
      message: 'Database tables do not exist. Please run migrations.'
    });
  }

  return NextResponse.json({
    status: 'ready',
    reports_count: reports?.length || 0,
    reports: reports
  });
}
