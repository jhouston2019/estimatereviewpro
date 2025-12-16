import Link from "next/link";
import { SectionCard } from "@/components/SectionCard";
import { DataTable } from "@/components/DataTable";

const exampleMissingItems = [
  { description: "Remove and dispose damaged drywall", trade: "Interior", qty: "120 SF", total: 360 },
  { description: "Install moisture barrier", trade: "Roofing", qty: "25 SQ", total: 875 },
  { description: "Repair structural framing", trade: "Framing", qty: "8 LF", total: 640 },
];

const exampleUnderpricedItems = [
  { description: "Architectural shingles", contractor: 4500, carrier: 3200, difference: 1300, percent: 28.9 },
  { description: "Exterior paint", contractor: 2800, carrier: 1900, difference: 900, percent: 32.1 },
  { description: "Hardwood flooring", contractor: 5600, carrier: 4100, difference: 1500, percent: 26.8 },
];

export default function ExamplesPage() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-950">
      <header className="border-b border-slate-800 bg-slate-950/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-amber-400 to-sky-500 shadow-lg shadow-amber-500/30">
              <span className="text-xs font-black text-slate-950">ER</span>
            </div>
            <span className="text-sm font-semibold text-slate-50">Estimate Review Pro</span>
          </Link>
          <nav className="flex items-center gap-4 text-xs font-medium text-slate-200">
            <Link href="/pricing" className="hover:text-slate-50">Pricing</Link>
            <Link href="/how-it-works" className="hover:text-slate-50">How It Works</Link>
            <Link href="/login" className="rounded-full border border-slate-700 px-3 py-1.5 hover:border-slate-500">Sign In</Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-12 px-6 py-16">
        <section className="text-center">
          <h1 className="text-4xl font-bold tracking-tight text-slate-50">Example Analysis</h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm text-slate-300">
            See how our AI identifies discrepancies and saves you money
          </p>
        </section>

        <SectionCard title="Missing Items" description="Items found in contractor estimate but missing from carrier estimate" variant="error">
          <DataTable
            columns={[
              { key: "description", label: "Description" },
              { key: "trade", label: "Trade" },
              { key: "qty", label: "Quantity", align: "right" },
              { key: "total", label: "Total", align: "right", render: (val) => `$${val.toFixed(2)}` },
            ]}
            data={exampleMissingItems}
          />
          <div className="mt-4 flex justify-end border-t border-slate-800 pt-3">
            <div className="text-right">
              <p className="text-xs font-semibold text-rose-300">Total Missing:</p>
              <p className="text-lg font-semibold text-rose-200">$1,875.00</p>
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Underpriced Items" description="Items where carrier pricing is significantly lower" variant="warning">
          <DataTable
            columns={[
              { key: "description", label: "Description" },
              { key: "contractor", label: "Contractor", align: "right", render: (val) => `$${val.toFixed(2)}` },
              { key: "carrier", label: "Carrier", align: "right", render: (val) => `$${val.toFixed(2)}` },
              { key: "difference", label: "Difference", align: "right", render: (val) => `$${val.toFixed(2)}` },
              { key: "percent", label: "%", align: "right", render: (val) => `${val.toFixed(1)}%` },
            ]}
            data={exampleUnderpricedItems}
          />
          <div className="mt-4 flex justify-end border-t border-slate-800 pt-3">
            <div className="text-right">
              <p className="text-xs font-semibold text-amber-300">Total Underpriced:</p>
              <p className="text-lg font-semibold text-amber-200">$3,700.00</p>
            </div>
          </div>
        </SectionCard>

        <SectionCard title="AI Summary Example" variant="success">
          <div className="space-y-4 text-xs text-slate-300">
            <p>
              <strong className="text-slate-200">Analysis Summary:</strong> The carrier estimate is missing 3 critical line items totaling $1,875 and has underpriced 3 items by an average of 29.3%, resulting in a total discrepancy of $5,575.
            </p>
            <div>
              <p className="font-semibold text-slate-200">Key Findings:</p>
              <ul className="mt-2 space-y-1 pl-4">
                <li>• Moisture barrier installation completely omitted from carrier scope</li>
                <li>• Architectural shingles priced 28.9% below market rate</li>
                <li>• Structural framing repair not included in carrier estimate</li>
              </ul>
            </div>
            <div>
              <p className="font-semibold text-slate-200">Recommended Next Steps:</p>
              <ol className="mt-2 space-y-1 pl-4">
                <li>1. Submit supplemental claim for missing moisture barrier and framing work</li>
                <li>2. Request pricing justification for underpriced shingle and paint items</li>
                <li>3. Provide contractor quotes to support higher pricing</li>
              </ol>
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Professional PDF Report">
          <p className="text-xs text-slate-300">
            All analysis results are compiled into a professional PDF report perfect for client presentations and insurance negotiations.
          </p>
          <div className="mt-4 rounded-lg border border-slate-800 bg-slate-900/50 p-8 text-center">
            <div className="mx-auto flex h-48 w-36 items-center justify-center rounded border-2 border-dashed border-slate-700 bg-slate-900">
              <div className="text-center">
                <svg className="mx-auto h-12 w-12 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="mt-2 text-[10px] text-slate-500">Sample PDF Preview</p>
              </div>
            </div>
            <p className="mt-4 text-xs text-slate-400">Professional formatting with your analysis results</p>
          </div>
        </SectionCard>

        <section className="text-center">
          <Link
            href="/register"
            className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-amber-400 via-amber-300 to-sky-400 px-6 py-3 text-sm font-semibold text-slate-950 shadow-md shadow-amber-500/40 hover:brightness-105"
          >
            Try It Yourself
          </Link>
          <p className="mt-4 text-xs text-slate-400">Get your first estimate analyzed in under 5 minutes</p>
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

