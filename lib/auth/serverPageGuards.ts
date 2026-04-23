import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { isPaymentBypassActive } from "@/lib/billing/devBypass";
import { createSupabaseServerComponentClient } from "@/lib/supabaseServer";

function assertProductionPaymentBypassNotMisconfigured(): void {
  if (
    process.env.NODE_ENV === "production" &&
    (process.env.BYPASS_PAYMENT === "true" || process.env.BYPASS_PAYMENT === "1")
  ) {
    redirect("/");
  }
}

/**
 * Auth + product paywall for dashboard, upload, account, etc.
 * (Not for /create-account, /login, /register.)
 */
export async function requireUserAndPaywall(): Promise<{
  supabase: Awaited<ReturnType<typeof createSupabaseServerComponentClient>>;
  user: User;
}> {
  assertProductionPaymentBypassNotMisconfigured();
  const supabase = await createSupabaseServerComponentClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  // TEMP: remove after debugging JWT app_metadata in Netlify / server logs
  console.log(
    "[pageGuard] user.app_metadata:",
    user ? JSON.stringify(user.app_metadata) : "(no user)"
  );
  if (!user) {
    redirect("/login");
  }
  if (!isPaymentBypassActive()) {
    const isAdmin = user.app_metadata?.is_admin === true;
    const hasPlan =
      user.app_metadata?.plan_type != null &&
      user.app_metadata?.plan_type !== "";
    if (!isAdmin && !hasPlan) {
      redirect("/pricing?message=payment_required");
    }
  }
  return { supabase, user };
}

/**
 * Admin routes (excludes /admin/login — use only on other app/admin/* pages).
 */
export async function requireAdminUser(): Promise<{
  supabase: Awaited<ReturnType<typeof createSupabaseServerComponentClient>>;
  user: User;
}> {
  assertProductionPaymentBypassNotMisconfigured();
  const supabase = await createSupabaseServerComponentClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  // TEMP: remove after debugging JWT app_metadata in Netlify / server logs
  console.log(
    "[pageGuard] user.app_metadata:",
    user ? JSON.stringify(user.app_metadata) : "(no user)"
  );
  if (!user) {
    redirect("/admin/login");
  }
  if (!user.app_metadata?.is_admin) {
    redirect("/admin/login");
  }
  return { supabase, user };
}
