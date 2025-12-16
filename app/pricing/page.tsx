import Link from "next/link";

export default function PricingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-950">
      <header className="border-b border-slate-800 bg-slate-950/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-amber-400 to-sky-500 shadow-lg shadow-amber-500/30">
              <span className="text-xs font-black text-slate-950">ER</span>
            </div>
            <span className="text-sm font-semibold text-slate-50">
              Estimate Review Pro
            </span>
          </Link>
          <nav className="flex items-center gap-4 text-xs font-medium text-slate-200">
            <Link href="/pricing" className="text-amber-300">Pricing</Link>
            <Link href="/how-it-works" className="hover:text-slate-50">How It Works</Link>
            <Link href="/login" className="rounded-full border border-slate-700 px-3 py-1.5 hover:border-slate-500">
              Sign In
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-12 px-6 py-16">
        <section className="text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-amber-300">
            Pricing
          </p>
          <h1 className="mt-2 text-4xl font-bold tracking-tight text-slate-50">
            Choose Your Plan
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm text-slate-300">
            Get AI-powered estimate analysis with professional PDF reports. No hidden fees.
          </p>
        </section>

        <section className="grid gap-8 md:grid-cols-2">
          {/* One-Off Review */}
          <div className="rounded-3xl border border-slate-800 bg-slate-950/60 p-8">
            <h3 className="text-lg font-semibold text-slate-50">One-Time Review</h3>
            <p className="mt-2 text-xs text-slate-300">
              Perfect for a single estimate analysis
            </p>
            <div className="mt-6">
              <span className="text-4xl font-bold text-slate-50">$79</span>
              <span className="ml-2 text-sm text-slate-400">one-time</span>
            </div>
            <ul className="mt-6 space-y-3 text-sm text-slate-200">
              <li className="flex items-start gap-2">
                <svg className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Full AI analysis of contractor & carrier estimates</span>
              </li>
              <li className="flex items-start gap-2">
                <svg className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Line-by-line comparison with discrepancies</span>
              </li>
              <li className="flex items-start gap-2">
                <svg className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Professional PDF report</span>
              </li>
              <li className="flex items-start gap-2">
                <svg className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Stored in your dashboard</span>
              </li>
              <li className="flex items-start gap-2">
                <svg className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Results in under 5 minutes</span>
              </li>
            </ul>
            <Link
              href="/register"
              className="mt-8 block w-full rounded-full bg-slate-800 py-3 text-center text-sm font-semibold text-slate-50 hover:bg-slate-700"
            >
              Get Started
            </Link>
          </div>

          {/* Pro Subscription */}
          <div className="relative rounded-3xl border border-amber-400/80 bg-gradient-to-b from-amber-500/10 via-amber-500/5 to-slate-950 p-8">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <span className="rounded-full bg-amber-400 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-950">
                Best Value
              </span>
            </div>
            <h3 className="text-lg font-semibold text-slate-50">Unlimited Pro</h3>
            <p className="mt-2 text-xs text-slate-100">
              For professionals running multiple claims
            </p>
            <div className="mt-6">
              <span className="text-4xl font-bold text-slate-50">$249</span>
              <span className="ml-2 text-sm text-slate-300">/month</span>
            </div>
            <ul className="mt-6 space-y-3 text-sm text-slate-100">
              <li className="flex items-start gap-2">
                <svg className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="font-semibold">Unlimited reviews</span>
              </li>
              <li className="flex items-start gap-2">
                <svg className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Everything in One-Time Review</span>
              </li>
              <li className="flex items-start gap-2">
                <svg className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Priority processing</span>
              </li>
              <li className="flex items-start gap-2">
                <svg className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>White-label PDF reports</span>
              </li>
              <li className="flex items-start gap-2">
                <svg className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Early access to new features</span>
              </li>
              <li className="flex items-start gap-2">
                <svg className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Cancel anytime</span>
              </li>
            </ul>
            <Link
              href="/register"
              className="mt-8 block w-full rounded-full bg-gradient-to-r from-amber-400 via-amber-300 to-sky-400 py-3 text-center text-sm font-semibold text-slate-950 shadow-md shadow-amber-500/40 hover:brightness-105"
            >
              Start Free Trial
            </Link>
          </div>
        </section>

        <section className="mx-auto max-w-3xl text-center">
          <h2 className="text-2xl font-semibold text-slate-50">Frequently Asked Questions</h2>
          <div className="mt-8 space-y-6 text-left">
            <div>
              <h3 className="text-sm font-semibold text-slate-200">How accurate is the AI analysis?</h3>
              <p className="mt-2 text-xs text-slate-400">
                Our AI is trained on thousands of insurance estimates and achieves 95%+ accuracy in line item extraction and comparison.
              </p>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-200">What file formats do you support?</h3>
              <p className="mt-2 text-xs text-slate-400">
                We support PDF, PNG, and JPG files up to 10MB. Works with Xactimate, Symbility, and handwritten estimates.
              </p>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-200">Can I cancel my subscription?</h3>
              <p className="mt-2 text-xs text-slate-400">
                Yes, you can cancel anytime from your account page. No questions asked.
              </p>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-800 py-8">
        <div className="mx-auto max-w-6xl px-6 text-center text-xs text-slate-400">
          <p>&copy; 2024 Estimate Review Pro. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
