'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function SeedPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSeed() {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/seed-database', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'seed' })
      });

      const data = await response.json();
      
      if (response.ok) {
        setResult(data);
      } else {
        setError(data.error || 'Failed to seed database');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function checkStatus() {
    setLoading(true);
    try {
      const response = await fetch('/api/seed-database');
      const data = await response.json();
      setResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-950 p-8">
      <div className="mx-auto w-full max-w-2xl">
        <Link href="/" className="text-sm text-blue-400 hover:text-blue-300">
          ← Back to Home
        </Link>

        <div className="mt-8 rounded-2xl border border-slate-800 bg-slate-900/50 p-8">
          <h1 className="text-2xl font-bold text-slate-50">Database Seeding</h1>
          <p className="mt-2 text-sm text-slate-400">
            Seed the database with example reports and required data.
          </p>

          <div className="mt-8 flex gap-4">
            <button
              onClick={handleSeed}
              disabled={loading}
              className="rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Processing...' : 'Seed Database'}
            </button>

            <button
              onClick={checkStatus}
              disabled={loading}
              className="rounded-lg border border-slate-700 px-6 py-3 font-semibold text-slate-200 hover:border-slate-500"
            >
              Check Status
            </button>
          </div>

          {error && (
            <div className="mt-6 rounded-lg border border-red-500/30 bg-red-500/10 p-4">
              <p className="text-sm font-semibold text-red-400">Error</p>
              <p className="mt-1 text-xs text-red-300">{error}</p>
              
              <div className="mt-4 rounded bg-slate-900 p-4">
                <p className="text-xs font-semibold text-slate-300">Manual Steps:</p>
                <ol className="mt-2 space-y-1 text-xs text-slate-400">
                  <li>1. Go to: <a href="https://supabase.com/dashboard/project/kptombohsrxxmaalnwmv" target="_blank" className="text-blue-400 hover:underline">Supabase Dashboard</a></li>
                  <li>2. Click "SQL Editor" → "New query"</li>
                  <li>3. Copy/paste: <code className="text-blue-300">supabase/migrations/00_create_users_table.sql</code></li>
                  <li>4. Click "Run"</li>
                  <li>5. Repeat for: <code className="text-blue-300">20260210_pricing_schema.sql</code></li>
                  <li>6. Repeat for: <code className="text-blue-300">01_seed_example_reports.sql</code></li>
                </ol>
              </div>
            </div>
          )}

          {result && (
            <div className="mt-6 rounded-lg border border-green-500/30 bg-green-500/10 p-4">
              <p className="text-sm font-semibold text-green-400">
                {result.status === 'ready' ? 'Database Ready' : result.success ? 'Success' : 'Status'}
              </p>
              <pre className="mt-2 overflow-auto rounded bg-slate-900 p-3 text-xs text-slate-300">
                {JSON.stringify(result, null, 2)}
              </pre>

              {result.reports_count > 0 && (
                <div className="mt-4">
                  <Link
                    href="/examples"
                    className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                  >
                    View Example Reports →
                  </Link>
                </div>
              )}
            </div>
          )}

          <div className="mt-8 rounded-lg border border-slate-800 bg-slate-900/30 p-4">
            <p className="text-xs font-semibold text-slate-300">What This Does:</p>
            <ul className="mt-2 space-y-1 text-xs text-slate-400">
              <li>• Creates database tables (users, teams, reports, usage_tracking)</li>
              <li>• Seeds 7 comprehensive example reports</li>
              <li>• Creates demo user and team</li>
              <li>• Total value analyzed: $962,877</li>
              <li>• Identified gaps: $85K-$179K</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
