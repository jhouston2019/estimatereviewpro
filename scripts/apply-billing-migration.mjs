/**
 * Applies supabase/migrations/20260418_billing_access_control.sql when possible,
 * or confirms it is already applied (checks for user_has_paid_access + users.is_admin).
 *
 * Requires one of:
 *   DATABASE_URL or SUPABASE_DATABASE_URL — Postgres URI (direct, port 5432)
 *   Get it from: Supabase Dashboard → Project Settings → Database → Connection string → URI
 *   (use "Direct connection" / session pooler as documented; password is your DB password)
 *
 * Usage: node scripts/apply-billing-migration.mjs
 */

import pg from "pg";
import { readFileSync, existsSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function loadEnvLocal() {
  const envPath = join(__dirname, "..", ".env.local");
  if (!existsSync(envPath)) {
    return { envPath, vars: null };
  }
  const envContent = readFileSync(envPath, "utf8");
  const vars = {};
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const match = trimmed.match(/^([^=#]+)=(.*)$/);
    if (match) {
      vars[match[1].trim()] = match[2].trim().replace(/^["']|["']$/g, "");
    }
  }
  return { envPath, vars };
}

const { envPath, vars } = loadEnvLocal();
const connectionString =
  (vars && (vars.DATABASE_URL || vars.SUPABASE_DATABASE_URL)) || process.env.DATABASE_URL;

const migrationPath = join(
  __dirname,
  "..",
  "supabase",
  "migrations",
  "20260418_billing_access_control.sql"
);

async function checkApplied(client) {
  const q = `
    SELECT
      EXISTS (
        SELECT 1 FROM pg_proc p
        JOIN pg_namespace n ON n.oid = p.pronamespace
        WHERE n.nspname = 'public' AND p.proname = 'user_has_paid_access'
      ) AS has_fn,
      EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'is_admin'
      ) AS has_col;
  `;
  const { rows } = await client.query(q);
  return rows[0]?.has_fn && rows[0]?.has_col;
}

async function main() {
  if (!existsSync(migrationPath)) {
    console.error("❌ Missing migration file:", migrationPath);
    process.exit(1);
  }

  if (!connectionString || connectionString.length < 20) {
    console.error("❌ DATABASE_URL or SUPABASE_DATABASE_URL is not set in .env.local");
    console.error("   Add your Postgres connection URI from:");
    console.error("   Supabase Dashboard → Project Settings → Database → Connection string → URI");
    console.error("   (Direct connection, port 5432, includes postgres password.)");
    console.error("");
    console.error("   Or open the SQL file in the Dashboard SQL Editor and run it manually:");
    console.error("   ", migrationPath);
    process.exit(1);
  }

  const client = new pg.Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();

    if (await checkApplied(client)) {
      console.log("✅ Billing access migration already applied (user_has_paid_access + users.is_admin present).");
      await client.end();
      process.exit(0);
    }

    const sql = readFileSync(migrationPath, "utf8");
    await client.query(sql);
    console.log("✅ Applied migration:", migrationPath);
    await client.end();
    process.exit(0);
  } catch (e) {
    const msg = String(e.message || e);
    console.error("❌ Migration failed:", msg);
    try {
      await client.end();
    } catch {
      /* ignore */
    }
    try {
      const c2 = new pg.Client({
        connectionString,
        ssl: { rejectUnauthorized: false },
      });
      await c2.connect();
      if (await checkApplied(c2)) {
        console.log("✅ Database already matches this migration (verified after error).");
        await c2.end();
        process.exit(0);
      }
      await c2.end();
    } catch {
      /* ignore */
    }
    process.exit(1);
  }
}

main();
