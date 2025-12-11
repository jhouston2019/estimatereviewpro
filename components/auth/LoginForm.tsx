\"use client\";

import { useState, FormEvent } from \"react\";
import { useRouter, useSearchParams } from \"next/navigation\";
import { createSupabaseBrowserClient } from \"@/lib/supabaseClient\";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState(\"\");
  const [password, setPassword] = useState(\"\");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const supabase = createSupabaseBrowserClient();
      const { error: signInError } =
        await supabase.auth.signInWithPassword({
          email,
          password,
        });

      if (signInError) {
        setError(signInError.message);
        setIsLoading(false);
        return;
      }

      const redirectTo = searchParams.get(\"redirectedFrom\") || \"/dashboard\";
      router.push(redirectTo);
      router.refresh();
    } catch (err) {
      setError(\"Unable to log in. Please try again.\");
      console.error(err);
      setIsLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className=\"mt-6 space-y-4 rounded-2xl border border-slate-800 bg-slate-950/70 p-6 shadow-lg shadow-slate-950/60\"
    >
      <div className=\"space-y-1 text-sm\">
        <label
          htmlFor=\"email\"
          className=\"text-xs font-medium text-slate-200\"
        >
          Email
        </label>
        <input
          id=\"email\"
          type=\"email\"
          autoComplete=\"email\"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className=\"block w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-50 outline-none ring-0 placeholder:text-slate-500 focus:border-amber-400 focus:ring-1 focus:ring-amber-400\"
          placeholder=\"you@firm.com\"
        />
      </div>

      <div className=\"space-y-1 text-sm\">
        <label
          htmlFor=\"password\"
          className=\"text-xs font-medium text-slate-200\"
        >
          Password
        </label>
        <input
          id=\"password\"
          type=\"password\"
          autoComplete=\"current-password\"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className=\"block w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-50 outline-none ring-0 placeholder:text-slate-500 focus:border-amber-400 focus:ring-1 focus:ring-amber-400\"
          placeholder=\"••••••••\"
        />
      </div>

      {error && (
        <p className=\"text-xs text-rose-300\" role=\"alert\">
          {error}
        </p>
      )}

      <button
        type=\"submit\"
        disabled={isLoading}
        className=\"flex w-full items-center justify-center rounded-full bg-gradient-to-r from-amber-400 via-amber-300 to-sky-400 px-4 py-2.5 text-sm font-semibold text-slate-950 shadow-md shadow-amber-500/40 transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-70\"
      >
        {isLoading ? \"Signing in…\" : \"Log in\"}
      </button>
    </form>
  );
}


