/**
 * Creates or resets a known test user in Supabase Auth + public.users (via trigger).
 *
 * Requires in .env.local:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *
 * Optional:
 *   TEST_USER_EMAIL   (default: dev-test@estimatereviewpro.local)
 *   TEST_USER_PASSWORD (default: DevTestPassword123!)
 *
 * Usage: node scripts/seed-test-user.mjs
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function loadEnvLocal() {
  const envPath = join(__dirname, "..", ".env.local");
  if (!existsSync(envPath)) {
    console.error("❌ Missing .env.local — copy from .env.example");
    process.exit(1);
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
  return vars;
}

const envVars = loadEnvLocal();
const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = envVars.SUPABASE_SERVICE_ROLE_KEY;

const email =
  envVars.TEST_USER_EMAIL || "dev-test@estimatereviewpro.local";
const password =
  envVars.TEST_USER_PASSWORD || "DevTestPassword123!";

if (!supabaseUrl || !serviceKey) {
  console.error("❌ Missing Supabase credentials in .env.local");
  if (!supabaseUrl) console.error("   Set NEXT_PUBLIC_SUPABASE_URL (Dashboard → Project Settings → API → Project URL).");
  if (!serviceKey) console.error("   Set SUPABASE_SERVICE_ROLE_KEY (Dashboard → Project Settings → API → service_role secret).");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  console.log("Seeding test user…\n");

  const { data: created, error: createErr } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (!createErr && created?.user) {
    console.log(`✅ Created auth user: ${email}`);
    console.log(`   User id: ${created.user.id}`);
    console.log("\nLog in at /login with the email and TEST_USER_PASSWORD.\n");
    return;
  }

  const msg = createErr?.message || "";
  if (!/already|registered|exists/i.test(msg)) {
    console.error("❌ createUser failed:", createErr);
    process.exit(1);
  }

  const { data: listData, error: listErr } = await supabase.auth.admin.listUsers({
    perPage: 1000,
  });
  if (listErr) {
    console.error("❌ listUsers failed:", listErr);
    process.exit(1);
  }

  const existing = listData.users.find(
    (u) => u.email?.toLowerCase() === email.toLowerCase()
  );
  if (!existing) {
    console.error("❌ User exists error but could not find user by email");
    process.exit(1);
  }

  const { error: updErr } = await supabase.auth.admin.updateUserById(
    existing.id,
    {
      password,
      email_confirm: true,
    }
  );
  if (updErr) {
    console.error("❌ updateUserById failed:", updErr);
    process.exit(1);
  }

  console.log(`✅ Reset password for existing user: ${email}`);
  console.log(`   User id: ${existing.id}`);
  console.log("\nLog in at /login with the email and TEST_USER_PASSWORD.\n");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
