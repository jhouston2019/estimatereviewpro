"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabaseClient";

export const dynamic = 'force-dynamic';

export default function PricingPage() {
  const [loading, setLoading] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createSupabaseBrowserClient();
      const { data: { session } } = await supabase.auth.getSession();
      setUserId(session?.user?.id || null);
    };
    checkAuth();
  }, []);

  const handleCheckout = async (planType: 'single' | 'professional' | 'enterprise') => {
    setLoading(planType);

    // Check if user is authenticated
    if (!userId) {
      // Redirect to login with return URL
      const returnUrl = encodeURIComponent(`/pricing?plan=${planType}`);
      window.location.href = `/login?redirectedFrom=${returnUrl}`;
      return;
    }

    try {
      if (planType === 'single') {
        // Create single review checkout session
        const response = await fetch('/api/checkout-single-plan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId }),
        });

        const data = await response.json();

        if (data.url) {
          window.location.href = data.url;
        } else {
          throw new Error(data.error || 'Failed to create checkout session');
        }
      } else {
        // Create subscription checkout session
        const response = await fetch('/api/checkout-subscription', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            planType,
            userId,
            teamName: `${planType} Team`,
          }),
        });

        const data = await response.json();

        if (data.url) {
          window.location.href = data.url;
        } else {
          throw new Error(data.error || 'Failed to create checkout session');
        }
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
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-white mb-4">
            Simple, Transparent Pricing
          </h1>
          <p className="text-lg text-slate-400">
            Choose the plan that fits your needs
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          {/* Pay Per Estimate */}
          <div className="rounded-lg border border-slate-800 bg-[#F8FAFC] p-8">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-slate-900 mb-2">
                Pay Per Estimate
              </h2>
              <div className="flex items-baseline gap-2 mb-4">
                <span className="text-5xl font-bold text-slate-900">$49</span>
                <span className="text-slate-600">per review</span>
              </div>
              <p className="text-sm text-slate-600">
                One-time payment
              </p>
            </div>

            <ul className="space-y-3 mb-8">
              <li className="flex items-start gap-2 text-sm text-slate-700">
                <svg className="h-5 w-5 text-[#2563EB] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Full dashboard view</span>
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
              className="w-full rounded-lg bg-slate-900 px-6 py-3 text-base font-semibold text-white hover:bg-slate-800 transition disabled:opacity-50"
            >
              {loading === 'single' ? 'Loading...' : 'Run Single Review'}
            </button>
          </div>

          {/* Professional */}
          <div className="rounded-lg border-2 border-[#2563EB] bg-[#F8FAFC] p-8 relative">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2">
              <span className="bg-[#2563EB] text-white px-4 py-1 rounded-full text-sm font-semibold">
                Most Popular
              </span>
            </div>

            <div className="mb-6">
              <h2 className="text-2xl font-bold text-slate-900 mb-2">
                Professional
              </h2>
              <div className="flex items-baseline gap-2 mb-4">
                <span className="text-5xl font-bold text-slate-900">$299</span>
                <span className="text-slate-600">/month</span>
              </div>
              <p className="text-sm text-slate-600">
                Billed monthly
              </p>
            </div>

            <ul className="space-y-3 mb-8">
              <li className="flex items-start gap-2 text-sm text-slate-700">
                <svg className="h-5 w-5 text-[#2563EB] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span><strong>50 reviews per month</strong></span>
              </li>
              <li className="flex items-start gap-2 text-sm text-slate-700">
                <svg className="h-5 w-5 text-[#2563EB] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Up to 5 users</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-slate-700">
                <svg className="h-5 w-5 text-[#2563EB] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Comparison mode</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-slate-700">
                <svg className="h-5 w-5 text-[#2563EB] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Unlimited exports</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-slate-700">
                <svg className="h-5 w-5 text-[#2563EB] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Report archive</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-slate-600">
                <span className="text-xs">Overage: $29 per additional review</span>
              </li>
            </ul>

            <button
              onClick={() => handleCheckout('professional')}
              disabled={loading === 'professional'}
              className="w-full rounded-lg bg-[#2563EB] px-6 py-3 text-base font-semibold text-white hover:bg-[#1E40AF] transition disabled:opacity-50"
            >
              {loading === 'professional' ? 'Loading...' : 'Start Professional'}
            </button>
          </div>

          {/* Enterprise */}
          <div className="rounded-lg border border-slate-800 bg-[#F8FAFC] p-8">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-slate-900 mb-2">
                Enterprise
              </h2>
              <div className="flex items-baseline gap-2 mb-4">
                <span className="text-5xl font-bold text-slate-900">$599</span>
                <span className="text-slate-600">/month</span>
              </div>
              <p className="text-sm text-slate-600">
                Billed monthly
              </p>
            </div>

            <ul className="space-y-3 mb-8">
              <li className="flex items-start gap-2 text-sm text-slate-700">
                <svg className="h-5 w-5 text-[#2563EB] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span><strong>150 reviews per month</strong></span>
              </li>
              <li className="flex items-start gap-2 text-sm text-slate-700">
                <svg className="h-5 w-5 text-[#2563EB] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Unlimited users</span>
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
                <span>White-label export</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-slate-700">
                <svg className="h-5 w-5 text-[#2563EB] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Analytics dashboard</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-slate-600">
                <span className="text-xs">Overage: $19 per additional review</span>
              </li>
            </ul>

            <button
              onClick={() => handleCheckout('enterprise')}
              disabled={loading === 'enterprise'}
              className="w-full rounded-lg bg-slate-900 px-6 py-3 text-base font-semibold text-white hover:bg-slate-800 transition disabled:opacity-50"
            >
              {loading === 'enterprise' ? 'Loading...' : 'Start Enterprise'}
            </button>
          </div>
        </div>

        <div className="mt-16 text-center">
          <p className="text-sm text-slate-400">
            All plans include structured findings, Xactimate-aware parsing, and deterministic output.
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
