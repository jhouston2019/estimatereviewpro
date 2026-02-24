"use client";

import { useState, FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabaseClient";

export function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const supabase = createSupabaseBrowserClient();
      const {
        data: { user },
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
        disabled={isLoading}
        className="flex w-full items-center justify-center rounded-full bg-[#1e3a8a] px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-[#1e3a8a]/40 transition hover:bg-[#1e40af] disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isLoading ? "Creating account…" : "Create account"}
      </button>
      <p className="text-[11px] text-slate-400">
        By creating an account you agree to store estimate files and AI reports
        in your secure dashboard. You can delete your account and data at any
        time.
      </p>
    </form>
  );
}


