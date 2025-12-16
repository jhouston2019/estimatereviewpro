import Link from "next/link";
import { SectionCard } from "@/components/SectionCard";

export default function HowItWorksPage() {
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
            <Link href="/pricing" className="hover:text-slate-50">Pricing</Link>
            <Link href="/how-it-works" className="text-amber-300">How It Works</Link>
            <Link href="/login" className="rounded-full border border-slate-700 px-3 py-1.5 hover:border-slate-500">
              Sign In
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-12 px-6 py-16">
        <section className="text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-amber-300">
            How It Works
          </p>
          <h1 className="mt-2 text-4xl font-bold tracking-tight text-slate-50">
            5 Steps to Professional Estimate Analysis
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm text-slate-300">
            Our AI-powered platform analyzes insurance estimates in minutes, not hours.
          </p>
        </section>

        <div className="space-y-6">
          <SectionCard title="Step 1: Upload Your Estimates">
            <p className="text-xs text-slate-300">
              Upload your contractor estimate and carrier estimate (if available). We support PDF, PNG, and JPG files up to 10MB. Works with Xactimate, Symbility, and handwritten estimates.
            </p>
            <div className="mt-4 rounded-lg border border-slate-800 bg-slate-900/50 p-4">
              <p className="text-[11px] font-semibold text-slate-400">Supported Formats:</p>
              <ul className="mt-2 space-y-1 text-xs text-slate-300">
                <li>• PDF exports from Xactimate, Symbility, or other estimating software</li>
                <li>• Scanned images (PNG, JPG)</li>
                <li>• Handwritten estimates (clear photos)</li>
              </ul>
            </div>
          </SectionCard>

          <SectionCard title="Step 2: AI Extracts Every Line Item">
            <p className="text-xs text-slate-300">
              Our advanced AI reads your estimate and extracts every line item with precision. We capture trade, description, quantity, unit price, and total for each item.
            </p>
            <div className="mt-4 rounded-lg border border-slate-800 bg-slate-900/50 p-4">
              <p className="text-[11px] font-semibold text-slate-400">What We Extract:</p>
              <ul className="mt-2 space-y-1 text-xs text-slate-300">
                <li>• Trade category (Roofing, Siding, Interior, etc.)</li>
                <li>• Item description</li>
                <li>• Quantity and unit of measure</li>
                <li>• Unit price and line total</li>
                <li>• Notes and special conditions</li>
              </ul>
            </div>
          </SectionCard>

          <SectionCard title="Step 3: AI Compares to Carrier Estimate">
            <p className="text-xs text-slate-300">
              If you uploaded a carrier estimate, we compare it line-by-line to your contractor estimate. Our AI identifies missing items, underpriced items, and mis-categorized work.
            </p>
            <div className="mt-4 rounded-lg border border-slate-800 bg-slate-900/50 p-4">
              <p className="text-[11px] font-semibold text-slate-400">Comparison Analysis:</p>
              <ul className="mt-2 space-y-1 text-xs text-slate-300">
                <li>• Missing items (in contractor but not carrier)</li>
                <li>• Underpriced items (significant price differences)</li>
                <li>• Mis-categorized items (wrong trade assignment)</li>
                <li>• Total difference calculation</li>
              </ul>
            </div>
          </SectionCard>

          <SectionCard title="Step 4: AI Summarizes Carrier Letters">
            <p className="text-xs text-slate-300">
              Upload carrier denial letters or engineer reports, and our AI translates the technical jargon into plain English. Get clear summaries of approval/denial reasons and recommended next steps.
            </p>
            <div className="mt-4 rounded-lg border border-slate-800 bg-slate-900/50 p-4">
              <p className="text-[11px] font-semibold text-slate-400">Summary Includes:</p>
              <ul className="mt-2 space-y-1 text-xs text-slate-300">
                <li>• Plain English summary of technical language</li>
                <li>• Approval/denial status</li>
                <li>• Key findings and reasoning</li>
                <li>• Recommended next steps</li>
              </ul>
            </div>
          </SectionCard>

          <SectionCard title="Step 5: Download Professional PDF Report">
            <p className="text-xs text-slate-300">
              Receive a professionally formatted PDF report with all findings, comparisons, and summaries. Perfect for client presentations, insurance negotiations, or internal documentation.
            </p>
            <div className="mt-4 rounded-lg border border-slate-800 bg-slate-900/50 p-4">
              <p className="text-[11px] font-semibold text-slate-400">Report Includes:</p>
              <ul className="mt-2 space-y-1 text-xs text-slate-300">
                <li>• Executive summary with key findings</li>
                <li>• Complete line item comparison tables</li>
                <li>• Missing and underpriced item highlights</li>
                <li>• Carrier letter summary (if provided)</li>
                <li>• Professional formatting ready for clients</li>
              </ul>
            </div>
          </SectionCard>
        </div>

        <section className="text-center">
          <Link
            href="/register"
            className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-amber-400 via-amber-300 to-sky-400 px-6 py-3 text-sm font-semibold text-slate-950 shadow-md shadow-amber-500/40 hover:brightness-105"
          >
            Get Started Now
          </Link>
          <p className="mt-4 text-xs text-slate-400">
            Results in under 5 minutes. No credit card required to sign up.
          </p>
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

