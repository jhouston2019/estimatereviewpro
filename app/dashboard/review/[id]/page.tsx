import Link from "next/link";
import { createServerClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { ReRunButton } from "./ReRunButton";
import type { Database } from "@/lib/database.types";

type Review = Database["public"]["Tables"]["reviews"]["Row"];

export default async function ReviewDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = await createServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return notFound();
  }

  const { data: review, error } = await supabase
    .from("reviews")
    .select("*")
    .eq("id", params.id)
    .eq("user_id", user.id)
    .single<Review>();

  if (error || !review) {
    return notFound();
  }

  const analysis = review.ai_analysis_json as any;
  const comparison = review.ai_comparison_json as any;
  const summary = review.ai_summary_json as any;

  return (
    <div className="flex min-h-screen flex-col bg-slate-950">
      <header className="border-b border-slate-800 bg-slate-950/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-amber-400 to-sky-500 shadow-lg shadow-amber-500/30">
              <span className="text-xs font-black text-slate-950">ER</span>
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

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-6 py-8">
        <section className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-amber-300">
              Review Details
            </p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-50">
              Estimate Analysis
            </h1>
            <p className="mt-1 text-xs text-slate-300">
              Created{" "}
              {new Date(review.created_at).toLocaleString(undefined, {
                month: "long",
                day: "numeric",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {review.pdf_report_url && (
              <a
                href={review.pdf_report_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-amber-400 via-amber-300 to-sky-400 px-4 py-2 text-xs font-semibold text-slate-950 shadow-md shadow-amber-500/40 hover:brightness-105"
              >
                Download PDF Report
              </a>
            )}
            <ReRunButton reviewId={review.id} />
          </div>
        </section>

        {/* Financial Summary */}
        {comparison?.summary && (
          <section className="rounded-3xl border border-slate-800 bg-slate-950/70 p-6 shadow-lg shadow-slate-950/60">
            <h2 className="text-sm font-semibold text-slate-50">
              Financial Summary
            </h2>
            <div className="mt-4 grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
                <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-400">
                  Contractor Total
                </p>
                <p className="mt-2 text-2xl font-semibold text-slate-50">
                  ${comparison.summary.contractorTotal?.toFixed(2) || "0.00"}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
                <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-400">
                  Carrier Total
                </p>
                <p className="mt-2 text-2xl font-semibold text-slate-50">
                  ${comparison.summary.carrierTotal?.toFixed(2) || "0.00"}
                </p>
              </div>
              <div className="rounded-2xl border border-rose-500/40 bg-rose-950/20 p-4">
                <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-rose-300">
                  Difference
                </p>
                <p className="mt-2 text-2xl font-semibold text-rose-200">
                  ${Math.abs(comparison.summary.difference || 0).toFixed(2)}
                </p>
              </div>
            </div>
          </section>
        )}

        {/* Key Findings */}
        {comparison?.summary?.keyFindings &&
          comparison.summary.keyFindings.length > 0 && (
            <section className="rounded-3xl border border-amber-400/40 bg-amber-950/20 p-6 shadow-lg shadow-amber-500/10">
              <h2 className="text-sm font-semibold text-amber-100">
                Key Findings
              </h2>
              <ul className="mt-3 space-y-2 text-xs text-amber-50">
                {comparison.summary.keyFindings.map(
                  (finding: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-amber-400" />
                      <span>{finding}</span>
                    </li>
                  )
                )}
              </ul>
            </section>
          )}

        {/* Missing Items */}
        {comparison?.missingItems && comparison.missingItems.length > 0 && (
          <section className="rounded-3xl border border-slate-800 bg-slate-950/70 p-6 shadow-lg shadow-slate-950/60">
            <h2 className="text-sm font-semibold text-slate-50">
              Missing Items
            </h2>
            <p className="mt-1 text-xs text-slate-400">
              Items found in contractor estimate but not in carrier estimate
            </p>
            <div className="mt-4 space-y-3">
              {comparison.missingItems.map((missing: any, idx: number) => (
                <div
                  key={idx}
                  className="rounded-xl border border-slate-800 bg-slate-950/60 p-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <p className="text-xs font-medium text-slate-100">
                        {missing.item?.description || "Item"}
                      </p>
                      <p className="mt-1 text-[11px] text-slate-400">
                        Trade: {missing.item?.trade || "N/A"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-semibold text-slate-50">
                        ${missing.item?.total?.toFixed(2) || "0.00"}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        {missing.item?.qty || 0} {missing.item?.unit || "EA"}
                      </p>
                    </div>
                  </div>
                  {missing.reason && (
                    <p className="mt-2 text-[11px] text-rose-300">
                      {missing.reason}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Underpriced Items */}
        {comparison?.underpricedItems &&
          comparison.underpricedItems.length > 0 && (
            <section className="rounded-3xl border border-slate-800 bg-slate-950/70 p-6 shadow-lg shadow-slate-950/60">
              <h2 className="text-sm font-semibold text-slate-50">
                Underpriced Items
              </h2>
              <p className="mt-1 text-xs text-slate-400">
                Items where carrier pricing is significantly lower than
                contractor
              </p>
              <div className="mt-4 space-y-3">
                {comparison.underpricedItems.map((item: any, idx: number) => (
                  <div
                    key={idx}
                    className="rounded-xl border border-slate-800 bg-slate-950/60 p-4"
                  >
                    <p className="text-xs font-medium text-slate-100">
                      {item.contractorItem?.description || "Item"}
                    </p>
                    <div className="mt-2 grid grid-cols-2 gap-4 text-[11px]">
                      <div>
                        <p className="text-slate-400">Contractor Price</p>
                        <p className="font-semibold text-slate-50">
                          ${item.contractorItem?.total?.toFixed(2) || "0.00"}
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-400">Carrier Price</p>
                        <p className="font-semibold text-slate-50">
                          ${item.carrierItem?.total?.toFixed(2) || "0.00"}
                        </p>
                      </div>
                    </div>
                    <p className="mt-2 text-[11px] font-semibold text-rose-300">
                      Difference: ${item.priceDifference?.toFixed(2) || "0.00"} (
                      {item.percentDifference?.toFixed(1) || "0"}%)
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}

        {/* Carrier Letter Summary */}
        {summary?.plainEnglishSummary && (
          <section className="rounded-3xl border border-slate-800 bg-slate-950/70 p-6 shadow-lg shadow-slate-950/60">
            <h2 className="text-sm font-semibold text-slate-50">
              Carrier Letter Summary
            </h2>
            {summary.approvalStatus && (
              <div className="mt-2">
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${
                    summary.approvalStatus === "approved"
                      ? "bg-emerald-500/10 text-emerald-200 border border-emerald-500/40"
                      : summary.approvalStatus === "denied"
                      ? "bg-rose-500/10 text-rose-200 border border-rose-500/40"
                      : "bg-amber-500/10 text-amber-200 border border-amber-500/40"
                  }`}
                >
                  {summary.approvalStatus.toUpperCase()}
                </span>
              </div>
            )}
            <p className="mt-4 text-xs leading-relaxed text-slate-300">
              {summary.plainEnglishSummary}
            </p>

            {summary.keyFindings && summary.keyFindings.length > 0 && (
              <div className="mt-4">
                <p className="text-[11px] font-semibold text-slate-400">
                  Key Points:
                </p>
                <ul className="mt-2 space-y-1 text-xs text-slate-300">
                  {summary.keyFindings.map((finding: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="mt-1 h-1 w-1 flex-shrink-0 rounded-full bg-slate-500" />
                      <span>{finding}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {summary.recommendedNextSteps &&
              summary.recommendedNextSteps.length > 0 && (
                <div className="mt-4">
                  <p className="text-[11px] font-semibold text-slate-400">
                    Recommended Next Steps:
                  </p>
                  <ol className="mt-2 space-y-1 text-xs text-slate-300">
                    {summary.recommendedNextSteps.map(
                      (step: string, idx: number) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="font-semibold text-amber-400">
                            {idx + 1}.
                          </span>
                          <span>{step}</span>
                        </li>
                      )
                    )}
                  </ol>
                </div>
              )}
          </section>
        )}

        {/* Line Items Table */}
        {analysis?.lineItems && analysis.lineItems.length > 0 && (
          <section className="rounded-3xl border border-slate-800 bg-slate-950/70 p-6 shadow-lg shadow-slate-950/60">
            <h2 className="text-sm font-semibold text-slate-50">
              Contractor Line Items
            </h2>
            <p className="mt-1 text-xs text-slate-400">
              {analysis.lineItems.length} items extracted from contractor
              estimate
            </p>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-left text-[11px] font-medium text-slate-400">
                    <th className="pb-2">Trade</th>
                    <th className="pb-2">Description</th>
                    <th className="pb-2 text-right">Qty</th>
                    <th className="pb-2 text-right">Unit Price</th>
                    <th className="pb-2 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="text-slate-300">
                  {analysis.lineItems.map((item: any, idx: number) => (
                    <tr key={idx} className="border-b border-slate-900/50">
                      <td className="py-2 text-[10px] text-slate-400">
                        {item.trade}
                      </td>
                      <td className="py-2">{item.description}</td>
                      <td className="py-2 text-right">
                        {item.qty} {item.unit}
                      </td>
                      <td className="py-2 text-right">
                        ${item.unit_price?.toFixed(2) || "0.00"}
                      </td>
                      <td className="py-2 text-right font-semibold text-slate-50">
                        ${item.total?.toFixed(2) || "0.00"}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t border-slate-700 font-semibold">
                    <td colSpan={4} className="pt-3 text-right text-slate-50">
                      Total:
                    </td>
                    <td className="pt-3 text-right text-slate-50">
                      ${analysis.summary?.totalAmount?.toFixed(2) || "0.00"}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

