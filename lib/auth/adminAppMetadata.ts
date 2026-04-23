import type { SupabaseClient } from "@supabase/supabase-js";

const ADMIN_FLAG = "is_admin" as const;

/**
 * If `ADMIN_AUTH_EMAIL` is set (e.g. in Netlify/Next env), the Auth user with that
 * email (case-insensitive) gets `app_metadata.is_admin: true` so edge middleware
 * and the JWT line up with database admin checks.
 */
export function getConfiguredAdminAuthEmail(): string | null {
  const raw = process.env.ADMIN_AUTH_EMAIL?.trim();
  if (!raw) return null;
  return raw.toLowerCase();
}

/**
 * Merges `is_admin: true` into the user's JWT app_metadata when their email
 * matches `ADMIN_AUTH_EMAIL`. No-op if env is unset or email does not match.
 */
export async function maybeSetAdminIsAdminAppMetadata(
  supabase: SupabaseClient,
  userId: string,
  email: string | null | undefined
): Promise<void> {
  const want = getConfiguredAdminAuthEmail();
  if (!want) return;
  if (!email?.trim() || email.trim().toLowerCase() !== want) return;

  const { data: existing, error: getErr } =
    await supabase.auth.admin.getUserById(userId);
  if (getErr || !existing.user) {
    console.error(
      "[maybeSetAdminIsAdminAppMetadata] getUserById failed:",
      userId,
      getErr
    );
    return;
  }
  const raw = existing.user.app_metadata;
  const base: Record<string, unknown> =
    raw && typeof raw === "object" && !Array.isArray(raw)
      ? { ...raw }
      : {};
  if (base[ADMIN_FLAG] === true) return;

  base[ADMIN_FLAG] = true;
  const { error: updErr } = await supabase.auth.admin.updateUserById(userId, {
    app_metadata: base,
  });
  if (updErr) {
    console.error(
      "[maybeSetAdminIsAdminAppMetadata] updateUserById failed:",
      userId,
      updErr
    );
  }
}

/**
 * Reads email from `public.users` (falling back to Auth) and runs
 * `maybeSetAdminIsAdminAppMetadata` — use after Stripe (or any) path resolves a user id
 * so `ADMIN_AUTH_EMAIL` can promote the JWT without threading email through every branch.
 */
export async function applyAdminAppMetadataForUserId(
  supabase: SupabaseClient,
  userId: string
): Promise<void> {
  const { data: row } = await supabase
    .from("users")
    .select("email")
    .eq("id", userId)
    .maybeSingle();
  let email: string | null = row?.email ?? null;
  if (!email) {
    const { data: authUser } = await supabase.auth.admin.getUserById(userId);
    email = authUser.user?.email ?? null;
  }
  await maybeSetAdminIsAdminAppMetadata(supabase, userId, email);
}
