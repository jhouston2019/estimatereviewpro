"use client";

import Link from "next/link";
import { useState } from "react";

export default function PricingPage() {
  const [loading, setLoading] = useState<string | null>(null);

  const handleCheckout = async (planType: 'single' | 'enterprise' | 'litigation') => {
    setLoading(planType);

    try {
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planType }),
      });

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error(data.error || 'Failed to create checkout session');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      alert('Failed to start checkout. Please try again.');
    } finally {
      setLoading(null);
    }
  };

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
            <Link href="/pricing" className="text-white">
              Pricing
            </Link>
            <Link
              href="/login"
              className="rounded-full border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-200 hover:border-slate-500 hover:text-white transition"
            >
              Log in
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-[1100px] flex-1 flex-col px-6 py-16">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-white mb-4">
            Find $10,000–$40,000 in Missed Claim Value
          </h1>
          <p className="text-xl text-slate-300 mb-2">
            In Minutes.
          </p>
          <p className="text-lg text-slate-400">
            Pay $49 → Potentially recover $10K–$40K
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          {/* Single Review */}
          <div className="rounded-lg border-2 border-[#2563EB] bg-[#F8FAFC] p-8 relative">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2">
              <span className="bg-[#2563EB] text-white px-4 py-1 rounded-full text-sm font-semibold">
                Most Popular
              </span>
            </div>

            <div className="mb-6">
              <h2 className="text-2xl font-bold text-slate-900 mb-2">
                Single Review
              </h2>
              <div className="flex items-baseline gap-2 mb-4">
                <span className="text-5xl font-bold text-slate-900">$49</span>
                <span className="text-slate-600">per estimate</span>
              </div>
              <p className="text-xs text-slate-600">
                One-time payment
              </p>
            </div>

            <ul className="space-y-3 mb-8">
              <li className="flex items-start gap-2 text-sm text-slate-700">
                <svg className="h-5 w-5 text-[#2563EB] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span><strong>Comprehensive estimate analysis</strong></span>
              </li>
              <li className="flex items-start gap-2 text-sm text-slate-700">
                <svg className="h-5 w-5 text-[#2563EB] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>11 intelligence engines</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-slate-700">
                <svg className="h-5 w-5 text-[#2563EB] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Recovery calculation</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-slate-700">
                <svg className="h-5 w-5 text-[#2563EB] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Litigation evidence</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-slate-700">
                <svg className="h-5 w-5 text-[#2563EB] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>PDF export</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-slate-700">
                <svg className="h-5 w-5 text-[#2563EB] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>30-day report access</span>
              </li>
            </ul>

            <button
              onClick={() => handleCheckout('single')}
              disabled={loading === 'single'}
              className="w-full rounded-lg bg-[#2563EB] px-6 py-3 text-base font-semibold text-white hover:bg-[#1E40AF] transition disabled:opacity-50 shadow-lg"
            >
              {loading === 'single' ? 'Loading...' : 'Start Review'}
            </button>
          </div>

          {/* Enterprise */}
          <div className="rounded-lg border border-slate-800 bg-[#F8FAFC] p-8">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-slate-900 mb-2">
                Enterprise
              </h2>
              <div className="flex items-baseline gap-2 mb-4">
                <span className="text-5xl font-bold text-slate-900">$299</span>
                <span className="text-slate-600">/month</span>
              </div>
              <p className="text-sm text-green-700 font-semibold mb-2">
                ✓ Recovery Guarantee
              </p>
              <p className="text-xs text-slate-600">
                Billed monthly
              </p>
            </div>

            <ul className="space-y-3 mb-8">
              <li className="flex items-start gap-2 text-sm text-slate-700">
                <svg className="h-5 w-5 text-[#2563EB] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span><strong>20 reviews per month</strong></span>
              </li>
              <li className="flex items-start gap-2 text-sm text-slate-700">
                <svg className="h-5 w-5 text-[#2563EB] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Carrier intelligence reports</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-slate-700">
                <svg className="h-5 w-5 text-[#2563EB] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Recovery analytics dashboard</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-slate-700">
                <svg className="h-5 w-5 text-[#2563EB] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Priority support</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-slate-700">
                <svg className="h-5 w-5 text-[#2563EB] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>API access</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-slate-700">
                <svg className="h-5 w-5 text-[#2563EB] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Bulk upload</span>
              </li>
            </ul>

            <button
              onClick={() => handleCheckout('enterprise')}
              disabled={loading === 'enterprise'}
              className="w-full rounded-lg bg-slate-900 px-6 py-3 text-base font-semibold text-white hover:bg-slate-800 transition disabled:opacity-50"
            >
              {loading === 'enterprise' ? 'Loading...' : 'Start Enterprise Plan'}
            </button>
          </div>

          {/* Litigation */}
          <div className="rounded-lg border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-800 p-8 relative">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2">
              <span className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
                Premium
              </span>
            </div>

            <div className="mb-6">
              <h2 className="text-2xl font-bold text-white mb-2">
                Litigation
              </h2>
              <div className="flex items-baseline gap-2 mb-4">
                <span className="text-5xl font-bold text-white">$499</span>
                <span className="text-slate-300">/month</span>
              </div>
              <p className="text-sm text-green-400 font-semibold mb-2">
                ✓ Recovery Guarantee
              </p>
              <p className="text-xs text-slate-400">
                Billed monthly
              </p>
            </div>

            <ul className="space-y-3 mb-8">
              <li className="flex items-start gap-2 text-sm text-slate-200">
                <svg className="h-5 w-5 text-blue-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span><strong>Unlimited reviews</strong></span>
              </li>
              <li className="flex items-start gap-2 text-sm text-slate-200">
                <svg className="h-5 w-5 text-blue-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Attorney-ready evidence reports</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-slate-200">
                <svg className="h-5 w-5 text-blue-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Carrier behavior analytics</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-slate-200">
                <svg className="h-5 w-5 text-blue-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Litigation exhibits</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-slate-200">
                <svg className="h-5 w-5 text-blue-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Expert witness support</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-slate-200">
                <svg className="h-5 w-5 text-blue-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Priority processing</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-slate-200">
                <svg className="h-5 w-5 text-blue-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Dedicated account manager</span>
              </li>
            </ul>

            <button
              onClick={() => handleCheckout('litigation')}
              disabled={loading === 'litigation'}
              className="w-full rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 px-6 py-3 text-base font-semibold text-white hover:from-purple-700 hover:to-blue-700 transition disabled:opacity-50 shadow-lg"
            >
              {loading === 'litigation' ? 'Loading...' : 'Start Litigation Plan'}
            </button>
          </div>
        </div>

        {/* Value Proposition */}
        <div className="mt-16 grid gap-8 md:grid-cols-3">
          <div className="text-center">
            <div className="text-4xl font-bold text-green-400 mb-2">$10K-$40K</div>
            <p className="text-slate-300">Average recovery identified</p>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-blue-400 mb-2">11</div>
            <p className="text-slate-300">Intelligence engines</p>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-purple-400 mb-2">100%</div>
            <p className="text-slate-300">Recovery guarantee</p>
          </div>
        </div>

        <div className="mt-12 text-center">
          <p className="text-sm text-slate-400">
            All plans include: Pricing validation • Labor rate analysis • Depreciation detection • Carrier tactic recognition • 
            Code compliance checking • Trade dependency analysis • Scope reconstruction • Litigation evidence generation
          </p>
        </div>
      </main>

      <footer className="border-t border-slate-800/50 bg-[#0F172A]/95">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-8 text-sm text-slate-500 sm:flex-row">
          <p>© {new Date().getFullYear()} Estimate Review Pro. All rights reserved.</p>
          <div className="flex gap-6">
            <Link href="/pricing" className="hover:text-slate-300 transition">
              Pricing
            </Link>
            <Link href="/" className="hover:text-slate-300 transition">
              Home
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
