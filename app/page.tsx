import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#1e3a8a] shadow-lg shadow-[#1e3a8a]/30">
              <span className="text-sm font-black text-white">ER</span>
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

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-16 px-6 py-12 md:py-20">
        <section className="grid gap-10 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] md:items-center">
          <div className="space-y-8">
            <p className="inline-flex items-center gap-2 rounded-full border border-[#1e3a8a]/40 bg-[#1e3a8a]/20 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.16em] text-blue-200 shadow-sm shadow-[#1e3a8a]/40">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              Built for public adjusters, contractors & claim pros
            </p>
            <div className="space-y-4">
              <h1 className="text-balance text-3xl font-semibold tracking-tight text-slate-50 sm:text-4xl md:text-5xl">
                Understand your estimate.{" "}
                <span className="text-white">
                  Win your claim.
                </span>
              </h1>
              <p className="max-w-xl text-balance text-sm leading-relaxed text-slate-300 md:text-base">
                Upload contractor and carrier estimates plus carrier letters.
                Estimate Review Pro uses OpenAI to extract line items, compare
                scopes, flag missing or underpriced work, and generate a clean
                PDF you can send directly to the carrier or policyholder.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <Link
                href="/register"
                className="inline-flex items-center justify-center rounded-full bg-[#1e3a8a] px-6 py-2.5 text-sm font-semibold text-white shadow-md shadow-[#1e3a8a]/40 hover:bg-[#1e40af]"
              >
                Start a review
              </Link>
              <Link
                href="/pricing"
                className="inline-flex items-center justify-center rounded-full border border-slate-700 px-5 py-2.5 text-xs font-semibold text-slate-200 hover:border-slate-500 hover:text-slate-50"
              >
                View pricing
              </Link>
              <p className="w-full text-xs text-slate-400 md:w-auto md:pl-2">
                No engineering required. Secure, HIPAA-friendly storage via
                Supabase.
              </p>
            </div>
            <dl className="grid gap-4 text-xs text-slate-300 sm:grid-cols-3">
              <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
                <dt className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-400">
                  Turnaround
                </dt>
                <dd className="mt-2 text-base font-semibold text-slate-50">
                  Under 2 minutes
                </dd>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
                <dt className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-400">
                  Formats
                </dt>
                <dd className="mt-2 text-base font-semibold text-slate-50">
                  Xactimate, Symbility, PDFs & photos
                </dd>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
                <dt className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-400">
                  Reports
                </dt>
                <dd className="mt-2 text-base font-semibold text-slate-50">
                  White‑label PDF exports
                </dd>
              </div>
            </dl>
          </div>

          <div className="space-y-4">
            <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-b from-slate-900/80 to-slate-950/90 p-5 shadow-2xl shadow-slate-900/80">
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span className="inline-flex items-center gap-2">
                  <span className="inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  Carrier vs contractor scope
                </span>
                <span className="rounded-full bg-slate-900 px-2 py-0.5 text-[10px] font-medium text-slate-300">
                  Live AI comparison
                </span>
              </div>

              <div className="mt-4 space-y-3 text-xs">
                <div className="grid grid-cols-[1fr_auto_1fr] gap-3 text-[11px] text-slate-300">
                  <div className="rounded-xl border border-slate-800/80 bg-slate-950/70 p-3">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                      Contractor estimate
                    </p>
                    <p className="mt-1 font-medium text-slate-50">
                      Full roof tear‑off, ice & water shield, interior repaint
                    </p>
                  </div>
                  <div className="flex items-center">
                    <span className="mx-auto rounded-full bg-slate-900 px-2 py-1 text-[10px] text-slate-400">
                      ➝ AI review
                    </span>
                  </div>
                  <div className="rounded-xl border border-slate-800/80 bg-slate-950/70 p-3">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                      Carrier estimate
                    </p>
                    <p className="mt-1 font-medium text-slate-50">
                      Spot repairs only, no code upgrades, no interior
                    </p>
                  </div>
                </div>

                <div className="rounded-xl border border-[#1e3a8a]/40 bg-[#1e3a8a]/20 p-3 text-[11px] text-blue-50 shadow-inner shadow-[#1e3a8a]/20">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-blue-200">
                    Key discrepancies
                  </p>
                  <ul className="mt-1 list-disc space-y-1 pl-4">
                    <li>Missing ice & water shield on eaves and valleys</li>
                    <li>Underpriced interior repaint – 2 coats not included</li>
                    <li>No line items for code‑required drip edge</li>
                  </ul>
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3 text-[11px] text-slate-200">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                    Plain‑English summary
                  </p>
                  <p className="mt-1">
                    The carrier&apos;s estimate omits several code‑required
                    items and does not match the contractor&apos;s scope for a
                    full roof replacement. We recommend requesting an updated
                    estimate including ice &amp; water shield, drip edge, and
                    interior repaint.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <p>Trusted workflow for PA firms, roofing companies, and TPAs.</p>
              <p className="hidden text-right sm:block">
                Hosted on Netlify. Auth, storage &amp; RLS security via Supabase.
              </p>
            </div>
          </div>
        </section>

        <section className="grid gap-6 border-y border-slate-800 py-10 md:grid-cols-3">
          <div className="space-y-2">
            <h2 className="text-sm font-semibold text-slate-50">
              Estimate comparison
            </h2>
            <p className="text-xs text-slate-300">
              Parse carrier and contractor estimates into clean line items. See
              missing trades, mis‑categorized scopes, and underpriced work in
              seconds.
            </p>
          </div>
          <div className="space-y-2">
            <h2 className="text-sm font-semibold text-slate-50">
              Carrier report summary
            </h2>
            <p className="text-xs text-slate-300">
              Turn dense engineer or carrier letters into plain‑English
              summaries, including approval/denial reasoning and key technical
              points.
            </p>
          </div>
          <div className="space-y-2">
            <h2 className="text-sm font-semibold text-slate-50">
              Actionable next steps
            </h2>
            <p className="text-xs text-slate-300">
              Every review ends with suggested talking points and questions to
              send back to the carrier, helping you move files toward
              resolution.
            </p>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-900/80 bg-slate-950/80">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-6 text-[11px] text-slate-500 sm:flex-row">
          <p>© {new Date().getFullYear()} Estimate Review Pro. All rights reserved.</p>
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

