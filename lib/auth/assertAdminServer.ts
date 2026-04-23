import { createSupabaseServerComponentClient } from "@/lib/supabaseServer";
import { redirect } from "next/navigation";
import { requireAdminUser } from "@/lib/auth/serverPageGuards";

/**
 * Admin UI: JWT `app_metadata.is_admin` (via `requireAdminUser`).
 */
export async function assertAdminOrRedirectToLogin(): Promise<void> {
  await requireAdminUser();
}

/**
 * If the session already has admin in JWT, skip the login form.
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
