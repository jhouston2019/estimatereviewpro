"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabaseClient";

/**
 * Supabase email link flows (magic link, password reset) must use this as
 * `redirectTo` / `emailRedirectTo` — and add the URL in Supabase Dashboard →
 * Authentication → URL configuration.
 */
export const ADMIN_AUTH_CALLBACK_URL =
  "https://estimatereviewpro.com/auth/callback" as const;

export function AdminLoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const supabase = createSupabaseBrowserClient();

    try {
      console.log("ADMIN LOGIN ATTEMPT:", { email });
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      console.log("SIGN IN RESULT:", {
        user: data?.user?.id,
        error: error?.message,
      });

      if (error) {
        setError(error.message);
        setIsLoading(false);
        return;
      }

      const userId = data.user?.id;
      if (!userId) {
        setError("Unable to sign in. Please try again.");
        setIsLoading(false);
        return;
      }

      const { data: userRow, error: isAdminError } = await supabase
        .from("users")
        .select("is_admin")
        .eq("id", userId)
        .maybeSingle();

      const isAdmin =
        (userRow as { is_admin?: boolean } | null)?.is_admin === true;
      console.log("IS_ADMIN CHECK:", { userRow, isAdminError });

      if (isAdminError || !isAdmin) {
        await supabase.auth.signOut();
        setError("Not authorized");
        setIsLoading(false);
        return;
      }

      router.replace("/admin");
      router.refresh();
    } catch (err) {
      console.error(err);
      setError("Unable to log in. Please try again.");
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
          htmlFor="admin-email"
          className="text-xs font-medium text-slate-200"
        >
          Email
        </label>
        <input
          id="admin-email"
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
          htmlFor="admin-password"
          className="text-xs font-medium text-slate-200"
        >
          Password
        </label>
        <input
          id="admin-password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="block w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-50 outline-none ring-0 placeholder:text-slate-500 focus:border-[#1e3a8a] focus:ring-1 focus:ring-[#1e3a8a]"
          placeholder="••••••••"
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
        {isLoading ? "Signing in…" : "Log in"}
      </button>
    </form>
  );
}
