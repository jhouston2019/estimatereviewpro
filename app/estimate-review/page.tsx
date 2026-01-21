import React from "react";
import Link from "next/link";

export default function EstimateReviewPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-amber-400 to-sky-500 shadow-lg shadow-amber-500/30">
              <span className="text-sm font-black text-slate-950">ER</span>
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-sm font-semibold text-slate-50">
                Estimate Review Pro
              </span>
              <span className="text-xs text-slate-400">
                AI estimate review for claims teams
              </span>
            </div>
          </Link>
          <nav className="flex items-center gap-6 text-sm font-medium text-slate-200">
            <Link
              href="/pricing"
              className="transition hover:text-amber-300 hover:underline hover:underline-offset-4"
            >
              Pricing
            </Link>
            <Link
              href="/login"
              className="hidden rounded-full border border-slate-700 px-4 py-1.5 text-xs font-semibold text-slate-200 hover:border-slate-500 hover:text-slate-50 sm:inline-flex"
            >
              Log in
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center rounded-full bg-gradient-to-r from-amber-400 via-amber-300 to-sky-400 px-4 py-1.5 text-xs font-semibold text-slate-950 shadow-sm shadow-amber-500/40 hover:brightness-105"
            >
              Get started
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-10 px-6 py-12 md:py-20">
        <section className="max-w-3xl space-y-8">
          <h1 className="text-balance text-3xl font-semibold tracking-tight text-slate-50 sm:text-4xl md:text-5xl">
            Not Sure If This Repair or Insurance Estimate Is Fair?
          </h1>

          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-slate-50">
              What This Is
            </h2>
            <p className="text-sm leading-relaxed text-slate-300 md:text-base">
              Estimates for repairs, construction, or insurance claims can vary
              widely depending on who prepared them, what was included, and how
              items were scoped. Many estimates look official but leave out
              important details or undervalue key components.
            </p>
            <p className="text-sm leading-relaxed text-slate-300 md:text-base">
              Estimate Review Pro helps you understand what an estimate is
              actually saying — and what may be missing — before you agree to
              it.
            </p>
          </div>

          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-slate-50">
              Why This Matters
            </h2>
            <ul className="list-disc space-y-1 pl-4 text-sm leading-relaxed text-slate-300 md:text-base">
              <li>You may overpay for work that’s overstated</li>
              <li>Insurance estimates may omit necessary repairs</li>
              <li>Important line items or scope details can be overlooked</li>
              <li>Once you agree, leverage often decreases</li>
            </ul>
          </div>

          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-slate-50">
              How Estimate Review Pro Works
            </h2>
            <p className="text-sm leading-relaxed text-slate-300 md:text-base">
              Upload your estimate and receive a clear, plain-English breakdown
              of the line items, scope, and potential gaps. The goal is clarity
              — so you know what questions to ask and what to review before
              moving forward.
            </p>
          </div>

          <div>
            <Link
              href="/dashboard/upload"
              className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-amber-400 via-amber-300 to-sky-400 px-6 py-2.5 text-sm font-semibold text-slate-950 shadow-md shadow-amber-500/40 hover:brightness-105"
            >
              Review My Estimate
            </Link>
          </div>

          <p className="text-xs text-slate-400">
            Disclaimer
            <span className="ml-1">
              Educational assistance only. Not legal, insurance, or financial
              advice.
            </span>
          </p>
        </section>
      </main>

      <footer className="border-t border-slate-900/80 bg-slate-950/80">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-6 text-[11px] text-slate-500 sm:flex-row">
          <p>
            © {new Date().getFullYear()} Estimate Review Pro. All rights
            reserved.
          </p>
          <div className="flex gap-4">
            <Link
              href="/pricing"
              className="hover:text-slate-300 hover:underline hover:underline-offset-4"
            >
              Pricing
            </Link>
            <Link
              href="/admin-login.html"
              className="text-xs opacity-50 hover:opacity-100 hover:text-slate-300"
            >
              Admin
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}


