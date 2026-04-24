import type { ReactNode } from "react";
import Link from "next/link";
import { requireUserAndPaywall } from "@/lib/auth/serverPageGuards";
import {
  parseAnalysisResult,
  parseComparisonResult,
} from "@/lib/estimate-json-parse";
import { RegenerateLetterForm } from "./regenerate-letter-form";

const strategyLabels: Record<string, string> = {
  FULL_SUPPLEMENT_DEMAND: "Full Supplement Demand",
  PARTIAL_DISPUTE: "Partial Dispute",
  DEMAND_REINSPECTION: "Demand Reinspection",
  INVOKE_APPRAISAL: "Invoke Appraisal",
  OTHER_CUSTOM: "Custom Strategy",
};

const strategyCodesForLetter = new Set<string>([
  "FULL_SUPPLEMENT_DEMAND",
  "PARTIAL_DISPUTE",
  "DEMAND_REINSPECTION",
  "INVOKE_APPRAISAL",
  "OTHER_CUSTOM",
]);

const letterTypeStoredLabel: Record<string, string> = {
  SUPPLEMENT_DEMAND: "Supplement demand letter",
  DISPUTE: "Dispute letter",
  REINSPECTION_REQUEST: "Re-inspection request",
  APPRAISAL_INVOCATION: "Appraisal invocation",
  CUSTOM_NARRATIVE: "Custom / narrative",
};

function labelForStoredLetterType(code: string | null): string {
  if (!code?.trim()) return "—";
  return letterTypeStoredLabel[code] ?? code;
}

/** Renders `ai_summary_json` as readable prose or structured text, not only raw JSON. */
function SummaryReadable({ data }: { data: unknown }): ReactNode {
  if (data === null || data === undefined) {
    return <p className="text-[11px] text-slate-500">—</p>;
  }
  if (typeof data === "string") {
    return (
      <div className="whitespace-pre-wrap text-sm leading-relaxed text-slate-200">
        {data}
      </div>
    );
  }
  if (typeof data === "number" || typeof data === "boolean") {
    return <p className="text-slate-200">{String(data)}</p>;
  }
  if (Array.isArray(data)) {
    return (
      <ul className="list-inside list-disc space-y-1.5 text-sm text-slate-200">
        {data.map((item, i) => (
          <li key={i} className="pl-0.5">
            <SummaryReadable data={item} />
          </li>
        ))}
      </ul>
    );
  }
  if (typeof data === "object") {
    const o = data as Record<string, unknown>;
    return (
      <div className="space-y-4 text-sm text-slate-200">
        {Object.entries(o).map(([k, v]) => (
          <div key={k}>
            <p className="text-[11px] font-medium text-slate-500">
              {k
                .replace(/_/g, " ")
                .replace(/\b\w/g, (c) => c.toUpperCase())}
            </p>
            <div className="mt-1.5 pl-0">
              <SummaryReadable data={v} />
            </div>
          </div>
        ))}
      </div>
    );
  }
  return <p className="text-slate-200">{String(data)}</p>;
}

function formatMoney(n: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(Number.isFinite(n) ? n : 0);
}

function riskClass(level: string): string {
  const l = level.toLowerCase();
  if (l === "high")
    return "border-red-500/40 bg-red-500/10 text-red-200";
  if (l === "low")
    return "border-emerald-500/40 bg-emerald-500/10 text-emerald-200";
  return "border-amber-500/40 bg-amber-500/10 text-amber-200";
}

function JsonBlock({ data }: { data: unknown }) {
  if (data === null || data === undefined) {
    return (
      <p className="text-[11px] text-slate-500">—</p>
    );
  }
  if (typeof data === "string") {
    return (
      <p className="whitespace-pre-wrap text-sm text-slate-200">{data}</p>
    );
  }
  return (
    <pre className="max-h-[480px] overflow-auto rounded-lg border border-slate-800 bg-slate-950/80 p-4 text-[11px] leading-relaxed text-slate-300">
      {JSON.stringify(data, null, 2)}
    </pre>
  );
}

export default async function DashboardReviewDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase, user } = await requireUserAndPaywall();

  const { data: userData } = await supabase
    .from("users" as any)
    .select("is_admin")
    .eq("id", user.id)
    .maybeSingle();
  const isAdmin = (userData as { is_admin?: boolean | null } | null)?.is_admin === true;

  let reviewQuery = supabase.from("reviews").select("*").eq("id", id);
  if (!isAdmin) {
    reviewQuery = reviewQuery.eq("user_id", user.id);
  }
  const { data: review, error } = (await reviewQuery.maybeSingle()) as {
    data: {
      id: string;
      user_id: string;
      insured_name: string | null;
      created_at: string;
      ai_analysis_json: unknown;
      ai_comparison_json: unknown;
      ai_summary_json: unknown;
      letter_text: string | null;
      letter_type: string | null;
      pdf_report_url: string | null;
    } | null;
    error: { message?: string } | null;
  };

  if (!review) {
    return (
      <div className="p-6 text-slate-200">
        Review not found. ID: {id} | Error: {error?.message ?? "none"}
      </div>
    );
  }

  const title =
    review.insured_name?.trim() || "Estimate Review";
  const created = review.created_at
    ? new Date(review.created_at).toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

  const analysis = review.ai_analysis_json
    ? parseAnalysisResult(review.ai_analysis_json)
    : null;
  const comparison = review.ai_comparison_json
    ? parseComparisonResult(review.ai_comparison_json)
    : null;
  const summaryJson = review.ai_summary_json;
  const strategyForLetter =
    analysis?.recommendedStrategy &&
    strategyCodesForLetter.has(analysis.recommendedStrategy)
      ? analysis.recommendedStrategy
      : "FULL_SUPPLEMENT_DEMAND";

  return (
    <div className="flex min-h-screen flex-col bg-slate-950">
      <header className="border-b border-slate-800 bg-slate-950/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#1e3a8a] shadow-lg shadow-[#1e3a8a]/30">
              <span className="text-xs font-black text-white">ER</span>
            </div>
            <span className="text-sm font-semibold text-slate-50">
              Estimate Review Pro
            </span>
          </Link>
          <nav className="flex items-center gap-4 text-xs font-medium text-slate-200">
            <Link
              href="/dashboard"
              className="rounded-full bg-slate-900 px-3 py-1.5 text-blue-300"
            >
              Dashboard
            </Link>
            <Link
              href="/account"
              className="rounded-full border border-slate-700 px-3 py-1.5 hover:border-slate-500 hover:text-slate-50"
            >
              Account
            </Link>
            <Link
              href="/pricing"
              className="rounded-full bg-[#2563EB] px-4 py-2 text-sm font-semibold text-white shadow-md shadow-[#2563EB]/40 transition hover:bg-[#1E40AF]"
            >
              Buy another review
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-6 py-8">
        <div>
          <Link
            href="/dashboard"
            className="text-xs font-medium text-blue-300 hover:underline"
          >
            ← Back to Dashboard
          </Link>
          <h1 className="mt-4 text-2xl font-semibold tracking-tight text-slate-50">
            {title}
          </h1>
          <p className="mt-1 text-xs text-slate-400">Created {created}</p>
        </div>

        {review.ai_analysis_json != null && (
          <section className="rounded-3xl border border-slate-800 bg-slate-900/40 p-6 shadow-lg shadow-slate-950/50">
            <h2 className="text-xs font-semibold uppercase tracking-[0.15em] text-blue-300">
              Analysis
            </h2>
            {analysis ? (
              <div className="mt-4 space-y-5 text-sm text-slate-200">
                <div>
                  <p className="text-[11px] font-medium text-slate-500">
                    Risk level
                  </p>
                  <span
                    className={`mt-1 inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize ${riskClass(
                      analysis.riskLevel
                    )}`}
                  >
                    {analysis.riskLevel}
                  </span>
                </div>
                <div>
                  <p className="text-[11px] font-medium text-slate-500">
                    Scope omissions
                  </p>
                  {analysis.scopeOmissions.length > 0 ? (
                    <ul className="mt-2 list-inside list-disc space-y-1 text-slate-200">
                      {analysis.scopeOmissions.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-1 text-[11px] text-slate-500">None listed</p>
                  )}
                </div>
                <div>
                  <p className="text-[11px] font-medium text-slate-500">
                    Pricing flags
                  </p>
                  {analysis.pricingFlags.length > 0 ? (
                    <ul className="mt-2 list-inside list-disc space-y-1 text-slate-200">
                      {analysis.pricingFlags.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-1 text-[11px] text-slate-500">None listed</p>
                  )}
                </div>
                <div>
                  <p className="text-[11px] font-medium text-slate-500">
                    Code upgrade gaps
                  </p>
                  {analysis.codeUpgradeGaps.length > 0 ? (
                    <ul className="mt-2 list-inside list-disc space-y-1 text-slate-200">
                      {analysis.codeUpgradeGaps.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-1 text-[11px] text-slate-500">None listed</p>
                  )}
                </div>
                <div>
                  <p className="text-[11px] font-medium text-slate-500">
                    Recommended strategy
                  </p>
                  <p className="mt-1 text-slate-200">
                    {analysis.recommendedStrategy
                      ? strategyLabels[analysis.recommendedStrategy] ??
                        analysis.recommendedStrategy
                      : "—"}
                  </p>
                </div>
              </div>
            ) : (
              <div className="mt-4">
                <p className="text-[11px] text-slate-500">
                  Could not parse stored analysis. Raw JSON:
                </p>
                <JsonBlock data={review.ai_analysis_json} />
              </div>
            )}
          </section>
        )}

        {review.ai_comparison_json != null && (
          <section className="rounded-3xl border border-slate-800 bg-slate-900/40 p-6 shadow-lg shadow-slate-950/50">
            <h2 className="text-xs font-semibold uppercase tracking-[0.15em] text-blue-300">
              Comparison
            </h2>
            {comparison ? (
              <div className="mt-4 space-y-4 text-sm text-slate-200">
                <p className="text-[11px] text-slate-400">
                  Mode: <span className="text-slate-200">{comparison.mode}</span>
                </p>
                <div className="grid gap-2 sm:grid-cols-3 text-xs">
                  <div className="rounded-lg border border-slate-800 bg-slate-950/50 p-3">
                    <p className="text-[10px] text-slate-500">Carrier total</p>
                    <p className="mt-0.5 font-semibold text-slate-100">
                      {formatMoney(comparison.totalCarrier)}
                    </p>
                  </div>
                  <div className="rounded-lg border border-slate-800 bg-slate-950/50 p-3">
                    <p className="text-[10px] text-slate-500">Other total</p>
                    <p className="mt-0.5 font-semibold text-slate-100">
                      {formatMoney(comparison.totalContractor)}
                    </p>
                  </div>
                  <div className="rounded-lg border border-slate-800 bg-slate-950/50 p-3">
                    <p className="text-[10px] text-slate-500">Delta</p>
                    <p className="mt-0.5 font-semibold text-slate-100">
                      {formatMoney(comparison.totalDelta)}
                    </p>
                  </div>
                </div>
                {comparison.lineItems.length > 0 && (
                  <div className="overflow-x-auto rounded-lg border border-slate-800">
                    <table className="min-w-full text-left text-[11px] text-slate-200">
                      <thead className="border-b border-slate-800 bg-slate-950/80 text-slate-400">
                        <tr>
                          <th className="px-2 py-2 font-medium">Trade</th>
                          <th className="px-2 py-2 font-medium">Carrier</th>
                          <th className="px-2 py-2 text-right font-medium">
                            C $
                          </th>
                          <th className="px-2 py-2 font-medium">Contractor</th>
                          <th className="px-2 py-2 text-right font-medium">
                            Other $
                          </th>
                          <th className="px-2 py-2 text-right font-medium">
                            Δ
                          </th>
                          <th className="px-2 py-2 font-medium">Note</th>
                        </tr>
                      </thead>
                      <tbody>
                        {comparison.lineItems.map((row, idx) => (
                          <tr
                            key={`${row.trade}-${row.carrierItem}-${idx}`}
                            className={
                              row.flagged
                                ? "bg-amber-500/5"
                                : "border-b border-slate-900/80"
                            }
                          >
                            <td className="px-2 py-2 align-top text-slate-300">
                              {row.trade}
                            </td>
                            <td className="px-2 py-2 align-top">
                              {row.carrierItem}
                            </td>
                            <td className="px-2 py-2 text-right tabular-nums">
                              {formatMoney(row.carrierAmount)}
                            </td>
                            <td className="px-2 py-2 align-top">
                              {row.contractorItem}
                            </td>
                            <td className="px-2 py-2 text-right tabular-nums">
                              {formatMoney(row.contractorAmount)}
                            </td>
                            <td className="px-2 py-2 text-right tabular-nums">
                              {formatMoney(row.delta)}
                            </td>
                            <td className="px-2 py-2 text-slate-400">
                              {row.reason}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                {comparison.versionDiff && (
                  <div className="rounded-lg border border-slate-800 bg-slate-950/40 p-4 text-[11px]">
                    <p className="font-semibold text-slate-200">
                      Version change: {comparison.versionDiff.previousVersion} →{" "}
                      {comparison.versionDiff.currentVersion} (net{" "}
                      {formatMoney(comparison.versionDiff.netChange)})
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="mt-4">
                <JsonBlock data={review.ai_comparison_json} />
              </div>
            )}
          </section>
        )}

        {review.ai_summary_json != null && (
          <section className="rounded-3xl border border-slate-800 bg-slate-900/40 p-6 shadow-lg shadow-slate-950/50">
            <h2 className="text-xs font-semibold uppercase tracking-[0.15em] text-blue-300">
              Summary
            </h2>
            <div className="mt-4">
              <SummaryReadable data={summaryJson} />
            </div>
          </section>
        )}

        <section className="rounded-3xl border border-slate-800 bg-slate-900/40 p-6 shadow-lg shadow-slate-950/50">
          <h2 className="text-xs font-semibold uppercase tracking-[0.15em] text-blue-300">
            Letter
          </h2>
          <p className="mt-3 text-[11px] font-medium text-slate-500">
            Type:{" "}
            <span className="text-slate-200">
              {labelForStoredLetterType(review.letter_type)}
            </span>
          </p>
          {review.letter_text?.trim() ? (
            <pre className="mt-3 max-h-[min(28rem,70vh)] overflow-auto whitespace-pre-wrap rounded-xl border border-slate-800 bg-slate-950/80 p-4 text-left text-sm leading-relaxed text-slate-200">
              {review.letter_text}
            </pre>
          ) : (
            <p className="mt-3 text-sm text-slate-500">
              No letter has been saved for this review yet. You can generate one
              below.
            </p>
          )}
        </section>

        <section className="rounded-3xl border border-slate-800 bg-slate-900/40 p-6 shadow-lg shadow-slate-950/50">
          <h2 className="text-xs font-semibold uppercase tracking-[0.15em] text-blue-300">
            Regenerate letter
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            Uses the same letter service as the upload wizard, with the saved
            analysis and comparison. The new letter overwrites the stored
            letter for this review.
          </p>
          <RegenerateLetterForm
            reviewId={review.id}
            analysisJson={review.ai_analysis_json}
            comparisonJson={review.ai_comparison_json}
            strategy={strategyForLetter}
            claimType=""
            initialLetterType={review.letter_type}
          />
        </section>
      </main>
    </div>
  );
}
