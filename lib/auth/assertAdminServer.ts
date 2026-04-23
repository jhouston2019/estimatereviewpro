import { createClient } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { createSupabaseServerComponentClient } from "@/lib/supabaseServer";
import type { Database } from "@/types/database.types";

/**
 * Enforces: valid session + users.is_admin === true, using the service role
 * to read `users` (bypasses RLS). Redirects to /admin/login on any failure.
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
 * If the current session is an admin, skip the login form and go to the dashboard.
 * Uses the same service-role `is_admin` read as the admin layout guard.
 */
export async function redirectToAdminIfAlreadyAdmin(): Promise<void> {
  const supabase = await createSupabaseServerComponentClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.id) {
    return;
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    return;
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
  if (error) {
    return;
  }
  if (row?.is_admin === true) {
    redirect("/admin");
  }
}
