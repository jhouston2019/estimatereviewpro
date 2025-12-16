"use client";

import { useState } from "react";

export default function PricingPage() {
  const [loading, setLoading] = useState<string | null>(null);

  const handleCheckout = async (plan: "individual" | "firm" | "pro") => {
    setLoading(plan);

    try {
      const endpoint =
        plan === "individual"
          ? "/.netlify/functions/create-individual-checkout"
          : "/.netlify/functions/create-firm-checkout";

      const body =
        plan === "individual"
          ? { email: "customer@example.com" } // Replace with actual user email
          : { plan: plan, email: "customer@example.com" }; // Replace with actual user email

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        alert("Error creating checkout session");
      }
    } catch (error) {
      console.error("Checkout error:", error);
      alert("Error creating checkout session");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="max-w-5xl mx-auto px-6 py-16 text-center">
        <h1 className="text-4xl font-bold text-neutral-900 mb-4">
          Simple, Transparent Pricing
        </h1>
      </div>

      {/* Policyholder Pricing (Primary) */}
      <div className="max-w-5xl mx-auto px-6 pb-12">
        <div className="max-w-md mx-auto">
          <div className="border-2 border-blue-600 rounded-lg p-8 bg-blue-50 shadow-lg">
            <h2 className="text-2xl font-bold text-neutral-900 mb-2">
              Professional Estimate Review
            </h2>
            <div className="mb-6">
              <span className="text-5xl font-bold text-neutral-900">$149</span>
              <span className="text-neutral-600 ml-2">— one-time</span>
            </div>

            <ul className="space-y-3 mb-8 text-neutral-700">
              <li className="flex items-start">
                <svg
                  className="w-5 h-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>Upload your contractor or insurance estimate</span>
              </li>
              <li className="flex items-start">
                <svg
                  className="w-5 h-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>Line-by-line review and issue flagging</span>
              </li>
              <li className="flex items-start">
                <svg
                  className="w-5 h-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>Plain-English explanation</span>
              </li>
              <li className="flex items-start">
                <svg
                  className="w-5 h-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>Downloadable PDF summary</span>
              </li>
            </ul>

            <button
              onClick={() => handleCheckout("individual")}
              disabled={loading === "individual"}
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading === "individual" ? "Loading..." : "Upload & Get Started"}
            </button>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="text-center text-neutral-500 text-sm font-medium">
          For firms, adjusters, and professionals
        </div>
      </div>

      {/* Firm Pricing */}
      <div className="max-w-5xl mx-auto px-6 pb-20">
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Firm Plan */}
          <div className="border border-neutral-300 rounded-lg p-8 bg-white shadow">
            <h2 className="text-2xl font-bold text-neutral-900 mb-2">
              Firm Plan
            </h2>
            <div className="mb-6">
              <span className="text-4xl font-bold text-neutral-900">$499</span>
              <span className="text-neutral-600 ml-2">/ month</span>
            </div>

            <ul className="space-y-3 mb-6 text-neutral-700">
              <li className="flex items-start">
                <svg
                  className="w-5 h-5 text-neutral-600 mr-3 mt-0.5 flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>Up to 10 estimate reviews per month</span>
              </li>
              <li className="flex items-start">
                <svg
                  className="w-5 h-5 text-neutral-600 mr-3 mt-0.5 flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>Priority processing</span>
              </li>
              <li className="flex items-start">
                <svg
                  className="w-5 h-5 text-neutral-600 mr-3 mt-0.5 flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>Client-ready PDF summaries</span>
              </li>
            </ul>

            <p className="text-sm text-neutral-600 mb-6">
              Additional reviews billed at $75 each
            </p>

            <button
              onClick={() => handleCheckout("firm")}
              disabled={loading === "firm"}
              className="w-full bg-neutral-900 text-white py-3 px-6 rounded-lg font-semibold hover:bg-neutral-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading === "firm" ? "Loading..." : "Start Firm Plan"}
            </button>
          </div>

          {/* Pro Firm Plan */}
          <div className="border border-neutral-300 rounded-lg p-8 bg-white shadow">
            <h2 className="text-2xl font-bold text-neutral-900 mb-2">
              Pro Firm Plan
            </h2>
            <div className="mb-6">
              <span className="text-4xl font-bold text-neutral-900">$1,499</span>
              <span className="text-neutral-600 ml-2">/ month</span>
            </div>

            <ul className="space-y-3 mb-6 text-neutral-700">
              <li className="flex items-start">
                <svg
                  className="w-5 h-5 text-neutral-600 mr-3 mt-0.5 flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>Up to 40 estimate reviews per month</span>
              </li>
              <li className="flex items-start">
                <svg
                  className="w-5 h-5 text-neutral-600 mr-3 mt-0.5 flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>Priority queue</span>
              </li>
              <li className="flex items-start">
                <svg
                  className="w-5 h-5 text-neutral-600 mr-3 mt-0.5 flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>White-label PDF summaries</span>
              </li>
            </ul>

            <div className="h-6 mb-6"></div>

            <button
              onClick={() => handleCheckout("pro")}
              disabled={loading === "pro"}
              className="w-full bg-neutral-900 text-white py-3 px-6 rounded-lg font-semibold hover:bg-neutral-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading === "pro" ? "Loading..." : "Start Pro Plan"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
