import Link from "next/link";

export default function ThankYouPage() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-6">
      <div className="max-w-md text-center">
        <div className="mb-6">
          <svg
            className="w-20 h-20 text-green-600 mx-auto"
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

        <h1 className="text-3xl font-bold text-neutral-900 mb-4">
          Thank You!
        </h1>

        <p className="text-lg text-neutral-700 mb-8">
          Your payment was successful. You can now upload your estimate for review.
        </p>

        <div className="space-y-4">
          <Link
            href="/dashboard/upload"
            className="block w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition"
          >
            Upload Estimate
          </Link>

          <Link
            href="/dashboard"
            className="block w-full bg-neutral-100 text-neutral-900 py-3 px-6 rounded-lg font-semibold hover:bg-neutral-200 transition"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
