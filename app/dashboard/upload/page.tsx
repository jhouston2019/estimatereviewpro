import Link from "next/link";

export default function UploadPage() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-950">
      <header className="border-b border-slate-800 bg-slate-950/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#1e3a8a] shadow-lg shadow-[#1e3a8a]/30">
              <span className="text-xs font-black text-white">ER</span>
            </div>
            <span className="text-sm font-semibold text-slate-50">
              Estimate Review Pro
            </span>
          </Link>
          <Link
            href="/dashboard"
            className="text-xs font-semibold text-slate-200 hover:underline hover:underline-offset-4"
          >
            Back to dashboard
          </Link>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-6 py-8">
        <section>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-blue-300">
            New review
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-50">
            Upload estimates & documents
          </h1>
          <p className="mt-1 max-w-2xl text-xs text-slate-300">
            Upload a contractor estimate plus the carrier estimate and any
            engineer or carrier letters. We&apos;ll extract line items, compare
            scopes, summarize reports, and generate a PDF for your file.
          </p>
        </section>

        {/* Client-side upload workflow */}
        <section className="rounded-3xl border border-slate-800 bg-slate-950/70 p-5 text-xs text-slate-200 shadow-lg shadow-slate-950/60">
          <UploadForm />
        </section>
      </main>
    </div>
  );
}

function UploadForm() {
  return (
    <form className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label
            htmlFor="contractor"
            className="text-xs font-medium text-slate-200"
          >
            Contractor estimate{" "}
            <span className="text-[10px] text-rose-300">*</span>
          </label>
          <p className="text-[11px] text-slate-400">
            Required. PDF, JPG, or PNG. For Xactimate/Symbility, export the
            full estimate as a PDF.
          </p>
          <input
            id="contractor"
            name="contractor"
            type="file"
            accept=".pdf,.png,.jpg,.jpeg"
            required
            className="mt-1 block w-full cursor-pointer rounded-lg border border-dashed border-slate-700 bg-slate-950 px-3 py-6 text-[11px] text-slate-300 file:mr-4 file:rounded-full file:border-0 file:bg-slate-800 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-slate-100 hover:border-slate-500"
          />
        </div>

        <div className="space-y-2">
          <label
            htmlFor="carrier"
            className="text-xs font-medium text-slate-200"
          >
            Carrier estimate (optional)
          </label>
          <p className="text-[11px] text-slate-400">
            Upload the most recent carrier scope so we can compare line items
            and pricing.
          </p>
          <input
            id="carrier"
            name="carrier"
            type="file"
            accept=".pdf,.png,.jpg,.jpeg"
            className="mt-1 block w-full cursor-pointer rounded-lg border border-dashed border-slate-700 bg-slate-950 px-3 py-6 text-[11px] text-slate-300 file:mr-4 file:rounded-full file:border-0 file:bg-slate-800 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-slate-100 hover:border-slate-500"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label
          htmlFor="report"
          className="text-xs font-medium text-slate-200"
        >
          Carrier letter or engineer report (optional)
        </label>
        <p className="text-[11px] text-slate-400">
          We&apos;ll summarize the technical reasoning and highlight key
          approval/denial points in plain English.
        </p>
        <input
          id="report"
          name="report"
          type="file"
          accept=".pdf,.png,.jpg,.jpeg"
          className="mt-1 block w-full cursor-pointer rounded-lg border border-dashed border-slate-700 bg-slate-950 px-3 py-6 text-[11px] text-slate-300 file:mr-4 file:rounded-full file:border-0 file:bg-slate-800 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-slate-100 hover:border-slate-500"
        />
      </div>

      <fieldset className="mt-2 space-y-2 rounded-2xl border border-slate-800 bg-slate-950/80 p-4">
        <legend className="px-1 text-xs font-medium text-slate-200">
          What should we generate?
        </legend>
        <div className="flex flex-col gap-2 text-[11px] text-slate-300 md:flex-row md:items-center">
          <label className="inline-flex items-center gap-2">
            <input
              type="radio"
              name="mode"
              value="full"
              defaultChecked
              className="h-3 w-3 rounded-full border-slate-500 bg-slate-900 text-[#1e3a8a] focus:ring-[#1e3a8a]"
            />
            <span className="font-medium text-slate-100">
              Generate full review
            </span>
            <span className="text-slate-400">
              Line‑item comparison, discrepancies, summary, and PDF.
            </span>
          </label>
        </div>
        <div className="flex flex-col gap-2 text-[11px] text-slate-300 md:flex-row md:items-center">
          <label className="inline-flex items-center gap-2">
            <input
              type="radio"
              name="mode"
              value="summary"
              className="h-3 w-3 rounded-full border-slate-500 bg-slate-900 text-[#1e3a8a] focus:ring-[#1e3a8a]"
            />
            <span className="font-medium text-slate-100">
              Generate summary only
            </span>
            <span className="text-slate-400">
              Skip line‑item comparison and focus on a narrative summary.
            </span>
          </label>
        </div>
      </fieldset>

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2 text-[11px] text-slate-400">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          <span>Secure upload via Supabase Storage. Files stay in your RLS‑protected bucket.</span>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            className="inline-flex items-center justify-center rounded-full bg-[#1e3a8a] px-5 py-2 text-xs font-semibold text-white shadow-md shadow-[#1e3a8a]/40 hover:bg-[#1e40af]"
          >
            Generate full review
          </button>
          <button
            type="submit"
            className="inline-flex items-center justify-center rounded-full border border-slate-700 bg-slate-900 px-5 py-2 text-xs font-semibold text-slate-100 hover:border-slate-500 hover:text-slate-50"
          >
            Generate summary only
          </button>
        </div>
      </div>

      <div className="mt-2 rounded-2xl border border-slate-900 bg-slate-950/80 p-4 text-[11px] text-slate-300">
        <p className="font-semibold text-slate-100">
          Your report is being generated
        </p>
        <p className="mt-1">
          After upload we&apos;ll show a live progress indicator while OpenAI
          extracts line items, compares estimates, summarizes carrier letters,
          and builds your PDF. You&apos;ll receive a link in your dashboard
          when it&apos;s ready.
        </p>
      </div>
    </form>
  );
}


