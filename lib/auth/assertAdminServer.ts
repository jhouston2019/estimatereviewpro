import { createClient } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { createSupabaseServerComponentClient } from "@/lib/supabaseServer";
import type { Database } from "@/types/database.types";

/**
 * Enforces: valid session + users.is_admin === true, using the service role
 * to read `users` (bypasses RLS). Redirects to /admin/login on any failure.
 *
 * Full admin access also expects `app_metadata.is_admin` on the JWT (set via Auth admin
 * API) so edge middleware and client session match this DB flag — both must be true for
 * the end-to-end admin flow (login → middleware → RLS/server checks).
 */
export async function assertAdminOrRedirectToLogin(): Promise<void> {
  const supabase = await createSupabaseServerComponentClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.id) {
    redirect("/admin/login");
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    redirect("/admin/login");
  }

  const service = createClient<Database>(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await service
    .from("users")
    .select("is_admin")
    .eq("id", user.id)
    .maybeSingle();

  const row = data as { is_admin?: boolean | null } | null;
  if (error || row?.is_admin !== true) {
    redirect("/admin/login");
  }
}

/**
 * If the session already has admin in JWT, skip the login form. Must match
 * middleware (app_metadata only) to avoid a redirect loop when DB and JWT
 * claims are out of sync.
 */
export async function redirectToAdminIfAlreadyAdmin(): Promise<void> {
  const supabase = await createSupabaseServerComponentClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.id) {
    return;
  }
  const meta = user.app_metadata as { is_admin?: boolean } | undefined;
  if (meta?.is_admin === true) {
    redirect("/admin");
  }
}
