/**
 * Validates Stripe keys in .env.local for Test mode (sk_test_ / pk_test_).
 * Does not print secret values.
 *
 * - Missing keys → advisory (exit 0) so setup:dev can run before keys are pasted
 * - Live keys when set → exit 1
 * - Test keys when set → exit 0
 *
 * Usage: node scripts/check-stripe-keys.mjs
 */

import { readFileSync, existsSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function loadEnvLocal() {
  const envPath = join(__dirname, "..", ".env.local");
  if (!existsSync(envPath)) {
    return { path: envPath, vars: null };
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
  return { path: envPath, vars };
}

function mask(key) {
  if (!key || key.length < 12) return "(unset or too short)";
  return `${key.slice(0, 7)}…${key.slice(-4)}`;
}

function main() {
  const { path: envPath, vars } = loadEnvLocal();

  if (!vars) {
    console.error(`❌ Missing ${envPath}`);
    console.error("   Copy .env.local.example to .env.local and fill in keys.");
    process.exit(1);
  }

  const secret = vars.STRIPE_SECRET_KEY || "";
  const publishable =
    vars.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ||
    vars.STRIPE_PUBLISHABLE_KEY ||
    "";

  let ok = true;
  let advisory = false;

  if (!secret) {
    console.warn("⚠️  STRIPE_SECRET_KEY is not set — add Test mode secret from Stripe Dashboard → Developers → API keys.");
    advisory = true;
  } else if (secret.startsWith("sk_live_")) {
    console.error("❌ STRIPE_SECRET_KEY is a LIVE key. Use Test mode (sk_test_…) for local development.");
    console.error(`   Masked: ${mask(secret)}`);
    ok = false;
  } else if (!secret.startsWith("sk_test_")) {
    console.warn("⚠️  STRIPE_SECRET_KEY does not start with sk_test_");
    console.warn(`   Masked: ${mask(secret)}`);
    ok = false;
  } else {
    console.log(`✅ STRIPE_SECRET_KEY looks like a test secret key (${mask(secret)})`);
  }

  if (!publishable) {
    console.warn("⚠️  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not set — add pk_test_… from the same Stripe Test mode page.");
    advisory = true;
  } else if (publishable.startsWith("pk_live_")) {
    console.error("❌ Publishable key is LIVE. Use Test mode (pk_test_…).");
    ok = false;
  } else if (!publishable.startsWith("pk_test_")) {
    console.warn("⚠️  Publishable key does not start with pk_test_");
    console.warn(`   Masked: ${mask(publishable)}`);
    ok = false;
  } else {
    console.log(`✅ NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY looks like a test key (${mask(publishable)})`);
  }

  if (!vars.STRIPE_WEBHOOK_SECRET) {
    console.warn("⚠️  STRIPE_WEBHOOK_SECRET is not set — run `npm run stripe:listen` and paste whsec_… then restart dev.");
    advisory = true;
  } else {
    console.log("✅ STRIPE_WEBHOOK_SECRET is set (value not shown)");
  }

  if (advisory && ok) {
    console.log("\nℹ️  Stripe check: advisory only (keys incomplete). Paste test keys when ready.");
  }

  process.exit(ok ? 0 : 1);
}

main();
