/**
 * Local setup orchestrator: Stripe check → seed test user → billing migration (if DATABASE_URL).
 *
 * Required in .env.local:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *
 * Optional:
 *   DATABASE_URL or SUPABASE_DATABASE_URL — auto-apply billing migration
 *
 * Usage: node scripts/setup-dev.mjs  (via npm run setup:dev)
 */

import { spawnSync } from "child_process";
import { readFileSync, existsSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const root = join(__dirname, "..");

function loadEnvLocal() {
  const envPath = join(root, ".env.local");
  if (!existsSync(envPath)) {
    return { envPath, vars: {} };
  }
  const vars = {};
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const match = trimmed.match(/^([^=#]+)=(.*)$/);
    if (match) {
      vars[match[1].trim()] = match[2].trim().replace(/^["']|["']$/g, "");
    }
  }
  return { envPath, vars };
}

function runNpm(scriptName) {
  const isWin = process.platform === "win32";
  const r = spawnSync(isWin ? "npm.cmd" : "npm", ["run", scriptName], {
    cwd: root,
    stdio: "inherit",
    shell: isWin,
    env: { ...process.env },
  });
  return r.status ?? 1;
}

const { envPath, vars } = loadEnvLocal();

console.log("setup:dev — checking required Supabase variables in .env.local\n");

const missing = [];
if (!vars.NEXT_PUBLIC_SUPABASE_URL?.trim()) missing.push("NEXT_PUBLIC_SUPABASE_URL");
if (!vars.SUPABASE_SERVICE_ROLE_KEY?.trim()) missing.push("SUPABASE_SERVICE_ROLE_KEY");

if (missing.length) {
  console.error("❌ Missing required values (paste from Supabase Dashboard → Project Settings → API):");
  for (const k of missing) console.error(`   - ${k}`);
  console.error(`\n   File: ${envPath}`);
  process.exit(1);
}

console.log("✅ Supabase URL and service role key are present.\n");

let code = runNpm("test:check-stripe");
if (code !== 0) process.exit(code);

code = runNpm("test:seed-user");
if (code !== 0) process.exit(code);

const dbUrl = (vars.DATABASE_URL || vars.SUPABASE_DATABASE_URL || "").trim();
if (dbUrl) {
  code = runNpm("test:apply-billing-migration");
  if (code !== 0) process.exit(code);
} else {
  console.warn("\n⚠️  DATABASE_URL / SUPABASE_DATABASE_URL not set — skipping automatic Postgres migration.");
  console.warn("   Add the URI from Supabase → Project Settings → Database → Connection string (port 5432),");
  console.warn("   or run this file in the SQL Editor:");
  console.warn(`   ${join(root, "supabase", "migrations", "20260418_billing_access_control.sql")}`);
  console.warn("   Then confirm: public.user_has_paid_access() exists and public.users.is_admin exists.\n");
}

console.log("✅ setup:dev finished successfully.\n");
process.exit(0);
