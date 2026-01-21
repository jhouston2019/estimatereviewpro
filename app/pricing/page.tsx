import Link from "next/link";

export default function PricingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-amber-400 to-sky-500 shadow-lg shadow-amber-500/30">
              <span className="text-sm font-black text-slate-950">ER</span>
            </div>
            <span className="text-sm font-semibold text-slate-50">
              Estimate Review Pro
            </span>
          </Link>
          <nav className="flex items-center gap-4 text-xs font-medium text-slate-200">
            <Link
              href="/login"
              className="hidden rounded-full border border-slate-700 px-4 py-1.5 hover:border-slate-500 hover:text-slate-50 sm:inline-flex"
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

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-10 px-6 py-12 md:py-16">
        <section className="text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-amber-300">
            Pricing
          </p>
          <h1 className="mt-3 text-balance text-3xl font-semibold tracking-tight text-slate-50 md:text-4xl">
            Simple pricing for serious claim professionals.
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-slate-300 md:text-base">
            Start with a single review or switch your team to unlimited monthly
            usage. Every plan includes AI estimate comparison, carrier letter
            summaries, PDF reports, and secure storage.
          </p>
        </section>

        <section className="grid gap-6 md:grid-cols-2">
          <div className="flex flex-col rounded-3xl border border-slate-800 bg-slate-950/60 p-6 shadow-xl shadow-slate-950/70">
            <h2 className="text-sm font-semibold text-slate-50">
              $49 One‑Time Review
            </h2>
            <p className="mt-1 text-xs text-slate-300">
              Best for occasional claims or trying Estimate Review Pro on a live
              file.
            </p>
            <p className="mt-4 text-3xl font-semibold text-slate-50">
              $49{" "}
              <span className="text-xs font-normal text-slate-400">
                per review
              </span>
            </p>
            <ul className="mt-4 space-y-2 text-xs text-slate-200">
              <li>✓ Upload carrier + contractor estimates</li>
              <li>✓ Full AI line‑item analysis</li>
              <li>✓ Carrier letter / engineer report summary</li>
              <li>✓ Downloadable PDF report included</li>
              <li>✓ Stored in your dashboard for future access</li>
            </ul>
            <div className="mt-6">
              <Link
                href="/register?plan=oneoff"
                className="inline-flex w-full items-center justify-center rounded-full border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm font-semibold text-slate-50 hover:border-slate-500 hover:bg-slate-800"
              >
                Purchase a single review
              </Link>
            </div>
          </div>

          <div className="relative flex flex-col rounded-3xl border border-amber-400/80 bg-gradient-to-b from-amber-500/10 via-amber-500/5 to-slate-950 p-6 shadow-xl shadow-amber-500/40">
            <div className="absolute right-4 top-4 rounded-full bg-amber-400 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-950">
              Most popular
            </div>
            <h2 className="text-sm font-semibold text-slate-50">
              $249/mo Unlimited
            </h2>
            <p className="mt-1 text-xs text-slate-100">
              For PA firms, roofing companies, and claim teams running multiple
              files per month.
            </p>
            <p className="mt-4 text-3xl font-semibold text-slate-50">
              $249{" "}
              <span className="text-xs font-normal text-slate-200">
                per user / month
              </span>
            </p>
            <ul className="mt-4 space-y-2 text-xs text-slate-100">
              <li>✓ Unlimited estimate reviews per user</li>
              <li>✓ Team usage allowed within your firm</li>
              <li>✓ Priority processing for every file</li>
              <li>✓ White‑label PDF output with your branding</li>
              <li>✓ Full access to dashboard history and re‑runs</li>
            </ul>
            <div className="mt-6">
              <Link
                href="/register?plan=pro"
                className="inline-flex w-full items-center justify-center rounded-full bg-gradient-to-r from-amber-400 via-amber-300 to-sky-400 px-4 py-2.5 text-sm font-semibold text-slate-950 shadow-md shadow-amber-500/40 hover:brightness-105"
              >
                Upgrade to Unlimited
              </Link>
            </div>
          </div>
        </section>

        <section className="mt-2 grid gap-6 rounded-3xl border border-slate-900 bg-slate-950/70 p-6 text-xs text-slate-300 md:grid-cols-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
              Secure by design
            </p>
            <p className="mt-2">
              Estimates and reports are stored in Supabase with row‑level
              security. Only you – and your team, if enabled – can access your
              files.
            </p>
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
              Cancel anytime
            </p>
            <p className="mt-2">
              Manage billing and invoices through the Stripe customer portal.
              Downgrade or cancel in one click without emailing support.
            </p>
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
              Built for production
            </p>
            <p className="mt-2">
              Deployed on Netlify with serverless functions for AI analysis,
              Stripe billing, and PDF rendering – without sharing your API keys
              client‑side.
            </p>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-900/80 bg-slate-950/80">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6 text-[11px] text-slate-500">
          <p>© {new Date().getFullYear()} Estimate Review Pro.</p>
          <Link
            href="/"
            className="hover:text-slate-300 hover:underline hover:underline-offset-4"
          >
            Back to home
          </Link>
        </div>
      </footer>
    </div>
  );
}


