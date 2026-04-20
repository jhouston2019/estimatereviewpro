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
  const [showStuck, setShowStuck] = useState(false);
  const [kick, setKick] = useState(0);

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
          setShowStuck(false);
          try {
            await fetch("/api/send-receipt", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              credentials: "include",
              body: JSON.stringify({ session_id: sid }),
            });
          } catch {
            /* non-blocking */
          }
          router.replace("/app");
          router.refresh();
          return;
        }

        if (attempt < maxAttempts - 1) {
          setMessage("Confirming your plan…");
          await sleep(500);
        }
      }

      setShowStuck(true);
      setMessage(
        "Payment is still processing. This usually resolves within a few seconds."
      );

      for (let extra = 0; extra < 10; extra++) {
        if (cancelled) return;
        await sleep(500);
        const verify = await fetch(
          `/api/verify-payment?session_id=${encodeURIComponent(sid)}`,
          { method: "GET", cache: "no-store", credentials: "include" }
        );
        let data: { success?: boolean; pending?: boolean } = {};
        try {
          data = (await verify.json()) as typeof data;
        } catch {
          data = {};
        }
        if (verify.ok && data.success === true && data.pending !== true) {
          setMessage("Redirecting…");
          setShowStuck(false);
          try {
            await fetch("/api/send-receipt", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              credentials: "include",
              body: JSON.stringify({ session_id: sid }),
            });
          } catch {
            /* non-blocking */
          }
          router.replace("/app");
          router.refresh();
          return;
        }
      }

      setMessage(
        "Payment is still processing. You can retry below or use Recovery after signing in."
      );
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
  }, [router, searchParams, kick]);

  const sid = searchParams?.get("session_id");

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 px-6">
      <div className="max-w-md text-center">
        <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
        <p className="text-sm text-slate-200">{message}</p>
        {showStuck && (
          <p className="mt-3 text-xs text-slate-400">
            We are still confirming with your bank. You can stay on this page;
            confirmation continues in the background.
          </p>
        )}
        {sid && (
          <button
            type="button"
            className="mt-6 inline-flex items-center justify-center rounded-full border border-slate-600 px-4 py-2 text-xs font-semibold text-slate-100 hover:border-slate-400"
            onClick={() => {
              setShowStuck(false);
              setMessage("Retrying confirmation…");
              setKick((k) => k + 1);
            }}
          >
            Retry confirmation
          </button>
        )}
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
