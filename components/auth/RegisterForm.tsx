"use client";

import { useState, useEffect, FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabaseClient";

export function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [autoVerifyDone, setAutoVerifyDone] = useState(false);

  const paymentSuccess =
    searchParams?.get("payment") === "success" &&
    Boolean(searchParams?.get("session_id"));

  useEffect(() => {
    console.log("[RegisterForm] URL search params", {
      payment: searchParams?.get("payment"),
      session_id: searchParams?.get("session_id"),
      paymentSuccess,
    });
  }, [searchParams, paymentSuccess]);

  useEffect(() => {
    let cancelled = false;
    async function existingSessionVerify() {
      const sid = searchParams?.get("session_id");
      const pay = searchParams?.get("payment");
      if (pay !== "success" || !sid) return;

      const supabase = createSupabaseBrowserClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user) return;

      setIsLoading(true);
      try {
        const verify = await fetch(
          `/api/verify-payment?session_id=${encodeURIComponent(sid)}`,
          { method: "GET", cache: "no-store", credentials: "include" }
        );
        const data = (await verify.json()) as {
          success?: boolean;
          postPaymentDestination?: "upload" | "dashboard";
        };
        if (cancelled) return;
        if (verify.ok && data.success) {
          setAutoVerifyDone(true);
          const dest =
            data.postPaymentDestination === "dashboard" ? "/dashboard" : "/upload";
          router.push(dest);
          router.refresh();
          return;
        }
      } catch {
        /* fall through to registration form */
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    void existingSessionVerify();
    return () => {
      cancelled = true;
    };
  }, [searchParams, router]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (autoVerifyDone) return;

      const supabase = createSupabaseBrowserClient();
      const {
        data: { user, session },
        error: signUpError,
      } = await supabase.auth.signUp({
        email,
        password,
      });

      if (signUpError) {
        setError(signUpError.message);
        setIsLoading(false);
        return;
      }

      if (!user) {
        setError("Unable to complete registration. Please check your email.");
        setIsLoading(false);
        return;
      }

      const sessionId = searchParams?.get("session_id");
      const payOk = searchParams?.get("payment") === "success";

      if (payOk && sessionId) {
        if (!session) {
          setError(
            "Confirm the email we sent you, then sign in with this same email so we can link your payment."
          );
          setIsLoading(false);
          return;
        }

        try {
          const verify = await fetch(
            `/api/verify-payment?session_id=${encodeURIComponent(sessionId)}`,
            { method: "GET", cache: "no-store", credentials: "include" }
          );
          const data = (await verify.json()) as {
            success?: boolean;
            postPaymentDestination?: "upload" | "dashboard";
            error?: string;
          };

          if (!verify.ok || !data.success) {
            setError(data.error ?? "Could not activate your plan. Try signing in, or contact support.");
            setIsLoading(false);
            return;
          }

          const dest =
            data.postPaymentDestination === "dashboard" ? "/dashboard" : "/upload";
          router.push(dest);
          router.refresh();
          return;
        } catch {
          setError("Could not activate your plan. Try signing in from the login page.");
          setIsLoading(false);
          return;
        }
      }

      const plan = searchParams?.get("plan");
      const redirectTo = plan ? `/dashboard?plan=${plan}` : "/dashboard";
      router.push(redirectTo);
      router.refresh();
    } catch (err) {
      console.error(err);
      setError("Unable to register. Please try again.");
      setIsLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-6 space-y-4 rounded-2xl border border-slate-800 bg-slate-950/70 p-6 shadow-lg shadow-slate-950/60"
    >
      {paymentSuccess && (
        <p className="rounded-lg border border-emerald-800/80 bg-emerald-950/40 px-3 py-2 text-[11px] text-emerald-200">
          Payment received. Create your account with the{" "}
          <span className="font-semibold">same email you used at checkout</span>{" "}
          so we can link your plan.
        </p>
      )}
      <div className="space-y-1 text-sm">
        <label
          htmlFor="email"
          className="text-xs font-medium text-slate-200"
        >
          Work email
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="block w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-50 outline-none ring-0 placeholder:text-slate-500 focus:border-[#1e3a8a] focus:ring-1 focus:ring-[#1e3a8a]"
          placeholder="you@firm.com"
        />
      </div>

      <div className="space-y-1 text-sm">
        <label
          htmlFor="password"
          className="text-xs font-medium text-slate-200"
        >
          Password
        </label>
        <input
          id="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="block w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-50 outline-none ring-0 placeholder:text-slate-500 focus:border-[#1e3a8a] focus:ring-1 focus:ring-[#1e3a8a]"
          placeholder="Create a strong password"
        />
      </div>

      {error && (
        <p className="text-xs text-rose-300" role="alert">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={isLoading || autoVerifyDone}
        className="flex w-full items-center justify-center rounded-full bg-[#1e3a8a] px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-[#1e3a8a]/40 transition hover:bg-[#1e40af] disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isLoading ? "Creating account…" : "Create account"}
      </button>
      <p className="text-[11px] text-slate-400">
        By creating an account you agree to store estimate files and AI reports
        in your secure dashboard. You can delete your account and data at any
        time.
      </p>
      {paymentSuccess && searchParams?.get("session_id") && (
        <p className="text-center text-[11px] text-slate-400">
          Already have an account?{" "}
          <Link
            className="font-semibold text-blue-300 hover:underline"
            href={`/login?redirectedFrom=${encodeURIComponent(
              `/register?payment=success&session_id=${searchParams.get("session_id")}`
            )}`}
          >
            Sign in
          </Link>
        </p>
      )}
    </form>
  );
}
