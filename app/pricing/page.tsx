"use client";

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="max-w-4xl mx-auto px-6 py-16">
        <h1 className="text-4xl font-bold text-center text-neutral-900 mb-16">
          Simple, Transparent Pricing
        </h1>

        {/* Policyholder Pricing (Primary) */}
        <div className="mb-12">
          <div className="border-2 border-blue-600 rounded-lg p-8 bg-blue-50">
            <h2 className="text-2xl font-semibold text-neutral-900 mb-2">
              Professional Estimate Review
            </h2>
            <div className="text-4xl font-bold text-blue-600 mb-6">
              $149 <span className="text-lg font-normal text-neutral-600">— one-time</span>
            </div>
            
            <ul className="space-y-3 mb-8 text-neutral-700">
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Upload your contractor or insurance estimate</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Line-by-line review and issue flagging</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Plain-English explanation</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Downloadable PDF summary</span>
              </li>
            </ul>

            <a
              href="/dashboard/upload"
              className="block w-full bg-blue-600 text-white text-center font-semibold py-3 px-6 rounded-lg hover:bg-blue-700 transition"
            >
              Upload & Get Started
            </a>
          </div>
        </div>

        {/* Divider */}
        <div className="text-center text-neutral-500 text-sm mb-12">
          For firms, adjusters, and professionals
        </div>

        {/* Firm Pricing */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Firm Plan */}
          <div className="border border-neutral-300 rounded-lg p-8 bg-white">
            <h2 className="text-xl font-semibold text-neutral-900 mb-2">
              Firm Plan
            </h2>
            <div className="text-3xl font-bold text-neutral-900 mb-6">
              $499 <span className="text-base font-normal text-neutral-600">/ month</span>
            </div>
            
            <ul className="space-y-3 mb-6 text-neutral-700">
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Up to 10 estimate reviews per month</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Priority processing</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Client-ready PDF summaries</span>
              </li>
            </ul>

            <p className="text-sm text-neutral-600 mb-6">
              Additional reviews billed at $75 each
            </p>

            <button
              onClick={() => {
                // Client-side checkout trigger
                window.location.href = '/api/checkout?plan=firm';
              }}
              className="block w-full bg-neutral-900 text-white text-center font-semibold py-3 px-6 rounded-lg hover:bg-neutral-800 transition"
            >
              Start Firm Plan
            </button>
          </div>

          {/* Pro Firm Plan */}
          <div className="border border-neutral-300 rounded-lg p-8 bg-white">
            <h2 className="text-xl font-semibold text-neutral-900 mb-2">
              Pro Firm Plan
            </h2>
            <div className="text-3xl font-bold text-neutral-900 mb-6">
              $1,499 <span className="text-base font-normal text-neutral-600">/ month</span>
            </div>
            
            <ul className="space-y-3 mb-6 text-neutral-700">
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Up to 40 estimate reviews per month</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Priority queue</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>White-label PDF summaries</span>
              </li>
            </ul>

            <div className="mb-6 h-6"></div>

            <button
              onClick={() => {
                // Client-side checkout trigger
                window.location.href = '/api/checkout?plan=pro';
              }}
              className="block w-full bg-neutral-900 text-white text-center font-semibold py-3 px-6 rounded-lg hover:bg-neutral-800 transition"
            >
              Start Pro Plan
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
