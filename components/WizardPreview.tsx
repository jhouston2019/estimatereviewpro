import Link from "next/link";

const FLOW = [
  "Upload",
  "Free Preview",
  "Paywall",
  "Full Analysis",
] as const;

export default function WizardPreview() {
  return (
    <section className="relative left-1/2 mb-20 w-screen -translate-x-1/2 bg-[#0F172A] px-4 py-16 md:px-8 md:py-20">
      <div className="mx-auto max-w-5xl">
        <h2 className="text-center text-3xl font-bold text-white md:text-4xl">
          See your analysis before you pay
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-center text-base text-slate-300 md:text-lg">
          The paywall sits after your preview — not before it.
        </p>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-2 md:gap-3">
          {FLOW.map((label, i) => (
            <div key={label} className="flex items-center gap-2 md:gap-3">
              {i > 0 && (
                <span className="text-slate-600" aria-hidden>
                  →
                </span>
              )}
              <span className="whitespace-nowrap rounded-full border border-slate-600 bg-slate-800/80 px-4 py-2 text-xs font-semibold text-slate-200 shadow-sm sm:text-sm">
                {label}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-10 flex justify-center px-2">
          <Link
            href="/analysis-preview"
            className="inline-flex w-full max-w-md items-center justify-center rounded-lg bg-blue-600 px-8 py-3.5 text-base font-semibold text-white shadow-md transition hover:bg-blue-700 sm:w-auto"
          >
            Upload Your Estimate — Free Preview
          </Link>
        </div>
      </div>
    </section>
  );
}
