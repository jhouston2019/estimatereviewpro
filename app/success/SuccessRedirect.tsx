"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabaseClient";

export function SuccessRedirect({ sessionId }: { sessionId: string | null }) {
  const router = useRouter();

  useEffect(() => {
    if (!sessionId) {
      router.replace("/pricing");
      return;
    }

    const supabase = createSupabaseBrowserClient();

    fetch("/api/auth/create-session-from-stripe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ session_id: sessionId }),
    }).finally(async () => {
      const { data } = await supabase.auth.refreshSession();
      if (data.session) {
        console.info(
          "[TODO] Post-purchase welcome email: not implemented. Supabase Auth has no built-in marketing/welcome email API — add Resend, SendGrid, or an Edge Function with your template (keep idempotent if also triggered from webhooks)."
        );
        router.replace("/dashboard");
      } else {
        router.replace("/create-account?session_id=" + encodeURIComponent(sessionId));
      }
    });
  }, [router, sessionId]);

  return <div>Finishing up…</div>;
}
