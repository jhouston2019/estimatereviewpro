import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-[#0F172A]">
      <header className="border-b border-slate-800/50 bg-[#0F172A]/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#2563EB] shadow-lg shadow-[#2563EB]/30">
              <span className="text-sm font-black text-white">ER</span>
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-sm font-semibold text-white">
                Estimate Review Pro
              </span>
              <span className="text-xs text-slate-400">
                Structured estimate analysis
              </span>
            </div>
          </Link>
          <nav className="flex items-center gap-6 text-sm font-medium text-slate-200">
            <Link
              href="/pricing"
              className="transition hover:text-white"
            >
              Pricing
            </Link>
            <Link
              href="/login"
              className="hidden rounded-full border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-200 hover:border-slate-500 hover:text-white sm:inline-flex"
            >
              Log in
            </Link>
            <Link
              href="/upload"
              className="inline-flex items-center rounded-full bg-[#2563EB] px-5 py-2 text-sm font-semibold text-white shadow-sm shadow-[#2563EB]/40 hover:bg-[#1d4ed8]"
            >
              Start Review
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-16 px-6 py-16 md:py-24">
        <section className="grid gap-12 md:grid-cols-[1.2fr_1fr] md:items-center">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#2563EB]/30 bg-[#2563EB]/10 px-4 py-2 text-xs font-medium uppercase tracking-wider text-blue-300">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              Deterministic • Platform-Aware • Non-Advisory
            </div>
            
            <div className="space-y-6">
              <h1 className="text-balance text-4xl font-bold tracking-tight text-white sm:text-5xl md:text-6xl">
                Structured Estimate Analysis for Claims Teams
              </h1>
              <p className="max-w-xl text-balance text-lg leading-relaxed text-slate-300">
                Identify scope gaps, missing line items, and structural inconsistencies in under 2 minutes. Xactimate-aware parsing with deterministic output.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <Link
                href="/upload"
                className="inline-flex items-center justify-center rounded-full bg-[#2563EB] px-8 py-4 text-base font-semibold text-white shadow-lg shadow-[#2563EB]/40 hover:bg-[#1d4ed8] transition"
              >
                Start Your Estimate Review
              </Link>
              <Link
                href="/pricing"
                className="inline-flex items-center justify-center rounded-full border border-slate-700 px-6 py-4 text-base font-semibold text-slate-200 hover:border-slate-500 hover:text-white transition"
              >
                View pricing
              </Link>
            </div>

            <p className="text-sm text-slate-400">
              $149 one-time • No subscription • Same input = same output
            </p>

            <dl className="grid gap-4 text-xs text-slate-300 sm:grid-cols-3">
              <div className="rounded-xl border border-slate-800 bg-[#0F172A]/60 p-5">
                <dt className="text-xs font-medium uppercase tracking-wider text-slate-400">
                  Turnaround
                </dt>
                <dd className="mt-2 text-xl font-bold text-white">
                  Under 2 min
                </dd>
              </div>
              <div className="rounded-xl border border-slate-800 bg-[#0F172A]/60 p-5">
                <dt className="text-xs font-medium uppercase tracking-wider text-slate-400">
                  Formats
                </dt>
                <dd className="mt-2 text-xl font-bold text-white">
                  Xactimate, PDF
                </dd>
              </div>
              <div className="rounded-xl border border-slate-800 bg-[#0F172A]/60 p-5">
                <dt className="text-xs font-medium uppercase tracking-wider text-slate-400">
                  Output
                </dt>
                <dd className="mt-2 text-xl font-bold text-white">
                  Structured report
                </dd>
              </div>
            </dl>
          </div>

          <div className="space-y-4">
            <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-[#F8FAFC] p-6 shadow-2xl">
              <div className="flex items-center justify-between text-xs text-slate-600 mb-4">
                <span className="inline-flex items-center gap-2 font-semibold">
                  <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                  Estimate Analysis
                </span>
                <span className="rounded-full bg-slate-200 px-3 py-1 text-xs font-medium text-slate-700">
                  Deterministic
                </span>
              </div>

              <div className="space-y-4">
                <div className="rounded-lg border border-slate-200 bg-white p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                    Input Estimate
                  </p>
                  <p className="text-sm font-medium text-slate-900">
                    DRY - Remove drywall - 200 SF<br />
                    DRY - Install drywall - 200 SF<br />
                    FLR - Remove flooring - 150 SF
                  </p>
                </div>

                <div className="rounded-lg border-2 border-[#2563EB] bg-blue-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-blue-700 mb-2">
                    Detected Issues
                  </p>
                  <ul className="space-y-2 text-sm text-blue-900">
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600">•</span>
                      <span>PNT trade not detected (drywall without paint)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600">•</span>
                      <span>FLR removal without replacement detected</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600">•</span>
                      <span>INS trade not detected for water loss</span>
                    </li>
                  </ul>
                </div>

                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-600 mb-2">
                    Structured Findings
                  </p>
                  <p className="text-sm text-slate-700 leading-relaxed">
                    The estimate includes drywall installation without paint trade. Flooring removal is present without reinstallation. Insulation trade is not detected.
                  </p>
                </div>
              </div>
            </div>

            <p className="text-xs text-slate-400 text-center">
              100% deterministic • No subjective reasoning • Observational only
            </p>
          </div>
        </section>

        <section className="grid gap-8 border-y border-slate-800/50 py-12 md:grid-cols-3">
          <div className="space-y-3">
            <div className="flex h-3 w-3 items-center justify-center">
              <div className="h-3 w-3 rounded-full bg-[#2563EB]"></div>
            </div>
            <h2 className="text-lg font-bold text-white">
              Xactimate Detection
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              Parses 30+ trade codes with confidence scoring. Requires ≥75% confidence or rejects document. Deterministic format validation.
            </p>
          </div>
          <div className="space-y-3">
            <div className="flex h-3 w-3 items-center justify-center">
              <div className="h-3 w-3 rounded-full bg-[#2563EB]"></div>
            </div>
            <h2 className="text-lg font-bold text-white">
              Trade Analysis
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              Identifies categories detected and NOT detected. Compares against loss type patterns. Reports observations only.
            </p>
          </div>
          <div className="space-y-3">
            <div className="flex h-3 w-3 items-center justify-center">
              <div className="h-3 w-3 rounded-full bg-[#2563EB]"></div>
            </div>
            <h2 className="text-lg font-bold text-white">
              Integrity Checks
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              Runs 8 structural rules: zero quantities, removal without replacement, drywall without paint. No subjective judgments.
            </p>
          </div>
        </section>

        <section className="rounded-2xl border-2 border-[#2563EB]/30 bg-[#2563EB]/5 p-12 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Analyze Your Estimate?
          </h2>
          <p className="text-lg text-slate-300 mb-8 max-w-2xl mx-auto">
            Upload your insurance estimate for structured analysis. Paste text or upload PDF.
          </p>
          <Link
            href="/upload"
            className="inline-flex items-center justify-center rounded-full bg-[#2563EB] px-10 py-4 text-lg font-semibold text-white shadow-lg shadow-[#2563EB]/40 hover:bg-[#1d4ed8] transition"
          >
            Start Your Estimate Review
          </Link>
          <p className="mt-6 text-sm text-slate-400">
            No credit card required for preview • Full export requires account
          </p>
        </section>
      </main>

      <footer className="border-t border-slate-800/50 bg-[#0F172A]/95">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-8 text-sm text-slate-500 sm:flex-row">
          <p>© {new Date().getFullYear()} Estimate Review Pro. All rights reserved.</p>
          <div className="flex gap-6">
            <Link
              href="/pricing"
              className="hover:text-slate-300 transition"
            >
              Pricing
            </Link>
            <Link
              href="/admin-login.html"
              className="opacity-50 hover:opacity-100 hover:text-slate-300 transition"
            >
              Admin
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
