"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function sessionConfirms(): Promise<boolean> {
  for (let i = 0; i < 2; i++) {
    const res = await fetch("/api/auth/me", {
      method: "GET",
      credentials: "include",
      cache: "no-store",
    });
    if (res.ok) return true;
    await sleep(300);
  }
  return false;
}

function SuccessVerifier() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [message, setMessage] = useState("Finalizing your access…");

  useEffect(() => {
    const sessionId = searchParams?.get("session_id");
    if (!sessionId) {
      setMessage("Missing payment session.");
      router.replace("/pricing?error=payment_failed");
      return;
    }

    const sid = sessionId;
    let cancelled = false;

    async function verifyPaymentLoop() {
      const maxAttempts = 5;
      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        if (cancelled) return;

        const verify = await fetch(
          `/api/verify-payment?session_id=${encodeURIComponent(sid)}`,
          { method: "GET", cache: "no-store", credentials: "include" }
        );

        let data: {
          success?: boolean;
          pending?: boolean;
          error?: string;
        } = {};
        try {
          data = (await verify.json()) as typeof data;
        } catch {
          data = {};
        }

        if (verify.ok && data.success === true && data.pending !== true) {
          setMessage("Redirecting…");
          router.replace("/app");
          router.refresh();
          return;
        }

        if (attempt < maxAttempts - 1) {
          setMessage("Confirming your plan…");
          await sleep(500);
        }
      }

      setMessage("Redirecting…");
      router.replace("/app");
      router.refresh();
    }

    function redirectToLoginFallback() {
      const encoded = encodeURIComponent(`/app?session_id=${sid}`);
      router.replace(`/login?redirectedFrom=${encoded}`);
    }

    async function run() {
      try {
        await fetch("/api/auth/create-session-from-stripe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ session_id: sid }),
        });

        if (cancelled) return;

        const sessionValid = await sessionConfirms();
        if (!sessionValid) {
          setMessage("Sign in to continue…");
          redirectToLoginFallback();
          return;
        }

        await verifyPaymentLoop();
      } catch {
        if (!cancelled) {
          const sessionValid = await sessionConfirms();
          if (!sessionValid) {
            setMessage("Sign in to continue…");
            redirectToLoginFallback();
            return;
          }
          await verifyPaymentLoop();
        }
      }
    }

    void run();
    return () => {
      cancelled = true;
    };
  }, [router, searchParams]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 px-6">
      <div className="max-w-md text-center">
        <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
        <p className="text-sm text-slate-200">{message}</p>
      </div>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-slate-950">
          <p className="text-sm text-slate-400">Loading…</p>
        </div>
      }
    >
      <SuccessVerifier />
    </Suspense>
  );
}
