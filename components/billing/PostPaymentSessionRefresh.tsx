"use client";

import { useEffect } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabaseClient";

/**
 * After Stripe checkout, the webhook may update JWT app_metadata (e.g. plan_type) before
 * the browser still has a stale access token. Refresh the session so middleware sees the
 * new claims on the first post-payment navigation.
 */
export function PostPaymentSessionRefresh() {
  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    void (async () => {
      const {
        data: { session },
      } = await supabase.auth.refreshSession();
      if (!session) return;
    })();
  }, []);
  return null;
}
