"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

type Props = {
  sessionId: string;
  email: string;
};

export function CreateAccountForm({ sessionId, email }: Props) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsPending(true);

    const form = event.currentTarget;
    const formData = new FormData(form);
    const password = String(formData.get("password") ?? "");
    const confirmPassword = String(formData.get("confirm_password") ?? "");

    try {
      const res = await fetch("/api/auth/create-account-after-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          session_id: sessionId,
          password,
          confirm_password: confirmPassword,
        }),
      });

      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        redirectTo?: string;
      };

      if (!res.ok) {
        setError(data.error ?? "Could not create account. Please try again.");
        return;
      }

      router.replace(data.redirectTo ?? "/app");
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-8 w-full max-w-md space-y-5"
    >
      <div className="space-y-1 text-sm">
        <label
          htmlFor="create-account-email"
          className="text-xs font-medium text-slate-200"
        >
          Email
        </label>
        <input
          id="create-account-email"
          name="email_display"
          type="email"
          readOnly
          value={email}
          autoComplete="email"
          className="block w-full cursor-not-allowed rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-2.5 text-sm text-slate-300 outline-none"
        />
      </div>

      <div className="space-y-1 text-sm">
        <label
          htmlFor="create-account-password"
          className="text-xs font-medium text-slate-200"
        >
          Password
        </label>
        <input
          id="create-account-password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          className="block w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-50 outline-none placeholder:text-slate-500 focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]"
          placeholder="At least 8 characters"
        />
      </div>

      <div className="space-y-1 text-sm">
        <label
          htmlFor="create-account-confirm"
          className="text-xs font-medium text-slate-200"
        >
          Confirm password
        </label>
        <input
          id="create-account-confirm"
          name="confirm_password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          className="block w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-50 outline-none placeholder:text-slate-500 focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]"
          placeholder="Re-enter password"
        />
      </div>

      {error ? (
        <p className="text-sm text-rose-300" role="alert">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isPending}
        className="flex w-full items-center justify-center rounded-lg bg-[#2563EB] px-4 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-[#1E40AF] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? "Creating account…" : "Create Account"}
      </button>
    </form>
  );
}
