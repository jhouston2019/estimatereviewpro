import React from "react";
import Link from "next/link";

export default function EstimateReviewPage() {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      <header className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#1e3a8a] shadow-lg shadow-[#1e3a8a]/30">
              <span className="text-sm font-black text-white">ER</span>
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-sm font-semibold text-slate-50">
                Estimate Review Pro
              </span>
              <span className="text-xs text-slate-400">
                Expert-Grade Xactimate Analysis
              </span>
            </div>
          </Link>
          <nav className="flex items-center gap-6 text-sm font-medium text-slate-200">
            <Link
              href="/pricing"
              className="transition hover:text-white hover:underline hover:underline-offset-4"
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
              className="inline-flex items-center rounded-full bg-[#1e3a8a] px-4 py-1.5 text-xs font-semibold text-white shadow-sm shadow-[#1e3a8a]/40 hover:bg-[#1e40af]"
            >
              Get started
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-6 py-12 md:py-20">
        {/* Hero Section */}
        <section className="mb-16 text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#1e3a8a]/40 bg-[#1e3a8a]/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-blue-300">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            Deterministic • Platform-Aware • Non-Advisory
          </div>
          
          <h1 className="mb-6 text-balance text-4xl font-bold tracking-tight text-white sm:text-5xl md:text-6xl lg:text-7xl">
            Insurance Estimate Review Tool
          </h1>
          
          <p className="mx-auto mb-8 max-w-3xl text-lg leading-relaxed text-slate-300 md:text-xl">
            Expert-grade Xactimate-aware estimate analysis. Deterministic structural review with trade category detection and line item observations.
          </p>

          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/pricing"
              className="inline-flex items-center justify-center rounded-full bg-[#2563EB] px-8 py-4 text-base font-semibold text-white shadow-lg shadow-[#2563EB]/40 transition hover:bg-[#1E40AF]"
            >
              Upload Estimate for Review
            </Link>
            <span className="text-sm text-slate-400">
              Starting at $49 • Multiple plans available
            </span>
          </div>
        </section>

        {/* What It Does Section */}
        <section className="mb-16">
          <div className="rounded-3xl border border-slate-800 bg-slate-900/50 p-8 shadow-2xl md:p-12">
            <h2 className="mb-6 text-2xl font-bold text-white md:text-3xl">
              What is Estimate Review Pro?
            </h2>
            <p className="mb-6 text-base leading-relaxed text-slate-300 md:text-lg">
              Estimate Review Pro is a <strong className="text-white">deterministic, platform-aware estimate analysis engine</strong> that performs structural review of insurance estimates. The system detects Xactimate format, identifies trade categories, and generates observational findings about estimate structure.
            </p>
            <p className="text-base leading-relaxed text-slate-300 md:text-lg">
              This is <strong className="text-white">NOT an AI assistant</strong>. This is a procedural analysis tool that produces the same output for the same input every time (100% deterministic).
            </p>
          </div>
        </section>

        {/* What It Does NOT Do - Warning Box */}
        <section className="mb-16">
          <div className="rounded-3xl border-2 border-rose-500/30 bg-rose-950/20 p-8 shadow-2xl md:p-12">
            <h2 className="mb-6 text-2xl font-bold text-rose-200 md:text-3xl">
              What This Tool Does NOT Do
            </h2>
            <ul className="grid gap-3 text-base text-rose-100/90 md:grid-cols-2 md:text-lg">
              <li className="flex items-start gap-2">
                <span className="mt-1 text-rose-400">×</span>
                <span><strong>Does NOT negotiate</strong> with insurance companies</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 text-rose-400">×</span>
                <span><strong>Does NOT interpret</strong> policy coverage or exclusions</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 text-rose-400">×</span>
                <span><strong>Does NOT provide</strong> legal advice or claim strategy</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 text-rose-400">×</span>
                <span><strong>Does NOT give</strong> pricing opinions or cost assessments</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 text-rose-400">×</span>
                <span><strong>Does NOT recommend</strong> actions or review on your behalf</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 text-rose-400">×</span>
                <span><strong>Does NOT determine</strong> what is owed, covered, or required</span>
              </li>
            </ul>
          </div>
        </section>

        {/* Features Grid */}
        <section className="mb-16">
          <h2 className="mb-8 text-center text-3xl font-bold text-white md:text-4xl">
            What This Tool Provides
          </h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* Feature 1 */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 shadow-xl transition hover:border-[#1e3a8a]/50">
              <div className="mb-4 flex h-3 w-3 items-center justify-center">
                <div className="h-3 w-3 rounded-full bg-[#1e3a8a]"></div>
              </div>
              <h3 className="mb-3 text-xl font-bold text-white">
                Xactimate Detection
              </h3>
              <p className="text-sm leading-relaxed text-slate-300">
                Detects Xactimate format with confidence scoring. Requires ≥75% confidence or rejects document. Parses 30+ trade codes (DRY, PNT, FLR, RFG, etc.).
              </p>
            </div>

            {/* Feature 2 */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 shadow-xl transition hover:border-[#1e3a8a]/50">
              <div className="mb-4 flex h-3 w-3 items-center justify-center">
                <div className="h-3 w-3 rounded-full bg-[#1e3a8a]"></div>
              </div>
              <h3 className="mb-3 text-xl font-bold text-white">
                Trade Category Analysis
              </h3>
              <p className="text-sm leading-relaxed text-slate-300">
                Identifies trade categories detected in estimate. Identifies categories NOT detected. Compares against loss type expectations (observational only).
              </p>
            </div>

            {/* Feature 3 */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 shadow-xl transition hover:border-[#1e3a8a]/50">
              <div className="mb-4 flex h-3 w-3 items-center justify-center">
                <div className="h-3 w-3 rounded-full bg-[#1e3a8a]"></div>
              </div>
              <h3 className="mb-3 text-xl font-bold text-white">
                Line Item Observations
              </h3>
              <p className="text-sm leading-relaxed text-slate-300">
                Detects zero-quantity items. Detects removal without replacement patterns. Detects structural inconsistencies. Reports observations only.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 shadow-xl transition hover:border-[#1e3a8a]/50">
              <div className="mb-4 flex h-3 w-3 items-center justify-center">
                <div className="h-3 w-3 rounded-full bg-[#1e3a8a]"></div>
              </div>
              <h3 className="mb-3 text-xl font-bold text-white">
                Deterministic Output
              </h3>
              <p className="text-sm leading-relaxed text-slate-300">
                Same input = same output (100%). Rule-based findings only. No subjective reasoning. Temperature 0.0 (not AI guessing).
              </p>
            </div>

            {/* Feature 5 */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 shadow-xl transition hover:border-[#1e3a8a]/50">
              <div className="mb-4 flex h-3 w-3 items-center justify-center">
                <div className="h-3 w-3 rounded-full bg-[#1e3a8a]"></div>
              </div>
              <h3 className="mb-3 text-xl font-bold text-white">
                Neutral Findings Report
              </h3>
              <p className="text-sm leading-relaxed text-slate-300">
                5-section structured report. Detected trades, categories not detected, line item observations, comprehensive limitations.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 shadow-xl transition hover:border-[#1e3a8a]/50">
              <div className="mb-4 flex h-3 w-3 items-center justify-center">
                <div className="h-3 w-3 rounded-full bg-[#1e3a8a]"></div>
              </div>
              <h3 className="mb-3 text-xl font-bold text-white">
                Enhanced Safety
              </h3>
              <p className="text-sm leading-relaxed text-slate-300">
                6-layer guardrails. 40+ prohibited phrase scanning. Refuses out-of-scope requests. Clear disclaimers throughout.
              </p>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="mb-16">
          <h2 className="mb-8 text-center text-3xl font-bold text-white md:text-4xl">
            How It Works
          </h2>
          <div className="space-y-4">
            {[
              {
                step: "1",
                title: "Upload Estimate",
                desc: "Paste your insurance estimate text (Xactimate format preferred). Select estimate type and damage type from structured dropdowns.",
              },
              {
                step: "2",
                title: "Xactimate Parsing",
                desc: "System detects Xactimate format with confidence scoring. Parses trade codes, quantities, and units. If confidence < 75%, document is rejected.",
              },
              {
                step: "3",
                title: "Trade Analysis",
                desc: "Identifies trade categories present in estimate. Compares against loss type expectations (WATER, FIRE, WIND, HAIL, COLLISION). Generates observational findings.",
              },
              {
                step: "4",
                title: "Integrity Checks",
                desc: "Runs 8 integrity rules: zero quantities, removal without replacement, drywall without paint, labor without material, and more. Reports observations only.",
              },
              {
                step: "5",
                title: "Neutral Report",
                desc: "Generates structured findings report with comprehensive disclaimers. Same estimate = same report (100% deterministic).",
              },
            ].map((item) => (
              <div
                key={item.step}
                className="flex gap-6 rounded-2xl border border-slate-800 bg-slate-900/50 p-6 shadow-xl"
              >
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-[#1e3a8a] text-xl font-bold text-white">
                  {item.step}
                </div>
                <div>
                  <h3 className="mb-2 text-xl font-bold text-white">
                    {item.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-slate-300">
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section className="mb-16">
          <div className="rounded-3xl border-2 border-[#1e3a8a] bg-gradient-to-br from-[#1e3a8a]/20 to-slate-900/50 p-12 text-center shadow-2xl">
            <h2 className="mb-4 text-3xl font-bold text-white md:text-4xl">
              Ready to Review Your Estimate?
            </h2>
            <p className="mb-8 text-lg text-slate-300">
              Upload your insurance estimate for expert-grade structural analysis.
            </p>
            <Link
              href="/pricing"
              className="inline-flex items-center justify-center rounded-full bg-[#2563EB] px-8 py-4 text-base font-semibold text-white shadow-lg shadow-[#2563EB]/40 transition hover:bg-[#1E40AF]"
            >
              Upload Estimate Now
            </Link>
          </div>
        </section>

        {/* Disclaimer */}
        <section className="mb-8">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/30 p-6 text-center">
            <p className="text-xs leading-relaxed text-slate-400">
              <strong className="text-slate-300">Critical Disclaimer:</strong> This tool provides observational estimate analysis only. It does not provide legal advice, claim strategy, coverage interpretation, policy analysis, pricing opinions, cost assessments, negotiation assistance, advocacy, or determinations about what is owed, covered, or required. For coverage questions, consult your insurance policy or agent. For legal questions, consult an attorney.
            </p>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-900/80 bg-slate-950/80">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 py-6 text-[11px] text-slate-500 sm:flex-row">
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

