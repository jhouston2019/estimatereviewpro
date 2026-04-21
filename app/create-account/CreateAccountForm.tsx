"use client";

import Link from "next/link";
import { useActionState } from "react";
import {
  createAccountAfterCheckout,
  type CreateAccountState,
} from "./actions";

const initialState: CreateAccountState = { error: null };

type Props = {
  sessionId: string;
  email: string;
};

export function CreateAccountForm({ sessionId, email }: Props) {
  const [state, formAction, isPending] = useActionState(
    createAccountAfterCheckout,
    initialState
  );

  return (
    <form action={formAction} className="mt-8 w-full max-w-md space-y-5">
      <input type="hidden" name="session_id" value={sessionId} />

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

      {state.error ? (
        <p className="text-sm text-rose-300" role="alert">
          {state.error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isPending}
        className="flex w-full items-center justify-center rounded-lg bg-[#2563EB] px-4 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-[#1E40AF] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? "Creating account…" : "Create Account"}
      </button>
      <p className="mt-4 text-center text-xs text-slate-500">
        Already have an account?{" "}
        <Link
          href="/login"
          className="text-slate-400 underline-offset-2 transition hover:text-slate-300 hover:underline"
        >
          Log in
        </Link>
      </p>
    </form>
  );
}
