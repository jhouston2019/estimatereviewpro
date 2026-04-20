import Link from "next/link";

export default function CancelPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 px-6">
      <div className="max-w-md text-center">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-blue-300">
          Checkout
        </p>
        <h1 className="mt-3 text-xl font-semibold text-slate-50">
          Payment canceled
        </h1>
        <p className="mt-2 text-sm text-slate-400">
          No charges were made. You can return to pricing to choose a plan or
          try again.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/pricing"
            className="inline-flex items-center justify-center rounded-full bg-[#1e3a8a] px-6 py-3 text-sm font-semibold text-white shadow-md shadow-[#1e3a8a]/40 hover:bg-[#1e40af]"
          >
            Try again
          </Link>
          <Link
            href="/app"
            className="inline-flex items-center justify-center rounded-full border border-slate-600 px-6 py-3 text-sm font-semibold text-slate-100 hover:border-slate-400"
          >
            Go to dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
