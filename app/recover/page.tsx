"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function RecoverClient() {
  const router = useRouter();
  const [message, setMessage] = useState("Checking your account…");

  useEffect(() => {
    let cancelled = false;

    async function run() {
      const me = await fetch("/api/auth/me", {
        credentials: "include",
        cache: "no-store",
      });
      if (!me.ok) {
        router.replace("/login?redirect=/recover&redirectedFrom=/recover");
        return;
      }

      const r = await fetch("/api/recover-payment-state", { cache: "no-store" });
      let j: {
        status?: string;
        session_id?: string | null;
      } = {};
      try {
        j = (await r.json()) as typeof j;
      } catch {
        j = {};
      }

      if (cancelled) return;

      if (j.status === "paid") {
        router.replace("/app");
        return;
      }
      if (j.status === "none") {
        router.replace("/pricing");
        return;
      }

      setMessage("Finishing your payment…");
      if (j.session_id) {
        await fetch(
          `/api/verify-payment?session_id=${encodeURIComponent(j.session_id)}`,
          { credentials: "include", cache: "no-store" }
        );
      }

      for (let i = 0; i < 8; i++) {
        if (cancelled) return;
        await sleep(1500);
        const r2 = await fetch("/api/recover-payment-state", {
          cache: "no-store",
        });
        let j2: { status?: string } = {};
        try {
          j2 = (await r2.json()) as typeof j2;
        } catch {
          j2 = {};
        }
        if (j2.status === "paid") {
          router.replace("/app");
          return;
        }
        if (j2.status === "none") {
          router.replace("/pricing");
          return;
        }
      }

      setMessage(
        "Payment is still processing. You can return to Pricing or try Recovery again in a moment."
      );
    }

    void run();
    return () => {
      cancelled = true;
    };
  }, [router]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 px-6">
      <div className="max-w-md text-center">
        <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
        <p className="text-sm text-slate-200">{message}</p>
      </div>
    </div>
  );
}

export default function RecoverPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-slate-950">
          <p className="text-sm text-slate-400">Loading…</p>
        </div>
      }
    >
      <RecoverClient />
    </Suspense>
  );
}
