"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabaseClient";

export default function AuthCallbackPage() {
  const router = useRouter();
  const [message] = useState("Redirecting...");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const supabase = createSupabaseBrowserClient();
      if (typeof window === "undefined") {
        return;
      }

      const searchParams = new URLSearchParams(window.location.search);
      const code = searchParams.get("code");
      if (code) {
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(
          code
        );
        if (exchangeError) {
          if (!cancelled) {
            await supabase.auth.signOut();
            router.replace("/");
          }
          return;
        }
      } else if (window.location.hash) {
        await new Promise((r) => {
          setTimeout(r, 0);
        });
      }

      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();
      if (cancelled) {
        return;
      }
      if (sessionError || !session?.user?.id) {
        await supabase.auth.signOut();
        router.replace("/");
        return;
      }

      const { data: row, error: rowError } = await supabase
        .from("users")
        .select("is_admin")
        .eq("id", session.user.id)
        .maybeSingle();
      const isAdmin =
        (row as { is_admin?: boolean } | null)?.is_admin === true;
      if (rowError || !isAdmin) {
        await supabase.auth.signOut();
        router.replace("/");
        return;
      }

      router.replace("/admin");
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 px-4">
      <p className="text-sm text-slate-300" role="status" aria-live="polite">
        {message}
      </p>
    </div>
  );
}
