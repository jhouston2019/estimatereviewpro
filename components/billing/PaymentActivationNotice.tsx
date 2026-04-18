"use client";

import { useEffect, useState } from "react";

type Props = {
  enabled: boolean;
};

/**
 * After Stripe redirect, subscription rows may lag until webhooks run.
 * Polls /api/billing/status until Supabase shows paid access (never trust URL alone).
 */
export function PaymentActivationNotice({ enabled }: Props) {
  const [state, setState] = useState<"idle" | "waiting" | "ready" | "timeout">(
    "idle"
  );

  useEffect(() => {
    if (!enabled) return;

    setState("waiting");
    let cancelled = false;
    const started = Date.now();
    const maxMs = 90_000;

    const tick = async () => {
      try {
        const res = await fetch("/api/billing/status", { cache: "no-store" });
        const data = await res.json();
        if (cancelled) return;
        if (data.hasPaidAccess) {
          setState("ready");
          return;
        }
        if (Date.now() - started > maxMs) {
          setState("timeout");
          return;
        }
        setTimeout(tick, 2500);
      } catch {
        if (!cancelled) setTimeout(tick, 4000);
      }
    };

    void tick();
    return () => {
      cancelled = true;
    };
  }, [enabled]);

  if (!enabled || state === "idle" || state === "ready") return null;

  return (
    <div
      className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-100"
      role="status"
    >
      {state === "waiting" && (
        <p>
          Confirming your subscription in our system… This usually takes a few
          seconds after Stripe redirects.
        </p>
      )}
      {state === "timeout" && (
        <p>
          We could not confirm your subscription yet. Refresh the page in a
          moment, or contact support if access does not appear.
        </p>
      )}
    </div>
  );
}
