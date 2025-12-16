import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Thank You | Estimate Review Pro",
  description: "Your payment was successful. Get started with your estimate review.",
};

export default function ThankYouPage() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-6">
      <div className="max-w-2xl text-center">
        <div className="mb-8">
          <svg
            className="w-20 h-20 mx-auto text-green-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>

        <h1 className="text-4xl font-bold text-neutral-900 mb-4">
          Thank You!
        </h1>
        
        <p className="text-lg text-neutral-600 mb-8">
          Your payment was successful. You can now upload your estimate for review.
        </p>

        <div className="space-y-4">
          <a
            href="/dashboard/upload"
            className="inline-block bg-blue-600 text-white font-semibold py-3 px-8 rounded-lg hover:bg-blue-700 transition"
          >
            Upload Your Estimate
          </a>
          
          <div>
            <a
              href="/dashboard"
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Go to Dashboard
            </a>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-neutral-200">
          <p className="text-sm text-neutral-500">
            Questions? Contact us at{" "}
            <a href="mailto:support@estimatereviewpro.com" className="text-blue-600 hover:underline">
              support@estimatereviewpro.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

