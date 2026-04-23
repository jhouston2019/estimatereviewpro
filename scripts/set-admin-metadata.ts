/**
 * One-off: set `app_metadata.is_admin: true` for a user by email (merges with existing
 * `app_metadata`). Optionally set `app_metadata.plan_type` from env when `PLAN_TYPE` is
 * set; if omitted, `plan_type` is left unchanged and only `is_admin` is updated.
 *
 * Requires (same as other scripts):
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *
 * Target email: env TARGET_EMAIL, or set HARDCODE_TARGET_EMAIL below temporarily.
 * Optional: PLAN_TYPE (e.g. single, professional) — from process.env or .env.local
 *
 * Run from repo root: npx tsx scripts/set-admin-metadata.ts
 */

import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function loadEnvLocal(): Record<string, string> {
  const envPath = join(__dirname, "..", ".env.local");
  if (!existsSync(envPath)) {
    return {};
  }
  const envContent = readFileSync(envPath, "utf8");
  const vars: Record<string, string> = {};
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

const envLocal = loadEnvLocal();
const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? envLocal.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? envLocal.SUPABASE_SERVICE_ROLE_KEY;

/** One-off: set to your email; leave null to require TARGET_EMAIL. */
const HARDCODE_TARGET_EMAIL = null as string | null;

const target =
  (process.env.TARGET_EMAIL || "").trim() ||
  (HARDCODE_TARGET_EMAIL != null ? HARDCODE_TARGET_EMAIL.trim() : "");
const targetLower = target.toLowerCase();

/** If set (non-empty), written to `app_metadata.plan_type` alongside `is_admin`. */
const planTypeFromEnv = (() => {
  const raw = (process.env.PLAN_TYPE ?? envLocal.PLAN_TYPE ?? "").trim();
  return raw.length > 0 ? raw : null;
})();

async function main(): Promise<void> {
  if (!url || !serviceKey) {
    console.error(
      "Missing NEXT_PUBLIC_SUPABASE_URL and/or SUPABASE_SERVICE_ROLE_KEY (env or .env.local)"
    );
    process.exit(1);
  }
  if (!targetLower) {
    console.error("Set TARGET_EMAIL (or HARDCODE_TARGET_EMAIL in this file).");
    process.exit(1);
  }

  const supabase = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: fromPublic, error: pubErr } = await supabase
    .from("users")
    .select("id, email")
    .ilike("email", target)
    .maybeSingle();

  let userId: string | null = fromPublic?.id ?? null;
  if (pubErr) {
    console.error("[set-admin-metadata] public.users lookup failed:", pubErr);
    process.exit(1);
  }
  if (!userId) {
    const { data: listData, error: listErr } = await supabase.auth.admin.listUsers({
      perPage: 1000,
    });
    if (listErr) {
      console.error("[set-admin-metadata] listUsers failed:", listErr);
      process.exit(1);
    }
    const found = listData.users.find(
      (u) => (u.email ?? "").toLowerCase() === targetLower
    );
    userId = found?.id ?? null;
  }
  if (!userId) {
    console.error("No user found for email:", target);
    process.exit(1);
  }

  const { data: existing, error: getErr } =
    await supabase.auth.admin.getUserById(userId);
  if (getErr || !existing.user) {
    console.error("getUserById failed:", userId, getErr);
    process.exit(1);
  }

  const raw = existing.user.app_metadata;
  const base: Record<string, unknown> =
    raw && typeof raw === "object" && !Array.isArray(raw)
      ? { ...(raw as Record<string, unknown>) }
      : {};

  const needAdmin = base.is_admin !== true;
  const needPlan =
    planTypeFromEnv != null &&
    base.plan_type !== planTypeFromEnv;
  if (!needAdmin && !needPlan) {
    console.log(
      "No update needed: is_admin already true" +
        (planTypeFromEnv == null
          ? " (PLAN_TYPE not set, skipping plan_type)"
          : " and plan_type already matches PLAN_TYPE")
    );
    return;
  }

  base.is_admin = true;
  if (planTypeFromEnv != null) {
    base.plan_type = planTypeFromEnv;
  }

  const { error: updErr } = await supabase.auth.admin.updateUserById(userId, {
    app_metadata: base,
  });
  if (updErr) {
    console.error("updateUserById failed:", updErr);
    process.exit(1);
  }
  const planMsg =
    planTypeFromEnv != null
      ? `, plan_type=${JSON.stringify(planTypeFromEnv)}`
      : "";
  console.log(
    "Updated app_metadata (is_admin: true" + planMsg + ") for user",
    userId,
    "email:",
    target
  );
}

void main().catch((e) => {
  console.error(e);
  process.exit(1);
});
