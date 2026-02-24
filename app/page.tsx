import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-[#0F172A]">
      <header className="border-b border-slate-800/50 bg-[#0F172A]/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#2563EB]">
              <span className="text-sm font-black text-white">ER</span>
            </div>
            <span className="text-sm font-semibold text-white">
              Estimate Review Pro
            </span>
          </Link>
          <nav className="flex items-center gap-6 text-sm font-medium">
            <Link
              href="/examples"
              className="text-slate-200 hover:text-white transition"
            >
              Examples
            </Link>
            <Link
              href="/pricing"
              className="text-slate-200 hover:text-white transition"
            >
              Pricing
            </Link>
            <Link
              href="/login"
              className="rounded-full border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-200 hover:border-slate-500 hover:text-white transition"
            >
              Log in
            </Link>
            <Link
              href="/pricing"
              className="rounded-full bg-[#2563EB] px-5 py-2 text-sm font-semibold text-white hover:bg-[#1E40AF] transition"
            >
              Start Review
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-[1100px] flex-1 flex-col px-6 py-16 md:py-24">
        {/* Hero Section */}
        <section className="mb-20 text-center">
          <h1 className="mb-6 text-4xl font-bold tracking-tight text-white md:text-5xl lg:text-[48px]">
            Structured Estimate Analysis
          </h1>
          <p className="mx-auto mb-10 max-w-3xl text-lg leading-relaxed text-slate-300 md:text-xl">
            Identify scope gaps, missing line items, and structural inconsistencies in under 2 minutes.
          </p>

          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/pricing"
              className="inline-flex items-center justify-center rounded-lg bg-[#2563EB] px-8 py-4 text-base font-semibold text-white hover:bg-[#1E40AF] transition"
            >
              Start Review
            </Link>
            <Link
              href="/examples"
              className="inline-flex items-center justify-center rounded-lg border border-slate-700 px-8 py-4 text-base font-semibold text-slate-200 hover:border-slate-500 hover:text-white transition"
            >
              See Example Report
            </Link>
          </div>

          <p className="mt-8 text-sm text-slate-400">
            Xactimate-aware. Deterministic output. Structured findings only.
          </p>
        </section>

        {/* Feature Strip */}
        <section className="mb-20 grid gap-8 md:grid-cols-3">
          <div className="rounded-lg border border-slate-800 bg-[#F8FAFC] p-8">
            <h2 className="mb-3 text-xl font-bold text-slate-900">
              Estimate Comparison
            </h2>
            <p className="text-sm leading-relaxed text-slate-700">
              Parse carrier and contractor estimates into structured line items. Detect missing trades, incomplete scope, and misaligned quantities.
            </p>
          </div>

          <div className="rounded-lg border border-slate-800 bg-[#F8FAFC] p-8">
            <h2 className="mb-3 text-xl font-bold text-slate-900">
              Carrier Letter Parsing
            </h2>
            <p className="text-sm leading-relaxed text-slate-700">
              Convert carrier explanations and engineer letters into plain-English structured summaries.
            </p>
          </div>

          <div className="rounded-lg border border-slate-800 bg-[#F8FAFC] p-8">
            <h2 className="mb-3 text-xl font-bold text-slate-900">
              Export-Ready Reports
            </h2>
            <p className="text-sm leading-relaxed text-slate-700">
              Generate clean, white-label PDFs suitable for file documentation or submission.
            </p>
          </div>
        </section>

        {/* How It Works */}
        <section className="mb-20">
          <h2 className="mb-10 text-center text-3xl font-bold text-white">
            How It Works
          </h2>
          <div className="grid gap-6 md:grid-cols-4">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-[#2563EB] text-xl font-bold text-white">
                1
              </div>
              <h3 className="mb-2 text-base font-semibold text-white">
                Upload Estimate
              </h3>
              <p className="text-sm text-slate-400">
                Drag & drop or paste text
              </p>
            </div>

            <div className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-[#2563EB] text-xl font-bold text-white">
                2
              </div>
              <h3 className="mb-2 text-base font-semibold text-white">
                Engine Analyzes Line Items
              </h3>
              <p className="text-sm text-slate-400">
                Parses structure and scope
              </p>
            </div>

            <div className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-[#2563EB] text-xl font-bold text-white">
                3
              </div>
              <h3 className="mb-2 text-base font-semibold text-white">
                Review Structured Findings
              </h3>
              <p className="text-sm text-slate-400">
                Preview results instantly
              </p>
            </div>

            <div className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-[#2563EB] text-xl font-bold text-white">
                4
              </div>
              <h3 className="mb-2 text-base font-semibold text-white">
                Export or Save to Dashboard
              </h3>
              <p className="text-sm text-slate-400">
                Download PDF or save
              </p>
            </div>
          </div>
        </section>

        {/* Positioning Block */}
        <section className="mb-20 rounded-lg border border-slate-800 bg-slate-900/50 p-10 text-center">
          <p className="text-lg leading-relaxed text-slate-300">
            Built for public adjusters, contractors, and claims professionals who need structured analysis — not opinions.
          </p>
        </section>

        {/* Final CTA */}
        <section className="text-center">
          <Link
            href="/pricing"
            className="inline-flex items-center justify-center rounded-lg bg-[#2563EB] px-10 py-4 text-lg font-semibold text-white hover:bg-[#1E40AF] transition"
          >
            Run Your First Review
          </Link>
        </section>
      </main>

      <footer className="border-t border-slate-800/50 bg-[#0F172A]/95">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-8 text-sm text-slate-500 sm:flex-row">
          <p>© {new Date().getFullYear()} Estimate Review Pro. All rights reserved.</p>
          <div className="flex gap-6">
            <Link href="/pricing" className="hover:text-slate-300 transition">
              Pricing
            </Link>
            <Link href="/admin-login.html" className="opacity-50 hover:opacity-100 hover:text-slate-300 transition">
              Admin
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
